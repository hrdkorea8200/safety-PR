(function(){
'use strict';
const CONFIG = window.SITE_CONFIG;
const { TIPS, RULES10, SELFCHECK, RULES, EMERGENCY, ECO_TOP, ECO_SELFCHECK, ECO } = window.CONTENT;
const { $, $$, esc, toast, nowLocal } = window.U;
const SB = window.SB;
const MAX_PHOTOS = 3;
const MAX_PHOTO_CHARS = 180000;
const JPEG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;

/* ===================== 탭 / 라우팅 ===================== */
const ICONS = {
  home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  rules:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  emergency:'<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
  report:'<path d="M3 11v2a1 1 0 001 1h2l7 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M16 9a4 4 0 010 6"/><path d="M19 6.5a8 8 0 010 11"/>',
  shoot:'<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/>',
  menu:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  admin:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>'
};
/* 화면(페이지) 목록: 주소(#id)로 열 수 있는 모든 화면 */
const TABS = [
  { id:'home' }, { id:'menu' }, { id:'rules' }, { id:'emergency' }, { id:'report' }, { id:'shoot' }, { id:'eco' }, { id:'search' }, { id:'quiz' },
  { id:'admin', href:'admin.html' }   /* 숫자 암호 입력 화면으로 이동 */
];
/* 하단 메뉴는 3칸만: 홈 / 바로가기 / 안전신문고. 안전수칙·비상대응·촬영안전은 '바로가기'(또는 홈 퀵 메뉴)로 들어가며, 그 화면에서는 '바로가기'가 켜져 있습니다. */
const BAR = [
  { id:'home',   label:'홈',        on:['home'] },
  { id:'menu',   label:'바로가기',  on:['menu','rules','emergency','shoot','eco','search','quiz'] },
  { id:'report', label:'안전신문고', on:['report'] }
];
/* 주소 형식: #탭  또는  #탭/세부 (예: #shoot/camera-01) */
function hashParts(){
  const h = (location.hash || '').replace(/^#/, ''), i = h.indexOf('/');
  if(i < 0) return [h, ''];
  let sub = h.slice(i + 1); try{ sub = decodeURIComponent(sub); }catch(e){}
  return [h.slice(0, i), sub];
}
let currentTab = hashParts()[0];
if(!TABS.some(t => t.id === currentTab && !t.href)) currentTab = 'home';
const PAGE_TITLES = { home:'', menu:'바로가기', rules:'안전수칙', emergency:'비상대응', report:'안전신문고', shoot:'촬영안전', eco:'친환경', search:'전체 검색', quiz:'오늘의 퀴즈' };
function syncAppBar(){
  document.body.dataset.page = currentTab;
  const bt = $('#barTitle'); if(bt) bt.textContent = PAGE_TITLES[currentTab] || '';
  const bb = $('#backBtn'); if(bb) bb.hidden = (currentTab === 'home');
}
function renderTabs(){
  $('#tabs').innerHTML = BAR.map(t =>
    `<button class="tab" role="tab" type="button" data-tab="${t.id}" aria-selected="${t.on.includes(currentTab)}">
       <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t.id]}</svg><span>${t.label}</span></button>`).join('');
  $$('main > .panel').forEach(p => p.hidden = (p.id !== 'p-' + currentTab));
  syncAppBar();
  if(currentTab === 'shoot' && window.ShootUI) window.ShootUI.route(hashParts()[1]);
  if(window.Extras) window.Extras.onShow(currentTab);
}
/* 화면 이동 기록: 휴대폰의 뒤로 가기 버튼과 화면 왼쪽 위 ‹ 버튼이 앱처럼 이전 화면으로 돌아가게 합니다 */
let navDepth = 0;
try{ history.replaceState({ d:0 }, ''); }catch(e){}
window.addEventListener('popstate', () => {
  const st = history.state;
  if(st && typeof st.d === 'number') navDepth = st.d;
  else { navDepth += 1; try{ history.replaceState({ d:navDepth }, ''); }catch(e){} }   /* 화면 안 링크로 이동한 경우 */
});
function goBack(){
  if(navDepth > 0){ history.back(); return; }
  if(currentTab === 'shoot' && hashParts()[1]){ location.hash = '#shoot'; return; }
  go('home');
}
function go(id){
  const tt = TABS.find(t => t.id === id);
  if(tt && tt.href){ location.href = tt.href; return; }
  currentTab = id;
  if(location.hash !== '#' + id){ try{ navDepth += 1; history.pushState({ d:navDepth }, '', '#' + id); }catch(e){ navDepth -= 1; } }
  renderTabs();
  window.scrollTo({ top:0, behavior:'auto' });
}
document.addEventListener('click', e => { if(e.target.closest('#backBtn')) goBack(); });
/* 스크롤하면 앱 바에 현재 화면 제목이 나타납니다 */
(function(){ let t = false; window.addEventListener('scroll', () => { if(t) return; t = true; requestAnimationFrame(() => { document.body.classList.toggle('scrolled', window.scrollY > 56); t = false; }); }, { passive:true }); })();
document.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]'); if(tb){ go(tb.dataset.tab); return; }
  const g = e.target.closest('[data-go]'); if(g){ go(g.dataset.go); }
});
window.addEventListener('hashchange', () => {
  const hp = hashParts(), h = hp[0];
  if(!TABS.some(t => t.id === h && !t.href)) return;
  if(h !== currentTab){ currentTab = h; renderTabs(); window.scrollTo({ top:0 }); }
  else if(h === 'shoot' && window.ShootUI){ window.ShootUI.route(hp[1]); }   /* 촬영안전 안에서 장비·메뉴 이동 */
});

