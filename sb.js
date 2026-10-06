/* Supabase 통신 모듈 (외부 라이브러리 없이 fetch만 사용)
 *  - 공개(익명): 제보 등록, 사진 업로드  → 읽기는 서버 규칙(RLS)이 막습니다
 *  - 관리자(로그인 후): 제보 조회/처리/삭제, 사진 보기
 */
(function(){
'use strict';
const C = window.SITE_CONFIG;
const SK = 'safety_admin_session';
const BUCKET = 'report-photos';
const SB = {};

SB.configured = function(){
  const u = String(C.SUPABASE_URL || ''), k = String(C.SUPABASE_ANON_KEY || '');
  return !!u && !!k && !/YOUR[-_]/i.test(u + k);
};
/* 주소 뒤에 /rest/v1 같은 경로가 붙어 있어도(Data API 화면에서 그대로 복사한 경우) 자동으로 사이트 주소까지만 사용합니다 */
const base = () => { const u = String(C.SUPABASE_URL || '').trim(); try{ return new URL(u).origin; }catch(e){ return u.replace(/\/+$/, ''); } };

function loadSession(){ try{ return JSON.parse(sessionStorage.getItem(SK) || 'null'); }catch(e){ return null; } }
function saveSession(s){ try{ if(s) sessionStorage.setItem(SK, JSON.stringify(s)); else sessionStorage.removeItem(SK); }catch(e){} }
SB.hasSession = () => !!loadSession();

async function raw(path, opts, token){
  const o = Object.assign({}, opts || {});
  /* 예전 anon 키(eyJ…)는 JWT라 Authorization에도 넣지만, 새 publishable 키(sb_publishable_…)는 JWT가 아니므로 apikey로만 보냅니다 */
  const key = String(C.SUPABASE_ANON_KEY || '').trim();
  const bearer = token || (key.indexOf('eyJ') === 0 ? key : '');
  o.headers = Object.assign({ apikey:key }, bearer ? { Authorization:'Bearer ' + bearer } : {}, o.headers || {});
  try{ return await fetch(base() + path, o); }
  catch(e){ throw { status:0, message:'네트워크 연결을 확인해 주세요.' }; }
}
async function json(res){ try{ return await res.json(); }catch(e){ return null; } }

/* ---------- 관리자 인증 ---------- */
function storeTokens(d){
  saveSession({ access_token:d.access_token, refresh_token:d.refresh_token, expires_at:Math.floor(Date.now() / 1000) + (d.expires_in || 3600) });
}
async function refresh(){
  const s = loadSession();
  if(!s || !s.refresh_token){ saveSession(null); throw { status:401, message:'로그인이 필요합니다.' }; }
  const res = await raw('/auth/v1/token?grant_type=refresh_token', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ refresh_token:s.refresh_token }) });
  const d = await json(res);
  if(!res.ok || !d || !d.access_token){ saveSession(null); throw { status:401, message:'세션이 만료되었습니다. 다시 로그인해 주세요.' }; }
  storeTokens(d);
}
async function accessToken(){
  const s = loadSession();
  if(!s) throw { status:401, message:'로그인이 필요합니다.' };
  if(s.expires_at - Date.now() / 1000 < 60) await refresh();
  return loadSession().access_token;
}
async function authed(path, opts){
  let res = await raw(path, opts, await accessToken());
  if(res.status === 401){ await refresh(); res = await raw(path, opts, await accessToken()); }
  return res;
}

SB.login = async function(email, password){
  const res = await raw('/auth/v1/token?grant_type=password', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ email:email, password:password }) });
  const d = await json(res);
  if(!res.ok || !d || !d.access_token){
    const code = (d && (d.error_code || d.code)) || '';
    let msg;
    if(res.status === 429) msg = '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    else if(res.status === 400 && code === 'email_not_confirmed') msg = '이메일 인증이 안 된 계정입니다. Supabase Users에서 Auto Confirm User를 체크해 계정을 다시 만들어 주세요.';
    else if(res.status === 400) msg = '암호가 올바르지 않습니다. (이메일 또는 비밀번호 확인)';
    else if(res.status === 401 || res.status === 403) msg = '연결 키(SUPABASE_ANON_KEY)가 올바르지 않습니다. site.config.js의 키를 다시 확인해 주세요. (코드 ' + res.status + ')';
    else if(res.status === 404) msg = '연결 주소(SUPABASE_URL)가 올바르지 않습니다. https://…supabase.co 까지만 입력했는지 확인해 주세요. (코드 404)';
    else if(res.status === 422) msg = '이메일 로그인이 꺼져 있거나 이메일 형식이 올바르지 않습니다. (코드 422' + (code ? ' ' + code : '') + ')';
    else msg = '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요. (코드 ' + res.status + ')';
    throw { status:res.status, message:msg };
  }
  storeTokens(d);
  let ok = false;
  try{ ok = await SB.isAdmin(); }catch(e){}
  if(!ok){ saveSession(null); throw { status:403, message:'관리자 권한이 없는 계정입니다.' }; }
};
SB.logout = function(){ saveSession(null); };
SB.isAdmin = async function(){
  const res = await authed('/rest/v1/rpc/is_admin', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:'{}' });
  if(!res.ok) return false;
  return (await json(res)) === true;
};

