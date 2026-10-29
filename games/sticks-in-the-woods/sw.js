const CACHE_PREFIX = 'sticks-in-the-woods-shell-';
const CACHE = CACHE_PREFIX + 'v1';
const SHELL = ['./', './index.html', './game.html', './pwa.js', './pwa.css', './manifest.webmanifest', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png'];
const shellURLs = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const entries = await Promise.all(SHELL.map(async path => {
      const url = new URL(path, self.registration.scope);
      const response = await fetch(url, {cache: 'reload', credentials: 'same-origin'});
      if (!response.ok || response.redirected) throw new Error('Game assets unavailable');
      if (path === './' || path === './index.html' || path === './game.html') {
        const html = await response.clone().text();
        const marker = path === './game.html' ? 'id="game"' : 'src="game.html"';
        if (!html.includes(marker)) throw new Error('Game page unavailable');
      }
      return [url.href, response];
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(entries.map(([url, response]) => cache.put(url, response)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  url.search = '';
  if (!shellURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(url.href) || fetch(event.request);
  })());
});
