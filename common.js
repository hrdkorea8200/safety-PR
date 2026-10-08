(function(){
'use strict';
const U = {};
U.$  = (s, r=document) => r.querySelector(s);
U.$$ = (s, r=document) => Array.from(r.querySelectorAll(s));
U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
U.toast = function(msg){
  const root = U.$('#toastRoot'); if(!root) return;
  root.innerHTML = '<div class="toast"></div>';
  root.firstChild.textContent = msg;
  clearTimeout(U.toast._t);
  U.toast._t = setTimeout(() => { root.innerHTML = ''; }, 2800);
};
U.fmtDT = function(v){
  try{
    const d = new Date(v);
    if(isNaN(d)) return String(v || '');
    return d.toLocaleString('ko-KR', { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
  }catch(e){ return String(v || ''); }
};
U.nowLocal = function(){
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
};
U.initTheme = function(){
  const root = document.documentElement;
  try{ const t = localStorage.getItem('theme'); if(t === 'dark' || t === 'light') root.setAttribute('data-theme', t); }catch(e){}
  const btn = U.$('#themeBtn'); if(!btn) return;
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('theme', next); }catch(e){}
  });
};
/* 페이지 머리말에 넣는 안전제일 캐릭터 그림. 파일이 없으면 자동으로 숨겨 화면이 깨지지 않게 합니다. */
U.mascotDuo = function(){
  return '<div class="pg-mascot-wrap"><img class="pg-mascot" src="./mascot-duo.png" alt="안전제일 어깨띠를 두르고 확성기와 안전 표지판을 든 한국산업인력공단 캐릭터" width="120" height="72"></div>';
};
/* 친환경 항목에 넣는 캐릭터 그림(지구를 안고 있는 모습) */
U.mascotEco = function(small){
  return '<div class="pg-mascot-wrap' + (small ? '' : ' eco-art') + '"><img class="pg-mascot" src="./mascot-eco.png" alt="지구를 안고 있는 한국산업인력공단 캐릭터 두 마리" width="150" height="145"></div>';
};
document.addEventListener('error', function(e){
  var t = e.target;
  if(t && t.classList && t.classList.contains('pg-mascot')){ var w = t.closest('.pg-mascot-wrap'); (w || t).hidden = true; }
}, true);
window.U = U;
})();

/* ===================== 전화 걸기(tel:) 보호 =====================
   휴대폰의 일반 페이지에서는 바로 전화 연결, 그 외(PC·액자 화면 등)에서는
   화면이 하얗게 되지 않도록 번호 안내 창을 보여줍니다. */
(function(){
  var inFrame = (function(){ try{ return window.self !== window.top; }catch(e){ return true; } })();
  var ua = navigator.userAgent || '';
  var mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  function closeTel(){ var o = document.getElementById('telOv'); if(o) o.remove(); }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if(!a) return;
    if(mobile && !inFrame) return;           // 휴대폰 + 일반 페이지: 기본 동작(전화 연결)
    e.preventDefault();
    closeTel();
    var num = a.getAttribute('href').slice(4);
    var ov = document.createElement('div'); ov.id = 'telOv'; ov.className = 'overlay';
    var sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role','dialog'); sh.setAttribute('aria-modal','true');
    sh.style.textAlign = 'center';
    var t = document.createElement('div'); t.className = 'lbl ok'; t.textContent = '📞 전화로 연락해 주세요';
    var n = document.createElement('div'); n.style.cssText = 'font-size:56px;font-weight:800;line-height:1.2;color:var(--danger)'; n.textContent = num;
    var m = document.createElement('p'); m.className = 'muted'; m.textContent = '휴대폰의 전화 앱을 열어 위 번호로 직접 걸어 주세요.';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn primary block'; b.textContent = '닫기';
    b.addEventListener('click', closeTel);
    sh.appendChild(t); sh.appendChild(n); sh.appendChild(m); sh.appendChild(b); ov.appendChild(sh);
    ov.addEventListener('click', function(ev){ if(ev.target === ov) closeTel(); });
    document.body.appendChild(ov);
    b.focus();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeTel(); });
})();

