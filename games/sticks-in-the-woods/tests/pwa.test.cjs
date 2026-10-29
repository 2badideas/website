const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = 'https://games.example/games/sticks-in-the-woods/';

async function serviceWorkerTests() {
  const events = {}, stores = new Map();
  let offline = false, broken = '';
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {put: async (key, value) => data.set(key, value), match: async key => data.get(key)?.clone()};
    },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name)
  };
  const sandbox = {URL, Set, Promise, caches, self: {
    registration: {scope: base}, location: {origin: new URL(base).origin},
    addEventListener: (name, fn) => events[name] = fn,
    skipWaiting: async () => {}, clients: {claim: async () => {}}
  }, fetch: async url => {
    if (offline) throw Error('offline');
    if (broken === 'redirect') return {ok: true, redirected: true};
    if (broken === 'html') return new Response('<html>Sign in</html>');
    const file = new URL(url).pathname.slice(new URL(base).pathname.length) || 'index.html';
    return new Response(fs.readFileSync(path.join(root, file)));
  }};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), sandbox);
  function dispatch(name, props = {}) {
    let result;
    events[name]({...props, waitUntil: p => result = p, respondWith: p => result = p});
    return result;
  }
  for (broken of ['redirect', 'html']) {
    await assert.rejects(dispatch('install'));
    assert.equal(stores.size, 0, 'Failed installs must not save sign-in or redirect pages');
  }
  broken = '';
  await dispatch('install');
  assert.equal(stores.get('sticks-in-the-woods-shell-v1').size, 9);
  stores.set('sticks-in-the-woods-shell-old', new Map());
  stores.set('stick-together-shell-v14', new Map());
  await dispatch('activate');
  assert(!stores.has('sticks-in-the-woods-shell-old'));
  assert(stores.has('stick-together-shell-v14'), 'Into the Deep cache must survive');
  offline = true;
  for (const route of ['', '?source=pwa', 'index.html?source=pwa', 'game.html']) {
    const page = await dispatch('fetch', {request: {url: base + route, method: 'GET', mode: 'navigate'}});
    assert((await page.text()).includes(route.startsWith('game.html') ? 'id="game"' : 'src="game.html"'));
  }
  for (const asset of ['pwa.js', 'pwa.css', 'manifest.webmanifest', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png']) {
    const response = await dispatch('fetch', {request: {url: base + asset, method: 'GET'}});
    assert((await response.arrayBuffer()).byteLength > 0);
  }
  for (const [url, method] of [[base + 'sign-in', 'GET'], ['https://third-party.example/pixel', 'GET'], [new URL('../into-the-deep/dist/', base).href, 'GET'], [base, 'POST']]) {
    assert.equal(dispatch('fetch', {request: {url, method}}), undefined);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest')));
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './?source=pwa');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'fullscreen');
  assert.equal(manifest.name, 'Sticks in the Woods');
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(root, icon.src));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  assert(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const entry of ['index.html', 'game.html']) {
    const html = fs.readFileSync(path.join(root, entry), 'utf8');
    assert(html.includes('href="manifest.webmanifest"'));
    assert(html.includes('src="pwa.js"'));
    assert(html.includes('name="mobile-web-app-capable"'));
  }
  console.log('PASS: Offline wrapper/game/assets, query-string launch, manifest/icon sizes, redirect rejection, cache isolation and network exclusions.');
}

