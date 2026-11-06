// Browser upgrade test: seed old cache versions, upgrade to this checkout, then go offline.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  let upgraded = false;
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const file = name.endsWith('/') ? name + 'index.html' : name;
    const full = path.join(root, file);
    if (!full.startsWith(root + path.sep) || !fs.existsSync(full)) { res.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    try {
      let body = upgraded ? fs.readFileSync(full) : execFileSync('git', ['show', 'origin/main:' + file.slice(1)], { cwd: root, maxBuffer: 16 * 1024 * 1024 });

      // Seed old cache versions with unchanged assets. Drain responses in the baseline
      // fixture too: its original installer stalls on Chrome's outstanding-fetch limit.
      if (!upgraded && file.endsWith('/sw.js')) body = body.toString().replace('return [url.href, response];', 'return [url.href, new Response(await response.arrayBuffer(), { headers: response.headers })];');
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const external = [];
  page.on('request', req => { if (!req.url().startsWith(origin)) external.push(req.url()); });
  try {
    for (const game of ['sticks-in-the-woods', 'into-the-deep/dist']) {
      console.log('Installing baseline worker:', game);
      await page.goto(origin + '/games/' + game + '/');
      await page.evaluate(async () => Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(Error('Baseline worker install timed out')), 20000))]));
    }
    await page.evaluate(() => localStorage.setItem('analytics-save-sentinel', 'preserve-existing-data'));
    let keys = await page.evaluate(() => caches.keys());
    assert(keys.includes('sticks-in-the-woods-shell-v4') && keys.includes('stick-together-shell-v24'));
    upgraded = true;
    await page.evaluate(async () => { for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.update(); });
    await page.evaluate(async () => {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        const keys = await caches.keys();
        if (keys.includes('sticks-in-the-woods-shell-v14') && keys.includes('stick-together-shell-v24') && !keys.includes('sticks-in-the-woods-shell-v4')) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      throw Error('Worker upgrade timed out');
    });
    for (const cache of ['sticks-in-the-woods-shell-v14', 'stick-together-shell-v24']) {
      assert(await page.evaluate(async name => Boolean(await (await caches.open(name)).match(location.origin + '/js/analytics.js')), cache));
    }
    await context.setOffline(true);
    for (const game of ['sticks-in-the-woods', 'into-the-deep/dist']) {
      await page.goto(origin + '/games/' + game + '/');
      assert(await page.getByRole('button', { name: 'Reject', exact: true }).isVisible());
      await page.getByRole('button', { name: 'Reject', exact: true }).click();
      if (game === 'sticks-in-the-woods') {
        await page.frameLocator('iframe').locator('#startBtn').click();
        await page.frameLocator('iframe').locator('#beginRunBtn').click();
        assert.equal(await page.frameLocator('iframe').locator('body').evaluate(() => typeof window.WoodsEnding?.create), 'function', 'Ending code loads offline');
        for (const asset of ['ending.js', 'ending.css', 'ending-scene.js']) {
          assert(await page.evaluate(async asset => { const response = await fetch('./' + asset); return response.ok && (await response.text()).length > 0; }, asset), asset + ' is available offline');
        }
      }
      else await page.locator('#start').click();
      await page.getByRole('button', { name: 'Analytics choices', exact: true }).click();
      await page.getByRole('button', { name: 'Accept', exact: true }).click();
      assert.equal(await page.evaluate(() => localStorage.getItem('analytics-save-sentinel')), 'preserve-existing-data');
      // Make the next route show its initial banner while keeping game storage intact.
      await page.evaluate(() => localStorage.removeItem('2badideas-analytics-v1'));
    }
    assert.deepEqual(external, []);
    keys = await page.evaluate(() => caches.keys());
    assert(keys.includes('sticks-in-the-woods-shell-v14') && keys.includes('stick-together-shell-v24'));
    console.log('PASS: Browser workers upgrade Woods v4 to v14 and preserve Deep v24, isolate caches, cache consent controls, preserve storage, and launch/play offline without external requests.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exit(1); });
