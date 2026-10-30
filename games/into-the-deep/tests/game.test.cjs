const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const noop=()=>{}, elements=new Map(),documentListeners=new Map(),cameraHud=[],cameraControls=[];const context2d=new Proxy({}, {get:(_,key)=>['createRadialGradient','createLinearGradient'].includes(key)?()=>({addColorStop:noop}):noop,set:()=>true});function el(){return {style:{},classList:{add:noop,remove:noop},append:noop,focus:noop,clientWidth:1280,clientHeight:600,getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight,right:this.clientWidth,bottom:this.clientHeight}},setPointerCapture:noop,getContext:()=>context2d,innerHTML:'',onclick:null}}const touchButtons=['a','d','j',' '].map(key=>({...el(),dataset:{key},setPointerCapture:noop}));const weaponButton=el();const document={body:el(),addEventListener:(type,fn,options)=>documentListeners.set(type,{fn,options}),getElementById:id=>{if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,querySelector:()=>el(),querySelectorAll:selector=>selector==='[data-key]'?touchButtons:selector==='[data-action]'?[weaponButton]:selector==='header, .dashboard, #hero0, .game-top'?cameraHud:selector==='#joyArea, .actions'?cameraControls:[]};class Dummy{constructor(){this.domElement=el();this.position={};this.scale={set:noop}}dispose(){this.disposed=true}updateProjectionMatrix(){}setPixelRatio(){}setSize(){}render(){}add(){}}const THREE=new Proxy({SRGBColorSpace:'srgb'}, {get:(a,k)=>a[k]||Dummy});const sandbox={document,documentListeners,weaponButton,cameraHud,cameraControls,THREE,devicePixelRatio:1,ResizeObserver:class{observe(){}},window:{addEventListener:noop},localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},requestAnimationFrame:noop,console,confirm:()=>true};vm.createContext(sandbox);let source=fs.readFileSync('dist/game.js','utf8').replace(/^import[^\n]+\n/,'');vm.runInContext(source+`\n
function check(x,m){if(!x)throw Error(m)}
for(level=1;level<=30;level++){makeLevel();let visited=new Set([0]),todo=[0];while(todo.length){let i=todo.pop(),a=cells[i];let near=[];if(a.right)near.push(i+1);if(a.down)near.push(i+cols);if(a.c>0&&cells[i-1].right)near.push(i-1);if(a.r>0&&cells[i-cols].down)near.push(i-cols);for(let j of near)if(!visited.has(j)){visited.add(j);todo.push(j)}}check(visited.size===cols*rows,'All rooms reachable');}
// Resizing must replace GPU storage instead of uploading larger pixels into it.
let previousTexture=texture,previousMode=mode,previousPlayer={...p};
for(const [width,height] of [[1600,900],[390,730],[844,290],[1920,1080],[320,740],[1280,600]]){
  $('viewport').clientWidth=width;$('viewport').clientHeight=height;
  const changed=canvas.width!==Math.round((width<height?760:600)*width/height)||canvas.height!==(width<height?760:600);
  resizeGame();
  if(changed){check(texture!==previousTexture&&previousTexture.disposed,'Resize releases old texture storage and creates a replacement')}
  check(screenMaterial.map===texture,'Material uses the replacement texture');
  check(canvas.width===W&&canvas.height===H&&darknessCanvas.width===W&&darknessCanvas.height===H,'Canvas and darkness dimensions stay aligned');
  check(mode===previousMode&&p.x===previousPlayer.x&&p.y===previousPlayer.y,'Resize preserves expedition state');
  previousTexture=texture;resizeGame();check(texture===previousTexture&&!texture.disposed,'Unchanged dimensions reuse the texture');
}
$('viewport').clientWidth=0;resizeGame();check(texture===previousTexture,'Hidden viewport preserves its texture');$('viewport').clientWidth=1280;
console.log('PASS: Repeated resize replaces and disposes textures, reuses unchanged sizes, and preserves expedition state.');
let originalW=W,originalH=H;$('viewport').clientWidth=390;$('viewport').clientHeight=730;resizeGame();check(H===760&&Math.abs(W/H-390/730)<.002,'Portrait canvas preserves aspect ratio');$('viewport').clientWidth=844;$('viewport').clientHeight=290;resizeGame();check(H===600&&Math.abs(W/H-844/290)<.002,'Landscape canvas preserves aspect ratio');$('viewport').clientWidth=1280;$('viewport').clientHeight=600;resizeGame();level=1;weaponTiers={spear:1,rock:1,dart:1,bomb:1};makeLevel();mode='play';enemies=[];keys.d=true;for(let i=0;i<30;i++)step(.025);keys.d=false;check(p.x>250,'Movement works');check(equipped==='rock'&&ammo.rock===8,'Pickup automatically equips ammunition');for(let i=0;i<8;i++){cool=0;attack()}check(ammo.rock===0&&equipped==='spear','Empty ammunition returns to spear');
let e={name:'snake',r:0,hp:2,max:2,x:p.x+50,y:p.y,points:25};enemies=[e];cool=0;attack();check(e.hp===1,'Melee hit');cool=0;attack();check(e.hp===0&&score===25,'Enemy scores only on defeat');
let a=cells.find(a=>a.down);p.x=a.c*CW+CW*.52;p.y=a.r*RH+180;enemies=[];keys.s=true;for(let i=0;i<100;i++)step(.025);keys.s=false;check(p.y>=(a.r+1)*RH+170,'Ladder descent reaches lower floor');keys.w=true;for(let i=0;i<100;i++)step(.025);keys.w=false;check(Math.abs(p.y-(a.r*RH+180))<12,'Ladder ascent returns to upper floor');
heroes[0].hp=10;heroes[1].hp=0;p.x=cols*CW-160;p.y=(rows-1)*RH+180;descend();check(mode==='celebrate','Exit celebrates');check(heroes.every(h=>h.hp===h.max),'Exit restores both heroes');let old=cols;$('start').onclick();check(level===2&&cols>old&&mode==='play','Next level is larger');const buttons=document.querySelectorAll('[data-key]');const pressEvent=i=>({pointerId:i,preventDefault(){}});buttons[1].onpointerdown(pressEvent(21));buttons[2].onpointerdown(pressEvent(22));buttons[3].onpointerdown(pressEvent(23));check(keys.d&&keys.j&&keys[' '],'Move, attack and jump can be held together');buttons[1].onpointercancel(pressEvent(21));check(!keys.d&&keys.j&&keys[' '],'Pointer cancellation releases only its action');buttons[2].onlostpointercapture(pressEvent(22));buttons[3].onpointerup(pressEvent(23));check(!keys.j&&!keys[' '],'Lost capture and pointerup release remaining actions');let testButton={classList:{remove:()=>{}}};keys.d=true;keys.j=true;touchPointers.set(1,{key:'d',button:testButton});touchPointers.set(2,{key:'j',button:testButton});releaseTouch({pointerId:1});check(!keys.d&&keys.j,'Multitouch release preserves other held action');clearControls();check(!keys.j&&touchPointers.size===0,'Cancelled controls clear held inputs');// One thumb slides through directions while other fingers keep combat held.
joyArea.clientWidth=joyArea.clientHeight=124;
const joyEvent=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,preventDefault(){}});
mode='play';enemies=[];loot=[];p={x:140,y:180,vx:0,vy:0,dir:1,on:true};
joyArea.onpointerdown(joyEvent(31,100,62));buttons[2].onpointerdown(pressEvent(32));buttons[3].onpointerdown(pressEvent(33));
step(.025);check(p.vx>0&&keys.j&&keys[' '],'Joystick combines with jump and attack');
joyArea.onpointermove(joyEvent(31,24,62));step(.025);check(p.vx<0&&p.dir===-1,'Slide reverses without lifting');
joyArea.onpointerdown(joyEvent(99,100,62));joyArea.onpointermove(joyEvent(99,100,62));check(joystick.id===31&&joystick.x<0,'Another finger cannot steal joystick');
joyArea.onpointermove(joyEvent(31,64,62));step(.025);check(p.vx===0,'Dead zone stops drift');
joyArea.onpointercancel(joyEvent(31,64,62));check(joystick.id===null&&joystick.x===0&&keys.j,'Cancellation preserves other finger');clearControls();
a=cells.find(a=>a.down);p={x:a.c*CW+CW*.52,y:a.r*RH+180,vx:0,vy:0,dir:1,on:true};
joyArea.onpointerdown(joyEvent(34,68,105));const ladderX=p.x,ladderY=p.y;step(.05);check(p.y>ladderY&&p.x===ladderX,'Vertical joystick climbs without drift');
joyArea.onpointermove(joyEvent(34,68,19));step(.05);check(p.y<=ladderY,'Slide up reverses descent');
joyArea.onlostpointercapture(joyEvent(34,68,19));check(joystick.id===null&&joystick.y===0,'Lost capture releases joystick');
joyArea.onpointerdown(joyEvent(35,105,62));buttons[2].onpointerdown(pressEvent(36));pause();check(mode==='paused'&&joystick.id===null&&!keys.j,'Pause clears all inputs');
joyArea.onpointerdown(joyEvent(37,105,62));check(joystick.id===null,'Paused game ignores joystick');
pause();joyArea.onpointerdown(joyEvent(38,105,62));showOverlay('test','test','test',()=>{});check(joystick.id===null,'Overlays release controls');$('overlay').classList.add('hidden');clearControls();
console.log('PASS: Joystick reversal, dead zone, ladders, multitouch, cancellation, lost capture and pause.');
// Native Safari gestures are cancelled during play without stealing menu input.
for(const type of ['touchstart','touchmove','touchend','gesturestart','gesturechange','gestureend','dblclick']){
  const listener=documentListeners.get(type);check(listener&&listener.options.passive===false,'Zoom guard can cancel native default');
  const nativeEvent=(surface=true,overlay=false,cancelable=true)=>({cancelable,prevented:false,target:{closest:selector=>selector==='.game-shell'?surface:overlay},preventDefault(){this.prevented=true}});
  mode='play';let event=nativeEvent();listener.fn(event);check(event.prevented,'Gameplay gestures cannot zoom');
  for(const state of ['intro','paused','celebrate','dead']){mode=state;event=nativeEvent();listener.fn(event);check(!event.prevented,'Menus keep native gestures')}
  mode='play';for(const event of [nativeEvent(false),nativeEvent(true,true),nativeEvent(true,false,false)]){listener.fn(event);check(!event.prevented,'Outside play, overlays and noncancelable events are untouched')}
  $('guide').open=true;event=nativeEvent();listener.fn(event);check(!event.prevented,'Field guide keeps native gestures');$('guide').open=false;
  $('installguide').open=true;event=nativeEvent();listener.fn(event);check(!event.prevented,'Install guide keeps native gestures');$('installguide').open=false;
}
mode='play';ammo={rock:8,dart:15,bomb:3};equipped='spear';weaponButton.onpointerdown({preventDefault(){}});check(equipped==='rock','Weapon responds to pointer without synthesized touch click');weaponButton.onclick({detail:1});check(equipped==='rock','Pointer click does not cycle twice');weaponButton.onclick({detail:0});check(equipped==='dart','Keyboard and assistive weapon activation still works');
console.log('PASS: Safari gesture cancellation, menu/dialog exclusions and single weapon activation.');
// Light moves with Donald and becomes fully opaque beyond the falloff.
follower={x:300,y:180};p.dir=1;let light=torchLight();check(visibilityAt(light.x,light.y)===1,'Torch center is fully visible');check(visibilityAt(light.x+light.radius*.6,light.y)>0&&visibilityAt(light.x+light.radius*.6,light.y)<1,'Torch halo fades');check(visibilityAt(light.x+light.radius+1,light.y)===0,'Beyond halo is fully hidden');let previous=light.x;follower.x+=100;check(torchLight().x===previous+100,'Halo follows Donald');p.dir=-1;check(torchLight().x===follower.x-28,'Torch follows facing direction');
// Older saves that were controlling Donald resume with Stickolas defending.
saved={level,score,common,rare,ammo,equipped,heroes:[{hp:0,max:100},{hp:60,max:120}],active:1,p:{...p},seen:[],enemies:[],loot:[]};start();check(heroes[0].hp===50&&heroes[1].hp===120,'Legacy Donald save migrates to fixed roles');
mode='play';heroes[0].hp=1;enemies=[{name:'rat',hp:3,max:3,x:p.x,y:p.y,r:Math.floor(p.y/RH),c:Math.floor(p.x/CW),timer:0,phase:0,speed:0,damage:9,points:60}];step(.025);check(mode==='dead'&&heroes[0].hp===0&&heroes[1].hp===120,'Stickolas defeat ends expedition without Donald taking over');
// Balance remains bounded at deep levels, with supplies on the exit route.
for(const depth of [1,2,3,5,9,15,30,100,1000]){level=depth;weaponTiers={spear:1,rock:1,dart:1,bomb:1};makeLevel();const route=routeToExit();check(cols<=14&&rows<=5,'Cave size is bounded');check(weaponTiers.spear===depthTier(),'Spear scales with depth');for(const e of enemies){const hits=Math.ceil(e.hp/weaponDamage('spear'));check(hits>=2&&hits<=7,'Enemy toughness stays within 2–7 spear hits');if(e.elite)check(hits>=5,'Veterans take at least five spear hits');if(!e.elite&&e.name!=='spider')check(hits<=4,'Ordinary enemies stay within four hits');if(depth>1)check(e.points>types.find(type=>type.name===e.name).points,'Rewards scale with depth')}const onRoute=it=>route.includes(it.r*cols+it.c);check(loot.some(it=>it.type==='sunspore'&&onRoute(it)),'Sunspore guaranteed on exit route');check(loot.filter(it=>it.type==='fungi'&&onRoute(it)).length>=2,'Healing guaranteed along route');check(loot.some(it=>it.type==='rock'&&it.r===0&&it.c===0),'Starting ammunition guaranteed');}
level=5;weaponTiers={spear:1,rock:1,dart:1,bomb:1};makeLevel();mode='play';enemies=[];heroes[0].hp=100;const weaponBefore=equipped,ammoBefore=JSON.stringify(ammo);loot=[{type:'sunspore',x:p.x,y:p.y}];step(.025);check(lightBoost===12&&equipped===weaponBefore&&JSON.stringify(ammo)===ammoBefore,'Sunspore pickup activates without replacing weapon or ammo');const far=()=>visibilityAt(torchLight().x+10000,torchLight().y);check(far()===1,'Sunspore unveils the entire screen');mode='paused';step(3);check(lightBoost===12,'Boost timer pauses with game');mode='play';lightBoost=1;check(Math.abs(far()-.5)<.001,'Last two seconds fade smoothly');step(1.1);check(lightBoost===0&&far()===0,'Normal darkness returns after expiry');activateSunspore();lightBoost=4;activateSunspore();check(lightBoost===12,'Further Sunspores refresh duration without unlimited stacking');
// Contact immunity prevents a mob cluster from dealing simultaneous damage.
lightBoost=0;hurtCooldown=0;heroes[0].hp=100;enemies=[0,1].map(()=>({name:'rat',hp:3,max:3,x:p.x,y:p.y,r:0,c:0,timer:0,phase:0,speed:0,damage:9,points:60}));step(.025);check(heroes[0].hp===91,'Only one contact hit during grace period');
// A fired bomb keeps its launch damage even when another weapon tier changes.
enemies=[{name:'rat',hp:13,max:13,x:500,y:180,r:0,c:1,timer:0,phase:0,speed:0,damage:9,points:60}];shots=[{type:'bomb',x:500,y:180,vx:0,vy:0,life:1,r:0,damage:12}];weaponTiers.bomb=10;step(.025);check(enemies[0].hp===1,'Bomb impact uses launch damage');
level=10;makeLevel({cols:15,rows:5});let oldMaze=JSON.stringify(cells.map(a=>[a.right,a.down]));saved={level,score,common,rare,ammo,equipped,heroes,p:{...p},seen:[],enemies:[],loot:[]};start();check(cols===15&&rows===5&&JSON.stringify(cells.map(a=>[a.right,a.down]))===oldMaze,'Legacy save retains its original maze instead of moving walls');weaponTiers.bomb=10;let written;localStorage.setItem=(key,value)=>written=JSON.parse(value);enemies=[];activateSunspore();save();const savedCols=cols,savedRows=rows;saved=written;start();check(cols===savedCols&&rows===savedRows&&lightBoost===12,'New save preserves cave dimensions and active boost');check(weaponTiers.bomb===10,'New save preserves weapon upgrades');
// Exercise the lowest row with Donald following, across phone orientations.
for(const [width,height] of [[390,844],[320,568],[844,390],[568,320]]){
  $('viewport').clientWidth=width;$('viewport').clientHeight=height;resizeGame();
  level=1;makeLevel();mode='play';enemies=[];loot=[];clearControls();
  p={x:1100,y:(rows-1)*RH+180,vx:0,vy:0,dir:1,on:true};follower={x:p.x-60,y:p.y};
  for(let i=0;i<180;i++)step(.025);
  check(Math.floor(p.y/RH)===rows-1&&Math.abs(follower.y-p.y)<1,'Both explorers remain on the bottom row');
  for(const explorer of [p,follower]){
    const foot=(explorer.y-camY)*height/H,head=(explorer.y-camY-125)*height/H,x=(explorer.x-camX)*width/W;
    check(head>0&&foot<height,'Bottom-row explorers stay inside viewport');
    const overlapsControls=x-30<144||x+30>width-164;
    check(!overlapsControls||foot<height-148,'Bottom-row explorers clear touch controls');
  }
  heroes[0].hp=73;updateUI();check($('hptext0').textContent==='73 / 100 HP'&&$('hp0').style.width==='73%','Single health display tracks Stickolas');
}
// Framing follows the usable screen area at every cave row, including transitions.
const cameraRect=(left,top,width,height)=>({getBoundingClientRect:()=>({left,top,width,height,right:left+width,bottom:top+height})});
for(const [width,height] of [[390,844],[320,568],[844,390],[568,320],[820,1180],[1180,820]]){
  const portrait=width<height,compact=width<=700&&!portrait;
  cameraHud.splice(0,cameraHud.length,cameraRect(0,0,width,portrait?172:compact?144:110));
  cameraControls.splice(0,cameraControls.length,cameraRect(16,height-140,124,124),cameraRect(width-164,height-156,148,140));
  $('viewport').clientWidth=width;$('viewport').clientHeight=height;resizeGame();level=1;makeLevel();
  for(const x of [70,1100,cols*CW-70]){
    p.x=x;p.y=180;followCamera(0,true);
    check(Math.abs(p.x-camX-W/2)<.01,'Camera centers at either outer cave edge');
    const assertClear=()=>{check(p.y-140-camY>=cameraFrame.top-.01,'Head stays below measured HUD');check(p.y+8-camY<=cameraFrame.bottom+.01,'Feet stay above overlapping controls')};
    assertClear();
    // Climb all the way down and back up, then jump, without waiting for settling.
    for(let y=180;y<=(rows-1)*RH+180;y+=5){p.y=y;followCamera(.016);assertClear()}
    for(let y=(rows-1)*RH+180;y>=100;y-=5){p.y=y;followCamera(.016);assertClear()}
    // A sudden position or viewport change must still obey the visible-area limits.
    p.y=(rows-1)*RH+180;followCamera(.016);assertClear();
  }
}
cameraHud.length=cameraControls.length=0;
console.log('PASS: HUD-aware camera centers at outer edges and keeps jumps, ladders and sudden transitions clear in six phone/tablet layouts.');
console.log('PASS: Bottom-row explorers, camera clearance and single-health updates in four phone layouts.');
console.log('PASS: 30 connected mazes, movement, pickup, ammo fallback, combat scoring, ladders both ways, healing, progression, portrait/landscape aspect ratio multitouch, torch falloff/tracking, fixed roles, old/new saves, deep-level balance, guaranteed supplies, Sunspore pickup/timing, contact immunity and bomb damage.');`,sandbox);

const html=fs.readFileSync('dist/index.html','utf8');assert(!html.includes('Switch explorer'));assert(!html.includes('<kbd>TAB</kbd>'));assert(!source.includes('switchHero'));assert(!source.includes('const tx=x+60'));console.log('PASS: Explorer switching and wall torches removed from code and controls.');
vm.runInContext(fs.readFileSync('tests/content-cases.js','utf8'),sandbox);
