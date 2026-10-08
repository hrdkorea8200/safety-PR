:root{
  box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);
  padding-bottom:env(safe-area-inset-bottom,0px);
  color-scheme:light;
  --bg:#f3f6f4; --surface:#ffffff; --surface2:#f7faf8; --text:#13231c; --muted:#5a6b63; --line:#dde6e1;
  --brand:#0e7a58; --brand-ink:#ffffff; --brand-soft:#e2f4ec; --hero-a:#0e7a58; --hero-b:#0a4f3a;
  --warn:#f6b800; --warn-ink:#2b2100; --warn-soft:#fff5d1;
  --danger:#cf3a2d; --danger-soft:#fde9e6; --info:#255fa6; --info-soft:#e6eefa;
  --shadow:0 6px 24px rgba(10,50,35,.10);
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    color-scheme:dark;
    --bg:#0c1512; --surface:#15221d; --surface2:#1a2a24; --text:#e7f1ec; --muted:#9db3a9; --line:#27392f;
    --brand:#3cc795; --brand-ink:#052116; --brand-soft:#17382c; --hero-a:#136b4e; --hero-b:#0a3a2b;
    --warn:#f6c231; --warn-ink:#2b2100; --warn-soft:#3a3110;
    --danger:#ff7d6e; --danger-soft:#3c1d19; --info:#7db2f2; --info-soft:#17283f;
    --shadow:0 6px 24px rgba(0,0,0,.4);
  }
}
:root[data-theme="dark"]{
  color-scheme:dark;
  --bg:#0c1512; --surface:#15221d; --surface2:#1a2a24; --text:#e7f1ec; --muted:#9db3a9; --line:#27392f;
  --brand:#3cc795; --brand-ink:#052116; --brand-soft:#17382c; --hero-a:#136b4e; --hero-b:#0a3a2b;
  --warn:#f6c231; --warn-ink:#2b2100; --warn-soft:#3a3110;
  --danger:#ff7d6e; --danger-soft:#3c1d19; --info:#7db2f2; --info-soft:#17283f;
  --shadow:0 6px 24px rgba(0,0,0,.4);
}
html{scroll-padding-top:env(safe-area-inset-top,0px);}
*,*::before,*::after{box-sizing:inherit}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;font-size:16px;line-height:1.65;-webkit-text-size-adjust:100%;word-break:keep-all;overflow-wrap:anywhere}
h1,h2,h3,p,ul,ol{margin:0}
button,input,select,textarea{font:inherit;color:inherit}
a{color:var(--brand)}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
[hidden]{display:none!important}

/* header */
.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:15;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top-in{display:flex;align-items:center;justify-content:space-between;height:56px}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.brand svg{flex:none;color:var(--brand)}
.brand-name{font-weight:800;font-size:15px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand-sub{font-size:12px;color:var(--muted);line-height:1.2}
.icon-btn{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;cursor:pointer}
.icon-btn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* .wrap의 padding(0 16px)에 덮어씌워지지 않도록 main.wrap 로 지정. 하단 고정 메뉴(약 66px)+iPhone 홈 영역만큼 여백 확보 */
main.wrap{padding-top:18px;padding-bottom:calc(132px + env(safe-area-inset-bottom,0px))}
.panel,.stack{display:flex;flex-direction:column;gap:14px}
h2{font-size:18px;font-weight:800;margin-top:10px}
h3{font-size:16px;font-weight:700}
.muted{color:var(--muted)}
.small{font-size:13px}

/* hero */
.hero{background:linear-gradient(135deg,var(--hero-a),var(--hero-b));color:#fff;border-radius:22px;padding:24px 20px;box-shadow:var(--shadow);position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-40px;top:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.08)}
.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:700;opacity:.8}
.hero h1{font-size:26px;line-height:1.3;font-weight:800;margin:6px 0 8px}
.hero p{opacity:.92;font-size:15px}
.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;position:relative;z-index:1}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 18px;border-radius:14px;border:1px solid transparent;font-weight:700;cursor:pointer;text-decoration:none;font-size:15px}
.btn.primary{background:var(--brand);color:var(--brand-ink)}
.btn.warn{background:var(--warn);color:var(--warn-ink)}
.btn.glass{background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.35)}
.btn.ghost{background:var(--surface);border-color:var(--line);color:var(--text)}
.btn.danger{background:var(--danger-soft);color:var(--danger);border-color:var(--danger)}
.btn.block{width:100%}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn:focus-visible,.tab:focus-visible,.icon-btn:focus-visible,summary:focus-visible,.item:focus-visible{outline:3px solid var(--warn);outline-offset:2px}

