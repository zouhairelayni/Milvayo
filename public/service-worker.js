/* Caches only same-origin static assets. Never cache API responses, private Firebase data, or other origins. */
const CACHE = 'niyarvo-projects-assets-v2';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/','/manifest.json','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('niyarvo-projects-assets-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/__/') || url.pathname.includes('/api/')) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => res).catch(() => caches.match('/')));
    return;
  }
  if (!/(\.(js|css|png|jpg|svg|woff2?|ttf|webp)$)/.test(url.pathname)) return;
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(cache => cache.put(req, clone)); }
    return res;
  })));
});
