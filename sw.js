/* PM Alerta — service worker: funciona offline e abre o app ao tocar na notificação. */
const CACHE = 'pma-v1';
const SHELL = [
  './', 'index.html', 'privacidade.html', 'termos.html', 'manifest.webmanifest',
  'assets/css/styles.css', 'assets/js/frame-guard.js', 'assets/js/config.js', 'assets/js/store.js', 'assets/js/util.js',
  'assets/js/ads.js', 'assets/js/app.js', 'assets/js/vendor/qrcode.js',
  'assets/img/icon.svg', 'assets/img/icon-192.png', 'assets/img/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Só arquivos do próprio site: rede primeiro (sempre atualizado), cache como reserva offline.
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('admin')) return; // o painel nunca fica em cache
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if (c.url.startsWith(self.registration.scope)) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
