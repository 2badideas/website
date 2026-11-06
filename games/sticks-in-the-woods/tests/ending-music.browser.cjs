// Exercise the actual local score in real time; Playwright on NODE_PATH.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<button id="play">Play</button>');
  await page.evaluate(()=>{
   const Native=window.AudioContext;
   window.AudioContext=class extends Native{
    constructor(){super();this.probe=this.createAnalyser();this.probe.fftSize=2048;this.probe.connect(this.destination);window.musicProbe={context:this,started:0};}
    createGain(){const gain=super.createGain(),connect=gain.connect.bind(gain);gain.connect=destination=>connect(destination===this.destination?this.probe:destination);return gain;}
    createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{window.musicProbe.started++;return start(...args);};return source;}
   };
  });
  await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../ending-music.js'),'utf8')});
  await page.evaluate(()=>{
   let muted=false,elapsed=0,previous=null;
   document.getElementById('play').onclick=()=>{
    const music=window.WoodsEndingMusic.create({isMuted:()=>muted});
    function frame(now){if(previous!==null&&!document.hidden)elapsed+=(now-previous)/1000;previous=now;music.frame(elapsed);requestAnimationFrame(frame);}requestAnimationFrame(frame);
    window.musicTest={
     level:()=>{const samples=new Float32Array(2048);window.musicProbe.context.probe.getFloatTimeDomainData(samples);return Math.max(...samples.map(Math.abs));},
     mute:()=>{muted=true;music.refresh();},unmute:()=>{muted=false;music.refresh();},
     hide:()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});music.pause();},
     show:()=>{delete document.hidden;previous=null;},stop:()=>music.stop(),dispose:()=>music.dispose()
    };
   };
  });
  await page.locator('#play').click();await page.waitForTimeout(2900);
  const initial=await page.evaluate(()=>({peak:window.musicTest.level(),notes:window.musicProbe.started,state:window.musicProbe.context.state}));
  assert.equal(initial.state,'running');assert(initial.notes>=4);assert(initial.peak>.0001&&initial.peak<.15,'Music is audible and quiet, without clipping');
  await page.evaluate(()=>window.musicTest.mute());await page.waitForTimeout(300);assert((await page.evaluate(()=>window.musicTest.level()))<.00001);
  await page.evaluate(()=>window.musicTest.unmute());await page.waitForTimeout(1500);assert((await page.evaluate(()=>window.musicProbe.started))>initial.notes);
  await page.evaluate(()=>window.musicTest.hide());await page.waitForTimeout(300);assert((await page.evaluate(()=>window.musicTest.level()))<.00001);
  await page.evaluate(()=>window.musicTest.show());await page.waitForTimeout(1300);
  await page.evaluate(()=>window.musicTest.stop());await page.waitForTimeout(300);assert((await page.evaluate(()=>window.musicTest.level()))<.00001);
  await page.evaluate(()=>window.musicTest.dispose());await page.waitForFunction(()=>window.musicProbe.context.state==='closed');
  assert.deepEqual(errors,[]);console.log('PASS: Real-time soft music produces bounded audio, mutes, resumes, silences while hidden/on stop and closes its owned context. Peak='+initial.peak.toFixed(4));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