/* ===================== 홈 ===================== */
/* 안전·환경 서비스 바로가기 6칸 (홈과 '바로가기' 화면이 같이 씁니다) */
function quickTiles(){
  /* 색은 안전보건표지의 뜻을 따릅니다: 파랑=지시, 노랑=경고, 빨강=소방·긴급, 녹색=안내(친환경) */
  const t = (go, art, name, label, tone) => `<button class="qtile tone-${tone}" type="button" data-go="${go}" aria-label="${label} 바로가기">${art}<b>${name}</b></button>`;
  return `<nav class="quick" aria-label="안전·환경 서비스 바로가기">
      ${t('rules', ART.helmet, '안전정보', '안전정보', 'blue')}
      ${t('report', ART.bubble, '안전신문고', '안전신문고', 'yellow')}
      ${t('emergency', ART.siren, '비상대응', '비상대응', 'red')}
      ${t('shoot', ART.camera, '촬영현장 안전가이드', '촬영현장 안전가이드', 'navy')}
      ${t('eco', ART.eco, '친환경', '친환경', 'green')}
      <a class="qtile tone-call" href="tel:119" aria-label="긴급상황 119 전화">${ART.phone}<b>긴급상황 119</b></a>
    </nav>`;
}

function renderHome(){
  const tip = WX.todayTip(TIPS);
  $('#p-home').innerHTML = `
    <h1 class="sr-only">${esc(CONFIG.orgName)} ${esc(CONFIG.siteTitle || '안전·친환경 지킴이')}</h1>

    <button class="search-launch" type="button" data-go="search" aria-label="전체 검색">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>
      <span>무엇이든 찾아보세요 <em>소화기 · 분리배출 · 드론</em></span>
    </button>

    <div id="wxSlot">${WX.render({ state:'loading', tip:tip })}</div>

    <section class="card notice-card" aria-label="공지사항">
      <div class="notice-head">
        <div><h2>📢 공지사항</h2><p class="muted small">안전·환경과 관련한 소식을 알려 드립니다.</p></div>
        <div class="mascot-wrap"><img class="mascot" src="./mascot.png" alt="확성기로 안내하는 한국산업인력공단 캐릭터" width="112" height="88"></div>
      </div>
      <div id="noticeList" class="notice-list"><p class="muted small">불러오는 중…</p></div>
    </section>

    <h2 class="q-title">안전·환경 서비스 바로가기</h2>
    ${quickTiles()}

    <div id="campSlot"></div>
    <div id="quizSlot"></div>

    <h2>아차사고, 왜 중요할까요?</h2>
    <div class="card">
      <p><b>아차사고</b>란 사고로 이어질 뻔했지만 다행히 다치거나 피해가 없었던 상황입니다. 하인리히 법칙(1:29:300)으로 널리 알려진 것처럼, 큰 사고 뒤에는 수많은 작은 징후가 있습니다.</p>
      <div class="pyr" aria-label="하인리히 법칙 1:29:300">
        <div class="a"><em>1</em>중대 사고</div>
        <div class="b"><em>29</em>경미한 사고</div>
        <div class="c"><em>300</em>아차사고 · 위험 징후</div>
      </div>
      <p class="muted small">제보는 잘잘못을 따지기 위한 것이 아니라 <b>같은 일이 반복되지 않게 하기 위한 것</b>입니다.</p>
    </div>

    <h2>사무실 안전 핵심 수칙 10</h2>
    <ol class="rules10">${RULES10.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`;
}

/* ===================== 바로가기 (모든 안전 서비스 모음) ===================== */
function renderMenu(){
  $('#p-menu').innerHTML = `
    <div class="page-head">
      <div>
        <h2 style="margin-top:0">바로가기</h2>
        <p class="muted">필요한 안전·환경 정보를 골라 보세요.</p>
      </div>
      ${window.U.mascotDuo()}
    </div>
    ${quickTiles()}
    <div id="offlineSlot"></div>
    <div id="installSlot"></div>
    <div class="menu-more">
      <button class="btn ghost" type="button" data-go="search">🔍 전체 검색</button>
      <button class="btn ghost" type="button" data-go="quiz">🧠 오늘의 퀴즈</button>
    </div>
    <button class="btn ghost block" type="button" data-go="admin">🔒 관리자 (제보 확인 · 공지 관리)</button>`;
}