/* cards */
.card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.feature{display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;color:inherit}
.feature .em{font-size:26px}
.feature b{font-size:16px}
.feature span{font-size:13.5px;color:var(--muted)}
.tip{background:var(--warn-soft);border-color:transparent}
.tip-label{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--text);opacity:.65}
.tip p{font-weight:700;margin-top:4px}

/* heinrich */
.pyr{display:flex;flex-direction:column;gap:6px;margin:12px 0}
.pyr div{display:flex;align-items:center;gap:10px;border-radius:10px;padding:8px 12px;font-size:14px;font-weight:700}
.pyr .a{background:var(--danger-soft);color:var(--danger);width:46%}
.pyr .b{background:var(--warn-soft);color:var(--text);width:72%}
.pyr .c{background:var(--brand-soft);color:var(--brand);width:100%}
.pyr em{font-style:normal;font-size:20px;font-weight:800;min-width:42px}

/* lists */
.rules10{list-style:none;padding:0;counter-reset:r;display:flex;flex-direction:column;gap:8px}
.rules10 li{counter-increment:r;display:flex;gap:12px;align-items:flex-start;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.rules10 li::before{content:counter(r);flex:none;width:26px;height:26px;border-radius:50%;background:var(--brand);color:var(--brand-ink);display:grid;place-items:center;font-weight:800;font-size:13px;margin-top:1px}

details.acc{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}
details.acc summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 16px;font-weight:700;min-height:56px}
details.acc summary::-webkit-details-marker{display:none}
details.acc summary::after{content:"＋";margin-left:auto;color:var(--muted);font-weight:400}
details.acc[open] summary::after{content:"－"}
.acc-ic{font-size:22px}
.acc-body{padding:2px 16px 16px;display:flex;flex-direction:column;gap:8px;font-size:15px}
.lbl{font-size:12px;font-weight:800;letter-spacing:.04em;margin-top:6px}
.lbl.ok{color:var(--brand)} .lbl.no{color:var(--danger)}
.ul{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.ul li{position:relative;padding-left:24px}
.ul li::before{position:absolute;left:0;top:0;font-weight:800}
.ul.ok li::before{content:"✓";color:var(--brand)}
.ul.no li::before{content:"✕";color:var(--danger)}
ol.steps{margin:0;padding:0;list-style:none;counter-reset:s;display:flex;flex-direction:column;gap:8px}
ol.steps li{counter-increment:s;position:relative;padding-left:36px}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:1px;width:24px;height:24px;border-radius:50%;background:var(--info-soft);color:var(--info);display:grid;place-items:center;font-weight:800;font-size:13px}
.note{background:var(--surface2);border-radius:10px;padding:10px 12px;font-size:14px;color:var(--muted)}

