/* 안전신문고 사진 정리: 접수 후 RETENTION_DAYS(기본 30일)가 지난 사진을 삭제합니다.
 *  - GitHub Actions(.github/workflows/photo-cleanup.yml)가 매일 실행합니다. 직접 실행: node scripts/purge-photos.mjs
 *  - 관리자 계정으로 로그인해서 Supabase 저장소 API로 사진을 지웁니다. (service_role 같은 만능 키는 쓰지 않습니다)
 *  - 제보 글(내용·상태·조치 내용)은 그대로 두고, 사진만 지우며 제보에 "사진 삭제일"을 남깁니다.
 *  - DRY_RUN=1 이면 지우지 않고 대상만 보여 줍니다.
 *  필요한 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD (GitHub Secrets에 등록) */
const env = process.env;
const BASE = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const ANON = String(env.SUPABASE_ANON_KEY || '').trim();
const EMAIL = String(env.ADMIN_EMAIL || '').trim();
const PASSWORD = String(env.ADMIN_PASSWORD || '');
const DAYS = Math.max(1, parseInt(env.RETENTION_DAYS || '30', 10) || 30);
const DRY = env.DRY_RUN === '1' || env.DRY_RUN === 'true';
const BUCKET = 'report-photos';

if(!BASE || !ANON || !EMAIL || !PASSWORD){
  console.log('SUPABASE_URL / SUPABASE_ANON_KEY / ADMIN_EMAIL / ADMIN_PASSWORD 시크릿이 없어 건너뜁니다. (README의 "사진 30일 자동 정리" 참고)');
  process.exit(0);
}

const cutoff = new Date(Date.now() - DAYS * 86400000);
let token = '';

async function call(path, opts = {}){
  const headers = Object.assign({ apikey: ANON }, token ? { Authorization: 'Bearer ' + token } : {}, opts.headers || {});
  const res = await fetch(BASE + path, Object.assign({}, opts, { headers }));
  return res;
}
async function must(res, what){
  if(res.ok) return res;
  let detail = ''; try{ detail = (await res.text()).slice(0, 200); }catch(e){}
  throw new Error(what + ' 실패 (HTTP ' + res.status + ') ' + detail);
}

async function login(){
  const res = await call('/auth/v1/token?grant_type=password', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ email:EMAIL, password:PASSWORD }) });
  if(!res.ok) throw new Error('관리자 로그인 실패 (HTTP ' + res.status + '). ADMIN_EMAIL / ADMIN_PASSWORD 시크릿을 확인하세요.');
  const d = await res.json();
  if(!d.access_token) throw new Error('관리자 로그인 응답에 토큰이 없습니다.');
  token = d.access_token;
}

/* 폴더(접수번호) 안의 파일을 모두 나열 */
async function listFolder(prefix){
  const out = []; let offset = 0;
  for(;;){
    const res = await must(await call('/storage/v1/object/list/' + BUCKET, { method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ prefix, limit:100, offset, sortBy:{ column:'name', order:'asc' } }) }), '저장소 목록 조회');
    const items = await res.json();
    if(!Array.isArray(items)) throw new Error('저장소 목록 형식이 올바르지 않습니다.');
    out.push(...items);
    if(items.length < 100) break;
    offset += 100;
  }
  return out;
}
async function listAllObjects(){
  const files = [];
  const top = await listFolder('');
  for(const it of top){
    if(it.id){ files.push({ path: it.name, created: it.created_at }); continue; }   // 폴더가 아닌 파일(드묾)
    const inner = await listFolder(it.name);
    for(const f of inner) if(f.id) files.push({ path: it.name + '/' + f.name, created: f.created_at });
  }
  return files;
}
async function removeObjects(paths){
  for(let i = 0; i < paths.length; i += 100){
    const chunk = paths.slice(i, i + 100);
    await must(await call('/storage/v1/object/' + BUCKET, { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ prefixes: chunk }) }), '사진 삭제');
  }
}
async function markReports(){
  const iso = cutoff.toISOString();
  let marked = 0;
  for(;;){
    const res = await must(await call('/rest/v1/reports?select=id&photo_count=gt.0&created_at=lt.' + encodeURIComponent(iso) + '&limit=200'), '제보 목록 조회');
    const rows = await res.json();
    if(!rows.length) break;
    if(DRY){ marked += rows.length; break; }
    const ids = rows.map(r => r.id);
    const patch = await must(await call('/rest/v1/reports?id=in.(' + ids.map(encodeURIComponent).join(',') + ')', { method:'PATCH',
      headers:{ 'Content-Type':'application/json', Prefer:'return=representation' }, body:JSON.stringify({ photo_count:0, photos_purged_at:new Date().toISOString() }) }), '제보 사진 표시 갱신');
    const done = await patch.json();
    if(!Array.isArray(done) || !done.length) throw new Error('제보를 갱신할 권한이 없습니다. (관리자 등록 / add_features.sql 실행 확인)');
    marked += done.length;
    if(rows.length < 200) break;
  }
  return marked;
}

(async () => {
  await login();
  const all = await listAllObjects();
  const old = all.filter(f => { const t = new Date(f.created); return !isNaN(t) && t < cutoff; });
  console.log(`보관기간 ${DAYS}일 · 기준일 ${cutoff.toISOString().slice(0, 10)} · 저장소 사진 ${all.length}장 중 삭제 대상 ${old.length}장${DRY ? ' (시험 실행: 지우지 않음)' : ''}`);
  if(old.length && !DRY) await removeObjects(old.map(f => f.path));
  const marked = await markReports();
  console.log(`제보 ${marked}건에 "사진 삭제" 표시${DRY ? ' 예정' : '를 남겼습니다'}.`);
  console.log('완료');
})().catch(e => { console.error('오류: ' + e.message); process.exit(1); });