/* ===================== 친환경 (사무실 · 홍보물 · 행사 + 촬영현장 안내 연결) ===================== */
function renderEco(){
  $('#p-eco').innerHTML = `
    <div class="page-head">
      <div>
        <h2 style="margin-top:0">🌱 친환경</h2>
        <p class="muted">에너지를 아끼고 쓰레기를 줄이는 작은 습관이 더 안전한 일터와 깨끗한 환경을 함께 만듭니다.</p>
      </div>
      ${window.U.mascotEco(true)}
    </div>

    <div id="ecoChallenge"></div>

    <h2>친환경 실천 8가지</h2>
    <ol class="rules10">${ECO_TOP.map(r => `<li>${esc(r)}</li>`).join('')}</ol>

    <div class="card">
      <h3>✅ 내 자리 친환경 셀프체크</h3>
      <p class="muted small">해당하는 항목을 눌러 보세요. (저장되지 않습니다)</p>
      <div id="ecoChk">${ECO_SELFCHECK.map((t,i) => `<label class="chk"><input type="checkbox" data-i="${i}"><span>${esc(t)}</span></label>`).join('')}</div>
      <div class="score"><span id="ecoScoreTxt">0 / ${ECO_SELFCHECK.length}</span><div class="bar"><i id="ecoScoreBar"></i></div></div>
      <p class="note" id="ecoScoreMsg" style="margin-top:10px">체크하지 못한 항목은 오늘부터 하나씩 실천해 보세요.</p>
    </div>

    <h2>분야별 친환경 수칙</h2>
    ${ECO.map((r, i) => accordion(r, i === 0, true)).join('')}

    <div class="card">
      <h3>🎬 촬영현장 친환경</h3>
      <p class="muted small">촬영 전·중·후 체크리스트와 배터리·세트 폐기물·야외 자연환경·연기 효과 안내가 있습니다.</p>
      <a class="btn ghost block" href="#shoot/common" style="margin-top:8px">촬영현장 친환경 수칙 보기</a>
    </div>

    <div class="card">
      <h3>💡 친환경 아이디어 · 낭비 신고</h3>
      <p class="muted small">새는 물, 켜져 있는 조명, 넘치는 쓰레기통, 개선 아이디어를 <b>안전신문고</b>(제보 유형: 위험요소 발견 · 개선 제안)로 알려 주세요.</p>
      <button class="btn primary block" type="button" data-go="report" style="margin-top:8px">안전신문고로 제안하기</button>
    </div>`;
  $('#ecoChk').addEventListener('change', () => {
    const n = $$('#ecoChk input:checked').length, tot = ECO_SELFCHECK.length;
    $('#ecoScoreTxt').textContent = n + ' / ' + tot;
    $('#ecoScoreBar').style.width = (n / tot * 100) + '%';
    $('#ecoScoreMsg').textContent = n === tot ? '훌륭해요! 지구와 일터를 함께 지키고 계십니다. 🌍' : '체크하지 못한 항목은 오늘부터 하나씩 실천해 보세요.';
  });
}

/* ===================== 오늘의 안전 날씨 (이용자 화면) ===================== */
function bindMascots(){
  $$('.mascot').forEach(im => { if(im.dataset.bound) return; im.dataset.bound = '1'; im.addEventListener('error', () => { const w = im.closest('.mascot-wrap'); if(w) w.hidden = true; }); });
}
async function loadWeather(){
  const slot = $('#wxSlot'); if(!slot) return;
  const tip = WX.todayTip(TIPS);
  if(!SB.configured()){ slot.innerHTML = WX.render({ state:'error', tip:tip }); bindMascots(); return; }
  try{ const w = await SB.getWeather(); slot.innerHTML = WX.render({ state:'ok', level:w.level, updatedAt:w.updatedAt, tip:tip }); }
  catch(e){ slot.innerHTML = WX.render({ state:'error', tip:tip }); }
  bindMascots();
}

