(function(){
'use strict';
const { $, $$, esc, toast, fmtDT } = window.U;
const SB = window.SB, CONFIG = window.SITE_CONFIG;
const STATUSES = ['접수','검토중','조치완료'];
const CATS = ['전체','아차사고','안전사고','위험요소 발견','개선 제안'];
const state = { reports:[], filter:{ status:'전체', cat:'전체' }, openId:null, timer:null, urls:[] };
const badgeCls = s => s === '조치완료' ? 'b-done' : s === '검토중' ? 'b-wip' : 'b-new';
const root = $('#root');
const pinMode = () => CONFIG.ADMIN_LOGIN_MODE !== 'password';

function renderSetup(){
  root.innerHTML = `<div class="login"><div class="card">
      <h2 style="margin:0">⚙️ 서버 연결 설정이 필요합니다</h2>
      <p class="muted small"><b>site.config.js</b>의 SUPABASE_URL, SUPABASE_ANON_KEY를 입력해 주세요. 자세한 방법은 README의 3~4단계를 참고하세요.</p>
      <a class="btn ghost block" href="./">← 안전 지킴이로 돌아가기</a></div></div>`;
}

function renderLogin(msg){
  clearInterval(state.timer);
  const fields = pinMode()
    ? `<div class="field"><label for="pw" class="small muted">관리자 암호 (숫자)</label>
        <input id="pw" class="input pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off" placeholder="••••"></div>`
    : `<div class="field"><label for="em" class="small muted">이메일</label><input id="em" class="input" type="email" autocomplete="username" value="${esc(CONFIG.ADMIN_EMAIL || '')}"></div>
       <div class="field"><label for="pw" class="small muted">비밀번호</label><input id="pw" class="input" type="password" autocomplete="current-password"></div>`;
  root.innerHTML = `<div class="login"><div class="card">
      <h2 style="margin:0">🔒 관리자 암호 입력</h2>
      <p class="muted small">접수된 제보와 사진은 관리자만 볼 수 있습니다.${pinMode() ? ' 숫자 암호를 입력해 주세요.' : ''}</p>
      ${fields}
      <div class="err" id="lerr" role="alert">${esc(msg || '')}</div>
      <button class="btn primary block" id="btnLogin" type="button">확인</button>
      <a class="btn ghost block" href="./">← 안전 지킴이로 돌아가기</a>
    </div></div>`;
  const submit = async () => {
    const v = $('#pw').value;
    if(!v){ $('#lerr').textContent = '암호를 입력해 주세요.'; return; }
    if(pinMode() && v.length < 4){ $('#lerr').textContent = '숫자 4자리 이상 입력해 주세요.'; return; }
    const b = $('#btnLogin'); b.disabled = true; $('#lerr').textContent = '';
    try{
      const email = pinMode() ? CONFIG.ADMIN_EMAIL : $('#em').value.trim();
      const password = pinMode() ? v + (CONFIG.ADMIN_PIN_SUFFIX || '') : v;
      await SB.login(email, password);
      await showDashboard();
    }catch(e){ $('#lerr').textContent = e.message || '로그인하지 못했습니다.'; $('#pw').value = ''; b.disabled = false; $('#pw').focus(); }
  };
  $('#btnLogin').addEventListener('click', submit);
  if(pinMode()) $('#pw').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
  $('#pw').addEventListener('keydown', e => { if(e.key === 'Enter') submit(); });
  $('#pw').focus();
}

async function load(){
  try{ state.reports = await SB.listReports(); }
  catch(e){ if(e.status === 401){ renderLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); return false; } toast(e.message || '불러오지 못했습니다.'); }
  return true;
}
async function showDashboard(){
  if(!(await load())) return;
  renderDashboard();
  clearInterval(state.timer);
  state.timer = setInterval(async () => { if(state.openId || document.getElementById('receiptRoot')) return; if(await load()) renderDashboard(); }, 60000);
}

function exportCsv(){
  const head = ['접수번호','접수일시','발생일시','제보자구분','유형','위험도','장소','상세위치','내용','사진수','익명','이름','연락처','처리상태','조치내용'];
  const cell = v => { let s = String(v == null ? '' : v); if(/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const lines = [head.map(cell).join(',')].concat(state.reports.map(r =>
    [r.id, r.createdAt, r.occurredAt, r.reporterType, r.category, r.severity, r.place, r.placeDetail, r.content, r.photoCount, r.anonymous ? 'Y' : 'N', r.contactName, r.contactInfo, r.status, r.memo].map(cell).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'safety_reports.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function renderDashboard(){
  const all = state.reports;
  const cnt = s => all.filter(r => r.status === s).length;
  const f = state.filter;
  const list = all.filter(r => (f.status === '전체' || r.status === f.status) && (f.cat === '전체' || r.category === f.cat));
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0">접수 현황</h2><p class="muted small">접수된 제보와 사진을 확인하고 처리 상태를 관리합니다. (1분마다 자동 갱신)</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ghost" type="button" id="btnRefresh">↻ 새로고침</button>
        <button class="btn ghost" type="button" id="btnCsv">⬇︎ CSV</button>
        <a class="btn ghost" href="./">사이트 보기</a>
        <button class="btn ghost" type="button" id="btnLogout">🔒 잠그기(로그아웃)</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>${all.length}</b><span>전체</span></div>
      <div class="stat"><b>${cnt('접수')}</b><span>접수</span></div>
      <div class="stat"><b>${cnt('검토중')}</b><span>검토중</span></div>
      <div class="stat"><b>${cnt('조치완료')}</b><span>조치완료</span></div>
    </div>
    <div class="filters" id="fStatus">
      ${['전체'].concat(STATUSES).map(s => `<label class="chip"><input type="radio" name="fs" value="${s}" ${f.status===s?'checked':''}><span>${s}</span></label>`).join('')}
    </div>
    <div class="filters" id="fCat">
      ${CATS.map(s => `<label class="chip"><input type="radio" name="fc" value="${s}" ${f.cat===s?'checked':''}><span>${s}</span></label>`).join('')}
    </div>
    <div class="list">
      ${list.length ? list.map(r => `
        <button class="item" type="button" data-open="${esc(r.id)}">
          <div class="item-top">
            <span class="badge ${badgeCls(r.status)}">${esc(r.status)}</span>
            <span class="sev sev-${esc(r.severity)}" title="위험 ${esc(r.severity)}"></span><b>${esc(r.category)}</b>
            <span class="muted small">· ${esc(r.place)}</span>
            ${r.photoCount ? `<span class="muted small">📷 ${esc(r.photoCount)}</span>` : ''}
          </div>
          <p>${esc(r.content)}</p>
          <div class="meta"><span>${esc(r.id)}</span><span>${esc(fmtDT(r.createdAt))}</span><span>${esc(r.reporterType)}</span></div>
        </button>`).join('') : `<div class="empty">${all.length ? '조건에 맞는 제보가 없습니다.' : '아직 접수된 제보가 없습니다.'}</div>`}
    </div>`;
  $('#fStatus').addEventListener('change', e => { state.filter.status = e.target.value; renderDashboard(); });
  $('#fCat').addEventListener('change', e => { state.filter.cat = e.target.value; renderDashboard(); });
  $$('[data-open]', root).forEach(b => b.addEventListener('click', () => openDetail(b.dataset.open)));
  $('#btnRefresh').addEventListener('click', async () => { if(await load()){ renderDashboard(); toast('새로 불러왔습니다.'); } });
  $('#btnCsv').addEventListener('click', exportCsv);
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; renderLogin('로그아웃되었습니다.'); });
}

function closeOverlay(){
  $('#overlayRoot').innerHTML = ''; state.openId = null;
  state.urls.forEach(u => URL.revokeObjectURL(u)); state.urls = [];
}
function openDetail(id){
  const rep = state.reports.find(r => r.id === id); if(!rep) return;
  state.openId = id;
  $('#overlayRoot').innerHTML = `
    <div class="overlay" id="ov"><div class="sheet" role="dialog" aria-modal="true" aria-label="제보 상세">
      <div class="sheet-head"><div><span class="badge ${badgeCls(rep.status)}">${esc(rep.status)}</span> <b>${esc(rep.id)}</b></div>
        <button class="icon-btn" type="button" id="btnClose" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <dl class="kv">
        <dt>유형</dt><dd><span class="sev sev-${esc(rep.severity)}"></span> ${esc(rep.category)} · 위험 ${esc(rep.severity)}</dd>
        <dt>제보자</dt><dd>${esc(rep.reporterType)}${rep.anonymous ? ' (익명)' : ''}</dd>
        ${!rep.anonymous ? `<dt>연락처</dt><dd>${esc(rep.contactName)} ${esc(rep.contactInfo) || '<span class="muted">(보유기간 경과로 삭제됨)</span>'}</dd>` : ''}
        <dt>장소</dt><dd>${esc(rep.place)}${rep.placeDetail ? ' · ' + esc(rep.placeDetail) : ''}</dd>
        <dt>발생일시</dt><dd>${esc(fmtDT(rep.occurredAt))}</dd>
        <dt>접수일시</dt><dd>${esc(fmtDT(rep.createdAt))}</dd>
      </dl>
      <div class="content-box">${esc(rep.content)}</div>
      ${rep.photoCount ? `<div><div class="lbl" style="margin-bottom:6px">첨부 사진 (${esc(rep.photoCount)})</div><div class="photo-grid" id="dPhotos"><p class="muted small">사진 불러오는 중…</p></div></div>` : ''}
      <div class="field"><label for="dStatus">처리 상태</label>
        <select id="dStatus" class="input">${STATUSES.map(s => `<option ${s===rep.status?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field"><label for="dMemo">조치 내용 (관리자 메모)</label>
        <textarea id="dMemo" class="input" maxlength="500" style="min-height:90px">${esc(rep.memo || '')}</textarea></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="dSave" style="flex:1">저장</button>
        <button class="btn ghost" type="button" id="dPrint">🖨 접수증 출력</button>
        <button class="btn danger" type="button" id="dDel">삭제</button>
      </div>
    </div></div>`;
  $('#btnClose').addEventListener('click', closeOverlay);
  $('#dPrint').addEventListener('click', () => openReceipt(rep));
  $('#ov').addEventListener('click', e => { if(e.target.id === 'ov') closeOverlay(); });
  $('#dSave').addEventListener('click', async () => {
    const b = $('#dSave'); b.disabled = true;
    try{
      await SB.updateReport(id, { status:$('#dStatus').value, memo:$('#dMemo').value.trim() });
      closeOverlay(); await load(); renderDashboard(); toast('저장되었습니다.');
    }catch(e){ if(e.status === 401){ closeOverlay(); renderLogin('세션이 만료되었습니다.'); return; } toast(e.message || '저장하지 못했습니다.'); b.disabled = false; }
  });
  let armed = false;
  $('#dDel').addEventListener('click', async () => {
    const b = $('#dDel');
    if(!armed){ armed = true; b.textContent = '정말 삭제할까요? 한 번 더 누르세요'; setTimeout(() => { armed = false; if(b.isConnected) b.textContent = '삭제'; }, 4000); return; }
    b.disabled = true;
    try{ await SB.deleteReport(rep); closeOverlay(); await load(); renderDashboard(); toast('삭제되었습니다.'); }
    catch(e){ toast(e.message || '삭제하지 못했습니다.'); b.disabled = false; }
  });
  if(rep.photoCount){
    (async () => {
      const box = $('#dPhotos'); let n = 0; box.innerHTML = '';
      for(let i = 0; i < rep.photoCount; i++){
        try{
          const u = await SB.photoObjectUrl(rep.id, i);
          if(state.openId !== id){ URL.revokeObjectURL(u); return; }
          state.urls.push(u);
          const im = document.createElement('img'); im.src = u; im.alt = '첨부 사진 ' + (i + 1);
          im.addEventListener('click', () => openLightbox(im.src)); box.appendChild(im); n++;
        }catch(e){}
      }
      if(!n && state.openId === id) box.innerHTML = '<p class="muted small">사진을 불러오지 못했습니다.</p>';
    })();
  }
}
function openLightbox(src){
  const d = document.createElement('div'); d.className = 'lightbox';
  const im = document.createElement('img'); im.src = src; im.alt = '확대한 사진';
  d.appendChild(im); d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const lb = $('.lightbox'); if(lb) lb.remove(); else closeOverlay(); } });

/* ===================== 접수증 출력 ===================== */
const RC_KINDS = [['고객','고객 · 방문자'],['직원','사내 근로자'],['수급업체','수급업체 근로자'],['기타','기타']];
function receiptHTML(rep){
  const orgName = (typeof CONFIG !== 'undefined' ? CONFIG : window.SITE_CONFIG).orgName;
  const d = new Date(rep.createdAt);
  const dateTxt = isNaN(d) ? '' : d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  const place = rep.place + (rep.placeDetail ? ' - ' + rep.placeDetail : '');
  const kinds = RC_KINDS.map(k => `<span class="rc-opt"><i class="ck${rep.reporterType === k[1] ? ' on' : ''}"></i>${k[0]}</span>`).join('<span class="rc-sep">/</span>');
  return `<div class="paper">
      <h1>안전신문고 접수증</h1>
      <p class="rc-sub">청사 이용 중 발견한 위험요소를 신고해 주세요!</p>
      <div class="rc-row"><b>구분</b><span>:</span><div>${kinds}</div></div>
      <div class="rc-row"><b>신고일자</b><span>:</span><div>${esc(dateTxt)}</div></div>
      <div class="rc-row"><b>위험장소</b><span>:</span><div>${esc(place)}</div></div>
      <div class="rc-row"><b>신고내용</b><span>:</span><div class="rc-content">${esc(rep.content)}</div></div>
      <p class="rc-foot">접수번호 ${esc(rep.id)} · ${esc(orgName)}</p>
    </div>`;
}
function closeReceipt(){
  const r = document.getElementById('receiptRoot'); if(r) r.remove();
  document.body.classList.remove('printing-receipt');
}
function openReceipt(rep){
  closeReceipt();
  const root = document.createElement('div'); root.id = 'receiptRoot';
  root.innerHTML = `<div class="overlay rc-ov"><div class="sheet rc-sheet" role="dialog" aria-modal="true" aria-label="접수증 미리보기">
      <div class="rc-bar noprint"><button class="btn primary" type="button" id="rcPrint">🖨 인쇄</button><button class="btn ghost" type="button" id="rcClose">닫기</button></div>
      ${receiptHTML(rep)}
      <p class="muted small noprint">인쇄가 열리지 않으면 브라우저 메뉴의 인쇄(Ctrl+P)를 이용하세요. 인쇄 시 접수증만 출력됩니다.</p>
    </div></div>`;
  document.body.appendChild(root);
  document.body.classList.add('printing-receipt');
  document.getElementById('rcClose').addEventListener('click', closeReceipt);
  root.firstChild.addEventListener('click', e => { if(e.target === root.firstChild) closeReceipt(); });
  document.getElementById('rcPrint').addEventListener('click', () => { try{ window.print(); }catch(e){ toast('인쇄 창을 열지 못했습니다. 브라우저의 인쇄(Ctrl+P)를 이용해 주세요.'); } });
}
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.getElementById('receiptRoot')){ e.stopImmediatePropagation(); closeReceipt(); } }, true);


window.U.initTheme();
$('#orgName').textContent = CONFIG.orgName;
(async function init(){
  if(!SB.configured()){ renderSetup(); return; }
  if(SB.hasSession()){
    try{ if(await SB.isAdmin()){ await showDashboard(); return; } }catch(e){}
    SB.logout();
  }
  renderLogin('');
})();
})();