/* contacts */
.contact{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
.contact:last-child{border-bottom:0}
.contact b{display:block}
.contact .num{font-weight:800;font-size:18px}
.callbtn{min-height:44px;padding:0 16px;border-radius:12px;background:var(--danger);color:#fff;font-weight:800;text-decoration:none;display:inline-flex;align-items:center}
.facts{display:grid;gap:8px;margin-top:6px}
.fact{display:flex;gap:10px;font-size:14.5px}
.fact b{min-width:84px;color:var(--muted);font-weight:700}

/* check */
.chk{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer}
.chk:last-of-type{border-bottom:0}
.chk input{width:22px;height:22px;margin-top:2px;accent-color:var(--brand);flex:none}
.score{display:flex;align-items:center;gap:10px;margin-top:10px;font-weight:700}
.bar{flex:1;height:10px;border-radius:99px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--brand);transition:width .25s}

/* form */
.field{display:flex;flex-direction:column;gap:8px}
.field>label,.field>.lab{font-weight:700;font-size:15px}
.req{color:var(--danger)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative}
.chip input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.chip span{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:99px;border:1.5px solid var(--line);background:var(--surface);font-weight:500;font-size:15px}
.chip input:checked+span{background:var(--brand-soft);border-color:var(--brand);color:var(--brand);font-weight:700}
.chip input:focus-visible+span{outline:3px solid var(--warn);outline-offset:2px}
.chip.sev-h input:checked+span{background:var(--danger-soft);border-color:var(--danger);color:var(--danger)}
.input,select.input,textarea.input{width:100%;min-height:48px;padding:10px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);font-size:16px}
textarea.input{min-height:130px;resize:vertical}
.input:focus{outline:3px solid color-mix(in srgb,var(--brand) 40%,transparent);border-color:var(--brand)}
.hint{font-size:13px;color:var(--muted)}
.err{color:var(--danger);font-size:14px;font-weight:700;min-height:0}
.banner{border-radius:14px;padding:12px 14px;font-size:14px;display:flex;gap:10px}
.banner.info{background:var(--info-soft);color:var(--info)}
.banner.warn{background:var(--warn-soft);color:var(--text)}
.banner.danger{background:var(--danger-soft);color:var(--danger)}
.banner b{display:block}
.photos-actions{display:flex;gap:10px;flex-wrap:wrap}
.thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.thumb{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:var(--surface2);border:1px solid var(--line)}
.thumb img{width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in}
.thumb button{position:absolute;top:4px;right:4px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:18px;cursor:pointer;line-height:1}
.success{text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 16px}
.success .ok-ic{width:64px;height:64px;border-radius:50%;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-size:32px}
.rid{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:800;font-size:20px;background:var(--surface2);border:1px dashed var(--line);border-radius:12px;padding:8px 16px;letter-spacing:.04em}

/* admin */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 6px;text-align:center}
.stat b{display:block;font-size:22px;line-height:1.2}
.stat span{font-size:12px;color:var(--muted)}
.filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.list{display:flex;flex-direction:column;gap:10px}
.item{display:flex;flex-direction:column;gap:6px;text-align:left;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;cursor:pointer}
.item-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;padding:3px 10px;border-radius:99px}
.b-new{background:var(--warn-soft);color:var(--text)} .b-wip{background:var(--info-soft);color:var(--info)} .b-done{background:var(--brand-soft);color:var(--brand)}
.sev{width:10px;height:10px;border-radius:50%;display:inline-block}
.sev-낮음{background:var(--brand)} .sev-보통{background:var(--warn)} .sev-높음{background:var(--danger)}
.item p{font-size:14.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.meta{font-size:12.5px;color:var(--muted);display:flex;gap:10px;flex-wrap:wrap}
.empty{text-align:center;padding:36px 12px;color:var(--muted)}

/* modal */
.overlay{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(0px + env(safe-area-inset-bottom,0px))}
.sheet{background:var(--bg);width:100%;max-width:640px;max-height:100%;overflow:auto;border-radius:22px 22px 0 0;padding:18px 16px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px}
@media(min-width:720px){.overlay{align-items:center}.sheet{border-radius:22px;max-height:90%}}
.sheet-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
.kv{display:grid;grid-template-columns:92px 1fr;gap:6px 10px;font-size:14.5px}
.kv dt{color:var(--muted);font-weight:700} .kv dd{margin:0}
.content-box{white-space:pre-wrap;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.photo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.photo-grid img{width:100%;border-radius:12px;display:block;cursor:zoom-in;border:1px solid var(--line)}
.lightbox{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px))}
.lightbox img{max-width:100%;max-height:100%;border-radius:8px}

