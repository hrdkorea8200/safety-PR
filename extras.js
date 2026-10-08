/* 이용자 편의 기능 모음
   1) 글자 크기 · 고대비 설정   2) 전체 검색   3) 오늘의 안전·친환경 퀴즈
   4) 이달의 안전·친환경 캠페인 카드   5) 이달의 친환경 실천 챌린지 카드
   app.js 가 화면을 그린 뒤 Extras.mountHome() / Extras.mountEco() / Extras.onShow() 를 불러 줍니다. */
(function(){
'use strict';
const { $, $$, esc, toast } = window.U;
const C = window.CONTENT || {};
const SHOOT = window.SHOOT || { EQUIP:[], COMMON:{} };
const QUIZ = window.QUIZ || [];
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const ym = () => today().slice(0, 7);
const month = () => new Date().getMonth() + 1;
const dayNum = () => { const t = new Date(); return Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000); };
const strip = h => String(h == null ? '' : h).replace(/<[^>]+>/g, '');
const E = {};

/* ===================== 1) 글자 크기 · 고대비 ===================== */
const A11Y_KEYS = { fs:'a11y_fs', hc:'a11y_hc' };
function a11yGet(){ return { fs:String(store.get(A11Y_KEYS.fs, '0')), hc:store.get(A11Y_KEYS.hc, '0') === '1' || store.get(A11Y_KEYS.hc, 0) === 1 }; }
function a11yApply(){
  const s = a11yGet(), r = document.documentElement;
  if(s.fs === '1' || s.fs === '2') r.setAttribute('data-fs', s.fs); else r.removeAttribute('data-fs');
  if(s.hc) r.setAttribute('data-contrast', 'high'); else r.removeAttribute('data-contrast');
}
function closeA11y(){ const o = $('#a11yOv'); if(o) o.remove(); }
function openA11y(){
  closeA11y();
  const s = a11yGet();
  const root = document.createElement('div');
  root.id = 'a11yOv'; root.className = 'overlay';
  root.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="화면 설정">
      <div class="sheet-head"><b>🔠 화면 설정</b>
        <button class="icon-btn" type="button" id="a11yClose" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="field"><span class="lab">글자 크기</span>
        <div class="chips" id="a11yFs">${[['0','표준'],['1','크게'],['2','아주 크게']].map(o =>
          `<label class="chip"><input type="radio" name="a11yfs" value="${o[0]}"${s.fs === o[0] ? ' checked' : ''}><span>${o[1]}</span></label>`).join('')}</div></div>
      <div class="field"><span class="lab">고대비 모드</span>
        <label class="chk" style="border:0;padding:0"><input type="checkbox" id="a11yHc"${s.hc ? ' checked' : ''}><span>글자와 배경의 대비를 높이고 테두리를 굵게 합니다</span></label></div>
      <button class="btn ghost block" type="button" id="a11yReset">처음 상태로 되돌리기</button>
      <p class="muted small">이 설정은 이 기기의 브라우저에만 저장됩니다.</p>
    </div>`;
  document.body.appendChild(root);
  root.addEventListener('click', e => { if(e.target === root) closeA11y(); });
  $('#a11yClose').addEventListener('click', closeA11y);
  $('#a11yFs').addEventListener('change', e => { store.set(A11Y_KEYS.fs, e.target.value); a11yApply(); });
  $('#a11yHc').addEventListener('change', e => { store.set(A11Y_KEYS.hc, e.target.checked ? '1' : '0'); a11yApply(); });
  $('#a11yReset').addEventListener('click', () => { store.set(A11Y_KEYS.fs, '0'); store.set(A11Y_KEYS.hc, '0'); a11yApply(); closeA11y(); toast('화면 설정을 처음 상태로 되돌렸습니다.'); });
  $('#a11yClose').focus();
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeA11y(); });

/* ===================== 2) 전체 검색 ===================== */
let searchIndex = null;
function buildIndex(){
  const items = [];
  const add = (sec, tab, sub, key, title, parts) => items.push({ sec:sec, tab:tab, sub:sub || '', key:key || '', title:title, text:parts.map(strip).filter(Boolean).join(' ') });
  const acc = (sec, tab, list) => (list || []).forEach(r => add(sec, tab, '', r.title, (r.icon || '') + ' ' + r.title, [r.intro].concat(r.do || [], r.dont || [], r.steps || [], [r.note])));
  acc('안전수칙', 'rules', C.RULES);
  acc('비상대응', 'emergency', C.EMERGENCY);
  acc('친환경', 'eco', C.ECO);
  if(C.ECO_TOP) add('친환경', 'eco', '', '', '🌱 친환경 실천 8가지', C.ECO_TOP);
  (C.ECO_CHALLENGES || []).forEach(c => add('친환경', 'eco', '', '', c.icon + ' ' + c.m + '월 챌린지 · ' + c.title, [c.desc].concat(c.actions)));
  (SHOOT.EQUIP || []).forEach(e => add('촬영안전', 'shoot', e.id, '', e.icon + ' ' + e.name, [e.core].concat(e.before || [], e.during || [], e.after || [], e.never || [], (e.mistakes || []).map(m => m.join(' ')),
    (e.env || []).map(x => x.t + ' ' + x.s.join(' ')), (e.emergency || []).map(x => x.t + ' ' + x.s.join(' ')), e.check || [], e.refs || [])));
  const K = SHOOT.COMMON || {};
  if(K.briefing) add('촬영안전', 'shoot', 'common', '', '🦺 촬영 전 5분 안전 브리핑', K.briefing);
  (K.cast || []).forEach(m => add('촬영안전', 'shoot', 'common', m.t, '🎬 출연자 안전 · ' + m.t, m.s));
  (K.weather || []).forEach(m => add('촬영안전', 'shoot', 'common', m.t, '🌦 ' + m.t, m.s));
  (K.ecoGuide || []).forEach(m => add('촬영안전', 'shoot', 'common', m.t, '🌱 촬영 친환경 · ' + m.t, m.s));
  (K.firstaid || []).forEach(m => add('촬영안전', 'shoot', 'common', m.t, '🩹 ' + m.t, m.s));
  return items;
}
function searchRun(q){
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if(!toks.length) return [];
  if(!searchIndex) searchIndex = buildIndex();
  const out = [];
  searchIndex.forEach(it => {
    const t = it.title.toLowerCase(), x = it.text.toLowerCase();
    let score = 0;
    for(const k of toks){
      const inT = t.indexOf(k) >= 0, inX = x.indexOf(k) >= 0;
      if(!inT && !inX) return;
      score += (inT ? 5 : 0) + (inX ? 1 : 0);
    }
    out.push({ it:it, score:score });
  });
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 40).map(o => o.it);
}
function snippet(it, toks){
  const x = it.text, low = x.toLowerCase(); let p = -1;
  for(const k of toks){ p = low.indexOf(k); if(p >= 0) break; }
  if(p < 0) return esc(x.slice(0, 70)) + (x.length > 70 ? '…' : '');
  const a = Math.max(0, p - 22), b = Math.min(x.length, p + 60);
  let s = esc(x.slice(a, b));
  const pat = toks.filter(Boolean).map(k => esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if(pat) s = s.replace(new RegExp(pat, 'gi'), m => '<mark>' + m + '</mark>');
  return (a > 0 ? '…' : '') + s + (b < x.length ? '…' : '');
}
function renderSearch(){
  const p = $('#p-search'); if(!p) return;
  p.innerHTML = `
    <div class="page-head"><div><h2 style="margin-top:0">🔍 전체 검색</h2>
      <p class="muted">안전수칙 · 비상대응 · 친환경 · 촬영안전에서 한 번에 찾아요.</p></div>${window.U.mascotDuo()}</div>
    <div class="field"><input id="sQ" class="input" type="search" placeholder="예: 소화기, 분리배출, 드론, 열사병" autocomplete="off" aria-label="검색어"></div>
    <div class="chips" id="sHint" aria-label="추천 검색어">${['소화기','멀티탭','분리배출','배터리','드론','열사병','지진','아동'].map(w => `<button type="button" class="chip s-chip" data-w="${w}"><span>${w}</span></button>`).join('')}</div>
    <div id="sRes" class="s-res" aria-live="polite"></div>`;
  const input = $('#sQ'), box = $('#sRes');
  let list = [];
  const draw = () => {
    const q = input.value.trim();
    if(!q){ box.innerHTML = '<p class="muted small">검색어를 입력하거나 위의 추천 검색어를 눌러 보세요.</p>'; list = []; return; }
    list = searchRun(q);
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    box.innerHTML = list.length
      ? `<p class="muted small">${list.length}건${list.length >= 40 ? ' (상위 40건)' : ''}</p>` + list.map((it, i) =>
        `<button type="button" class="s-item" data-i="${i}"><span class="s-sec">${esc(it.sec)}</span><b>${esc(it.title)}</b><span class="s-snip">${snippet(it, toks)}</span></button>`).join('')
      : '<div class="empty">검색 결과가 없습니다. 다른 낱말로 찾아 보세요.</div>';
  };
  input.addEventListener('input', draw);
  $('#sHint').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if(!b) return; input.value = b.dataset.w; draw(); input.focus(); });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if(!b) return;
    const it = list[+b.dataset.i]; if(!it) return;
    if(it.key) E.pending = { tab:it.tab, key:it.key };
    location.hash = it.tab === 'shoot' ? (it.sub ? '#shoot/' + it.sub : '#shoot') : '#' + it.tab;
  });
  draw();
  setTimeout(() => { try{ input.focus(); }catch(e){} }, 50);
}
function openPending(tab){
  const p = E.pending; if(!p || p.tab !== tab) return;
  E.pending = null;
  setTimeout(() => {
    const panel = $('#p-' + tab); if(!panel) return;
    const want = strip(p.key).trim();
    const hit = $$('details > summary', panel).find(s => strip(s.textContent).indexOf(want) >= 0);
    if(hit){ const d = hit.parentElement; d.open = true; hit.scrollIntoView({ block:'center', behavior:'smooth' }); }
  }, 80);
}

/* ===================== 3) 오늘의 안전·친환경 퀴즈 ===================== */
const QSTAT = 'quiz_stat', QDAY = 'quiz_day';
function seededRand(seed){ let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffled(arr, rnd){ const a = arr.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
let PERM = null;
function perm(){ if(!PERM) PERM = shuffled(QUIZ.map((_, i) => i), seededRand(20261008)); return PERM; }
function dailyIndex(){ return perm()[dayNum() % QUIZ.length]; }
function optionsOf(q, rnd){ return q.ox ? ['O', 'X'] : shuffled([q.a].concat(q.w), rnd); }
function stats(){ return Object.assign({ total:0, correct:0, days:[], streak:0, last:'' }, store.get(QSTAT, {})); }
function record(ok, daily){
  const s = stats(); s.total++; if(ok) s.correct++;
  if(daily){
    const t = today();
    if(s.last !== t){
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yd = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate());
      s.streak = (s.last === yd) ? (s.streak || 0) + 1 : 1; s.last = t;
    }
  }
  store.set(QSTAT, s);
}
function qCard(q, opts, picked, extra){
  const done = picked != null;
  const right = q.a;
  const optHtml = opts.map((o, i) => {
    let cls = 'qz-opt';
    if(done){ if(o === right) cls += ' ok'; else if(o === picked) cls += ' no'; else cls += ' dim'; }
    return `<button type="button" class="${cls}" data-pick="${i}"${done ? ' disabled' : ''}><span class="qz-mark">${q.ox ? o : String.fromCharCode(65 + i)}</span><span>${q.ox ? (o === 'O' ? '맞다 (O)' : '틀리다 (X)') : esc(o)}</span></button>`;
  }).join('');
  const res = done ? `<div class="qz-res ${picked === right ? 'ok' : 'no'}" role="status"><b>${picked === right ? '🎉 정답입니다!' : '😮 아쉬워요, 오답입니다.'}</b>
      ${picked !== right ? `<p>정답: <b>${esc(q.ox ? (right === 'O' ? 'O (맞다)' : 'X (틀리다)') : right)}</b></p>` : ''}<p>${esc(q.e)}</p></div>` : '';
  return `<div class="qz-tag">${esc(q.c === '비상' ? '비상·응급' : q.c)}${q.ox ? ' · O/X' : ''}</div><p class="qz-q">${esc(q.q)}</p><div class="qz-opts">${optHtml}</div>${res}${extra || ''}`;
}
function mountQuizCard(){
  const slot = $('#quizSlot'); if(!slot || !QUIZ.length) return;
  const qi = dailyIndex(), q = QUIZ[qi];
  const seed = qi * 7919 + dayNum();
  const opts = optionsOf(q, seededRand(seed));
  const saved = store.get(QDAY, null);
  let picked = (saved && saved.d === today() && saved.qi === qi) ? saved.pick : null;
  const draw = () => {
    slot.innerHTML = `<section class="card quiz-card" aria-label="오늘의 안전·친환경 퀴즈">
        <div class="qz-head"><h2>🧠 오늘의 안전·친환경 퀴즈</h2><span class="muted small">매일 1문제</span></div>
        ${qCard(q, opts, picked, `<button class="btn ghost block" type="button" data-go="quiz" style="margin-top:12px">퀴즈 더 풀기 (${QUIZ.length}문항) ›</button>`)}
      </section>`;
  };
  draw();
  slot.addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if(!b || picked != null) return;
    picked = opts[+b.dataset.pick];
    store.set(QDAY, { d:today(), qi:qi, pick:picked });
    record(picked === q.a, true);
    draw();
  });
}
const QS = { cat:'전체', run:null };
function renderQuiz(){
  const p = $('#p-quiz'); if(!p) return;
  const s = stats();
  const rate = s.total ? Math.round(s.correct / s.total * 100) : 0;
  const cats = ['전체', '안전', '비상', '촬영', '친환경'];
  const label = c => c === '비상' ? '비상·응급' : c === '촬영' ? '촬영현장' : c;
  const cnt = c => c === '전체' ? QUIZ.length : QUIZ.filter(q => q.c === c).length;
  if(QS.run && QS.run.i >= QS.run.list.length){ renderQuizEnd(p); return; }
  if(QS.run){ renderQuizStep(p); return; }
  p.innerHTML = `
    <div class="page-head"><div><h2 style="margin-top:0">🧠 오늘의 안전·친환경 퀴즈</h2>
      <p class="muted">안전·비상·촬영·친환경 ${QUIZ.length}문항. 풀면서 수칙을 익혀요.</p></div>${window.U.mascotDuo()}</div>
    <div class="stats qz-stats">
      <div class="stat"><b>${s.total}</b><span>푼 문제</span></div>
      <div class="stat"><b>${s.total ? rate + '%' : '-'}</b><span>정답률</span></div>
      <div class="stat"><b>${s.streak || 0}</b><span>연속 도전(일)</span></div>
    </div>
    <div class="card">
      <h3>5문제 도전</h3>
      <p class="muted small">분야를 고르고 시작하세요. 문제는 무작위로 나옵니다.</p>
      <div class="chips" id="qzCats">${cats.map(c => `<label class="chip"><input type="radio" name="qzc" value="${c}"${QS.cat === c ? ' checked' : ''}><span>${label(c)} (${cnt(c)})</span></label>`).join('')}</div>
      <button class="btn primary block" type="button" id="qzStart" style="margin-top:12px">시작하기</button>
    </div>
    <div id="qzToday"></div>
    <p class="muted small">정답과 기록은 이 기기의 브라우저에만 저장됩니다.</p>`;
  $('#qzCats').addEventListener('change', e => { QS.cat = e.target.value; });
  $('#qzStart').addEventListener('click', () => {
    const pool = QUIZ.map((q, i) => i).filter(i => QS.cat === '전체' || QUIZ[i].c === QS.cat);
    const pick = shuffled(pool, Math.random).slice(0, 5);
    QS.run = { list:pick, i:0, score:0, picked:null, opts:null };
    renderQuiz(); window.scrollTo({ top:0 });
  });
  const slot = $('#qzToday');
  const qi = dailyIndex(), q = QUIZ[qi];
  const saved = store.get(QDAY, null);
  if(saved && saved.d === today() && saved.qi === qi){
    const opts = optionsOf(q, seededRand(qi * 7919 + dayNum()));
    slot.innerHTML = `<section class="card quiz-card"><h3>오늘의 문제 다시 보기</h3>${qCard(q, opts, saved.pick)}</section>`;
  }
}
function renderQuizStep(p){
  const r = QS.run, q = QUIZ[r.list[r.i]];
  if(!r.opts) r.opts = optionsOf(q, Math.random);
  p.innerHTML = `
    <div class="page-head"><div><h2 style="margin-top:0">🧠 퀴즈 ${r.i + 1} / ${r.list.length}</h2>
      <div class="bar" aria-hidden="true"><i style="width:${(r.i / r.list.length) * 100}%"></i></div></div></div>
    <section class="card quiz-card">${qCard(q, r.opts, r.picked, r.picked != null ? `<button class="btn primary block" type="button" id="qzNext" style="margin-top:12px">${r.i + 1 >= r.list.length ? '결과 보기' : '다음 문제'}</button>` : '')}</section>
    <button class="btn ghost block" type="button" id="qzStop">그만하기</button>`;
  $('#qzStop').addEventListener('click', () => { QS.run = null; renderQuiz(); });
  p.querySelector('.qz-opts').addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if(!b || r.picked != null) return;
    r.picked = r.opts[+b.dataset.pick];
    const ok = r.picked === q.a; if(ok) r.score++;
    record(ok, false);
    renderQuiz();
  });
  const nx = $('#qzNext'); if(nx) nx.addEventListener('click', () => { r.i++; r.picked = null; r.opts = null; renderQuiz(); window.scrollTo({ top:0 }); });
}
function renderQuizEnd(p){
  const r = QS.run, n = r.list.length;
  const msg = r.score === n ? '완벽해요! 안전·환경 박사님이에요. 🏆' : r.score >= n - 1 ? '아주 잘했어요! 👏' : r.score >= Math.ceil(n / 2) ? '좋아요! 조금만 더 익혀 볼까요? 💪' : '괜찮아요! 해설을 읽고 다시 도전해 보세요. 🌱';
  p.innerHTML = `
    <div class="card success"><div class="ok-ic">🧠</div><h2 style="margin:0">${r.score} / ${n} 정답</h2><p class="muted">${msg}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn primary" type="button" id="qzAgain">다시 도전</button>
        <button class="btn ghost" type="button" id="qzBack">퀴즈 홈</button>
        <button class="btn ghost" type="button" data-go="rules">안전수칙 보기</button>
      </div></div>`;
  $('#qzAgain').addEventListener('click', () => {
    const pool = QUIZ.map((q, i) => i).filter(i => QS.cat === '전체' || QUIZ[i].c === QS.cat);
    QS.run = { list:shuffled(pool, Math.random).slice(0, 5), i:0, score:0, picked:null, opts:null }; renderQuiz();
  });
  $('#qzBack').addEventListener('click', () => { QS.run = null; renderQuiz(); });
}

/* ===================== 4) 이달의 안전·친환경 캠페인 ===================== */
function campaignDefaults(){
  const m = month();
  const sc = (C.SAFETY_CAMPAIGNS || []).find(x => x.m === m) || null;
  const ec = (C.ECO_CHALLENGES || []).find(x => x.m === m) || null;
  return { month:m, safety:sc, eco:ec };
}
E.campaignDefaults = campaignDefaults;
function campaignHtml(d, ov){
  const sTitle = (ov && ov.safetyTitle) || (d.safety && d.safety.title) || '';
  const sBody  = (ov && ov.safetyTitle ? ov.safetyBody : (d.safety && d.safety.body)) || '';
  const eTitle = (ov && ov.ecoTitle) || (d.eco && (d.eco.icon + ' ' + d.eco.title)) || '';
  const eBody  = (ov && ov.ecoTitle ? ov.ecoBody : (d.eco && d.eco.desc)) || '';
  const sGo = (d.safety && d.safety.go) || 'rules';
  return `<section class="card camp-card" aria-label="이달의 안전·친환경 캠페인">
      <div class="camp-head"><h2>📅 이달의 안전·친환경 캠페인</h2><span class="camp-month">${d.month}월</span></div>
      ${sTitle ? `<div class="camp-row safe"><span class="camp-pill">안전</span><div><b>${esc(sTitle)}</b><p>${esc(sBody)}</p><button class="camp-go" type="button" data-go="${esc(sGo)}">관련 수칙 보기 ›</button></div></div>` : ''}
      ${eTitle ? `<div class="camp-row eco"><span class="camp-pill">친환경</span><div><b>${esc(eTitle)}</b><p>${esc(eBody)}</p><button class="camp-go" type="button" data-go="eco">챌린지 참여하기 ›</button></div></div>` : ''}
    </section>`;
}
function mountCampaign(){
  const slot = $('#campSlot'); if(!slot) return;
  const d = campaignDefaults();
  slot.innerHTML = campaignHtml(d, null);
  const SB = window.SB;
  if(SB && SB.configured && SB.configured() && SB.getCampaign){
    SB.getCampaign().then(c => {
      if(c && c.ym === ym() && (c.safetyTitle || c.ecoTitle)){ const s = $('#campSlot'); if(s) s.innerHTML = campaignHtml(d, c); }
    }).catch(() => {});
  }
}

/* ===================== 5) 이달의 친환경 실천 챌린지 (친환경 화면) ===================== */
function mountChallenge(){
  const slot = $('#ecoChallenge'); if(!slot) return;
  const list = C.ECO_CHALLENGES || []; if(!list.length) return;
  const m = month(), cur = list.find(x => x.m === m) || list[0];
  const next = list.find(x => x.m === (m % 12) + 1);
  const key = 'eco_ch_' + ym();
  const done = new Set(store.get(key, []));
  const draw = () => {
    const n = cur.actions.filter((_, i) => done.has(i)).length, all = n === cur.actions.length;
    slot.innerHTML = `<section class="card eco-ch${all ? ' all' : ''}" aria-label="이달의 친환경 실천 챌린지">
        <div class="camp-head"><h3>🌿 이달의 친환경 실천 챌린지</h3><span class="camp-month">${m}월</span></div>
        <div class="eco-ch-title"><span class="eco-ch-ic" aria-hidden="true">${cur.icon}</span><div><b>${esc(cur.title)}</b><p class="muted small">${esc(cur.desc)}</p></div></div>
        <div id="ecoChList">${cur.actions.map((a, i) => `<label class="chk"><input type="checkbox" data-i="${i}"${done.has(i) ? ' checked' : ''}><span>${esc(a)}</span></label>`).join('')}</div>
        <div class="score"><span>${n} / ${cur.actions.length} 실천</span><div class="bar"><i style="width:${n / cur.actions.length * 100}%"></i></div></div>
        <p class="note" style="margin-top:10px">${all ? '🎉 이달의 챌린지를 모두 실천했어요! 정말 멋져요.' : '오늘 할 수 있는 것부터 하나씩 체크해 보세요. (이 기기에만 저장됩니다)'}</p>
        ${next ? `<p class="muted small" style="margin-top:8px">다음 달 챌린지: ${next.icon} ${esc(next.title)}</p>` : ''}
        <details class="acc" style="margin-top:10px"><summary><span class="acc-ic">🗓</span><span>12개월 챌린지 한눈에 보기</span></summary>
          <div class="acc-body"><ul class="ul ok">${list.map(c => `<li${c.m === m ? ' style="font-weight:700"' : ''}>${c.m}월 · ${c.icon} ${esc(c.title)}</li>`).join('')}</ul></div></details>
      </section>`;
  };
  draw();
  slot.addEventListener('change', e => {
    const cb = e.target.closest('input[data-i]'); if(!cb) return;
    const i = +cb.dataset.i; if(cb.checked) done.add(i); else done.delete(i);
    store.set(key, Array.from(done)); draw();
  });
}

/* ===================== 6) 앱처럼 설치하기 (홈 화면에 추가) ===================== */
function isStandalone(){ try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } }
function mountInstall(){
  const slot = $('#installSlot'); if(!slot) return;
  if(isStandalone()){ slot.innerHTML = ''; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  slot.innerHTML = `<section class="card install-card" aria-label="앱처럼 설치하기">
      <div class="ins-ic" aria-hidden="true">📲</div>
      <div class="ins-tx"><b>앱처럼 설치하기</b>
        <p class="muted small">${ios ? '사파리 아래쪽 <b>공유 버튼(□↑)</b>을 누르고 <b>“홈 화면에 추가”</b>를 고르면 앱 아이콘이 생겨요.' : '홈 화면에 추가하면 앱처럼 바로 열리고, 인터넷이 불안정해도 안전수칙·비상대응을 볼 수 있어요.'}</p>
        ${ios ? '' : '<button class="btn primary" type="button" id="installBtn">홈 화면에 추가</button>'}</div>
    </section>`;
  const b = $('#installBtn');
  if(b) b.addEventListener('click', async () => {
    const ev = window.__installEvt;
    if(!ev){ toast('브라우저 메뉴(⋮)에서 “홈 화면에 추가” 또는 “앱 설치”를 눌러 주세요.'); return; }
    ev.prompt(); try{ await ev.userChoice; }catch(e){}
    window.__installEvt = null;
  });
  window.addEventListener('appinstalled', () => { const s = $('#installSlot'); if(s) s.innerHTML = ''; });
}

/* ===================== 7) 오프라인 사용 (저장 상태 확인 · 연결 끊김 안내) ===================== */
async function offlineStatus(){
  if(!('serviceWorker' in navigator) || !('caches' in window)) return { ok:false, why:'unsupported' };
  try{
    const reg = await navigator.serviceWorker.getRegistration();
    if(!reg || !reg.active) return { ok:false, why:'pending' };
    const keys = await caches.keys(); const k = keys.find(x => x.indexOf('safety-app-') === 0);
    if(!k) return { ok:false, why:'pending' };
    const n = (await (await caches.open(k)).keys()).length;
    return { ok:n >= 18, why:n >= 18 ? 'ready' : 'pending', n:n };
  }catch(e){ return { ok:false, why:'pending' }; }
}
function mountOffline(){
  const slot = $('#offlineSlot'); if(!slot) return;
  slot.innerHTML = `<section class="card offline-card" aria-label="오프라인 사용">
      <div class="ins-ic" aria-hidden="true">📴</div>
      <div class="ins-tx"><b>인터넷이 없어도 볼 수 있어요</b><p class="muted small" id="offTxt">저장 상태를 확인하고 있어요…</p></div>
    </section>`;
  const set = (ok, txt) => { const t = $('#offTxt'); if(!t) return; t.innerHTML = txt; const c = $('.offline-card'); if(c) c.classList.toggle('ready', !!ok); };
  const check = async (again) => {
    const r = await offlineStatus();
    if(r.ok) set(true, '✅ <b>준비 완료.</b> 안전수칙·비상대응·촬영안전·친환경·퀴즈가 이 기기에 저장되어 있어요. 연결이 끊겨도 열립니다. (제보 접수·접수번호 조회·공지·안전 날씨는 인터넷이 필요해요)');
    else if(r.why === 'unsupported') set(false, '이 주소·브라우저에서는 오프라인 저장을 쓸 수 없어요. https 주소(GitHub Pages)에서 최신 크롬·사파리로 열어 주세요.');
    else { set(false, '⏳ 아직 저장 중이에요. <b>인터넷이 연결된 상태에서</b> 이 앱을 한 번 더 열어 주세요.'); if(again) setTimeout(() => check(again - 1), 2500); }
  };
  check(3);
}
E.mountOffline = mountOffline;
function syncOnline(){
  const off = (typeof navigator.onLine === 'boolean') && !navigator.onLine;
  const bar = $('#offlineBar'); if(bar) bar.hidden = !off;
  document.documentElement.toggleAttribute('data-offline', off);
}

/* ===================== app.js 와 연결 ===================== */
E.mountHome = function(){ mountCampaign(); mountQuizCard(); };
E.mountEco = function(){ mountChallenge(); };
E.mountInstall = mountInstall;
E.onShow = function(tab){
  if(tab === 'search') renderSearch();
  else if(tab === 'quiz') renderQuiz();
  openPending(tab);
};
E.init = function(){
  a11yApply();
  syncOnline(); window.addEventListener('online', syncOnline); window.addEventListener('offline', syncOnline);
  const sb = $('#searchBtn'); if(sb) sb.addEventListener('click', () => { location.hash = '#search'; });
  const ab = $('#a11yBtn'); if(ab) ab.addEventListener('click', openA11y);
};
window.Extras = E;
})();
