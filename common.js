(function(){
'use strict';
const { $, $$, esc, toast, fmtDT } = window.U;
const SB = window.SB, CONFIG = window.SITE_CONFIG;
const STATUSES = ['접수','검토중','조치완료'];
const CATS = ['전체','아차사고','안전사고','위험요소 발견','개선 제안'];
const state = { reports:[], filter:{ status:'전체', cat:'전체' }, openId:null, timer:null, urls:[], view:'reports', notices:[], editNotice:null, weather:null, weatherPick:null, campaign:null, campaignErr:'', statMonth:null };
const badgeCls = s => s === '조치완료' ? 'b-done' : s === '검토중' ? 'b-wip' : 'b-new';
const root = $('#root');
const pinMode = () => CONFIG.ADMIN_LOGIN_MODE !== 'password';

function renderSetup(){
  root.innerHTML = `<div class="login"><div class="card">
      <h2 style="margin:0">⚙️ 서버 연결 설정이 필요합니다</h2>
      <p class="muted small"><b>site.config.js</b>의 SUPABASE_URL, SUPABASE_ANON_KEY를 입력해 주세요. 자세한 방법은 README의 3~4단계를 참고하세요.</p>
      <a class="btn ghost block" href="./">← ${esc(CONFIG.siteTitle || '안전·친환경 지킴이')}로 돌아가기</a></div></div>`;
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
      <a class="btn ghost block" href="./">← ${esc(CONFIG.siteTitle || '안전·친환경 지킴이')}로 돌아가기</a>
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
  state.timer = setInterval(async () => { if(state.openId || state.view !== 'reports' || document.getElementById('receiptRoot')) return; if(await load()) renderDashboard(); }, 60000);
}

function exportCsv(){
  const head = ['접수번호','접수일시','발생일시','제보자구분','유형','위험도','장소','상세위치','내용','사진수','익명','이름','연락처','처리상태','조치내용(내부 메모)','공개 처리결과','사진 삭제일'];
  const cell = v => { let s = String(v == null ? '' : v); if(/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const lines = [head.map(cell).join(',')].concat(state.reports.map(r =>
    [r.id, r.createdAt, r.occurredAt, r.reporterType, r.category, r.severity, r.place, r.placeDetail, r.content, r.photoCount, r.anonymous ? 'Y' : 'N', r.contactName, r.contactInfo, r.status, r.memo, r.reply, r.photosPurgedAt || ''].map(cell).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'safety_reports.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function renderDashboard(){
  if(state.view === 'notices'){ renderNoticeAdmin(); return; }
  if(state.view === 'weather'){ renderWeatherAdmin(); return; }
  if(state.view === 'campaign'){ renderCampaignAdmin(); return; }
  if(state.view === 'stats'){ renderStatsAdmin(); return; }
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
    ${viewSwitchHtml()}
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
  bindViewSwitch();
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; renderLogin('로그아웃되었습니다.'); });
}

/* ===================== 공지사항 관리 ===================== */
function viewSwitchHtml(){
  return `<div class="filters" id="viewSw">${[['reports', '📋 제보 접수'], ['stats', '📊 통계·보고서'], ['notices', '📢 공지사항'], ['weather', '🌤 안전 날씨'], ['campaign', '📅 이달 캠페인']].map(v =>
    `<label class="chip"><input type="radio" name="vw" value="${v[0]}" ${state.view === v[0] ? 'checked' : ''}><span>${v[1]}</span></label>`).join('')}</div>`;
}
function bindViewSwitch(){
  $('#viewSw').addEventListener('change', async e => {
    state.view = e.target.value; state.editNotice = null;
    if(state.view === 'notices') await loadNotices();
    if(state.view === 'weather'){ state.weatherPick = null; await loadWeatherState(); }
    if(state.view === 'campaign'){ await loadCampaignState(); }
    renderDashboard();
  });
}
async function loadNotices(){
  try{ state.notices = await SB.listNotices(); }catch(e){ toast(e.message || '공지사항을 불러오지 못했습니다.'); }
}
function renderNoticeAdmin(){
  const ed = state.editNotice;
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0">공지사항 관리</h2><p class="muted small">등록한 공지는 사이트 홈 화면의 공지사항에 바로 표시됩니다.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn ghost" href="./">사이트 보기</a>
        <button class="btn ghost" type="button" id="btnLogout">🔒 잠그기(로그아웃)</button>
      </div>
    </div>
    ${viewSwitchHtml()}
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <h3 style="margin:0">${ed ? '공지 수정' : '새 공지 작성'}</h3>
      <div class="field"><label for="nTitle" class="small muted">제목 (100자 이내)</label>
        <input id="nTitle" class="input" type="text" maxlength="100" value="${esc(ed ? ed.title : '')}"></div>
      <div class="field"><label for="nBody" class="small muted">내용 (2,000자 이내)</label>
        <textarea id="nBody" class="input" maxlength="2000" style="min-height:140px">${esc(ed ? ed.body : '')}</textarea></div>
      <label class="chk" style="border:0;padding:0"><input type="checkbox" id="nPinned" ${ed && ed.pinned ? 'checked' : ''}><span>📌 목록 맨 위에 고정</span></label>
      <div class="err" id="nErr" role="alert"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="nSave" style="flex:1">${ed ? '수정 저장' : '공지 등록'}</button>
        ${ed ? '<button class="btn ghost" type="button" id="nCancel">수정 취소</button>' : ''}
      </div>
    </div>
    <div class="list" id="nList">
      ${state.notices.length ? state.notices.map(n => `
        <div class="card">
          <div class="item-top">${n.pinned ? '<span class="npin">📌 고정</span>' : ''}<b>${esc(n.title)}</b></div>
          <div class="muted small">${esc(fmtDT(n.createdAt))}</div>
          <p class="n-prev">${esc(n.body)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn ghost" type="button" data-edit="${esc(n.id)}">수정</button>
            <button class="btn danger" type="button" data-del="${esc(n.id)}">삭제</button>
          </div>
        </div>`).join('') : '<div class="empty">등록된 공지사항이 없습니다.</div>'}
    </div>`;
  bindViewSwitch();
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; state.notices = []; state.view = 'reports'; renderLogin('로그아웃되었습니다.'); });
  const nErr = msg => { $('#nErr').textContent = msg; };
  $('#nSave').addEventListener('click', async () => {
    const title = $('#nTitle').value.trim(), body = $('#nBody').value.trim(), pinned = $('#nPinned').checked;
    if(!title) return nErr('제목을 입력해 주세요.');
    const b = $('#nSave'); b.disabled = true; nErr('');
    try{
      if(ed) await SB.updateNotice(ed.id, { title:title, body:body, pinned:pinned });
      else await SB.createNotice({ title:title, body:body, pinned:pinned });
      state.editNotice = null; await loadNotices(); renderNoticeAdmin();
      toast(ed ? '공지를 수정했습니다.' : '공지를 등록했습니다.');
    }catch(e){
      if(e.status === 401){ renderLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; }
      nErr(e.message || '저장하지 못했습니다.'); b.disabled = false;
    }
  });
  const cancel = $('#nCancel'); if(cancel) cancel.addEventListener('click', () => { state.editNotice = null; renderNoticeAdmin(); });
  $$('[data-edit]', root).forEach(b => b.addEventListener('click', () => {
    state.editNotice = state.notices.find(n => String(n.id) === b.dataset.edit) || null;
    renderNoticeAdmin(); window.scrollTo({ top:0, behavior:'smooth' });
  }));
  $$('[data-del]', root).forEach(b => {
    let armed = false;
    b.addEventListener('click', async () => {
      if(!armed){ armed = true; b.textContent = '정말 삭제할까요? 한 번 더 누르세요'; setTimeout(() => { armed = false; if(b.isConnected) b.textContent = '삭제'; }, 4000); return; }
      b.disabled = true;
      try{ await SB.deleteNotice(b.dataset.del); if(state.editNotice && String(state.editNotice.id) === b.dataset.del) state.editNotice = null; await loadNotices(); renderNoticeAdmin(); toast('공지를 삭제했습니다.'); }
      catch(e){ if(e.status === 401){ renderLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; } toast(e.message || '삭제하지 못했습니다.'); b.disabled = false; }
    });
  });
}

/* ===================== 오늘의 안전 날씨 관리 ===================== */
async function loadWeatherState(){
  try{ state.weather = await SB.getWeather(); }
  catch(e){ state.weather = null; if(e.status !== 404) toast(e.message || '안전 날씨를 불러오지 못했습니다.'); }
}
function renderWeatherAdmin(){
  const cur = state.weather;
  const pick = state.weatherPick || (cur ? cur.level : '맑음');
  const tip = WX.todayTip(window.CONTENT.TIPS);
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0">오늘의 안전 날씨</h2><p class="muted small">선택한 단계가 사이트 홈 화면 맨 위에 "오늘은 ○○ 단계"로 표시됩니다.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn ghost" href="./">사이트 보기</a>
        <button class="btn ghost" type="button" id="btnLogout">🔒 잠그기(로그아웃)</button>
      </div>
    </div>
    ${viewSwitchHtml()}
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <h3 style="margin:0">오늘의 단계 선택</h3>
      <div class="wx-pick" id="wxPick" role="radiogroup" aria-label="오늘의 안전 날씨 단계">
        ${WX.levels.map(l => `<label class="wx-opt ${WX.info[l].cls}"><input type="radio" name="wxl" value="${l}" ${pick === l ? 'checked' : ''}><span class="wx-box">${ART[WX.info[l].icon]}<b>${l} 단계</b></span></label>`).join('')}
      </div>
      <div class="err" id="wErr" role="alert"></div>
      <button class="btn primary block" type="button" id="wSave">저장</button>
      <p class="muted small">${cur ? '현재 홈 화면 표시: <b>오늘은 ' + esc(cur.level) + ' 단계</b> (' + esc(fmtDT(cur.updatedAt)) + ' 설정)' : '아직 저장된 단계가 없습니다. 저장하면 홈 화면에 표시됩니다.'}</p>
    </div>
    <h3 style="margin:6px 0 0">홈 화면 미리보기</h3>
    <div id="wxPreview">${WX.render({ state:'ok', level:pick, tip:tip, dateLabel:'미리보기' })}</div>`;
  bindViewSwitch();
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; state.notices = []; state.view = 'reports'; renderLogin('로그아웃되었습니다.'); });
  $('#wxPick').addEventListener('change', e => {
    state.weatherPick = e.target.value;
    $('#wxPreview').innerHTML = WX.render({ state:'ok', level:state.weatherPick, tip:tip, dateLabel:'미리보기' });
  });
  $('#wSave').addEventListener('click', async () => {
    const level = state.weatherPick || pick;
    const b = $('#wSave'); b.disabled = true; $('#wErr').textContent = '';
    try{
      await SB.setWeather(level);
      state.weatherPick = null; await loadWeatherState(); renderWeatherAdmin();
      toast('오늘의 안전 날씨를 "' + level + ' 단계"로 저장했습니다.');
    }catch(e){
      if(e.status === 401){ renderLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; }
      $('#wErr').textContent = e.message || '저장하지 못했습니다.'; b.disabled = false;
    }
  });
}

/* ===================== 이달의 안전·친환경 캠페인 관리 ===================== */
const thisYm = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
async function loadCampaignState(){
  state.campaignErr = '';
  try{ state.campaign = await SB.getCampaign(); }
  catch(e){ state.campaign = null; state.campaignErr = (e.status === 404 || e.status === 400) ? '캠페인 저장소가 아직 없습니다. Supabase에서 supabase/add_features.sql 을 실행해 주세요.' : (e.message || '캠페인 설정을 불러오지 못했습니다.'); }
}
function renderCampaignAdmin(){
  const C = window.CONTENT || {}, m = new Date().getMonth() + 1;
  const dsf = (C.SAFETY_CAMPAIGNS || []).find(x => x.m === m) || { title:'', body:'' };
  const dec = (C.ECO_CHALLENGES || []).find(x => x.m === m) || { title:'', desc:'', icon:'' };
  const cur = state.campaign, active = cur && cur.ym === thisYm() && (cur.safetyTitle || cur.ecoTitle);
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0">이달의 안전·친환경 캠페인</h2><p class="muted small">비워 두면 ${m}월 기본 문구가 홈 화면에 나옵니다. 직접 쓰면 <b>이번 달에만</b> 대신 표시되고, 달이 바뀌면 자동으로 기본 문구로 돌아갑니다.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn ghost" href="./">사이트 보기</a>
        <button class="btn ghost" type="button" id="btnLogout">🔒 잠그기(로그아웃)</button>
      </div>
    </div>
    ${viewSwitchHtml()}
    ${state.campaignErr ? `<div class="banner warn"><span>⚠️</span><div>${esc(state.campaignErr)}</div></div>` : ''}
    <div class="card camp-admin" style="display:flex;flex-direction:column;gap:12px">
      <h3 style="margin:0">${m}월 캠페인 문구 직접 쓰기 <span class="badge ${active ? 'b-done' : 'b-new'}">${active ? '직접 쓴 문구 표시 중' : '기본 문구 표시 중'}</span></h3>
      <div class="field"><label for="cST" class="small muted">안전 캠페인 제목 (60자 이내)</label>
        <input id="cST" class="input" type="text" maxlength="60" placeholder="기본: ${esc(dsf.title)}" value="${esc(active ? cur.safetyTitle : '')}"></div>
      <div class="field"><label for="cSB" class="small muted">안전 캠페인 내용 (300자 이내)</label>
        <textarea id="cSB" class="input" maxlength="300" placeholder="기본: ${esc(dsf.body)}">${esc(active ? cur.safetyBody : '')}</textarea></div>
      <div class="field"><label for="cET" class="small muted">친환경 캠페인 제목 (60자 이내)</label>
        <input id="cET" class="input" type="text" maxlength="60" placeholder="기본: ${esc((dec.icon || '') + ' ' + dec.title)}" value="${esc(active ? cur.ecoTitle : '')}"></div>
      <div class="field"><label for="cEB" class="small muted">친환경 캠페인 내용 (300자 이내)</label>
        <textarea id="cEB" class="input" maxlength="300" placeholder="기본: ${esc(dec.desc)}">${esc(active ? cur.ecoBody : '')}</textarea></div>
      <div class="err" id="cErr" role="alert"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn primary" type="button" id="cSave" style="flex:1">저장</button>
        <button class="btn ghost" type="button" id="cReset">기본 문구로 되돌리기</button>
      </div>
      <p class="muted small">안전 또는 친환경 중 한쪽만 써도 됩니다. 쓰지 않은 쪽은 기본 문구가 나옵니다.</p>
    </div>`;
  bindViewSwitch();
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; state.notices = []; state.view = 'reports'; renderLogin('로그아웃되었습니다.'); });
  const save = async (clear) => {
    const body = clear ? { ym:'', safetyTitle:'', safetyBody:'', ecoTitle:'', ecoBody:'' }
      : { ym:thisYm(), safetyTitle:$('#cST').value.trim(), safetyBody:$('#cSB').value.trim(), ecoTitle:$('#cET').value.trim(), ecoBody:$('#cEB').value.trim() };
    if(!clear && !body.safetyTitle && !body.ecoTitle){ $('#cErr').textContent = '제목을 하나 이상 입력해 주세요. 기본 문구를 쓰려면 \"기본 문구로 되돌리기\"를 누르세요.'; return; }
    const b = $('#cSave'), r = $('#cReset'); b.disabled = true; r.disabled = true; $('#cErr').textContent = '';
    try{
      await SB.setCampaign(body);
      await loadCampaignState(); renderCampaignAdmin();
      toast(clear ? '기본 문구로 되돌렸습니다.' : '캠페인 문구를 저장했습니다.');
    }catch(e){
      if(e.status === 401){ renderLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; }
      $('#cErr').textContent = e.message || '저장하지 못했습니다.'; b.disabled = false; r.disabled = false;
    }
  };
  $('#cSave').addEventListener('click', () => save(false));
  $('#cReset').addEventListener('click', () => save(true));
}

/* ===================== 통계 · 월간 보고서 ===================== */
const monthOf = r => String(r.createdAt || '').slice(0, 7);
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;
function monthOptions(){
  const set = {}; state.reports.forEach(r => { const m = monthOf(r); if(m) set[m] = 1; });
  set[thisYm()] = 1;
  return Object.keys(set).sort().reverse();
}
function statsFor(sel){
  const all = state.reports;
  const list = sel === '전체' ? all : all.filter(r => monthOf(r) === sel);
  const cnt = (arr, f) => arr.filter(f).length;
  const group = (key, order) => {
    const m = {}; list.forEach(r => { const k = r[key] || '(없음)'; m[k] = (m[k] || 0) + 1; });
    const keys = order ? order.concat(Object.keys(m).filter(k => order.indexOf(k) < 0)) : Object.keys(m).sort((a, b) => m[b] - m[a]);
    return keys.map(k => [k, m[k] || 0]);
  };
  const done = list.filter(r => r.status === '조치완료');
  const days = done.map(r => (new Date(r.updatedAt) - new Date(r.createdAt)) / 86400000).filter(x => isFinite(x) && x >= 0);
  const avg = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length * 10) / 10 : null;
  return {
    sel:sel, list:list, total:list.length,
    st:{ 접수:cnt(list, r => r.status === '접수'), 검토중:cnt(list, r => r.status === '검토중'), 조치완료:done.length },
    rate:pct(done.length, list.length), avgDays:avg,
    highOpen:list.filter(r => r.severity === '높음' && r.status !== '조치완료'),
    cat:group('category', ['아차사고', '안전사고', '위험요소 발견', '개선 제안']),
    sev:group('severity', ['높음', '보통', '낮음']),
    place:group('place').slice(0, 10),
    who:group('reporterType', ['사내 근로자', '수급업체 근로자', '고객 · 방문자', '기타'])
  };
}
function barRows(rows, total, cls){
  const mx = Math.max.apply(null, rows.map(r => r[1]).concat([1]));
  return `<div class="st-bars">${rows.map(r => `<div class="st-row"><span class="l" title="${esc(r[0])}">${esc(r[0])}</span><span class="tr"><i class="${cls && cls(r[0]) || ''}" style="width:${r[1] / mx * 100}%"></i></span><b>${r[1]}</b></div>`).join('')}</div>`;
}
function renderStatsAdmin(){
  const opts = monthOptions();
  if(!state.statMonth || (state.statMonth !== '전체' && opts.indexOf(state.statMonth) < 0)){
    const withData = opts.find(m => state.reports.some(r => monthOf(r) === m));
    state.statMonth = withData || thisYm();
  }
  const S = statsFor(state.statMonth);
  const last6 = opts.slice(0, 6).reverse().map(m => [m.slice(5) + '월', state.reports.filter(r => monthOf(r) === m).length]);
  const mx6 = Math.max.apply(null, last6.map(x => x[1]).concat([1]));
  const sevCls = k => k === '높음' ? 'danger' : k === '보통' ? 'warn' : '';
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0">통계 · 월간 보고서</h2><p class="muted small">접수된 제보를 월별로 집계합니다. 최근 ${state.reports.length}건 기준(최대 1,000건)입니다.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn ghost" href="./">사이트 보기</a>
        <button class="btn ghost" type="button" id="btnLogout">🔒 잠그기(로그아웃)</button>
      </div>
    </div>
    ${viewSwitchHtml()}
    <div class="st-toolbar">
      <label class="small muted" for="stM">기간</label>
      <select id="stM" class="input">${['전체'].concat(opts).map(m => `<option value="${m}"${m === state.statMonth ? ' selected' : ''}>${m === '전체' ? '전체 기간' : m.replace('-', '년 ') + '월'}</option>`).join('')}</select>
      <button class="btn primary" type="button" id="stPrint">🖨 월간 보고서 출력</button>
      <button class="btn ghost" type="button" id="stCsv">⬇︎ CSV(전체)</button>
    </div>
    <div class="st-kpi">
      <div class="stat"><b>${S.total}</b><span>접수</span></div>
      <div class="stat"><b>${S.st.조치완료}</b><span>조치완료</span><small>처리율 ${S.rate}%</small></div>
      <div class="stat"><b>${S.st.접수 + S.st.검토중}</b><span>처리 대기</span><small>접수 ${S.st.접수} · 검토중 ${S.st.검토중}</small></div>
      <div class="stat"><b style="color:${S.highOpen.length ? 'var(--danger)' : 'inherit'}">${S.highOpen.length}</b><span>미조치 높음</span><small>${S.avgDays == null ? '평균 처리일 -' : '평균 ' + S.avgDays + '일 소요'}</small></div>
    </div>
    ${S.total ? `
    <div class="st-cols">
      <div class="card"><h3>유형별</h3>${barRows(S.cat)}</div>
      <div class="card"><h3>위험도별</h3>${barRows(S.sev, S.total, sevCls)}</div>
      <div class="card"><h3>장소별 (상위 10)</h3>${barRows(S.place)}</div>
      <div class="card"><h3>제보자 구분</h3>${barRows(S.who)}</div>
    </div>
    <div class="card"><h3>월별 접수 추이 (최근 6개월)</h3>
      <div class="st-month">${last6.map(x => `<div><b>${x[1]}</b><i style="height:${x[1] / mx6 * 80}px"></i><span>${esc(x[0])}</span></div>`).join('')}</div></div>
    <div class="card"><h3>미조치 높음 위험 제보 ${S.highOpen.length}건</h3>
      ${S.highOpen.length ? `<div class="list">${S.highOpen.slice(0, 20).map(r => `<button class="item" type="button" data-open="${esc(r.id)}"><div class="item-top"><span class="badge ${badgeCls(r.status)}">${esc(r.status)}</span><b>${esc(r.category)}</b><span class="muted small">· ${esc(r.place)}</span></div><p>${esc(r.content)}</p><div class="meta"><span>${esc(r.id)}</span><span>${esc(fmtDT(r.createdAt))}</span></div></button>`).join('')}</div>` : '<p class="muted">위험도가 높은데 아직 조치되지 않은 제보가 없습니다. 👍</p>'}
    </div>` : '<div class="empty">선택한 기간에 접수된 제보가 없습니다.</div>'}`;
  bindViewSwitch();
  $('#btnLogout').addEventListener('click', () => { SB.logout(); state.reports = []; state.notices = []; state.view = 'reports'; renderLogin('로그아웃되었습니다.'); });
  $('#stM').addEventListener('change', e => { state.statMonth = e.target.value; renderStatsAdmin(); });
  $('#stCsv').addEventListener('click', exportCsv);
  $('#stPrint').addEventListener('click', () => openMonthlyReport(S));
  $$('[data-open]', root).forEach(b => b.addEventListener('click', () => openDetail(b.dataset.open)));
}
function monthlyReportHTML(S){
  const org = (typeof CONFIG !== 'undefined' ? CONFIG : window.SITE_CONFIG);
  const label = S.sel === '전체' ? '전체 기간' : S.sel.slice(0, 4) + '년 ' + parseInt(S.sel.slice(5), 10) + '월';
  const now = new Date();
  const trow = (rows) => rows.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1]}건</td><td class="n">${pct(r[1], S.total)}%</td></tr>`).join('');
  const sum = t => t.length > 60 ? t.slice(0, 60) + '…' : t;
  const hi = S.list.filter(r => r.severity === '높음');
  return `<div class="paper rp">
      <h1>${esc(org.siteTitle || '안전·친환경 지킴이')} 월간 보고서</h1>
      <p class="rp-sub">${esc(org.orgName)} · 안전신문고 접수 현황 · 대상 기간: ${esc(label)} · 작성일: ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}</p>
      <h2>1. 처리 현황 요약</h2>
      <div class="rp-kpi">
        <div><b>${S.total}건</b>접수</div><div><b>${S.st.조치완료}건</b>조치완료 (${S.rate}%)</div>
        <div><b>${S.st.접수 + S.st.검토중}건</b>처리 대기</div><div><b>${S.highOpen.length}건</b>미조치 높음</div>
      </div>
      <p class="rp-note">접수 ${S.st.접수}건 · 검토중 ${S.st.검토중}건 · 조치완료 ${S.st.조치완료}건${S.avgDays == null ? '' : ' · 접수부터 최종 처리까지 평균 ' + S.avgDays + '일(마지막 수정일 기준 추정)'}</p>
      <h2>2. 유형별</h2><table><tr><th>유형</th><th class="n">건수</th><th class="n">비율</th></tr>${trow(S.cat)}</table>
      <h2>3. 위험도별</h2><table><tr><th>위험도</th><th class="n">건수</th><th class="n">비율</th></tr>${trow(S.sev)}</table>
      <h2>4. 장소별 (상위 10)</h2><table><tr><th>장소</th><th class="n">건수</th><th class="n">비율</th></tr>${trow(S.place)}</table>
      <h2>5. 제보자 구분</h2><table><tr><th>구분</th><th class="n">건수</th><th class="n">비율</th></tr>${trow(S.who)}</table>
      <h2>6. 위험도 \"높음\" 제보 (${hi.length}건)</h2>
      ${hi.length ? `<table><tr><th>접수번호</th><th>접수일</th><th>유형·장소</th><th>내용</th><th>상태</th></tr>${hi.slice(0, 30).map(r => `<tr><td>${esc(r.id)}</td><td>${esc(String(r.createdAt || '').slice(0, 10))}</td><td>${esc(r.category)} · ${esc(r.place)}</td><td>${esc(sum(r.content))}${r.memo ? '<br><small>조치: ' + esc(sum(r.memo)) + '</small>' : ''}</td><td>${esc(r.status)}</td></tr>`).join('')}</table>${hi.length > 30 ? `<p class="rp-note">※ 상위 30건만 표시했습니다. 전체 목록은 관리자 화면 또는 CSV를 확인하세요.</p>` : ''}` : '<p>해당 기간에 위험도 \"높음\" 제보가 없습니다.</p>'}
      <p class="rp-note">※ 이 보고서에는 제보자의 이름·연락처가 포함되지 않습니다. 담당자 확인: ____________ &nbsp; 부서장 확인: ____________</p>
    </div>`;
}
function openMonthlyReport(S){
  closeReceipt();
  const rt = document.createElement('div'); rt.id = 'receiptRoot';
  rt.innerHTML = `<div class="overlay rc-ov"><div class="sheet rc-sheet" role="dialog" aria-modal="true" aria-label="월간 보고서 미리보기">
      <div class="rc-bar noprint"><button class="btn primary" type="button" id="rcPrint">🖨 인쇄 / PDF 저장</button><button class="btn ghost" type="button" id="rcClose">닫기</button></div>
      ${monthlyReportHTML(S)}
      <p class="muted small noprint">인쇄 창에서 \"PDF로 저장\"을 고르면 파일로 보관할 수 있습니다. 인쇄 시 보고서만 출력됩니다.</p>
    </div></div>`;
  document.body.appendChild(rt);
  document.body.classList.add('printing-receipt');
  document.getElementById('rcClose').addEventListener('click', closeReceipt);
  rt.firstChild.addEventListener('click', e => { if(e.target === rt.firstChild) closeReceipt(); });
  document.getElementById('rcPrint').addEventListener('click', () => { try{ window.print(); }catch(e){ toast('인쇄 창을 열지 못했습니다. 브라우저의 인쇄(Ctrl+P)를 이용해 주세요.'); } });
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
      ${rep.photosPurgedAt ? `<div class="banner warn"><span>📷</span><div>첨부 사진은 보관기간(30일)이 지나 ${esc(fmtDT(rep.photosPurgedAt))}에 자동 삭제되었습니다.</div></div>` : ''}
      <div class="field"><label for="dStatus">처리 상태</label>
        <select id="dStatus" class="input">${STATUSES.map(s => `<option ${s===rep.status?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field"><label for="dReply">처리 결과 (제보자에게 공개)</label>
        <textarea id="dReply" class="input" maxlength="300" style="min-height:80px" placeholder="예: 미끄럼 주의 표지를 설치하고 바닥을 정비했습니다.">${esc(rep.reply || '')}</textarea>
        <span class="hint">접수번호로 조회하는 사람에게 그대로 보입니다. 이름·연락처 등 개인정보는 쓰지 마세요.</span></div>
      <div class="field"><label for="dMemo">조치 내용 (관리자 메모 · 내부용, 공개되지 않음)</label>
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
      await SB.updateReport(id, { status:$('#dStatus').value, memo:$('#dMemo').value.trim(), reply:$('#dReply').value.trim() });
      closeOverlay(); await load(); renderDashboard(); toast('저장되었습니다.');
    }catch(e){
      if(e.status === 401){ closeOverlay(); renderLogin('세션이 만료되었습니다.'); return; }
      if(/reply|photos_purged_at/.test(e.message || '')) toast('서버에 “처리 결과” 칸이 아직 없습니다. Supabase에서 supabase/add_features.sql 을 먼저 실행해 주세요.');
      else toast(e.message || '저장하지 못했습니다.');
      b.disabled = false;
    }
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
