// Run with Playwright available via NODE_PATH. All collection requests are intercepted.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const site = path.resolve(__dirname, '..');
const origin = 'https://2badideas.com';
const key = '2badideas-analytics-v1';
const routes = ['/', '/privacy.html', '/games/sticks-in-the-woods/', '/games/sticks-in-the-woods/game.html', '/games/into-the-deep/dist/', '/games/sap-and-survive/'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json' };
(async () => {
  const tracker = process.env.UMAMI_SCRIPT_PATH ? fs.readFileSync(process.env.UMAMI_SCRIPT_PATH, 'utf8') : await (await fetch('https://cloud.umami.is/script.js')).text();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let context;
  async function setup(options = {}, state = null, signal = null) {
    await context?.close();
    context = await browser.newContext({ serviceWorkers: 'block', ...options });
    const requests = [], sends = [], errors = [];
    if (state || signal) await context.addInitScript(({ state, signal, key }) => {
      if (state) localStorage.setItem(key, JSON.stringify(state));
      if (signal) Object.defineProperty(navigator, signal, { get: () => signal === 'globalPrivacyControl' ? true : '1' });
    }, { state, signal, key });
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      requests.push(req.url());
      if (url.origin === origin || url.origin === 'https://preview.example') {
        const name = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
        const file = path.join(site, name);
        if (!file.startsWith(site + '/') || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'missing' });
        return route.fulfill({ contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
      }
      if (req.url() === 'https://cloud.umami.is/script.js') return route.fulfill({ contentType: 'text/javascript', body: tracker });
      // Never send synthetic visits to Umami. Capture their real serialized payloads.
      assert(['cloud.umami.is', 'gateway.umami.is'].includes(url.hostname), 'Unexpected external request: ' + url.hostname);
      if (req.method() === 'OPTIONS') return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type,x-umami-cache' }, body: '' });
      assert.equal(req.method(), 'POST');
      sends.push(req.postDataJSON());
      return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"cache":"synthetic"}' });
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    return { page, requests, sends, errors };
  }
  const accepted = () => ({ choice: 'accepted', expires: Date.now() + 86400000 });
  const remoteCount = run => run.requests.filter(u => !u.startsWith(origin)).length;
  const settle = page => page.waitForTimeout(150);
  try {
    for (const route of routes) {
      const run = await setup(); const { page } = run;
      await page.goto(origin + route); await settle(page);
      await page.getByRole('button', { name: 'Reject', exact: true }).click();
      await page.evaluate(() => window.siteAnalytics.gameStart('sap-and-survive'));
      await settle(page); assert.equal(remoteCount(run), 0, route);
      await page.reload(); await settle(page); assert.equal(remoteCount(run), 0, route + ' reload');
      assert.deepEqual(run.errors, [], route);
    }
    console.log('PASS: All six routes load/reject/reload with zero third-party requests and no JS errors.');

    const run = await setup(); const { page, sends } = run;
    await page.goto(origin + '/?secret=never-send#private', { referer: 'https://referral.example/private?email=private' });
    const desktopHeight = await page.locator('#analytics-controls').evaluate(host => host.shadowRoot.querySelector('section').getBoundingClientRect().height);
    assert(desktopHeight <= 110, 'Desktop notice should remain a compact strip');
    assert(await page.getByRole('button', { name: 'Analytics choices', exact: true }).isHidden());
    await page.screenshot({ path: '/tmp/website-analytics-desktop.png' });
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.waitForFunction(() => Boolean(window.umami)); await settle(page);
    assert.equal(sends.length, 1); assert.equal(sends[0].type, 'event');
    assert.equal(sends[0].payload.website, '5ff42a68-829e-4902-9d3b-b4fc38c8f29c');
    assert.equal(sends[0].payload.url, '/'); assert.equal(sends[0].payload.referrer, 'https://referral.example');
    assert(!JSON.stringify(sends).includes('never-send')); assert(!JSON.stringify(sends).includes('email='));
    await page.evaluate(() => { window.siteAnalytics.gameStart('sap-and-survive'); window.siteAnalytics.gameStart('invalid'); });
    await settle(page); assert.equal(sends.length, 2); assert.equal(sends[1].payload.name, 'game-start');
    assert.deepEqual(sends[1].payload.data, { game: 'sap-and-survive' });
    const other = await context.newPage(); await other.goto(origin + '/privacy.html'); await settle(page);
    const before = sends.length;
    await other.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await other.getByRole('button', { name: 'Reject', exact: true }).click();
    await page.evaluate(() => window.siteAnalytics.gameStart('into-the-deep'));
    await settle(page); assert.equal(sends.length, before);
    await page.reload(); await settle(page); assert.equal(sends.length, before);
    assert.equal((await context.cookies()).length, 0);
    console.log('PASS: Real Umami script, opt-in pageview, sanitized payload, event allowlist, cross-tab withdrawal and no cookies.');

    for (const signal of ['globalPrivacyControl', 'doNotTrack']) {
      const run = await setup({}, accepted(), signal);
      await run.page.goto(origin); await settle(run.page);
      await run.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
      assert(await run.page.getByRole('button', { name: 'Accept', exact: true }).isDisabled());
      assert.equal(remoteCount(run), 0);
    }
    for (const state of [{ choice: 'accepted', expires: Date.now() - 1000 }, { choice: 'garbage', expires: Date.now() + 86400000 }]) {
      const run = await setup({}, state); await run.page.goto(origin); await settle(run.page);
      assert(await run.page.getByRole('button', { name: 'Accept', exact: true }).isVisible());
      assert.equal(remoteCount(run), 0);
    }
    const preview = await setup({}, accepted()); await preview.page.goto('https://preview.example/'); await settle(preview.page);
    assert.equal(preview.requests.filter(u => u.startsWith('https://cloud.umami.is')).length, 0);
    console.log('PASS: GPC/DNT override prior acceptance, expired/invalid choices default off, preview hosts never collect.');

    const blocked = await setup();
    await blocked.page.addInitScript(() => {
      Storage.prototype.getItem = () => { throw Error('storage blocked'); };
      Storage.prototype.setItem = () => { throw Error('storage blocked'); };
    });
    await blocked.page.goto(origin);
    await blocked.page.getByRole('button', { name: 'Accept', exact: true }).click(); await settle(blocked.page);
    assert(blocked.sends.length <= 1, 'Storage-blocked analytics may fail closed');
    const blockedBefore = blocked.sends.length;
    await blocked.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    await blocked.page.getByRole('button', { name: 'Reject', exact: true }).click();
    await blocked.page.evaluate(() => window.siteAnalytics.gameStart('into-the-deep')); await settle(blocked.page);
    assert.equal(blocked.sends.length, blockedBefore); assert.deepEqual(blocked.errors, []);
    console.log('PASS: Unavailable local storage supports a page-only choice and withdrawal.');

    for (const [route, game, start] of [
      ['/games/sticks-in-the-woods/', 'sticks-in-the-woods', 'woods'],
      ['/games/into-the-deep/dist/', 'into-the-deep', 'deep'],
      ['/games/sap-and-survive/', 'sap-and-survive', 'sap']
    ]) {
      const run = await setup({}, accepted()); await run.page.goto(origin + route); await settle(run.page);
      assert.equal(run.sends.length, 1, 'One pageview including Woods iframe');
      if (start === 'woods') await run.page.frameLocator('iframe').locator('#startBtn').click();
      if (start === 'deep') await run.page.locator('#start').click();
      if (start === 'sap') {
        await run.page.locator('#startBtn').click();
        // The intro transitions to gameplay through startPlay; wait for that real transition.
        await run.page.waitForFunction(() => !document.getElementById('hud').hidden, { timeout: 30000 });
      }
      await settle(run.page);
      assert(run.sends.some(s => s.payload.name === 'game-start' && s.payload.data.game === game), game);
      assert.deepEqual(run.errors, []);
    }
    console.log('PASS: Actual game-start controls emit events for all games; Woods iframe sends no duplicate pageview.');

    const mobile = await setup({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.page.goto(origin + '/games/sap-and-survive/');
    const box = await mobile.page.locator('#analytics-controls').evaluate(host => {
      const rect = host.shadowRoot.querySelector('section').getBoundingClientRect();
      return { x: rect.x, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    assert(box.x >= 0 && box.right <= 390 && box.top >= 0 && box.bottom <= 844);
    assert(box.bottom - box.top <= 180, 'Mobile notice should use no more than 180px');
    await mobile.page.screenshot({ path: '/tmp/website-analytics-mobile.png' });
    await mobile.page.getByRole('button', { name: 'Reject', exact: true }).click();
    await mobile.page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
    assert(await mobile.page.getByRole('button', { name: 'Accept', exact: true }).evaluate(el => el.getRootNode().activeElement === el));
    await mobile.page.keyboard.press('Escape');
    assert(await mobile.page.getByRole('button', { name: 'Analytics choices', exact: true }).evaluate(el => el.getRootNode().activeElement === el));
    console.log('PASS: Compact desktop/mobile notice, hidden duplicate settings, and keyboard close/focus restoration.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