function pwaHarness({embedded = false, standalone = false, ios = false, registrationFails = false} = {}) {
  function element() {
    return {hidden: false, open: false, textContent: '', events: {},
      addEventListener(name, fn) {this.events[name] = fn;},
      setAttribute() {}, showModal() {this.open = true;}, close() {this.open = false;}};
  }
  const buttons = [element(), element()];
  const parts = Object.fromEntries(['.woods-install-close', '#woods-install-confirm', '#woods-install-message', '#woods-offline-status'].map(id => [id, element()]));
  const dialog = {...element(), querySelector: selector => parts[selector]};
  const messages = [], parentMessages = [], events = {}, registrations = [];
  const frame = {...element(), contentWindow: {postMessage: (...args) => messages.push(args)}};
  const window = {addEventListener: (name, fn) => events[name] = fn};
  const parent = {postMessage: (...args) => parentMessages.push(args)};
  window.parent = embedded ? parent : window;
  const navigator = {userAgent: ios ? 'iPhone' : 'Chrome', platform: '', maxTouchPoints: 0, serviceWorker: {
    register: async (...args) => {registrations.push(args); if (registrationFails) throw Error('registration denied');},
    ready: Promise.resolve()
  }};
  const sandbox = {window, navigator, location: {origin: new URL(base).origin}, matchMedia: () => ({matches: standalone}), document: {
    querySelectorAll: () => buttons, querySelector: () => embedded ? null : frame,
    createElement: () => dialog, body: {append() {}}
  }};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'pwa.js'), 'utf8'), sandbox);
  return {buttons, parts, dialog, events, registrations, messages, parentMessages, frame, parent};
}

async function installTests() {
  const h = pwaHarness();
  await h.events.load();
  assert.equal(h.registrations[0][0], './sw.js');
  assert(h.parts['#woods-offline-status'].textContent.includes('ready for offline'));
  h.events.message({origin: 'https://attacker.example', source: h.frame.contentWindow, data: {type: 'woods-install-request'}});
  h.events.message({origin: new URL(base).origin, source: {}, data: {type: 'woods-install-request'}});
  assert(!h.dialog.open, 'Untrusted messages must not open installation UI');
  h.events.message({origin: new URL(base).origin, source: h.frame.contentWindow, data: {type: 'woods-install-request'}});
  assert(h.dialog.open);
  assert(h.parts['#woods-install-confirm'].hidden);
  let prompts = 0, prevented = false;
  h.events.beforeinstallprompt({preventDefault() {prevented = true;}, prompt: async () => prompts++, userChoice: Promise.resolve({outcome: 'dismissed'})});
  assert(prevented);
  assert(!h.parts['#woods-install-confirm'].hidden);
  await h.parts['#woods-install-confirm'].events.click();
  await h.parts['#woods-install-confirm'].events.click();
  assert.equal(prompts, 1, 'A native prompt can only be consumed once');
  assert(!h.dialog.open);
  h.events.appinstalled();
  assert(h.buttons.every(button => button.hidden));
  assert(h.messages.at(-1)[0].installed);
  const ios = pwaHarness({ios: true});
  ios.buttons[0].events.click();
  assert(ios.parts['#woods-install-message'].textContent.includes('Add to Home Screen'));
  const failed = pwaHarness({registrationFails: true});
  await failed.events.load();
  assert(failed.parts['#woods-offline-status'].textContent.includes('unavailable'));
  const installed = pwaHarness({standalone: true});
  assert(installed.buttons.every(button => button.hidden));
  installed.buttons[0].events.click();
  assert(!installed.dialog.open);
  const child = pwaHarness({embedded: true});
  child.buttons[0].events.click();
  assert.equal(child.parentMessages.at(-1)[0].type, 'woods-install-request');
  assert.equal(child.parentMessages.at(-1)[1], new URL(base).origin);
  assert.equal(child.registrations.length, 0, 'The iframe delegates installation to the top-level page');
  child.events.message({origin: new URL(base).origin, source: {}, data: {type: 'woods-install-state', installed: true}});
  assert(child.buttons.every(button => !button.hidden));
  child.events.message({origin: new URL(base).origin, source: child.parent, data: {type: 'woods-install-state', installed: true}});
  assert(child.buttons.every(button => button.hidden));
  console.log('PASS: Native prompt lifecycle, iframe origin/source checks, installed-state propagation, iOS fallback and offline failure messaging.');
}
(async () => {await serviceWorkerTests(); await installTests();})().catch(error => {console.error(error); process.exit(1);});
