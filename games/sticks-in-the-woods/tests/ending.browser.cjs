// Playwright on NODE_PATH; optional PLAYWRIGHT_CHANNEL and ENDING_SCREENSHOTS.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),origin='https://preview.example';
const hook=`let testNow=0;window.endingTest={
 prepare:(n,left=0)=>{state='playing';wave=n;toSpawn=left;spawnTimer=999;enemies=[];p.hp=p.maxHp;runSeconds=1234;kills=4321;score=98765;runXP=500;update(0);},
 read:()=>({state,wave,xp:runXP,best:progress.bestWave,kills,seconds:runSeconds,audio:audio?.state,muted}),
 advance:seconds=>{for(let i=0;i<Math.round(seconds*10);i++){testNow+=100;ending.frame(testNow);}},
 ready:()=>ending.ready,
 again:()=>beginEnding()
};`;
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  for(const mode of ['desktop','mobile','landscape','reduced-no-audio']){
   const mobile=mode==='mobile'||mode==='landscape',fallback=mode==='reduced-no-audio';
   const context=await browser.newContext({viewport:mode==='landscape'?{width:844,height:390}:mobile?{width:390,height:844}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,reducedMotion:fallback?'reduce':'no-preference',serviceWorkers:'block'});
   await context.addInitScript(fallback=>{window.requestAnimationFrame=()=>0;if(fallback){window.AudioContext=undefined;window.webkitAudioContext=undefined;}},fallback);
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());assert.equal(url.origin,origin);
    const file=path.join(root,url.pathname);let body=fs.readFileSync(file);
    if(file.endsWith('game.html'))body=body.toString().replace(/requestAnimationFrame\(frame\);\r?\n\}\)\(\);/,hook+'\nrequestAnimationFrame(frame);\n})();');
    return route.fulfill({body,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});
   });
   await page.goto(origin+'/games/sticks-in-the-woods/game.html');
   await page.getByRole('button',{name:'Reject',exact:true}).click();
   await page.locator('#startBtn').click();await page.locator('#beginRunBtn').click();
   await page.evaluate(()=>window.endingTest.prepare(99));
   assert.equal((await page.evaluate(()=>window.endingTest.read())).state,'upgrade');
   await page.evaluate(()=>window.endingTest.prepare(100,1));
   assert.equal((await page.evaluate(()=>window.endingTest.read())).state,'playing','Do not end when wave 100 merely starts');
   await page.evaluate(()=>window.endingTest.prepare(100));
   await page.evaluate(()=>window.endingTest.ready());
   assert.equal(await page.locator('.woods-ending img,.woods-ending image,.woods-ending canvas').count(),0,'Scene has no raster images');
   assert.equal(await page.locator('.woods-ending-stage svg').count(),1);
   assert.equal(await page.locator('[data-expression]').getAttribute('data-expression'),'steady');
   let state=await page.evaluate(()=>window.endingTest.read());
   assert.equal(state.state,'ending');assert.equal(state.xp,1025);assert.equal(state.best,100);
   await page.evaluate(()=>window.endingTest.again());
   assert.equal((await page.evaluate(()=>window.endingTest.read())).xp,1025,'Final reward is idempotent');
   assert(await page.locator('#hud').isHidden());assert(await page.locator('#mobile').isHidden());
   await page.evaluate(()=>window.endingTest.advance(.1));
   assert(await page.locator('.woods-ending-results').isHidden());
   const snap=async name=>{if(process.env.ENDING_SCREENSHOTS&&!fallback){fs.mkdirSync(process.env.ENDING_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.ENDING_SCREENSHOTS,`${mode}-${name}.png`)});}};
   await page.evaluate(()=>window.endingTest.advance(8));await snap('close');
   assert(await page.locator('[data-fallen="background"]').count()>=200,'Distant ground is covered in fallen creatures');
   assert(await page.locator('[data-fallen]').count()>350,'Denser whole-scene tableau');
   const stillTorso=await page.locator('[data-torso]').getAttribute('transform');
   const stillMouth=await page.locator('[data-mouth]').getAttribute('ry');
   await page.evaluate(()=>window.endingTest.advance(.4));
   assert.equal(await page.locator('[data-torso]').getAttribute('transform'),stillTorso,'No breathing torso loop');
   assert.equal(await page.locator('[data-mouth]').getAttribute('ry'),stillMouth,'No breathing mouth loop');
   const closeView=await page.locator('.woods-ending-stage svg').getAttribute('viewBox');
   const brow=await page.locator('[data-expression]>path').first().getAttribute('d');
   assert(brow.includes('M-31-78L-11-78M11-78L31-78'),'Level brows, no sad raised inner corners');
   assert.equal(await page.locator('.woods-ending-sound').count(),0,'Silent draft has no audio controls');
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.endingTest.advance(60);});
   assert(await page.locator('.woods-ending-results').isHidden(),'Backgrounding pauses cinematic time');
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await page.evaluate(()=>window.endingTest.advance(22.6));await snap('wide');
   const wideView=await page.locator('.woods-ending-stage svg').getAttribute('viewBox');
   if(!fallback)assert.notEqual(closeView,wideView,'Camera pulls through the same vector scene');
   const standingLeg=await page.locator('[data-leg="left"]').getAttribute('d');
   await page.evaluate(()=>window.endingTest.advance(2.2));await snap('crouch');
   await page.evaluate(()=>window.endingTest.advance(1.5));await snap('braced');
   assert((await page.locator('[data-arm="right"]').getAttribute('d')).endsWith('L76 25'),'Hands brace on the ground');
   await page.evaluate(()=>window.endingTest.advance(1.3));await snap('sit');
   assert((await page.locator('[data-arm="right"]').getAttribute('d')).endsWith('L57 -3'),'Hands finish resting at knees');
   assert.notEqual(await page.locator('[data-leg="left"]').getAttribute('d'),standingLeg,'Legs bend into seated pose');
   assert.equal(await page.locator('[data-expression]').getAttribute('data-expression'),'steady');
   await page.evaluate(()=>window.endingTest.advance(2));await snap('black');
   assert(await page.locator('.woods-ending-results').isHidden());
   await page.evaluate(()=>window.endingTest.advance(5));await snap('stats');
   assert(await page.getByText('Made by 2badIdeas',{exact:true}).isVisible());
   const stats=await page.locator('.woods-ending-results dd').allTextContents();
   assert.deepEqual(stats,['100','4,321','98,765','20m 34s','1,025']);
   await page.evaluate(()=>window.endingTest.advance(2));
   await page.locator('.woods-ending-return').click();
   assert.equal((await page.evaluate(()=>window.endingTest.read())).state,'menu');
   assert.equal(await page.locator('.woods-ending').count(),0);
   await page.locator('#startBtn').click();await page.locator('#beginRunBtn').click();
   state=await page.evaluate(()=>window.endingTest.read());assert.equal(state.wave,1);assert.equal(state.seconds,0);
   await page.evaluate(()=>window.endingTest.prepare(100));
   await page.locator('.woods-ending-skip').click();await page.evaluate(()=>window.endingTest.advance(6));
   assert(await page.locator('.woods-ending-return').isVisible());
   assert.deepEqual(errors,[]);
   console.log(`PASS: ${mode} wave-100 clear guard, final reward, HTML/SVG camera and seated pose, exact stats, credits, return/new run and skip; no external requests or JS errors.`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
