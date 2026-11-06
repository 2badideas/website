// Run with Playwright on NODE_PATH; optional PLAYWRIGHT_CHANNEL and MOBILE_SCREENSHOT.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const origin = 'https://preview.example';
const hook = `window.woodsTest = {
  read: () => ({facing:p.facing, attacking:touchAim.engaged, manual:touchAim.manual, moving:joystick.active}),
  drop: offset => { groundWeapons=[]; dropWeapon('pea',p.x+offset,p.y); updateUI(); },
  safe: () => { p.hp=p.maxHp=100000; }
};`;
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    for (const [width, height] of [[320,568], [390,844], [844,390]]) {
      const context = await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        assert.equal(url.origin, origin, 'No external requests on preview');
        const file = path.join(root, url.pathname);
        let body = fs.readFileSync(file);
        if (file.endsWith('game.html')) body = body.toString().replace(/requestAnimationFrame\(frame\);\r?\n\}\)\(\);/, hook + '\nrequestAnimationFrame(frame);\n})();');
        const ext = path.extname(file);
        return route.fulfill({body,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext] || 'application/octet-stream'});
      });
      await page.goto(origin + '/games/sticks-in-the-woods/game.html');
      await page.getByRole('button',{name:'Reject',exact:true}).tap();
      await page.locator('#startBtn').tap();
      await page.locator('#beginRunBtn').tap();
      await page.evaluate(() => window.woodsTest.safe());
      assert(await page.locator('#pickupBtn').isHidden());
      const health = await page.locator('.healthbox').boundingBox();
      const weapon = await page.locator('#mobileLoadout').boundingBox();
      assert(health.y + health.height <= 42 && weapon.y + weapon.height <= 65, 'Compact top HUD');
      for (const [button, stick] of [['#dashBtn','#joyArea'], ['#burstBtn','#aimArea']]) {
        const b = await page.locator(button).boundingBox(), s = await page.locator(stick).boundingBox();
        assert(b.y + b.height <= s.y && s.y - (b.y + b.height) <= 18, 'Action directly above edge stick');
        assert(b.x < width * .2 || b.x + b.width > width * .8, 'Action stays at an edge');
      }
      await page.evaluate(() => window.woodsTest.drop(20));
      assert(await page.locator('#pickupBtn').isVisible());
      await page.locator('#pickupBtn').tap();
      assert(await page.locator('#pickupBtn').isHidden(), 'Pickup hides immediately after collecting');
      await page.evaluate(() => window.woodsTest.drop(150));
      assert(await page.locator('#pickupBtn').isHidden(), 'Out-of-range items do not show pickup');
      const cdp = await context.newCDPSession(page);
      const aim = await page.locator('#aimArea').boundingBox(), joy = await page.locator('#joyArea').boundingBox();
      const points = [{id:1,x:joy.x+joy.width*.75,y:joy.y+joy.height*.5},{id:2,x:aim.x+aim.width*.5,y:aim.y+aim.height*.2}];
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
      await page.waitForTimeout(250);
      const held = await page.evaluate(() => window.woodsTest.read());
      assert(held.attacking && held.moving);
      assert(Number(await page.locator('#aimArea').evaluate(el => getComputedStyle(el).opacity)) > .95);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[points[1]]});
      await page.waitForTimeout(300);
      const released = await page.evaluate(() => window.woodsTest.read());
      assert(!released.attacking && released.moving && released.manual, JSON.stringify({held,released}));
      assert(Math.abs(released.facing-held.facing)<.01, 'Release keeps last aim while left stick still moves');
      assert(Number(await page.locator('#aimArea').evaluate(el => getComputedStyle(el).opacity)) <= .13);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
      assert(!(await page.evaluate(() => window.woodsTest.read())).moving);
      if (process.env.MOBILE_SCREENSHOT && width === 390) await page.screenshot({path:process.env.MOBILE_SCREENSHOT});
      assert.deepEqual(errors, []);
      console.log(`PASS: ${width}x${height} compact HUD, edge actions, contextual pickup, simultaneous sticks, aim retention and idle fade.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });

