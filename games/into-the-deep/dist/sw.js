const CACHE = 'stick-together-shell-v20';
const SHELL = ['./', './index.html', './style.css', './game.js', './pwa.js', './manifest.webmanifest', './assets/three.module.js', './assets/three.core.js', './assets/story.png', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png', '../../../assets/fonts/satoshi/Satoshi-Variable.woff2', '../../../assets/fonts/inter/InterVariable.woff2'];
const shellURLs = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Do not save the private hosting service's sign-in page as the game shell.
    const responses = await Promise.all(SHELL.map(async path => {
      const url = new URL(path, self.registration.scope);
      const response = await fetch(url, {cache:'reload', credentials:'same-origin'});
      if (!response.ok || response.redirected) throw new Error('Game assets unavailable');
      if ((path === './' || path === './index.html') && !(await response.clone().text()).includes('id="viewport"')) throw new Error('Game sign-in required');
      return [url.href, response];
    }));
    await Promise.all(responses.map(([url,response]) => cache.put(url,response)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter(key => key.startsWith('stick-together-shell-') && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Only the game shell is cached. Authentication routes and other pages always go to the network.
  const entry = event.request.mode === 'navigate' && (url.pathname === new URL('./', self.registration.scope).pathname || url.pathname === new URL('./index.html', self.registration.scope).pathname);
  url.search = '';
  if (!entry && !shellURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(entry ? new URL('./', self.registration.scope).href : url.href);
    return cached || fetch(event.request);
  })());
});
