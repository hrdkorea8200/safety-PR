/* 앱처럼 쓰기 위한 서비스 워커
   - 같은 사이트의 화면 파일을 저장해 두었다가, 인터넷이 불안정해도 안전수칙·비상대응이 열리게 합니다.
   - 인터넷이 되면 항상 최신 파일을 먼저 가져오므로(저장본은 대비용), 파일을 고쳐 올리면 바로 반영됩니다.
   - 서버(Supabase) 요청, 관리자 화면(admin.*)은 건드리지 않습니다. */
const VERSION = 'v2-2026-10-08';
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
    try{
      const res = await fetch(req);                                   // 1) 인터넷이 되면 항상 최신 파일
      if(res && res.ok) cache.put(req, res.clone());
      return res;
    }catch(err){
      const hit = await cache.match(req, { ignoreSearch:true });      // 2) 안 되면 저장해 둔 파일
      if(hit) return hit;
      if(req.mode === 'navigate'){ const home = await cache.match('./index.html'); if(home) return home; }
      throw err;
    }
  })());
});
