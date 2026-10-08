/* 아이콘 모음: 안전 날씨 3종 + 퀵 메뉴 3종 (직접 그린 SVG, 캐릭터와 같은 굵은 윤곽선 스타일) */
window.ART = (function(){
  const S = 'stroke="#231f20" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const wrap = inner => '<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">' + inner + '</svg>';
  const cloud = (fill, dy) => '<path transform="translate(0,' + (dy || 0) + ')" d="M20 48c-7 0-12-5-12-11 0-6 4-10 10-11 2-7 8-12 15-12 8 0 14 5 15 12 6 1 10 5 10 11 0 6-5 11-12 11z" fill="' + fill + '" ' + S + '/>';
  return {
    /* ----- 안전 날씨 ----- */
    sun: wrap(
      '<g ' + S + ' fill="none"><path d="M32 3v8M32 53v8M3 32h8M53 32h8M11.5 11.5l5.5 5.5M47 47l5.5 5.5M52.5 11.5L47 17M17 47l-5.5 5.5"/></g>' +
      '<circle cx="32" cy="32" r="15" fill="#ffc907" ' + S + '/>' +
      '<circle cx="26.5" cy="29" r="2" fill="#231f20"/><circle cx="37.5" cy="29" r="2" fill="#231f20"/>' +
      '<path d="M26 35q6 6 12 0" fill="none" ' + S + '/>' +
      '<circle cx="23" cy="34" r="2.6" fill="#f69a9a"/><circle cx="41" cy="34" r="2.6" fill="#f69a9a"/>'),
    cloud: wrap(
      cloud('#c3d0d9', 0) +
      '<circle cx="26" cy="35" r="2" fill="#231f20"/><circle cx="38" cy="35" r="2" fill="#231f20"/>' +
      '<path d="M28 42h8" fill="none" ' + S + '/>'),
    storm: wrap(
      cloud('#7d8b96', -8) +
      '<path d="M37 30L24 50h9l-4 12 17-23h-10l5-9z" fill="#ffc907" ' + S + '/>'),
    /* ----- 퀵 메뉴 ----- */
    helmet: wrap(
      '<path d="M10 44h44a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" fill="#f9a61a" ' + S + '/>' +
      '<path d="M14 44c0-14 8-24 18-24s18 10 18 24z" fill="#ffc907" ' + S + '/>' +
      '<path d="M28 21h8v23h-8z" fill="#f9a61a" ' + S + '/>' +
      '<circle cx="51" cy="14" r="10" fill="#00aeef" ' + S + '/>' +
      '<rect x="49.4" y="13" width="3.2" height="8" rx="1.4" fill="#fff"/><circle cx="51" cy="9.4" r="2" fill="#fff"/>'),
    bubble: wrap(
      '<path d="M9 10h46a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H31l-13 11V43H9a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5z" fill="#00aeef" ' + S + '/>' +
      '<rect x="29.5" y="16" width="5" height="14" rx="2.5" fill="#fff"/><circle cx="32" cy="36" r="3" fill="#fff"/>'),
    camera: wrap(
      '<path d="M22 18l3-6h14l3 6z" fill="#9d9fa2" ' + S + '/>' +
      '<rect x="6" y="18" width="52" height="34" rx="7" fill="#ffc907" ' + S + '/>' +
      '<circle cx="32" cy="35" r="12" fill="#fff" ' + S + '/>' +
      '<circle cx="32" cy="35" r="6.5" fill="#00aeef" ' + S + '/>' +
      '<circle cx="49" cy="26" r="2.6" fill="#231f20"/>'),
    eco: wrap(
      '<circle cx="32" cy="32" r="23" fill="#00aeef" ' + S + '/>' +
      '<path d="M16 27c3-7 10-9 14-6 3 2 1 6 3 8 2 3-1 7-6 6-4-1-5-4-8-5-2-1-3-2-3-3z" fill="#8dc63f" stroke="#231f20" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M37 38c4-2 9 0 10 4 1 3-2 7-6 7-3 0-5-3-5-6 0-2 0-4 1-5z" fill="#8dc63f" stroke="#231f20" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M40 14c-3 6-1 10 4 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>'),
    phone: wrap(
      '<circle cx="32" cy="32" r="24" fill="#fff" ' + S + '/>' +
      '<path d="M22 17c-2 0-5 3-5 6 0 13 10 24 24 24 3 0 6-3 6-5l-6-5-4 3c-5-2-9-6-11-11l3-4z" fill="#ed1c24" ' + S + '/>'),
    siren: wrap(
      '<g ' + S + ' fill="none"><path d="M32 4v7M12.5 11l4.5 4.5M51.5 11L47 15.5"/></g>' +
      '<rect x="11" y="47" width="42" height="11" rx="3.5" fill="#9d9fa2" ' + S + '/>' +
      '<path d="M16 47V34c0-9 7-16 16-16s16 7 16 16v13z" fill="#ed1c24" ' + S + '/>' +
      '<path d="M22 35c0-5 4-9 8-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')
  };
})();

/* 오늘의 안전 날씨 카드 (이용자 홈 화면과 관리자 미리보기가 같은 모양을 쓰도록 공용으로 둠) */
window.WX = (function(){
  const LEVELS = ['맑음', '흐림', '위험'];
  const LV = { '맑음':{ cls:'wx-clear', icon:'sun' }, '흐림':{ cls:'wx-cloudy', icon:'cloud' }, '위험':{ cls:'wx-danger', icon:'storm' } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  function dateText(iso){
    const d = new Date(iso); if(isNaN(d)) return '';
    const t = new Date();
    if(d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()) return '오늘 설정';
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' 설정';
  }
  function todayTip(tips){
    const t = new Date();
    return tips[Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000) % tips.length];
  }
  /* o: { state:'ok'|'loading'|'error', level, updatedAt, tip, dateLabel } */
  function render(o){
    const lv = LV[o.level], ok = o.state === 'ok' && !!lv;
    const cls = ok ? lv.cls : 'wx-none';
    const icon = ok ? window.ART[lv.icon] : window.ART.cloud;
    const main = ok ? esc(o.level) + ' 단계' : (o.state === 'loading' ? '확인 중…' : '확인 불가');
    const date = o.dateLabel != null ? o.dateLabel : (ok ? dateText(o.updatedAt) : '');
    return '<section class="wx ' + cls + '" aria-label="오늘의 안전 날씨">'
      + '<div class="wx-head"><h2>오늘의 안전 날씨</h2>' + (date ? '<span class="wx-date">' + esc(date) + '</span>' : '') + '</div>'
      + '<div class="wx-level"><div class="wx-ico">' + icon + '</div>'
      + '<div class="wx-title"><span>오늘은</span><b>' + main + '</b></div></div>'
      + '<div class="mascot-wrap"><img class="mascot" src="./mascot-safety.png" alt="안전제일 깃발을 든 한국산업인력공단 캐릭터" width="104" height="110"></div>'
      + (o.state === 'error' ? '<p class="wx-note">안전 날씨를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>' : '')
      + '<div class="wx-tip"><b>오늘의 안전 한마디</b><p>' + esc(o.tip) + '</p></div>'
      + '</section>';
  }
  return { levels:LEVELS, info:LV, render:render, todayTip:todayTip };
})();