/* ===================== 공지사항 (이용자 화면) ===================== */
function fmtDate(v){
  const d = new Date(v); if(isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
}
async function loadNotices(){
  const box = $('#noticeList'); if(!box) return;
  if(!SB.configured()){ box.innerHTML = '<p class="muted small">공지사항이 아직 연결되지 않았습니다.</p>'; return; }
  try{ renderNotices(await SB.listNotices()); }
  catch(e){ box.innerHTML = '<p class="muted small">공지사항을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>'; }
}
function renderNotices(list){
  const box = $('#noticeList'); if(!box) return;
  if(!list.length){ box.innerHTML = '<p class="muted">등록된 공지사항이 없습니다.</p>'; return; }
  const SHOW = 5;
  box.innerHTML = list.map((n, i) => `<details class="notice-item${n.pinned ? ' pinned' : ''}"${i >= SHOW ? ' data-more hidden' : ''}>
      <summary><span class="n-title">${n.pinned ? '<span class="npin">📌 고정</span>' : ''}${esc(n.title)}</span><span class="n-date">${esc(fmtDate(n.createdAt))}</span></summary>
      <div class="n-body">${esc(n.body) || '<span class="muted">(내용 없음)</span>'}</div></details>`).join('')
    + (list.length > SHOW ? `<button class="btn ghost block" type="button" id="noticeMore">이전 공지 더 보기 (${list.length - SHOW}건)</button>` : '');
  const more = $('#noticeMore');
  if(more) more.addEventListener('click', () => { $$('#noticeList [data-more]').forEach(d => d.hidden = false); more.remove(); });
}

/* ===================== 안전수칙 ===================== */
function accordion(item, open, noArt){
  const lists = [];
  if(item.art === 'eco' && !noArt) lists.push(window.U.mascotEco());
  if(item.intro) lists.push(`<p>${item.intro}</p>`);
  if(item.do) lists.push(`<div class="lbl ok">이렇게 해요</div><ul class="ul ok">${item.do.map(x => `<li>${x}</li>`).join('')}</ul>`);
  if(item.dont) lists.push(`<div class="lbl no">하지 않아요</div><ul class="ul no">${item.dont.map(x => `<li>${x}</li>`).join('')}</ul>`);
  if(item.steps) lists.push(`<ol class="steps">${item.steps.map(x => `<li>${x}</li>`).join('')}</ol>`);
  if(item.note) lists.push(`<p class="note">${item.note}</p>`);
  return `<details class="acc"${open?' open':''}><summary><span class="acc-ic">${item.icon}</span><span>${item.title}</span></summary><div class="acc-body">${lists.join('')}</div></details>`;
}
function renderRules(){
  $('#p-rules').innerHTML = `
    <div class="page-head">
      <div>
        <h2 style="margin-top:0">안전수칙</h2>
        <p class="muted">분야를 눌러 자세한 수칙을 확인하세요.</p>
      </div>
      ${window.U.mascotDuo()}
    </div>
    <div class="card">
      <h3>✅ 내 자리 안전 셀프체크</h3>
      <p class="muted small">해당하는 항목을 눌러 보세요. (저장되지 않습니다)</p>
      <div id="selfchk">${SELFCHECK.map((t,i) => `<label class="chk"><input type="checkbox" data-i="${i}"><span>${esc(t)}</span></label>`).join('')}</div>
      <div class="score"><span id="scoreTxt">0 / ${SELFCHECK.length}</span><div class="bar"><i id="scoreBar"></i></div></div>
      <p class="note" id="scoreMsg" style="margin-top:10px">체크하지 못한 항목은 오늘 바로 개선해 보세요.</p>
    </div>
    ${RULES.map((r,i) => accordion(r, i===0)).join('')}`;
  $('#selfchk').addEventListener('change', () => {
    const n = $$('#selfchk input:checked').length, tot = SELFCHECK.length;
    $('#scoreTxt').textContent = n + ' / ' + tot;
    $('#scoreBar').style.width = (n / tot * 100) + '%';
    $('#scoreMsg').textContent = n === tot ? '훌륭해요! 안전한 자리를 만들고 계십니다. 🎉' : '체크하지 못한 항목은 오늘 바로 개선해 보세요.';
  });
}

/* ===================== 비상대응 ===================== */
function renderEmergency(){
  $('#p-emergency').innerHTML = `
    <div class="page-head">
      <div>
        <h2 style="margin-top:0">비상대응</h2>
        <p class="muted">급박한 위험이라면 이 페이지에서 제보하지 말고 <b>먼저 전화</b>하세요.</p>
      </div>
      ${window.U.mascotDuo()}
    </div>
    <div class="card">
      <h3>📞 긴급 연락처</h3>
      ${CONFIG.contacts.map(c => `
        <div class="contact">
          <div><b>${esc(c.label)}</b><span class="num">${esc(c.number)}</span></div>
          ${c.tel ? `<a class="callbtn" href="tel:${esc(c.tel)}">전화</a>` : ''}
        </div>`).join('')}
    </div>
    <div class="card">
      <h3>📍 우리 사무실 비상 정보</h3>
      <div class="facts">
        <div class="fact"><b>비상 집결지</b><span>${esc(CONFIG.assemblyPoint)}</span></div>
        <div class="fact"><b>소화기</b><span>${esc(CONFIG.extinguisherLoc)}</span></div>
        <div class="fact"><b>AED</b><span>${esc(CONFIG.aedLoc)}</span></div>
      </div>
    </div>
    ${EMERGENCY.map((e,i) => accordion(e, i===0)).join('')}`;
}

/* ===================== 안전신문고 (제보 폼) ===================== */
const form = { photos:[], busy:false, processing:false };

/* ----- 접수번호로 처리 결과 조회 (제보자용: 상태와 공개된 처리 결과만 보여 줍니다) ----- */
function lookupCardHtml(){
  return `<details class="card lookup" id="lkBox">
      <summary>🔎 접수번호로 처리 결과 조회</summary>
      <div class="lk-body">
        <p class="muted small">제보할 때 받은 접수번호(예: SF-261008-AB12C)를 입력하면 처리 상태와 공개된 처리 결과를 볼 수 있어요. 익명으로 제보했어도 조회됩니다.</p>
        <div class="lk-row">
          <input id="lkId" class="input" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="20" placeholder="SF-YYMMDD-XXXXX" aria-label="접수번호">
          <button class="btn primary" type="button" id="lkBtn">조회</button>
        </div>
        <div id="lkRes" aria-live="polite"></div>
      </div>
    </details>`;
}
const LK_RE = /^SF-[0-9]{6}-[0-9A-F]{5}$/;
const LK_STEPS = ['접수', '검토중', '조치완료'];
function lookupResultHtml(r){
  const at = LK_STEPS.indexOf(r.status);
  const cls = r.status === '조치완료' ? 'b-done' : r.status === '검토중' ? 'b-wip' : 'b-new';
  const msg = r.status === '조치완료' ? '조치가 완료되었습니다.' : r.status === '검토중' ? '담당자가 내용을 검토하고 있습니다.' : '제보가 접수되었습니다. 곧 담당자가 확인합니다.';
  return `<div class="lk-card">
      <div class="lk-top"><span class="badge ${cls}">${esc(r.status)}</span><b>${esc(r.id)}</b></div>
      <ol class="lk-steps" aria-label="처리 단계">${LK_STEPS.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><i>${i < at || (i === at && at === 2) ? '✓' : i + 1}</i><span>${s}</span></li>`).join('')}</ol>
      <p>${msg}</p>
      <dl class="kv"><dt>유형</dt><dd>${esc(r.category)}</dd><dt>접수일</dt><dd>${esc(fmtDate(r.createdAt))}</dd><dt>최근 처리일</dt><dd>${esc(fmtDate(r.updatedAt))}</dd></dl>
      <div class="lk-reply"><b>📝 처리 결과</b><p>${r.reply ? esc(r.reply) : '<span class="muted">아직 공개된 처리 결과가 없습니다. 처리 결과가 등록되면 이곳에 안내됩니다.</span>'}</p></div>
    </div>`;
}
async function doLookup(){
  const box = $('#lkRes'), btn = $('#lkBtn'); if(!box) return;
  const id = $('#lkId').value.trim().toUpperCase().replace(/\s+/g, '');
  $('#lkId').value = id;
  if(!LK_RE.test(id)){ box.innerHTML = '<p class="err">접수번호는 SF-날짜6자리-5자리(영문 A~F·숫자) 형식입니다. 예: SF-261008-AB12C</p>'; return; }
  if(!SB.configured()){ box.innerHTML = '<p class="err">서버 연결 설정이 아직 되지 않았습니다. 관리자에게 문의해 주세요.</p>'; return; }
  btn.disabled = true; box.innerHTML = '<p class="muted small">조회 중…</p>';
  try{
    const r = await SB.lookupReport(id);
    box.innerHTML = r ? lookupResultHtml(r) : '<p class="err">해당 접수번호를 찾을 수 없습니다. 번호를 다시 확인해 주세요. (삭제된 제보는 조회되지 않습니다)</p>';
  }catch(e){ box.innerHTML = '<p class="err">' + esc(e.message || '조회하지 못했습니다.') + '</p>'; }
  btn.disabled = false;
}
function bindLookup(){
  const b = $('#lkBtn'); if(!b) return;
  b.addEventListener('click', doLookup);
  $('#lkId').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); doLookup(); } });
}
function openLookup(id){
  const box = $('#lkBox'); if(!box) return;
  box.open = true; if(id) $('#lkId').value = id;
  box.scrollIntoView({ behavior:'smooth', block:'start' });
  if(id) doLookup();
}

function renderReport(){
  const placeOpts = CONFIG.places.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  $('#p-report').innerHTML = `
    <div class="page-head">
      <div>
        <h2 style="margin-top:0">📣 안전신문고</h2>
        <p class="muted">아차사고, 사고, 위험요소, 개선 아이디어를 자유롭게 알려주세요. 근로자 · 수급업체 · 고객 누구나 제보할 수 있고, <b>이름 없이 익명</b>으로도 가능합니다.</p>
      </div>
      ${window.U.mascotDuo()}
    </div>
    ${lookupCardHtml()}
    <div id="rBanner"></div>
    <div id="rWrap" class="stack" style="gap:18px">
      <div class="banner danger"><span>🚨</span><div><b>생명·신체에 급박한 위험이 있나요?</b>이 제보보다 먼저 <a href="tel:119" style="color:inherit">119</a> 또는 비상연락처로 연락해 주세요.</div></div>

      <div class="field"><span class="lab">제보하시는 분 <span class="req">*</span></span>
        <div class="chips">
          ${['사내 근로자','수급업체 근로자','고객 · 방문자','기타'].map(v => `<label class="chip"><input type="radio" name="rtype" value="${v}"><span>${v}</span></label>`).join('')}
        </div></div>

      <div class="field"><span class="lab">제보 유형 <span class="req">*</span></span>
        <div class="chips">
          ${['아차사고','안전사고','위험요소 발견','개선 제안'].map(v => `<label class="chip"><input type="radio" name="cat" value="${v}"><span>${v}</span></label>`).join('')}
        </div>
        <span class="hint">아차사고: 다치진 않았지만 사고가 날 뻔한 일</span></div>

      <div class="field"><span class="lab">위험 정도 <span class="req">*</span></span>
        <div class="chips">
          ${[['낮음',''],['보통',''],['높음','sev-h']].map(a => `<label class="chip ${a[1]}"><input type="radio" name="sev" value="${a[0]}"><span>${a[0]}${a[0]==='높음'?' (즉시 조치 필요)':''}</span></label>`).join('')}
        </div></div>

      <div class="field"><label for="fPlace">장소 <span class="req">*</span></label>
        <select id="fPlace" class="input"><option value="">장소를 선택하세요</option>${placeOpts}</select>
        <input id="fPlaceDetail" class="input" type="text" maxlength="80" placeholder="상세 위치 (예: 3층 엘리베이터 앞)"></div>

      <div class="field"><label for="fWhen">발생 · 발견 일시 <span class="req">*</span></label>
        <input id="fWhen" class="input" type="datetime-local"></div>

      <div class="field"><label for="fContent">내용 <span class="req">*</span></label>
        <textarea id="fContent" class="input" maxlength="1000" placeholder="어떤 일이 있었나요? 어떤 점이 위험하다고 느끼셨나요? 어떻게 개선하면 좋을지도 알려주세요."></textarea>
        <span class="hint" id="cnt">0 / 1000</span></div>

      <div class="field"><span class="lab">사진 첨부 <span class="muted" style="font-weight:400">(선택, 최대 ${MAX_PHOTOS}장)</span></span>
        <div class="photos-actions">
          <button class="btn ghost" type="button" id="btnCam">📷 사진 촬영</button>
          <button class="btn ghost" type="button" id="btnAlbum">🖼️ 앨범에서 선택</button>
        </div>
        <input type="file" id="fCam" accept="image/*" capture="environment" hidden>
        <input type="file" id="fAlbum" accept="image/*" multiple hidden>
        <div class="thumbs" id="thumbs"></div>
        <span class="hint" id="photoHint">얼굴·차량번호·개인정보 등이 찍히지 않도록 주의해 주세요. 사진은 자동으로 압축되며 위치정보(GPS)는 제거됩니다. 사진은 접수 후 30일이 지나면 자동으로 삭제됩니다.</span></div>

      <div class="field">
        <label class="chk" style="border:0;padding:0"><input type="checkbox" id="fWantReply"><span>처리 결과를 받고 싶어요 (연락처 남기기, 선택)</span></label>
        <div id="contactBox" class="field" hidden style="gap:10px">
          <input id="fName" class="input" type="text" maxlength="30" placeholder="이름">
          <input id="fContact" class="input" type="text" maxlength="60" placeholder="연락처 (전화번호 또는 이메일)">
          <label class="chk" style="border:0;padding:0"><input type="checkbox" id="fConsent"><span class="small">개인정보 수집·이용에 동의합니다.<br><span class="muted">${esc(CONFIG.privacyNotice)}</span></span></label>
        </div>
        <span class="hint">연락처를 남기지 않으면 완전한 익명으로 접수됩니다.</span>
      </div>

      <div class="honey" aria-hidden="true"><label>웹사이트<input id="fWebsite" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="err" id="rErr" role="alert"></div>
      <button class="btn primary block" type="button" id="btnSubmit">제보 접수하기</button>
    </div>
    <div id="rDone" class="card" hidden></div>`;

  bindLookup();
  $('#fWhen').value = nowLocal(); $('#fWhen').max = nowLocal();
  $('#fContent').addEventListener('input', e => { $('#cnt').textContent = e.target.value.length + ' / 1000'; });
  $('#fWantReply').addEventListener('change', e => { $('#contactBox').hidden = !e.target.checked; });
  $('#btnCam').addEventListener('click', () => $('#fCam').click());
  $('#btnAlbum').addEventListener('click', () => $('#fAlbum').click());
  $('#fCam').addEventListener('change', onPickFiles);
  $('#fAlbum').addEventListener('change', onPickFiles);
  $('#thumbs').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if(rm){ form.photos.splice(+rm.dataset.rm, 1); renderThumbs(); return; }
    const im = e.target.closest('img'); if(im) openLightbox(im.src);
  });
  $('#btnSubmit').addEventListener('click', submitReport);
  if(!SB.configured()){
    $('#rBanner').innerHTML = '<div class="banner warn"><span>⚙️</span><div><b>서버 연결 설정이 아직 되지 않았습니다.</b>관리자는 README의 3~4단계를 완료해 주세요. (site.config.js의 SUPABASE_URL · SUPABASE_ANON_KEY)</div></div>';
    $('#btnSubmit').disabled = true;
  }
}

async function onPickFiles(e){
  const files = Array.from(e.target.files || []); e.target.value = '';
  if(!files.length) return;
  const room = MAX_PHOTOS - form.photos.length;
  if(room <= 0){ toast('사진은 최대 ' + MAX_PHOTOS + '장까지 첨부할 수 있어요.'); return; }
  form.processing = true; $('#photoHint').textContent = '사진을 처리하는 중…';
  let failed = 0;
  for(const f of files.slice(0, room)){
    try{ form.photos.push({ data: await fileToJpeg(f) }); renderThumbs(); }
    catch(err){ failed++; }
  }
  form.processing = false;
  $('#photoHint').textContent = failed ? '일부 사진을 불러오지 못했습니다. 다른 사진을 선택해 주세요.' : '얼굴·차량번호·개인정보 등이 찍히지 않도록 주의해 주세요. 사진은 자동으로 압축됩니다.';
  if(files.length > room) toast('사진은 최대 ' + MAX_PHOTOS + '장까지만 담았어요.');
}
async function fileToJpeg(file){
  const url = URL.createObjectURL(file);
  try{
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = url; });
    let maxDim = 1280, q = 0.72;
    for(let n=0; n<8; n++){
      const sc = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img, 0, 0, w, h);
      const data = c.toDataURL('image/jpeg', q);
      if(data.length <= MAX_PHOTO_CHARS && JPEG_RE.test(data)) return data;
      if(q > 0.5) q -= 0.1; else maxDim = Math.round(maxDim * 0.8);
    }
    throw new Error('too big');
  } finally { URL.revokeObjectURL(url); }
}
function renderThumbs(){
  $('#thumbs').innerHTML = form.photos.map((p,i) =>
    `<div class="thumb"><img src="${p.data}" alt="첨부 사진 ${i+1}"><button type="button" data-rm="${i}" aria-label="사진 ${i+1} 삭제">×</button></div>`).join('');
}

function val(name){ const c = $('input[name="' + name + '"]:checked'); return c ? c.value : ''; }
async function submitReport(){
  if(form.busy) return;
  const err = $('#rErr'); err.textContent = '';
  const fail = m => { err.textContent = m; err.scrollIntoView({ block:'center', behavior:'smooth' }); };
  const rtype = val('rtype'), cat = val('cat'), sev = val('sev');
  const place = $('#fPlace').value, detail = $('#fPlaceDetail').value.trim();
  const when = $('#fWhen').value, content = $('#fContent').value.trim();
  const wantReply = $('#fWantReply').checked;
  const name = $('#fName').value.trim(), contact = $('#fContact').value.trim();
  if(!rtype) return fail('제보하시는 분을 선택해 주세요.');
  if(!cat) return fail('제보 유형을 선택해 주세요.');
  if(!sev) return fail('위험 정도를 선택해 주세요.');
  if(!place) return fail('장소를 선택해 주세요.');
  if(!when) return fail('발생·발견 일시를 입력해 주세요.');
  if(content.length < 10) return fail('내용을 10자 이상 적어 주세요.');
  if(wantReply){
    if(!contact) return fail('회신받을 연락처를 입력하거나, 체크를 해제해 주세요.');
    if(!$('#fConsent').checked) return fail('연락처를 남기시려면 개인정보 수집·이용에 동의해 주세요.');
  }
  if(form.processing) return fail('사진을 처리하는 중입니다. 잠시 후 다시 눌러 주세요.');

  /* 같은 브라우저에서 1시간에 5건까지 (간단한 도배 방지) */
  let recent = [];
  try{ recent = JSON.parse(localStorage.getItem('safety_recent') || '[]').filter(t => Date.now() - t < 3600000); }catch(e){}
  if(recent.length >= 5) return fail('짧은 시간에 너무 많이 제출했습니다. 잠시 후 다시 시도해 주세요.');

  form.busy = true; const btn = $('#btnSubmit'); btn.disabled = true; btn.textContent = '접수 중…';
  try{
    if($('#fWebsite').value){ showDone(newId(), 0); return; }          /* 봇 차단(숨김 입력란): 성공한 척 무시 */
    const body = {
      occurred_at:when, reporter_type:rtype, category:cat, severity:sev, place:place, place_detail:detail, content:content,
      photo_count:form.photos.length, anonymous:!wantReply,
      contact_name: wantReply ? name : '', contact_info: wantReply ? contact : ''
    };
    let id = '', saved = false;
    for(let i = 0; i < 3 && !saved; i++){
      id = newId();
      try{ await SB.insertReport(Object.assign({ id:id }, body)); saved = true; }
      catch(e){ if(e.code !== '23505' || i === 2) throw e; }          /* 접수번호 중복이면 새 번호로 재시도 */
    }
    let photoFailed = 0;
    for(let i = 0; i < form.photos.length; i++){
      try{ await SB.uploadPhoto(id, i, dataUrlToBlob(form.photos[i].data)); }catch(e){ photoFailed++; }
    }
    try{ recent.push(Date.now()); localStorage.setItem('safety_recent', JSON.stringify(recent)); }catch(e){}
    showDone(id, photoFailed);
  }catch(e){
    err.textContent = e.status === 0 ? e.message
      : /RATE_LIMIT/.test(e.message || '') ? '지금 접수가 몰려 있습니다. 잠시 후 다시 시도해 주세요.'
      : e.status === 400 ? '입력 내용을 다시 확인해 주세요.'
      : '접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.';
  }finally{
    form.busy = false; btn.disabled = !SB.configured(); btn.textContent = '제보 접수하기';
  }
}
function newId(){
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const r = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 5);
  return 'SF-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
}
function dataUrlToBlob(u){
  const bin = atob(u.split(',')[1]); const arr = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type:'image/jpeg' });
}
function showDone(id, photoFailed){
  $('#rWrap').hidden = true;
  const d = $('#rDone'); d.hidden = false;
  d.innerHTML = `<div class="success">
      <div class="ok-ic">✓</div>
      <h2 style="margin:0">제보가 접수되었습니다</h2>
      <p class="muted">소중한 의견 감사합니다. 담당자가 확인 후 조치합니다.</p>
      <div class="rid">${esc(id)}</div>
      <p class="hint">접수번호를 꼭 기록해 두세요. 나중에 <b>처리 결과 조회</b>에서 처리 상태와 결과를 확인할 수 있습니다. 사진은 접수 후 30일이 지나면 자동으로 삭제됩니다.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn ghost" type="button" id="btnCopyId">접수번호 복사</button>
        <button class="btn ghost" type="button" id="btnLookupNow">처리 결과 조회</button>
      </div>
      ${photoFailed ? `<div class="banner warn"><span>⚠️</span><div>사진 ${photoFailed}장은 저장하지 못했습니다. 필요하면 다시 제보해 주세요.</div></div>` : ''}
      <button class="btn primary" type="button" id="btnAgain">새 제보 작성하기</button>
    </div>`;
  $('#btnAgain').addEventListener('click', () => { form.photos = []; renderReport(); window.scrollTo({ top:0 }); });
  $('#btnCopyId').addEventListener('click', () => {
    const ok = () => toast('접수번호를 복사했습니다.');
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(id).then(ok).catch(() => window.prompt('접수번호를 복사하세요', id));
    else window.prompt('접수번호를 복사하세요', id);
  });
  $('#btnLookupNow').addEventListener('click', () => openLookup(id));
  window.scrollTo({ top:0, behavior:'smooth' });
}
function openLightbox(src){
  if(!/^data:image\/jpeg;base64,/.test(src)) return;
  const d = document.createElement('div'); d.className = 'lightbox';
  const im = document.createElement('img'); im.src = src; im.alt = '확대한 사진';
  d.appendChild(im); d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ const lb = $('.lightbox'); if(lb) lb.remove(); } });

/* ===================== 시작 ===================== */
window.U.initTheme();
$('#orgName').textContent = CONFIG.orgName;
document.title = (CONFIG.siteTitle || '안전·친환경 지킴이') + ' · ' + CONFIG.orgName;
const bs = $('#siteSub'); if(bs) bs.textContent = CONFIG.siteTitle || '안전·친환경 지킴이';
renderHome(); renderMenu(); renderEco(); renderRules(); renderEmergency(); renderReport();
if(window.Extras){ window.Extras.init(); window.Extras.mountHome(); window.Extras.mountEco(); window.Extras.mountInstall(); window.Extras.mountOffline(); }
renderTabs();
loadWeather();
loadNotices();
bindMascots();
})();