/* ---------- 공개: 제보 등록 / 사진 업로드 ---------- */
SB.insertReport = async function(rep){
  const res = await raw('/rest/v1/reports', { method:'POST', headers:{ 'Content-Type':'application/json', Prefer:'return=minimal' }, body:JSON.stringify(rep) });
  if(res.ok) return;
  const d = await json(res) || {};
  throw { status:res.status, code:d.code || '', message:d.message || '' };
};
SB.uploadPhoto = async function(id, idx, blob){
  const res = await raw('/storage/v1/object/' + BUCKET + '/' + encodeURIComponent(id) + '/' + idx + '.jpg', { method:'POST', headers:{ 'Content-Type':'image/jpeg', 'x-upsert':'false' }, body:blob });
  if(!res.ok) throw { status:res.status, message:'사진 업로드 실패' };
};

/* ---------- 관리자: 조회 / 처리 / 삭제 / 사진 ---------- */
function toApi(r){
  return {
    id:r.id, createdAt:r.created_at, updatedAt:r.updated_at, occurredAt:r.occurred_at,
    reporterType:r.reporter_type, category:r.category, severity:r.severity,
    place:r.place, placeDetail:r.place_detail || '', content:r.content,
    photoCount:r.photo_count || 0, anonymous:!!r.anonymous,
    contactName:r.contact_name || '', contactInfo:r.contact_info || '',
    status:r.status, memo:r.memo || ''
  };
}
SB.listReports = async function(){
  const res = await authed('/rest/v1/reports?select=*&order=created_at.desc&limit=1000');
  if(!res.ok) throw { status:res.status, message:'목록을 불러오지 못했습니다.' };
  return (await res.json()).map(toApi);
};
SB.updateReport = async function(id, patch){
  const res = await authed('/rest/v1/reports?id=eq.' + encodeURIComponent(id), { method:'PATCH', headers:{ 'Content-Type':'application/json', Prefer:'return=representation' }, body:JSON.stringify(patch) });
  if(!res.ok) throw { status:res.status, message:'저장하지 못했습니다.' };
  const d = await json(res);
  if(!Array.isArray(d) || !d.length) throw { status:403, message:'저장 권한이 없거나 이미 삭제된 제보입니다.' };
};
SB.deleteReport = async function(rep){
  const res = await authed('/rest/v1/reports?id=eq.' + encodeURIComponent(rep.id), { method:'DELETE', headers:{ Prefer:'return=representation' } });
  if(!res.ok) throw { status:res.status, message:'삭제하지 못했습니다.' };
  const d = await json(res);
  if(!Array.isArray(d) || !d.length) throw { status:403, message:'삭제 권한이 없거나 이미 삭제된 제보입니다.' };
  if(rep.photoCount){
    const prefixes = []; for(let i = 0; i < rep.photoCount; i++) prefixes.push(rep.id + '/' + i + '.jpg');
    try{ await authed('/storage/v1/object/' + BUCKET, { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ prefixes:prefixes }) }); }catch(e){}
  }
};
/* 사진은 비공개 저장소라 로그인 토큰으로 내려받아 화면용 주소(blob)로 바꿉니다 */
SB.photoObjectUrl = async function(id, idx){
  const res = await authed('/storage/v1/object/authenticated/' + BUCKET + '/' + encodeURIComponent(id) + '/' + idx + '.jpg');
  if(!res.ok) throw { status:res.status, message:'사진을 불러오지 못했습니다.' };
  return URL.createObjectURL(await res.blob());
};

window.SB = SB;
})();