/* bottom nav */
nav.tabs{position:fixed;left:0;right:0;bottom:0;z-index:20;background:var(--surface);border-top:1px solid var(--line);display:flex;gap:4px;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px))}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:54px;border:0;background:none;border-radius:14px;color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;padding:4px 2px}
.tab svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tab[aria-selected="true"]{color:var(--brand);background:var(--brand-soft);font-weight:800}
.tab.alert[aria-selected="false"]{color:var(--danger)}
@media(min-width:720px){
  nav.tabs{left:50%;right:auto;transform:translateX(-50%);width:min(560px,calc(100% - 32px));bottom:calc(16px + env(safe-area-inset-bottom,0px));border:1px solid var(--line);border-radius:22px;padding:6px;box-shadow:var(--shadow)}
}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));background:#16221d;color:#fff;border-radius:99px;padding:10px 18px;font-size:14px;z-index:70;max-width:90%;text-align:center;box-shadow:var(--shadow)}

/* login */
.login{max-width:420px;margin:8vh auto 0}
.login .card{display:flex;flex-direction:column;gap:14px;padding:22px 18px}
.honey{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.topbar-actions{display:flex;gap:8px}

.input.pin{text-align:center;font-size:30px;letter-spacing:.45em;padding-left:calc(14px + .45em);font-weight:700}

/* ---- 접수증(출력용) ---- */
.rc-ov{z-index:55}
.rc-sheet{max-width:680px}
.rc-bar{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.paper{background:#fff;color:#000;border:1px solid #cfd8d3;border-radius:6px;padding:36px 32px;font-family:"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif;line-height:1.7;word-break:keep-all}
.paper h1{font-size:28px;text-align:center;margin:0 0 6px;letter-spacing:.08em;border-bottom:3px double #000;padding-bottom:14px;color:#000}
.rc-sub{text-align:center;margin:12px 0 26px;font-weight:700}
.rc-row{display:grid;grid-template-columns:5.2em 1.2em 1fr;margin-bottom:14px;align-items:start}
.rc-row b{font-weight:800}
.rc-content{white-space:pre-wrap;min-height:9em;border:1px solid #000;padding:10px 12px;overflow-wrap:anywhere}
.rc-opt{display:inline-flex;align-items:center;margin:0 4px;white-space:nowrap}
.rc-sep{margin:0 4px}
.ck{display:inline-block;width:15px;height:15px;border:1.6px solid #000;margin-right:5px;position:relative;box-sizing:border-box}
.ck.on::after{content:"";position:absolute;left:3.5px;top:-1px;width:4px;height:9px;border:solid #000;border-width:0 2.4px 2.4px 0;transform:rotate(45deg)}
.rc-foot{margin-top:26px;font-size:12px;color:#444;text-align:right}
@media print{
  @page{size:A4;margin:18mm}
  body.printing-receipt > *:not(#receiptRoot){display:none!important}
  #receiptRoot .noprint{display:none!important}
  #receiptRoot .overlay{position:static;display:block;background:none;padding:0}
  #receiptRoot .sheet{max-width:none;max-height:none;overflow:visible;padding:0;background:none;border-radius:0;box-shadow:none}
  #receiptRoot .paper{border:none;padding:0}
}


/* ---- 공지사항 ---- */
.notice-card{display:flex;flex-direction:column;gap:12px}
.notice-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.notice-head h2{margin:0;font-size:20px}
.mascot-wrap{flex:none;background:#fff;border:1px solid var(--line);border-radius:18px;padding:6px 10px}
.mascot{display:block;width:112px;height:auto}
.notice-list{display:flex;flex-direction:column;gap:8px}
details.notice-item{background:var(--surface2);border:1px solid var(--line);border-radius:14px;overflow:hidden}
details.notice-item.pinned{border-color:var(--warn);background:var(--warn-soft)}
details.notice-item summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;min-height:48px;font-weight:700}
details.notice-item summary::-webkit-details-marker{display:none}
.n-title{min-width:0;overflow-wrap:anywhere}
.n-date{flex:none;font-size:12.5px;font-weight:400;color:var(--muted)}
.npin{display:inline-block;font-size:12px;font-weight:800;background:var(--warn);color:var(--warn-ink);border-radius:99px;padding:1px 8px;margin-right:4px}
.n-body{padding:0 14px 14px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}
.n-prev{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 10px;font-size:14.5px}

/* ---- 오늘의 안전 날씨 ---- */
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.wx{--wx-bg:var(--surface2);--wx-line:var(--line);display:grid;grid-template-columns:1fr auto;grid-template-areas:"head mascot" "level mascot" "note note" "tip tip";gap:8px 12px;align-items:center;border:2px solid var(--wx-line);background:var(--wx-bg);border-radius:22px;padding:16px;box-shadow:var(--shadow)}
.wx-clear{--wx-bg:var(--brand-soft);--wx-line:var(--brand)}
.wx-cloudy{--wx-bg:var(--warn-soft);--wx-line:var(--warn)}
.wx-danger{--wx-bg:var(--danger-soft);--wx-line:var(--danger)}
.wx-head{grid-area:head;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.wx-head h2{margin:0;font-size:17px}
.wx-date{font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:1px 9px}
.wx-level{grid-area:level;display:flex;align-items:center;gap:12px;min-width:0}
.wx-ico{flex:none;width:56px;height:56px}
.wx-ico svg{width:100%;height:100%;display:block}
.wx-none .wx-ico{opacity:.45;filter:grayscale(1)}
.wx-title{display:flex;flex-direction:column;line-height:1.2;min-width:0}
.wx-title span{font-size:15px;color:var(--muted);font-weight:700}
.wx-title b{font-size:22px;font-weight:800;word-break:keep-all}
.wx .mascot-wrap{grid-area:mascot;align-self:center}
.wx .mascot-wrap{padding:4px 6px}
.wx .mascot{width:84px}
.wx-note{grid-area:note;margin:0;font-size:13px;color:var(--muted)}
.wx-tip{grid-area:tip;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.wx-tip b{display:block;font-size:12px;letter-spacing:.06em;color:var(--muted)}
.wx-tip p{margin:2px 0 0;font-weight:700}
/* 퀵 메뉴 */
.q-title{margin:6px 0 0;font-size:17px}
.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.qtile{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px 12px;background:var(--surface);border:1.5px solid var(--line);border-radius:18px;cursor:pointer;color:inherit;font:inherit;text-align:center;min-height:44px}
.qtile svg{width:56px;height:56px;display:block}
.qtile b{font-size:15px}
.qtile span{font-size:12px;color:var(--muted)}
.qtile.q-emg{border-color:var(--danger);background:var(--danger-soft)}
.qtile:focus-visible{outline:3px solid var(--warn);outline-offset:2px}
/* 관리자: 안전 날씨 선택 */
.wx-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.wx-opt{position:relative;display:block;cursor:pointer}
.wx-opt input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.wx-box{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:2px solid var(--line);border-radius:16px;background:var(--surface)}
.wx-box svg{width:52px;height:52px;display:block}
.wx-box b{font-size:15px}
.wx-opt.wx-clear input:checked + .wx-box{border-color:var(--brand);background:var(--brand-soft)}
.wx-opt.wx-cloudy input:checked + .wx-box{border-color:var(--warn);background:var(--warn-soft)}
.wx-opt.wx-danger input:checked + .wx-box{border-color:var(--danger);background:var(--danger-soft)}
.wx-opt input:focus-visible + .wx-box{outline:3px solid var(--warn);outline-offset:2px}

/* 넓은 화면(가로 440px 이상)에서는 안전 날씨 카드를 더 크게 */
@media (min-width:440px){
  .wx-ico{width:76px;height:76px}
  .wx-title b{font-size:30px}
  .wx .mascot-wrap{padding:6px 10px}
  .wx .mascot{width:116px}
}

/* ===== 촬영안전 추가: 넓은 바로가기 버튼 (홈·바로가기 화면) ===== */
.qwide{display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;background:var(--surface);border:1.5px solid var(--line);border-radius:18px;cursor:pointer;color:inherit;font:inherit;text-align:left;min-height:44px}
.qwide svg{width:48px;height:48px;flex:none;display:block}
.qwide .qw-txt{display:flex;flex-direction:column;min-width:0;flex:1}
.qwide .qw-txt b{font-size:15px}
.qwide .qw-txt span{font-size:12px;color:var(--muted)}
.qwide i{font-style:normal;font-size:22px;color:var(--muted);flex:none}
.qwide:focus-visible{outline:3px solid var(--warn);outline-offset:2px}


/* ===== 페이지 머리말의 안전제일 캐릭터 (안전수칙·비상대응·바로가기·안전신문고·촬영안전) ===== */
.page-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.page-head > div:first-child{min-width:0;flex:1}
.pg-mascot-wrap{flex:none;background:#fff;border:1px solid var(--line);border-radius:18px;padding:6px 8px}
.pg-mascot{display:block;width:120px;height:auto}
@media (max-width:400px){ .pg-mascot{width:92px} }

/* 친환경 항목의 캐릭터 그림 */
.eco-art{display:block;width:fit-content;margin:0 auto 10px}
.eco-art .pg-mascot{width:150px}
@media (max-width:400px){ .eco-art .pg-mascot{width:130px} }

/* 안전 서비스 바로가기 6칸 */
.quick .qtile{text-decoration:none;justify-content:flex-start}
.quick .qtile b{line-height:1.25;word-break:keep-all}

/* =====================================================================
   기능 추가: 화면 설정(글자 크기·고대비) · 전체 검색 · 퀴즈 · 이달의 캠페인/챌린지 · 접수번호 조회 · 관리자 통계
   ===================================================================== */

/* ---- 헤더 버튼(검색·화면 설정·밝기) ---- */
.top-actions{display:flex;align-items:center;gap:6px;flex:none}
.top-actions .icon-btn{width:40px;height:40px}
.a11y-ic{font-weight:800;font-size:16px;line-height:1}
@media (max-width:400px){ .top-actions{gap:4px} .top-actions .icon-btn{width:37px;height:37px;border-radius:10px} .brand-name{font-size:14px} }

/* ---- 글자 크기 (화면 전체를 비율로 키웁니다) ---- */
html[data-fs="1"] body{zoom:1.15}
html[data-fs="2"] body{zoom:1.3}

/* ---- 고대비 모드: 글자·배경 대비를 높이고 테두리를 굵게 ---- */
:root[data-contrast="high"]{
  --bg:#ffffff; --surface:#ffffff; --surface2:#f1f1f1; --text:#000000; --muted:#1f1f1f; --line:#000000;
  --brand:#00573c; --brand-ink:#ffffff; --brand-soft:#dff3e9; --hero-a:#00573c; --hero-b:#003b29;
  --warn:#ffd400; --warn-ink:#000000; --warn-soft:#fff3b0; --danger:#b00020; --danger-soft:#ffe3e6; --info:#003a8c; --info-soft:#dce8ff;
  --shadow:none;
}
:root[data-contrast="high"][data-theme="dark"]{
  --bg:#000000; --surface:#000000; --surface2:#141414; --text:#ffffff; --muted:#f0f0f0; --line:#ffffff;
  --brand:#ffd400; --brand-ink:#000000; --brand-soft:#2b2500; --hero-a:#000000; --hero-b:#000000;
  --warn:#ffd400; --warn-ink:#000000; --warn-soft:#2b2500; --danger:#ff8a80; --danger-soft:#3a0a0a; --info:#9cc4ff; --info-soft:#0a1f3d;
}
@media (prefers-color-scheme: dark){
  :root[data-contrast="high"]:not([data-theme="light"]){
    --bg:#000000; --surface:#000000; --surface2:#141414; --text:#ffffff; --muted:#f0f0f0; --line:#ffffff;
    --brand:#ffd400; --brand-ink:#000000; --brand-soft:#2b2500; --hero-a:#000000; --hero-b:#000000;
    --warn:#ffd400; --warn-ink:#000000; --warn-soft:#2b2500; --danger:#ff8a80; --danger-soft:#3a0a0a; --info:#9cc4ff; --info-soft:#0a1f3d;
  }
}
:root[data-contrast="high"] .card, :root[data-contrast="high"] .qtile, :root[data-contrast="high"] .stat, :root[data-contrast="high"] details.acc,
:root[data-contrast="high"] .rules10 li, :root[data-contrast="high"] .tabs, :root[data-contrast="high"] .icon-btn, :root[data-contrast="high"] .input,
:root[data-contrast="high"] .pg-mascot-wrap, :root[data-contrast="high"] .sh-card, :root[data-contrast="high"] .sh-item, :root[data-contrast="high"] details.sh-acc{border-width:2px}
:root[data-contrast="high"] a:not(.btn):not(.qtile):not(.sh-item):not(.sh-commonlink):not(.sh-subnav a){text-decoration:underline}
:root[data-contrast="high"] .tab[aria-selected="true"]{outline:2px solid var(--text);outline-offset:-2px}
:root[data-contrast="high"] :focus-visible{outline:4px solid var(--warn);outline-offset:2px}

/* ---- 바로가기 화면 아래 버튼 ---- */
.menu-more{display:grid;grid-template-columns:1fr 1fr;gap:10px}

/* ---- 접수번호로 처리 결과 조회 ---- */
details.lookup{padding:0;overflow:hidden}
details.lookup > summary{list-style:none;cursor:pointer;padding:14px 16px;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px}
details.lookup > summary::-webkit-details-marker{display:none}
details.lookup > summary::after{content:"＋";color:var(--muted);font-weight:900}
details.lookup[open] > summary::after{content:"－"}
.lk-body{padding:0 16px 16px;display:flex;flex-direction:column;gap:10px}
.lk-row{display:flex;gap:8px}
.lk-row .input{flex:1;text-transform:uppercase;letter-spacing:.04em}
.lk-card{border:1.5px solid var(--line);border-radius:14px;padding:14px;background:var(--surface2);display:flex;flex-direction:column;gap:10px}
.lk-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.lk-steps{list-style:none;padding:0;margin:0;display:flex;gap:6px}
.lk-steps li{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12.5px;color:var(--muted);position:relative}
.lk-steps li i{font-style:normal;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;font-weight:800;background:var(--surface)}
.lk-steps li.done i,.lk-steps li.now i{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.lk-steps li.now{color:var(--text);font-weight:800}
.lk-reply{background:var(--surface);border:1.5px dashed var(--line);border-radius:12px;padding:10px 12px}
.lk-reply p{margin:4px 0 0;white-space:pre-wrap}

/* ---- 전체 검색 ---- */
.s-res{display:flex;flex-direction:column;gap:8px}
.s-item{display:flex;flex-direction:column;gap:3px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;cursor:pointer;color:inherit;font:inherit}
.s-item:hover{border-color:var(--brand)}
.s-sec{font-size:11.5px;font-weight:800;color:var(--brand);letter-spacing:.02em}
.s-snip{font-size:13.5px;color:var(--muted);line-height:1.5}
.s-item mark,.s-snip mark{background:var(--warn);color:var(--warn-ink);border-radius:3px;padding:0 2px}
.s-chip{cursor:pointer}

/* ---- 퀴즈 ---- */
.qz-stats{grid-template-columns:repeat(3,1fr)}
.quiz-card{display:flex;flex-direction:column;gap:10px}
.qz-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.qz-head h2{margin:0;font-size:18px}
.qz-tag{align-self:flex-start;font-size:12px;font-weight:800;padding:2px 10px;border-radius:99px;background:var(--brand-soft);color:var(--brand)}
.qz-q{font-size:17px;font-weight:700;line-height:1.5;margin:0}
.qz-opts{display:flex;flex-direction:column;gap:8px}
.qz-opt{display:flex;align-items:flex-start;gap:10px;text-align:left;background:var(--surface);border:2px solid var(--line);border-radius:14px;padding:11px 12px;font:inherit;color:inherit;cursor:pointer;min-height:48px}
.qz-opt:hover:not(:disabled){border-color:var(--brand)}
.qz-mark{flex:none;width:26px;height:26px;border-radius:50%;background:var(--surface2);border:1.5px solid var(--line);display:grid;place-items:center;font-size:13px;font-weight:800}
.qz-opt.ok{border-color:var(--brand);background:var(--brand-soft)}
.qz-opt.ok .qz-mark{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.qz-opt.no{border-color:var(--danger);background:var(--danger-soft)}
.qz-opt.no .qz-mark{background:var(--danger);border-color:var(--danger);color:#fff}
.qz-opt.dim{opacity:.55}
.qz-opt:disabled{cursor:default}
.qz-res{border-radius:14px;padding:12px 14px;line-height:1.6}
.qz-res.ok{background:var(--brand-soft)}
.qz-res.no{background:var(--danger-soft)}
.qz-res p{margin:6px 0 0}
.page-head .bar{margin-top:8px}

/* ---- 이달의 안전·친환경 캠페인 / 친환경 챌린지 ---- */
.camp-card{display:flex;flex-direction:column;gap:12px}
.camp-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.camp-head h2,.camp-head h3{margin:0;font-size:17px}
.camp-month{flex:none;font-size:13px;font-weight:800;padding:3px 12px;border-radius:99px;background:var(--brand);color:var(--brand-ink)}
.camp-row{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;border:1.5px solid var(--line);background:var(--surface2)}
.camp-row.safe{border-left:6px solid var(--warn)}
.camp-row.eco{border-left:6px solid var(--brand)}
.camp-pill{flex:none;font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px;background:var(--surface);border:1.5px solid var(--line)}
.camp-row b{display:block;line-height:1.4}
.camp-row p{margin:4px 0 0;color:var(--muted);font-size:14px;line-height:1.55}
.camp-go{margin-top:6px;border:0;background:none;color:var(--brand);font-weight:800;font:inherit;font-weight:800;cursor:pointer;padding:4px 0}
.eco-ch{display:flex;flex-direction:column;gap:10px;border-top:6px solid var(--brand)}
.eco-ch.all{background:var(--brand-soft)}
.eco-ch-title{display:flex;align-items:center;gap:12px}
.eco-ch-ic{font-size:34px;line-height:1;flex:none}
.eco-ch-title b{display:block;line-height:1.4}

/* ---- 관리자: 통계 · 월간 보고서 ---- */
.st-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.st-toolbar select{max-width:200px}
.st-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.st-kpi .stat small{display:block;color:var(--muted);font-size:11.5px;margin-top:2px}
.st-bars{display:flex;flex-direction:column;gap:7px}
.st-row{display:grid;grid-template-columns:92px 1fr 44px;gap:8px;align-items:center;font-size:13.5px}
.st-row span.l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-row .tr{height:14px;background:var(--line);border-radius:99px;overflow:hidden}
.st-row .tr i{display:block;height:100%;background:var(--brand);border-radius:99px}
.st-row .tr i.warn{background:var(--warn)}
.st-row .tr i.danger{background:var(--danger)}
.st-row b{text-align:right;font-variant-numeric:tabular-nums}
.st-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:560px){ .st-kpi{grid-template-columns:repeat(2,1fr)} .st-cols{grid-template-columns:1fr} }
.st-month{display:flex;align-items:flex-end;gap:6px;height:120px;padding-top:6px}
.st-month div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px;height:100%;font-size:11px;color:var(--muted)}
.st-month div i{display:block;width:100%;background:var(--brand);border-radius:6px 6px 0 0;min-height:2px}
.st-month div b{font-size:12px;color:var(--text)}
.camp-admin textarea{min-height:70px}

/* 월간 보고서(인쇄용 종이) */
.paper.rp{padding:28px 26px;font-size:13px;line-height:1.55}
.rp h1{font-size:21px;text-align:center;margin:0 0 4px}
.rp .rp-sub{text-align:center;color:#444;margin:0 0 14px;font-size:12.5px}
.rp h2{font-size:14.5px;margin:16px 0 6px;border-bottom:2px solid #000;padding-bottom:3px}
.rp table{width:100%;border-collapse:collapse;font-size:12.5px}
.rp th,.rp td{border:1px solid #666;padding:5px 7px;text-align:left;vertical-align:top}
.rp th{background:#eee}
.rp td.n,.rp th.n{text-align:right;white-space:nowrap}
.rp .rp-note{font-size:11.5px;color:#444;margin-top:10px}
.rp .rp-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.rp .rp-kpi div{border:1px solid #666;padding:7px;text-align:center}
.rp .rp-kpi b{display:block;font-size:19px}
@media print{ #receiptRoot .rp{padding:0} #receiptRoot .rp h2{break-after:avoid} #receiptRoot .rp table{break-inside:auto} #receiptRoot .rp tr{break-inside:avoid} }
button.chip{background:none;border:0;padding:0;font:inherit;color:inherit}
