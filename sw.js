/* 앱처럼 쓰기 위한 서비스 워커
   - 같은 사이트의 화면 파일을 저장해 두었다가, 인터넷이 불안정해도 안전수칙·비상대응이 열리게 합니다.
   - 인터넷이 잘 되면 항상 최신 파일을 가져오므로, 파일을 고쳐 올리면 바로 반영됩니다.
   - 인터넷이 끊겼거나 신호가 약해 3초 안에 응답이 없으면 저장해 둔 파일을 바로 보여 줍니다(비상 상황에서 기다리지 않게).
   - 서버(Supabase) 요청, 관리자 화면(admin.*)은 건드리지 않습니다. */
const VERSION = 'v3-2026-10-08';
let slowUntil = 0;       /* 느린 연결로 판단한 뒤 이 시각까지는 기다리지 않고 바로 저장본을 보여 줍니다 */
const SLOW_WINDOW = 60000;
const SLOW_MS = 3000;   /* 인터넷이 이 시간 안에 응답하지 않으면 저장해 둔 파일을 먼저 보여 줍니다 */
const CACHE = 'safety-app-' + VERSION;
const CORE = [
  './', './index.html', './app.css', './shoot.css', './ui.css', './site.config.js', './content.js', './art.js', './common.js',
  './shoot-data.js', './quiz-data.js', './shoot.js', './sb.js', './extras.js', './app.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './mascot.png', './mascot-safety.png', './mascot-duo.png', './mascot-eco.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache:'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('safety-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;                     // 서버·글꼴·외부 도구는 그대로
  if(/\/admin\.(html|js)$/.test(url.pathname)) return;                // 관리자 화면은 저장하지 않음
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch:true });
    const t0 = Date.now();
    const net = fetch(req).then(res => {
      if(res && res.ok){ cache.put(req, res.clone()); if(Date.now() - t0 < SLOW_MS) slowUntil = 0; return res; }
      return hit || res;                                              // 서버가 오류를 주면 저장본 우선
    });
    if(!hit){                                                         // 저장본이 없으면 인터넷을 기다림
      try{ return await net; }
      catch(err){
        if(req.mode === 'navigate'){ const home = await cache.match('./index.html'); if(home) return home; }
        throw err;
      }
    }
    e.waitUntil(net.catch(() => {}));                                 // 늦어도 뒤에서 최신 파일로 저장본을 갱신
    if(Date.now() < slowUntil) return hit;                            // 방금 느리다고 판단했으면 기다리지 않고 바로 저장본
    return Promise.race([
      net.catch(() => { slowUntil = Date.now() + SLOW_WINDOW; return hit; }),
      new Promise(r => setTimeout(() => { slowUntil = Date.now() + SLOW_WINDOW; r(hit); }, SLOW_MS))
    ]);
  })());
});
