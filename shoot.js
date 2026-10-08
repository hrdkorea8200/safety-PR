/* 촬영현장 안전가이드 탭
   - 주소 형식: #shoot (장비 목록) / #shoot/common (현장 공통 수칙) / #shoot/qr (QR 라벨) / #shoot/camera-01 (장비 상세)
   - 내용(장비·수칙)은 shoot-data.js, 모양은 shoot.css 에서 고칩니다. */
(function(){
'use strict';
const D = window.SHOOT;
const { PPE, CATS, EQUIP, COMMON } = D;
const { $, $$, esc, toast } = window.U;
const RISK = { high:['위험도 높음','hi'], mid:['위험도 보통','mid'], low:['위험도 낮음','lo'] };
const catName = id => (CATS.find(c => c.id === id) || {}).name || '';
const el = () => $('#p-shoot');

const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
function copyText(text, okMsg){
  const ok = () => toast(okMsg || '복사했어요');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(ok).catch(() => window.prompt('아래 내용을 복사하세요', text));
  }else{ window.prompt('아래 내용을 복사하세요', text); }
}

/* ---------- 공통 조각 ---------- */
function subnav(cur){
  const items = [['list','장비','#shoot'], ['common','공통 수칙','#shoot/common'], ['qr','QR 라벨','#shoot/qr']];
  return '<nav class="sh-subnav" aria-label="촬영안전 메뉴">' + items.map(i =>
    '<a href="' + i[2] + '"' + (i[0] === cur ? ' aria-current="page"' : '') + '>' + i[1] + '</a>').join('') + '</nav>';
}
function accHTML(items, open){
  return items.map((m, i) => `
    <details class="sh-acc"${open && i === 0 ? ' open' : ''}>
      <summary>${esc(m.t)}</summary>
      <ul class="sh-accb">${m.s.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ul>
    </details>`).join('');
}
function emergencyHTML(list){
  return list.map(m => `
    <details class="sh-acc">
      <summary>${esc(m.t)}</summary>
      <ol class="sh-accb">${m.s.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
    </details>`).join('');
}
function chkHTML(groups){
  let i = 0;
  return groups.map(g => {
    const label = g[0], items = g[1];
    return (label ? `<h3 class="sh-gh">${esc(label)}</h3>` : '') +
      items.map(c => { const n = i++; return `<label class="sh-chk"><input type="checkbox" data-i="${n}"><span>${esc(c)}</span></label>`; }).join('');
  }).join('');
}
function checklistBox(groups, key){
  return `<div class="sh-chkwrap" data-key="${esc(key)}">
    <div class="sh-progress"><div class="sh-bar" aria-hidden="true"><i class="sh-barfill"></i></div><span class="sh-count" aria-live="polite"></span></div>
    ${chkHTML(groups)}
    <button class="sh-ghost sh-resetchk" type="button">체크 모두 해제</button>
  </div>`;
}
function bindChk(){
  /* 한 화면에 체크리스트가 여러 개(예: 브리핑 + 친환경)여도 각각 따로 저장·복원합니다 */
  $$('.sh-chkwrap', el()).forEach(wrap => {
    const key = 'sh:chk:' + wrap.dataset.key;
    const saved = new Set(store.get(key, []));
    const boxes = $$('input', wrap);
    boxes.forEach((b, i) => { b.checked = saved.has(i); });
    const refresh = () => {
      const n = boxes.filter(b => b.checked).length;
      $('.sh-count', wrap).textContent = n + ' / ' + boxes.length;
      $('.sh-barfill', wrap).style.width = (boxes.length ? n / boxes.length * 100 : 0) + '%';
      store.set(key, boxes.map((b, i) => b.checked ? i : -1).filter(i => i >= 0));
    };
    wrap.addEventListener('change', refresh);
    $('.sh-resetchk', wrap).addEventListener('click', () => { boxes.forEach(b => { b.checked = false; }); refresh(); });
    refresh();
  });
}
function reportCard(selId){
  const opts = EQUIP.map(e => `<option value="${esc(e.id)}"${e.id === selId ? ' selected' : ''}>${esc(e.name)}</option>`).join('')
    + `<option value="etc"${selId === 'etc' ? ' selected' : ''}>기타 · 현장 공통</option>`;
  return `<section class="sh-card" aria-labelledby="shHRep">
    <h2 id="shHRep">사고·아차사고 보고</h2>
    <p class="sh-hint">내용을 적고 복사해서 관리자에게 메시지로 보내세요. 일시는 복사하는 시점으로 자동 입력됩니다. 기록으로 남기려면 안전신문고로 제보하세요.</p>
    <label class="sh-flabel" for="shRpEq">관련 장비</label>
    <select class="sh-field" id="shRpEq">${opts}</select>
    <label class="sh-flabel" for="shRpPlace">장소</label>
    <input class="sh-field" id="shRpPlace" placeholder="직접 입력 (예: 3층 스튜디오 출입구)">
    <label class="sh-flabel" for="shRpWhat">내용 (주요 사항만 신속히 보고 후 추후 상세히 보고)</label>
    <textarea class="sh-field" id="shRpWhat" rows="5" placeholder="누가:&#10;어떻게:&#10;다친 사람 / 조치:"></textarea>
    <div class="sh-example">
      <b>작성 예시</b>
      <p>누가: 촬영팀 홍길동<br>어떻게: 바닥 케이블에 발이 걸려 조명 스탠드가 넘어지고 램프가 떨어짐<br>다친 사람 / 조치: 없음(아차사고). 소등 후 현장 정리 중<br><br>※ 원인과 재발 방지 대책 등 자세한 내용은 추후 상세히 보고합니다.</p>
    </div>
    <div class="sh-row">
      <button class="sh-btn" type="button" id="shRpCopy">보고 문구 복사</button>
      <button class="sh-btn sec" type="button" data-go="report">안전신문고로 제보하기</button>
    </div>
  </section>`;
}
function bindReport(){
  const b = $('#shRpCopy'); if(!b) return;
  b.addEventListener('click', () => {
    const sel = $('#shRpEq');
    const eqName = sel.options[sel.selectedIndex].text;
    const place = $('#shRpPlace').value.trim() || '(미입력)';
    const what = $('#shRpWhat').value.trim() || '(미입력)';
    const text = '[안전 사고 보고]\n장비: ' + eqName + '\n일시: ' + new Date().toLocaleString('ko-KR') + '\n장소: ' + place + '\n내용:\n' + what + '\n보고자: (이름·연락처)';
    copyText(text, '보고 문구를 복사했어요');
  });
}
const DISCLAIMER = '이 안내는 일반적인 안전 수칙입니다. 현장 규정, 장비 제조사 매뉴얼, 최신 법령이 다를 때는 그쪽을 우선합니다.';

/* ---------- 목록 ---------- */
function renderList(){
  let cat = 'all', q = '';
  el().innerHTML = subnav('list') + `
    <div class="sh-intro page-head">
      <div>
        <h1>촬영현장 안전가이드</h1>
        <p>장비를 선택하면 안전 수칙이 열립니다. 장비에 붙은 QR코드를 스캔해도 해당 장비 페이지로 바로 이동합니다.</p>
      </div>
      ${window.U.mascotDuo ? window.U.mascotDuo() : ''}
    </div>
    <a class="sh-commonlink" href="#shoot/common">
      <span style="font-size:28px" aria-hidden="true">🦺</span>
      <span><b>현장 공통 안전 수칙</b><small>촬영 전 브리핑 · 날씨별 대응 · 친환경 촬영 · 응급처치</small></span>
      <span class="sh-go" aria-hidden="true">›</span>
    </a>
    <input class="sh-search" id="shQ" type="search" placeholder="장비 이름 검색" aria-label="장비 검색" autocomplete="off">
    <div class="sh-chips" id="shChips" role="group" aria-label="카테고리 필터"></div>
    <div class="sh-legend" aria-label="위험도 색상 안내">
      <span style="--c:var(--sh-red)">위험도 높음</span><span style="--c:var(--sh-yellow)">보통</span><span style="--c:var(--sh-green)">낮음</span>
    </div>
    <div class="sh-items" id="shItems"></div>`;
  const chips = $('#shChips');
  const all = [{ id:'all', name:'전체' }].concat(CATS);
  chips.innerHTML = all.map(c => `<button class="sh-chip" type="button" data-c="${esc(c.id)}" aria-pressed="${c.id === cat}">${esc(c.name)}</button>`).join('');
  const draw = () => {
    const list = EQUIP.filter(e => (cat === 'all' || e.cat === cat) && (e.name + catName(e.cat)).toLowerCase().includes(q.toLowerCase()));
    $('#shItems').innerHTML = list.length ? list.map(e => `
      <a class="sh-item ${RISK[e.risk][1]}" href="#shoot/${esc(e.id)}">
        <span class="sh-ic" aria-hidden="true">${e.icon}</span>
        <span><b>${esc(e.name)}</b><small>${esc(catName(e.cat))} · ${RISK[e.risk][0]}</small></span>
        <span class="sh-go" aria-hidden="true">›</span>
      </a>`).join('') : '<p class="sh-empty">찾는 장비가 없어요. 다른 이름으로 검색하거나 카테고리를 바꿔보세요.</p>';
  };
  chips.addEventListener('click', ev => {
    const b = ev.target.closest('.sh-chip'); if(!b) return;
    cat = b.dataset.c;
    $$('.sh-chip', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    draw();
  });
  $('#shQ').addEventListener('input', ev => { q = ev.target.value.trim(); draw(); });
  draw();
}

/* ---------- 장비 상세 ---------- */
function renderDetail(e){
  const steps = [['before','사용 전'], ['during','사용 중'], ['after','사용 후']];
  const groups = [['사용 전', e.check], ['사용 후', e.checkAfter || []]].filter(g => g[1].length);
  el().innerHTML = subnav('') + `
    <a class="sh-back" href="#shoot">← 장비 목록</a>
    <section class="sh-hero" aria-labelledby="shT">
      <div class="sh-stripe" aria-hidden="true"></div>
      <div class="sh-hero-in">
        <p class="sh-cat"><span class="sh-em" aria-hidden="true">${e.icon}</span>${esc(catName(e.cat))}<span class="sh-risk ${RISK[e.risk][1]}">${RISK[e.risk][0]}</span></p>
        <h1 id="shT">${esc(e.name)}</h1>
        <p class="sh-core">${esc(e.core)}</p>
        <ul class="sh-hazards" aria-label="주요 위험요소">
          ${e.hz.map(h => `<li class="sh-hz ${h[1] ? 'hi' : ''}">${esc(h[0])}</li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="sh-card mand" aria-labelledby="shHPpe">
      <h2 id="shHPpe"><span class="sh-sg sh-sg-mand" aria-hidden="true">✓</span>착용할 보호구</h2>
      <ul class="sh-ppe">${e.ppe.map(p => `<li class="sh-pp"><i aria-hidden="true">${PPE[p] || '🛡️'}</i>${esc(p)}</li>`).join('')}</ul>
    </section>

    <section class="sh-card mand" aria-labelledby="shHMand">
      <h2 id="shHMand"><span class="sh-sg sh-sg-mand" aria-hidden="true">✓</span>꼭 지켜야 할 수칙</h2>
      <div class="sh-tabs" role="tablist" aria-label="사용 단계">
        ${steps.map((t, i) => `<button class="sh-tab" type="button" role="tab" id="shTab-${t[0]}" data-k="${t[0]}" aria-selected="${i === 0}" aria-controls="shRules">${t[1]}</button>`).join('')}
      </div>
      <ul class="sh-rules" id="shRules" role="tabpanel"></ul>
    </section>

    <section class="sh-card warn" aria-labelledby="shHEnv">
      <h2 id="shHEnv"><span class="sh-sg sh-sg-warn" aria-hidden="true">!</span>이런 상황이면 추가로</h2>
      ${accHTML(e.env, true)}
    </section>

    <section class="sh-card warn" aria-labelledby="shHMis">
      <h2 id="shHMis"><span class="sh-sg sh-sg-warn" aria-hidden="true">!</span>자주 하는 실수</h2>
      <ul class="sh-mis">${e.mistakes.map(m => `<li><p class="w">${esc(m[0])}</p><p class="r">${esc(m[1])}</p></li>`).join('')}</ul>
    </section>

    <section class="sh-card proh" aria-labelledby="shHProh">
      <h2 id="shHProh"><span class="sh-sg sh-sg-proh" aria-hidden="true"></span>절대 금지</h2>
      <ul class="sh-nevers">${e.never.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </section>

    <section class="sh-card safe" aria-labelledby="shHSafe">
      <h2 id="shHSafe"><span class="sh-sg sh-sg-safe" aria-hidden="true">+</span>사고가 났다면</h2>
      ${emergencyHTML(e.emergency)}
      <p class="sh-hint" style="margin:12px 0 0">다친 사람이 있으면 먼저 <a href="tel:119"><b>119</b></a>에 신고하세요. 응급처치 요령은 <a href="#shoot/common"><b>공통 수칙</b></a>, 사무실 비상 연락처는 <a href="#emergency"><b>비상대응</b></a> 탭에 있어요.</p>
    </section>

    <section class="sh-card warn" aria-labelledby="shHChk">
      <h2 id="shHChk"><span class="sh-sg sh-sg-warn" aria-hidden="true">!</span>점검 체크리스트</h2>
      ${checklistBox(groups, e.id)}
    </section>

    ${(e.refs && e.refs.length) ? `<section class="sh-card" aria-labelledby="shHRef">
      <h2 id="shHRef">관련 기준</h2>
      <ul class="sh-refs">${e.refs.map(r => `<li><span>${esc(r)}</span></li>`).join('')}</ul>
    </section>` : ''}

    ${reportCard(e.id)}

    <p class="sh-note">${DISCLAIMER}</p>`;

  const showTab = k => {
    $$('.sh-tab', el()).forEach(t => t.setAttribute('aria-selected', String(t.dataset.k === k)));
    $('#shRules').setAttribute('aria-labelledby', 'shTab-' + k);
    $('#shRules').innerHTML = e[k].map(r => `<li><span>${esc(r)}</span></li>`).join('');
  };
  showTab('before');
  $('.sh-tabs', el()).addEventListener('click', ev => { const t = ev.target.closest('.sh-tab'); if(t) showTab(t.dataset.k); });
  bindChk();
  bindReport();
}

/* ---------- 현장 공통 수칙 ---------- */
function renderCommon(){
  el().innerHTML = subnav('common') + `
    <a class="sh-back" href="#shoot">← 장비 목록</a>
    <section class="sh-hero" aria-labelledby="shT">
      <div class="sh-stripe" aria-hidden="true"></div>
      <div class="sh-hero-in">
        <p class="sh-cat"><span class="sh-em" aria-hidden="true">🦺</span>모든 촬영 현장</p>
        <h1 id="shT">현장 공통 안전 수칙</h1>
        <p class="sh-core">촬영을 시작하기 전 5분, 모두가 위험 요소와 비상 대피 방법을 함께 확인하세요.</p>
      </div>
    </section>

    <section class="sh-card mand" aria-labelledby="shHB">
      <h2 id="shHB"><span class="sh-sg sh-sg-mand" aria-hidden="true">✓</span>촬영 전 5분 안전 브리핑</h2>
      <p class="sh-hint">전원이 모인 자리에서 하나씩 확인하고 체크하세요.</p>
      ${checklistBox([['', COMMON.briefing]], 'common')}
    </section>

    <section class="sh-card warn" aria-labelledby="shHW">
      <h2 id="shHW"><span class="sh-sg sh-sg-warn" aria-hidden="true">!</span>날씨 · 시간대별 대응</h2>
      ${accHTML(COMMON.weather, false)}
    </section>

    <section class="sh-card eco" aria-labelledby="shHE">
      <h2 id="shHE"><span class="sh-sg sh-sg-safe" aria-hidden="true">♻</span>친환경 촬영</h2>
      ${window.U.mascotEco ? window.U.mascotEco() : ''}
      <p class="sh-hint">쓰레기·에너지를 줄이는 습관은 현장을 더 안전하게 만듭니다. 단계별로 체크하세요.</p>
      ${checklistBox(COMMON.eco, 'eco')}
      <h3 class="sh-gh" style="margin-top:18px">상황별 안내</h3>
      ${accHTML(COMMON.ecoGuide, false)}
    </section>

    <section class="sh-card safe" aria-labelledby="shHF">
      <h2 id="shHF"><span class="sh-sg sh-sg-safe" aria-hidden="true">+</span>응급처치 요약</h2>
      <p class="sh-hint">전문 교육을 대신할 수 없습니다. 위급하면 먼저 119에 신고하세요. 사무실 비상 연락처·집결지는 <a href="#emergency"><b>비상대응</b></a> 탭에 있어요.</p>
      ${emergencyHTML(COMMON.firstaid)}
    </section>

    <section class="sh-card" aria-labelledby="shHR">
      <h2 id="shHR">사고가 나면 이 순서로</h2>
      <ol class="sh-steps">${COMMON.report.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
    </section>

    ${reportCard('etc')}

    <p class="sh-note">${DISCLAIMER}</p>`;
  bindChk();
  bindReport();
}

/* ---------- QR 라벨 ---------- */
function baseUrl(){
  const saved = store.get('sh:baseUrl', '');
  return saved ? saved : location.href.split('#')[0];
}
function linkFor(id){ return baseUrl().split('#')[0] + '#shoot/' + id; }
function makeQR(text){
  if(typeof qrcode !== 'function') return null;
  const qr = qrcode(0, 'M'); qr.addData(text); qr.make(); return qr;
}
function qrSvg(text){
  const qr = makeQR(text); if(!qr) return '';
  const n = qr.getModuleCount(), m = 2; let d = '';
  for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(qr.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
  const s = n + m * 2;
  return '<svg viewBox="0 0 ' + s + ' ' + s + '" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR코드"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
}
function labelCanvas(e){
  const qr = makeQR(linkFor(e.id)); if(!qr) return null;
  const W = 640, H = 800, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#FFC800'; x.fillRect(0, 0, W, 120);
  x.fillStyle = '#15171A';
  x.font = "900 40px 'Noto Sans KR', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(e.name.length > 16 ? e.name.slice(0, 15) + '…' : e.name, W / 2, 62);
  const n = qr.getModuleCount(), mod = Math.floor(480 / (n + 4)), size = mod * (n + 4);
  const ox = (W - size) / 2, oy = 150;
  x.fillStyle = '#fff'; x.fillRect(ox, oy, size, size);
  x.fillStyle = '#000';
  for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(qr.isDark(r, c)) x.fillRect(ox + (c + 2) * mod, oy + (r + 2) * mod, mod, mod);
  x.fillStyle = '#15171A'; x.font = "700 30px 'Noto Sans KR', sans-serif";
  x.fillText('QR을 스캔해 안전 수칙 확인', W / 2, oy + size + 50);
  x.fillStyle = '#5A616B'; x.font = "500 22px 'Noto Sans KR', sans-serif";
  x.fillText('장비 ID ' + e.id, W / 2, oy + size + 92);
  return cv;
}
function ensureFont(){
  try{
    return Promise.all([document.fonts.load("900 40px 'Noto Sans KR'"), document.fonts.load("700 30px 'Noto Sans KR'"), document.fonts.load("500 22px 'Noto Sans KR'")]).catch(() => {});
  }catch(err){ return Promise.resolve(); }
}
function drawLabel(x, e, ox, oy, w, h){
  const qr = makeQR(linkFor(e.id)); if(!qr) return;
  x.fillStyle = '#fff'; x.fillRect(ox, oy, w, h);
  const hh = Math.round(h * 0.15);
  x.fillStyle = '#FFC800'; x.fillRect(ox, oy, w, hh);
  x.fillStyle = '#15171A'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = Math.round(w * 0.075);
  while(fs > 12){ x.font = '900 ' + fs + "px 'Noto Sans KR', sans-serif"; if(x.measureText(e.name).width <= w - 24) break; fs -= 2; }
  x.fillText(e.name, ox + w / 2, oy + hh / 2);
  const n = qr.getModuleCount();
  const avail = Math.min(w - 30, h - hh - 90);
  const mod = Math.max(1, Math.floor(avail / (n + 4))), size = mod * (n + 4);
  const qx = ox + (w - size) / 2, qy = oy + hh + 10;
  x.fillStyle = '#fff'; x.fillRect(qx, qy, size, size);
  x.fillStyle = '#000';
  for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(qr.isDark(r, c)) x.fillRect(qx + (c + 2) * mod, qy + (r + 2) * mod, mod, mod);
  x.fillStyle = '#15171A'; x.font = '700 ' + Math.round(w * 0.052) + "px 'Noto Sans KR', sans-serif";
  x.fillText('QR을 스캔해 안전 수칙 확인', ox + w / 2, qy + size + w * 0.07);
  x.fillStyle = '#5A616B'; x.font = '500 ' + Math.round(w * 0.045) + "px 'Noto Sans KR', sans-serif";
  x.fillText(e.id, ox + w / 2, qy + size + w * 0.07 + w * 0.065);
  x.strokeStyle = '#9AA3AD'; x.lineWidth = 2; x.setLineDash([8, 6]);
  x.strokeRect(ox + 1, oy + 1, w - 2, h - 2); x.setLineDash([]);
}
function sheetCanvases(){
  if(typeof qrcode !== 'function') return [];
  const W = 1240, H = 1754, M = 60, G = 30, COLS = 3, ROWS = 4;
  const cw = Math.floor((W - 2 * M - (COLS - 1) * G) / COLS), ch = Math.floor((H - 2 * M - (ROWS - 1) * G) / ROWS);
  const per = COLS * ROWS, pages = [];
  for(let p = 0; p < EQUIP.length; p += per){
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    EQUIP.slice(p, p + per).forEach((e, i) => { drawLabel(x, e, M + (i % COLS) * (cw + G), M + Math.floor(i / COLS) * (ch + G), cw, ch); });
    pages.push(cv);
  }
  return pages;
}
function openDialog(html, wide){
  const dlg = $('#shDlg');
  if(!dlg || typeof dlg.showModal !== 'function'){ toast('이 브라우저에서는 이미지 창을 열 수 없어요. 다른 브라우저로 열어 주세요.'); return; }
  dlg.style.width = wide ? 'min(94vw,720px)' : '';
  dlg.innerHTML = html;
  dlg.showModal();
  const c = $('#shClose'); if(c) c.addEventListener('click', () => dlg.close());
}
function renderQR(){
  const noLib = typeof qrcode !== 'function';
  el().innerHTML = subnav('qr') + `
    <a class="sh-back sh-noprint" href="#shoot">← 장비 목록</a>
    <div class="sh-intro sh-noprint"><h1>QR 라벨 만들기</h1><p>장비마다 QR코드를 만들고 인쇄해서 장비에 붙이세요. 스캔하면 그 장비의 안전 수칙이 바로 열립니다.</p></div>
    <section class="sh-card sh-qrcard sh-noprint">
      <h2>사이트 주소</h2>
      <p>QR코드가 열 주소입니다. 공개 사이트 주소(<b>https://내계정.github.io/safety-site/</b>)를 넣고 저장하세요. 주소가 바뀌면 QR코드도 다시 만들어야 합니다. 관리자 주소(admin.html)는 넣지 마세요.</p>
      <div class="sh-row">
        <input class="sh-field" id="shBase" type="url" inputmode="url" value="${esc(baseUrl())}" aria-label="사이트 주소">
        <button class="sh-btn" type="button" id="shSave">주소 저장</button>
      </div>
      <p class="sh-warnmsg" id="shWarn"></p>
    </section>
    <section class="sh-card sh-qrcard sh-noprint">
      <h2>라벨 출력</h2>
      <p>모든 장비의 QR 라벨을 A4 용지에 모아 이미지로 만듭니다(한 장에 12개). 이미지를 저장한 뒤 인쇄하거나 스티커 용지에 출력하세요.</p>
      <div class="sh-row"><button class="sh-btn" type="button" id="shSheet">전체 라벨 시트 만들기</button><button class="sh-btn sec" type="button" id="shPrint">바로 인쇄</button></div>
      <p style="margin-top:10px">인쇄창이 뜨지 않으면 시트 이미지를 사용하세요.</p>
    </section>
    ${noLib ? '<p class="sh-warnmsg sh-noprint">QR 생성 도구를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침하세요.</p>' : ''}
    <div class="sh-labels" id="shLabels"></div>`;

  const warn = () => { $('#shWarn').textContent = /^https?:\/\//.test(baseUrl()) ? '' : 'http:// 또는 https://로 시작하는 주소를 입력하세요.'; };
  const draw = () => {
    $('#shLabels').innerHTML = EQUIP.map(e => `
      <div class="sh-label" data-id="${esc(e.id)}">
        <div class="lh">${e.icon} ${esc(e.name)}</div>
        <div class="qr">${qrSvg(linkFor(e.id))}</div>
        <div class="lt">QR을 스캔해 안전 수칙 확인</div>
        <div class="li">${esc(e.id)}</div>
        <div class="acts">
          <button type="button" data-a="img">이미지</button>
          <button type="button" data-a="copy">링크 복사</button>
          <button type="button" data-a="open">열기</button>
        </div>
      </div>`).join('');
  };
  warn(); draw();

  $('#shSave').addEventListener('click', () => { store.set('sh:baseUrl', $('#shBase').value.trim()); warn(); draw(); toast('주소를 저장했어요'); });
  $('#shSheet').addEventListener('click', async () => {
    await ensureFont();
    const pages = sheetCanvases();
    if(!pages.length){ toast('QR 생성 도구를 불러오지 못했어요. 새로고침해 주세요.'); return; }
    openDialog('<p>이미지를 길게 누르거나 우클릭해서 저장한 뒤 인쇄하세요. A4 용지 기준입니다.</p>' +
      pages.map((cv, i) => { const d = cv.toDataURL('image/png'); return '<img src="' + d + '" alt="QR 라벨 시트 ' + (i + 1) + '">' +
        '<div class="sh-row"><a class="sh-btn" href="' + d + '" download="qr-labels-' + (i + 1) + '.png">다운로드 (' + (i + 1) + '/' + pages.length + ')</a></div>'; }).join('') +
      '<div class="sh-row"><button class="sh-btn sec" type="button" id="shClose">닫기</button></div>', true);
  });
  $('#shPrint').addEventListener('click', () => {
    const root = document.documentElement;
    root.classList.add('sh-printing');
    window.addEventListener('afterprint', () => root.classList.remove('sh-printing'), { once:true });
    try{ window.print(); }catch(err){ root.classList.remove('sh-printing'); toast('이 화면에서는 인쇄가 막혀 있어요. 이미지로 저장해 인쇄하세요.'); }
  });
  $('#shLabels').addEventListener('click', async ev => {
    const b = ev.target.closest('button'); if(!b) return;
    const e = EQUIP.find(x => x.id === b.closest('.sh-label').dataset.id); if(!e) return;
    if(b.dataset.a === 'open') location.hash = 'shoot/' + e.id;
    if(b.dataset.a === 'copy') copyText(linkFor(e.id), '링크를 복사했어요');
    if(b.dataset.a === 'img'){
      await ensureFont();
      const cv = labelCanvas(e); if(!cv){ toast('QR 생성 도구를 불러오지 못했어요. 새로고침해 주세요.'); return; }
      const data = cv.toDataURL('image/png');
      openDialog('<img src="' + data + '" alt="' + esc(e.name) + ' QR 라벨"><p>이미지를 길게 누르거나 우클릭해서 저장하세요.</p>' +
        '<div class="sh-row"><a class="sh-btn" href="' + data + '" download="' + esc(e.id) + '-qr.png">다운로드</a><button class="sh-btn sec" type="button" id="shClose">닫기</button></div>', false);
    }
  });
}

/* ---------- 진입점: app.js 가 탭을 보여 줄 때마다 호출합니다 ---------- */
function route(sub){
  const e = EQUIP.find(x => x.id === sub);
  if(sub === 'common') renderCommon();
  else if(sub === 'qr') renderQR();
  else if(e) renderDetail(e);
  else renderList();
  window.scrollTo({ top:0, behavior:'auto' });
}
window.ShootUI = { route: route };
})();
