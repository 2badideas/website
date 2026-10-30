import * as THREE from './assets/three.module.js';
const $=s=>document.getElementById(s),CW=440,RH=250;let W=1280,H=600,cameraFrame={top:0,bottom:600},cameraNeedsSnap=true;const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;let ctx=canvas.getContext('2d');const darknessCanvas=document.createElement('canvas'),darkness=darknessCanvas.getContext('2d');
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true})}catch{renderer={domElement:canvas,setPixelRatio(){},setSize(){},render(){}};}renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize($('viewport').clientWidth,$('viewport').clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;$('viewport').append(renderer.domElement);const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,.1,10);camera.position.z=2;let texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const screenMaterial=new THREE.MeshBasicMaterial({map:texture}),screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(W,H),screenMaterial);scene.add(screenMesh);
function resizeGame(){
  const vw=$('viewport').clientWidth,vh=$('viewport').clientHeight;
  if(!vw||!vh)return;
  const nextH=vw<vh?760:600,nextW=Math.round(nextH*vw/vh);
  if(canvas.width!==nextW||canvas.height!==nextH){
    // WebGL texture storage cannot change size after its first upload.
    // Recreate it when the source canvas dimensions change.
    texture.dispose();
    W=nextW;H=nextH;
    canvas.width=W;canvas.height=H;
    texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    screenMaterial.map=texture;
  }
  if(darknessCanvas.width!==W||darknessCanvas.height!==H){
    darknessCanvas.width=W;darknessCanvas.height=H;
  }
  camera.left=-W/2;camera.right=W/2;camera.top=H/2;camera.bottom=-H/2;
  camera.updateProjectionMatrix();
  screenMesh.scale.set(W/1280,H/600,1);
  renderer.setSize(vw,vh);
  texture.needsUpdate=true;
  refreshCameraFrame();
}
// Measure the HUD and controls in CSS pixels, then convert to game coordinates.
// Side controls need not consume vertical space when the explorers fit between them.
function refreshCameraFrame(){
  const viewport=$('viewport').getBoundingClientRect();
  if(!viewport.width||!viewport.height)return;
  const scale=viewport.width/W,center=viewport.left+viewport.width/2;
  const laneLeft=center-110*scale,laneRight=center+110*scale;
  let top=viewport.top+12,bottom=viewport.bottom-12;
  const overlaps=r=>r.width&&r.height&&r.left<laneRight&&r.right>laneLeft;
  for(const e of document.querySelectorAll('header, .dashboard, #hero0, .game-top')){
    const r=e.getBoundingClientRect();if(overlaps(r))top=Math.max(top,r.bottom+12);
  }
  for(const e of document.querySelectorAll('#joyArea, .actions')){
    const r=e.getBoundingClientRect();if(overlaps(r))bottom=Math.min(bottom,r.top-12);
  }
  cameraNeedsSnap=true;
  cameraFrame={top:(top-viewport.top)*H/viewport.height,bottom:(bottom-viewport.top)*H/viewport.height};
  // Very small windows still need enough room for the full character.
  if(cameraFrame.bottom-cameraFrame.top<160){const middle=(cameraFrame.top+cameraFrame.bottom)/2;cameraFrame.top=middle-80;cameraFrame.bottom=middle+80}
}
function followCamera(dt=0,snap=false){
  const targetX=p.x-W/2,targetY=p.y-65-(cameraFrame.top+cameraFrame.bottom)/2;
  const blend=snap||cameraNeedsSnap?1:1-Math.exp(-dt*7);cameraNeedsSnap=false;
  camX+=(targetX-camX)*blend;camY+=(targetY-camY)*blend;
  // Smooth following cannot let a jump or ladder movement cross the clear area's edge.
  camY=Math.max(p.y+8-cameraFrame.bottom,Math.min(p.y-140-cameraFrame.top,camY));
}
new ResizeObserver(resizeGame).observe($('viewport'));resizeGame();
let seed=92317;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}const rnd=(a,b)=>a+rand()*(b-a);let level=1,score=0,common=0,rare=0,cols,rows,cells=[],enemies=[],loot=[],shots=[],particles=[],seen=[],mode='intro',last=0,t=0,cool=0,toastTime=0,camX=0,camY=0,sound=false,audio,saveClock=0;let ammo={rock:0,dart:0,bomb:0,seed:0,trap:0},equipped='spear',weaponTiers={spear:1,rock:1,dart:1,bomb:1,seed:1,trap:1},lightBoost=0,hurtCooldown=0;let shieldHits=0,slowTime=0,traps=[],treasureRooms=[];const keys={};let heroes=[{hp:100,max:100},{hp:120,max:120}];let p={x:140,y:180,vx:0,vy:0,dir:1,on:true};let follower={x:90,y:180};const names={spear:'Wooden spear',rock:'Throwing rocks',dart:'Pea Pod Blaster',bomb:'Sap bombs',seed:'Ricochet seeds',trap:'Sticky sap traps'};const types=[{name:'snake',hp:2,points:25,damage:10,speed:60},{name:'bat',hp:2,points:40,damage:9,speed:75},{name:'rat',hp:3,points:60,damage:14,speed:80},{name:'spider',hp:5,points:100,damage:18,speed:48},{name:'beetle',hp:4,points:90,damage:20,speed:38},{name:'grub',hp:3,points:70,damage:15,speed:40},{name:'slime',hp:4,points:110,damage:12,speed:45}];
function note(msg){$('toast').textContent=msg;$('toast').classList.add('show');toastTime=3}function beep(f=400,d=.08){if(!sound)return;audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
// Depth pacing: equipment keeps ordinary enemies within a small number of hits.
const BALANCE_VERSION=3,SUNSPORE_SECONDS=12;
function depthTier(depth=level){return 1+Math.floor((depth-1)/4)}
function caveSize(depth=level){return{cols:Math.min(14,6+Math.floor(4*Math.log2(1+(depth-1)/4))),rows:3+Math.min(2,Math.floor((depth-1)/6))}}
function weaponDamage(weapon=equipped){return({spear:1,rock:2,dart:2,bomb:6,seed:2,trap:0}[weapon]??1)*(weaponTiers[weapon]||1)}
function treasurePoints(isRare=false){return Math.round((isRare?150:15)*(1+Math.min(4,(level-1)*.08)))}
function enemyStats(type,elite=false,variant=0){const tier=depthTier(),hits=Math.min(elite?7:type.name==='spider'?6:4,Math.max(elite?5:2,type.hp+variant+(elite?2:0)));return{...type,hp:hits*tier,max:hits*tier,elite,damage:Math.round(type.damage*(1+Math.min(.65,(level-1)*.035))*(elite?1.2:1)),speed:type.speed*(1+Math.min(.3,(level-1)*.025)),points:Math.round(type.points*(1+(level-1)*.12)*(hits/type.hp)*(elite?1.25:1))}}
function routeToExit(){const parents=new Map([[0,-1]]),queue=[0];for(let n=0;n<queue.length;n++){const i=queue[n],a=cells[i],near=[];if(a.right)near.push(i+1);if(a.down)near.push(i+cols);if(a.c>0&&cells[i-1].right)near.push(i-1);if(a.r>0&&cells[i-cols].down)near.push(i-cols);for(const j of near)if(!parents.has(j)){parents.set(j,i);queue.push(j)}}const route=[];for(let i=cells.length-1;i!==-1;i=parents.get(i))route.push(i);return route.reverse()}
function updateLightUI(){const seconds=Math.ceil(lightBoost);$('objective').textContent=seconds?'☀ FULL LIGHT · '+seconds+'s':'FIND THE WAY DOWN ↘'}
function activateSunspore(){lightBoost=SUNSPORE_SECONDS;updateLightUI();note('Sunspore! Donald lights up the whole screen · 12 seconds');beep(880,.25)}
function boostStrength(){return Math.min(1,lightBoost/2)}
function cell(c,r){return cells[r*cols+c]}function makeLevel(shape=caveSize()){seed=(level*71639+92317)>>>0;cols=shape.cols;rows=shape.rows;weaponTiers.spear=Math.max(weaponTiers.spear,depthTier());hurtCooldown=0;cells=Array.from({length:cols*rows},(_,i)=>({c:i%cols,r:Math.floor(i/cols),right:false,down:false,visited:false}));const stack=[cell(0,0)];stack[0].visited=true;while(stack.length){const a=stack.at(-1),opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dc,dr])=>{let c=a.c+dc,r=a.r+dr;return c>=0&&c<cols&&r>=0&&r<rows&&!cell(c,r).visited});if(!opts.length){stack.pop();continue}const [dc,dr]=opts[Math.floor(rand()*opts.length)],b=cell(a.c+dc,a.r+dr);if(dc===1)a.right=true;if(dc===-1)b.right=true;if(dr===1)a.down=true;if(dr===-1)b.down=true;b.visited=true;stack.push(b)}
enemies=[];loot=[];shots=[];particles=[];seen=[];traps=[];treasureRooms=[];slowTime=0;
function place(type,index,offset=rnd(100,340)){const a=cells[index];loot.push({x:a.c*CW+offset,y:a.r*RH+180,type,r:a.r,c:a.c,tier:depthTier()})}
function spawn(type,a,elite=false){const stats=enemyStats(type,elite,level>=3&&rand()<.35?1:0);const e=newEnemy(type,a,elite,stats);enemies.push(e);return e}
for(const a of cells){const i=a.r*cols+a.c;if(i===0)continue;if(rand()<Math.min(.7,.56+level*.015)){const roll=rand(),spiderChance=Math.min(.28,.08+(level-1)*.02),ratChance=Math.min(.3,.2+(level-1)*.01);let type=roll<spiderChance?types[3]:roll<spiderChance+ratChance?types[2]:roll<spiderChance+ratChance+.25?types[1]:types[0];if(rand()<(level===1?.12:.2))type=types[4];if(level>=3&&rand()<.13)type=types[5];if(level>=4&&rand()<.16)type=types[6];spawn(type,a,level>=5&&rand()<Math.min(.22,.1+(level-5)*.015));if(level>=4&&rand()<.18)spawn(types[1],a)}if(rand()<.55)place(rand()<.2?'rare':'common',i);if(rand()<.23){const roll=rand();let gear=roll<.45?'rock':roll<.9?'dart':'bomb';if(level>=2&&roll>=.55&&roll<.75)gear='seed';if(level>=3&&roll>=.75&&roll<.85)gear='trap';place(gear,i)}if(rand()<.015)place('shield',i);if(rand()<.035)place('fungi',i);if(rand()<.045)place('sunspore',i)}
// Supplies along the actual route make each floor viable even with unlucky random drops.
const route=routeToExit();place('rock',0,285);for(let j=5;j<route.length-1;j+=5)place(j%9===0?'bomb':j%2===0?'dart':'rock',route[j],180);for(const fraction of [.55])place('fungi',route[Math.max(1,Math.floor((route.length-1)*fraction))],300);const sporeRoom=route[Math.max(1,Math.floor((route.length-1)*.3))];if(!loot.some(it=>it.type==='sunspore'&&it.r*cols+it.c===sporeRoom))place('sunspore',sporeRoom,110);
populateDiscoveries(route,place,spawn);
p={x:130,y:180,vx:0,vy:0,dir:1,on:true};follower={x:75,y:180};camX=0;camY=0;updateUI()}
// New discoveries use the existing Attack/Weapon controls on keyboard and touch.
function newEnemy(type,a,elite=false,stats=enemyStats(type,elite)){
  return{...stats,x:a.c*CW+rnd(140,320),y:a.r*RH+180-(type.name==='grub'?170:0),r:a.r,c:a.c,timer:0,phase:rnd(0,6),dir:1,state:type.name==='grub'?'hang':'walk',aiTime:0,slow:0};
}
function populateDiscoveries(route,place,spawn){
  const room=fraction=>cells[route[Math.min(route.length-2,Math.max(1,Math.floor((route.length-1)*fraction)))]];
  if(level%4===1)place('shield',route[1],300);
  spawn(types[4],room(.25));
  if(level>=2)place('seed',route[Math.min(2,route.length-2)],135);
  if(level>=3){
    place('trap',route[Math.min(3,route.length-2)],135);spawn(types[5],room(.5));
    for(const a of cells){if(a.c===0&&a.r===0)continue;if(rand()<.13)traps.push({x:a.c*CW+340,y:a.r*RH+180,r:a.r,c:a.c,owner:'cave',life:null,radius:46})}
    // A visible wild patch is guaranteed; it is away from ladders and cannot block travel.
    const a=room(.4);if(!traps.some(s=>s.c===a.c&&s.r===a.r))traps.push({x:a.c*CW+340,y:a.r*RH+180,r:a.r,c:a.c,owner:'cave',life:null,radius:46});
    const degree=a=>(a.right?1:0)+(a.down?1:0)+(a.c>0&&cell(a.c-1,a.r).right?1:0)+(a.r>0&&cell(a.c,a.r-1).down?1:0);
    const candidates=cells.filter(a=>a.c+a.r>0&&a.r*cols+a.c!==cells.length-1).sort((a,b)=>((route.includes(a.r*cols+a.c)?10:0)+degree(a))-((route.includes(b.r*cols+b.c)?10:0)+degree(b)));
    for(const a of candidates.slice(0,level>=7?2:1)){
      const id='cache-'+level+'-'+(a.r*cols+a.c);treasureRooms.push({id,c:a.c,r:a.r,opened:false});
      // Keep the encounter readable: these two guardians replace random occupants.
      enemies=enemies.filter(e=>e.c!==a.c||e.r!==a.r);traps=traps.filter(s=>s.c!==a.c||s.r!==a.r);
      for(const [type,offset] of [[types[4],140],[level>=4?types[6]:types[2],300]]){const e=spawn(type,a);e.x=a.c*CW+offset;e.guardId=id}
      loot=loot.filter(it=>it.c!==a.c||it.r!==a.r||!['common','rare'].includes(it.type));
      loot.push({type:'vault',x:a.c*CW+220,y:a.r*RH+180,c:a.c,r:a.r,guardId:id});
    }
  }
  const quietRoom=fraction=>{const preferred=room(fraction);return treasureRooms.some(a=>a.c===preferred.c&&a.r===preferred.r)?cells.find(a=>a.c+a.r>0&&!treasureRooms.some(v=>v.c===a.c&&v.r===a.r)):preferred};
  if(level>=3&&!enemies.some(e=>e.name==='grub'))spawn(types[5],quietRoom(.5));
  if(level>=3&&!traps.length){const a=quietRoom(.4);traps.push({x:a.c*CW+340,y:a.r*RH+180,r:a.r,c:a.c,owner:'cave',life:null,radius:46})}
  if(level>=4)spawn(types[6],quietRoom(.7));
}
function guardCount(id){return enemies.filter(e=>e.hp>0&&e.guardId===id).length}
function openVault(it){
  const room=treasureRooms.find(a=>a.id===it.guardId);if(room)room.opened=true;
  rare+=3;score+=treasurePoints(true)*3;heroes[0].hp=Math.min(heroes[0].max,heroes[0].hp+10);
  ammo.seed=(ammo.seed||0)+12;weaponTiers.seed=Math.max(weaponTiers.seed||1,depthTier());
  note('Cache opened · 3 rare treasures, +10 health, +12 seeds');beep(940,.3);
}
function splitSlime(e){
  e.split=true;
  for(const direction of [-1,1]){
    const small={...e,x:Math.max(e.c*CW+48,Math.min((e.c+1)*CW-48,e.x+direction*24)),y:e.r*RH+180,hp:Math.max(1,Math.ceil(e.max*.35)),max:Math.max(1,Math.ceil(e.max*.35)),damage:Math.max(1,Math.round(e.damage*.5)),points:Math.round(e.points*.25),speed:e.speed*1.35,small:true,elite:false,dir:direction,timer:.35,state:'walk',aiTime:0,phase:rnd(0,6)};
    enemies.push(small);
  }
  burst(e.x,e.y-20,'#a8df83',16);note('Slime split! Clear the two little ones.');
}
function hurtPlayer(damage){
  if(hurtCooldown>0)return;
  hurtCooldown=.65;
  if(shieldHits>0){shieldHits--;burst(p.x,p.y-45,'#e1c184');note(shieldHits?'Bark shield · '+shieldHits+' hits left':'Bark shield broken');beep(430)}
  else{heroes[0].hp=Math.max(0,heroes[0].hp-damage);burst(p.x,p.y-45,'#c77d60');beep(90,.15)}
  updateUI();
  if(heroes[0].hp<=0){mode='dead';clearControls();try{localStorage.removeItem('stick-below-v1')}catch{}showOverlay('Even strong roots rest.',`Stickolas has fallen. Donald keeps the torch burning as ROOT calls you home. You reached level ${level} and earned ${score} points.`,'Try again',()=>{$('restart').click()})}
}
function updateTraps(dt){
  slowTime=Math.max(0,slowTime-dt);
  for(const trap of traps){
    if(trap.life!==null)trap.life-=dt;
    if(trap.life!==null&&trap.life<=0)continue;
    if(trap.owner==='cave'&&Math.abs(p.x-trap.x)<trap.radius&&Math.abs(p.y-trap.y)<18&&p.on&&!keys[' ']&&!keys.k){
      if(!slowTime)note('Stinging sap! Jump over amber spikes.');slowTime=.5;
      if(hurtCooldown<=0)hurtPlayer(10+Math.min(10,Math.floor((level-1)*.7)));
      if(mode!=='play')return;
    }
    for(const e of enemies)if(e.hp>0&&Math.abs(e.x-trap.x)<trap.radius&&Math.abs(e.y-trap.y)<35)e.slow=1.2;
  }
  traps=traps.filter(a=>a.life===null||a.life>0);
}
function updateEnemy(e,dt){
  e.dir||=1;e.phase??=0;
  e.timer=(e.timer||0)-dt;e.blockTime=Math.max(0,(e.blockTime||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);
  const slow=e.slow>0?.3:1,floor=e.r*RH+180,same=Math.abs(e.y-p.y)<85;
  const chase=same&&Math.abs(e.x-p.x)<330;
  const min=e.c*CW+45,max=(e.c+1)*CW-45;
  e.aiTime=Math.max(0,(e.aiTime||0)-dt);e.state??=e.name==='grub'?'hang':'walk';
  if(e.name==='grub'){
    if(e.state==='hang'){e.y=floor-170;if(Math.abs(p.y-floor)<85&&Math.abs(p.x-e.x)<85){e.state='warn';e.aiTime=.55;beep(600)}}
    else if(e.state==='warn'){if(e.aiTime===0){e.state='fall';e.vy=0}}
    else if(e.state==='fall'){e.vy+=900*dt;e.y=Math.min(floor,e.y+e.vy*dt);if(e.y===floor){e.state='crawl';e.aiTime=.6}}
    else if(!e.aiTime){e.dir=Math.sign(p.x-e.x)||e.dir;e.x+=e.dir*e.speed*dt*slow}
  }else if(e.name==='beetle'){
    if(e.state==='walk'){
      if(chase){e.state='windup';e.aiTime=.55;e.dir=Math.sign(p.x-e.x)||e.dir}
      else{e.dir=Math.sin(t*.7+e.phase)>0?1:-1;e.x+=e.dir*e.speed*dt*slow}
    }else if(e.state==='windup'&&e.aiTime===0){e.state='charge';e.aiTime=.65}
    else if(e.state==='charge'){e.x+=e.dir*330*dt*slow;if(e.aiTime===0||e.x<=min||e.x>=max){e.state='recover';e.aiTime=1.25}}
    else if(e.state==='recover'&&e.aiTime===0)e.state='walk';
    e.y=floor;
  }else{
    e.dir=chase?(Math.sign(p.x-e.x)||e.dir):Math.sin(t*.7+e.phase)>0?1:-1;
    e.x+=e.dir*e.speed*dt*(chase?1.4:1)*slow;
    e.y=floor-(e.name==='bat'?60+Math.sin(t*3+e.phase)*22:e.name==='slime'?Math.max(0,Math.sin(t*5+e.phase))*(e.small?9:18):0);
  }
  e.x=Math.max(min,Math.min(max,e.x));
}
function updateShot(s,dt){
  s.life-=dt;const oldX=s.x;s.x+=s.vx*dt;s.y+=s.vy*dt;
  if(s.type!=='dart')s.vy+=(s.type==='seed'?250:420)*dt;
  for(const e of [...enemies])if(e.hp>0&&Math.abs(s.x-e.x)<(e.small?22:30)&&Math.abs(s.y-(e.y-25))<40){
    if(s.type!=='bomb')hit(e,s.damage||weaponDamage(s.type),oldX,s.type);
    if(s.type==='bomb')explodeBomb(s);s.life=0;return;
  }
  const oldC=Math.floor(oldX/CW),c=Math.floor(s.x/CW),wall=c<0||c>=cols||(c!==oldC&&!cell(Math.min(c,oldC),s.r)?.right);
  const floor=s.r*RH+177,ceiling=s.r*RH-45,ground=s.y>=floor,roof=s.y<ceiling;
  if(wall||ground||roof){
    if(s.type==='seed'&&s.bounces>0){
      s.bounces--;if(wall){s.x=oldX;s.vx=-s.vx}if(ground){s.y=floor-1;s.vy=-Math.max(130,Math.abs(s.vy)*.8)}if(roof){s.y=ceiling+1;s.vy=Math.abs(s.vy)}
      burst(s.x,s.y,'#d4e899',4);beep(560,.03);
    }else{if(s.type==='bomb')explodeBomb(s);s.life=0}
  }
}
function explodeBomb(s){burst(s.x,s.y,'#d5b45b',32);for(const e of [...enemies])if(e.hp>0&&Math.hypot(e.x-s.x,e.y-25-s.y)<155)hit(e,s.damage||weaponDamage('bomb'),s.x,'bomb')}
function drawBarkShield(x,y,scale=1,hits=0){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);path([[-13,-20],[12,-20],[16,5],[0,23],[-15,5]],'#9b793e','#e0c28a',2);
  for(const xx of [-7,0,7])line(xx,-16,xx,9,'#5e5430',2);
  if(hits)for(let i=0;i<hits;i++)circle(-7+i*7,0,2.3,'#cbedaa');ctx.restore();
}
function drawSeeds(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);for(const [dx,dy] of [[-6,3],[5,3],[0,-7]]){circle(dx,dy,6,'#d0c466');circle(dx-2,dy-2,2,'#edf0ae')}line(0,-12,4,-18,'#96bd73',2);ctx.restore()}
function drawSapJar(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);path([[-7,-13],[7,-13],[10,12],[-10,12]],'#79bfa3','#c8e4b4',2);line(-6,-16,6,-16,'#aa8a55',5);circle(0,3,5,'#d9b65c');ctx.restore()}
function drawTraps(){for(const a of traps){if(a.x<camX-90||a.x>camX+W+90)continue;ctx.save();ctx.globalAlpha=a.life!==null?Math.min(1,a.life):1;ctx.fillStyle=a.owner==='player'?'#66c3ad99':'#c69c4eaa';ctx.beginPath();ctx.ellipse(a.x,a.y+2,a.radius,7,0,0,7);ctx.fill();for(let j=0;j<5;j++){const x=a.x-a.radius*.7+j*a.radius*.35;circle(x,a.y-2-(j%2)*3,3,a.owner==='player'?'#b5e9c9':'#edcd77');if(a.owner==='cave')path([[x-5,a.y],[x,a.y-15],[x+5,a.y]],'#edcd77')}if(a.owner==='cave'){ctx.fillStyle='#e4c97c';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('SAP SPIKES · JUMP',a.x,a.y-23)}ctx.restore()}}
function drawTreasureRooms(){for(const a of treasureRooms){const x=a.c*CW+220,y=a.r*RH+180;if(x<camX-250||x>camX+W+250)continue;glow(x,y-45,180,'#d2ac5622');for(const dx of [-165,165]){line(x+dx,y,x+dx,y-165,'#8e895b',5);line(x+dx-10,y-165,x+dx+10,y-165,'#c4ae6e',4)}ctx.fillStyle='#d7c28c';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(a.opened?'CACHE CLAIMED':'GUARDED TREASURE',x,y-190)}}
function drawDiscovery(it){
  const x=it.x,y=it.y;
  if(it.type==='shield')drawBarkShield(x,y-25,1.1);
  else if(it.type==='seed')drawSeeds(x,y-17,1.1);
  else if(it.type==='trap')drawSapJar(x,y-18,1.1);
  else if(it.type==='vault'){
    const count=guardCount(it.guardId);glow(x,y-20,55,count?'#d9ac6a22':'#e8cf8155');
    path([[x-24,y-5],[x-24,y-35],[x+24,y-35],[x+24,y-5]],'#8b6c36','#d3bb7b',3);
    for(const dx of [-17,17])line(x+dx,y-32,x+dx,y-7,'#c2aa6e',4);
    circle(x,y-22,7,count?'#6b7862':'#dbdf91');ctx.fillStyle='#e2d5a6';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(count?count+' GUARD'+(count===1?'':'S')+' LEFT':'OPEN CACHE',x,y-53);return true;
  }else return false;
  glow(x,y-22,40,'#bbd99b22');ctx.fillStyle='#cad9b0';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(it.type==='shield'?'BARK SHIELD':it.type==='seed'?'RICOCHET SEEDS':'STICKY TRAPS',x,y-54);return true;
}
function drawNewEnemy(e){
  if(e.name==='beetle'){
    for(const dy of [-20,-8]){line(-15,dy,-31,dy+12,'#b6a569',3);line(13,dy,28,dy+12,'#b6a569',3)}
    ctx.fillStyle=e.state==='windup'?'#d5ab67':e.state==='recover'?'#a5bd85':'#8b814c';ctx.beginPath();ctx.ellipse(0,-20,24,17,0,0,7);ctx.fill();line(0,-35,0,-8,'#3e4b2c',3);circle(24,-20,9,'#687d4f');circle(28,-23,2,'#edda8c');line(29,-18,40,-24,'#d1bf80',3);
    ctx.fillStyle=e.state==='recover'?'#cce4ab':'#f1ca88';ctx.font='8px monospace';ctx.textAlign='center';if(e.state==='windup')ctx.fillText('READY...',0,-49);if(e.state==='charge')ctx.fillText('JUMP!',0,-49);if(e.state==='recover')ctx.fillText('DAZED',0,-49);
  }
  if(e.name==='grub'){
    if(e.state==='hang'||e.state==='warn')line(0,-5,0,-55,'#bac39a88',1);
    const wiggle=e.state==='warn'?Math.sin(t*45)*4:0;for(let i=0;i<4;i++)circle(-15+i*9,-14+Math.sin(t*3+i)*2+wiggle,9,i===3?'#b6be8c':'#859a73');circle(16,-17,2,'#222e23');
    if(e.state==='warn'){ctx.fillStyle='#f1cc8c';ctx.font='bold 16px monospace';ctx.fillText('!',-5,-40)}
  }
  if(e.name==='slime'){
    const size=e.small?.6:1;ctx.save();ctx.scale(size,size);ctx.fillStyle=e.small?'#acd784':'#78a776';ctx.beginPath();ctx.ellipse(0,-17,26+Math.sin(t*5+e.phase)*3,20,0,0,7);ctx.fill();circle(-8,-22,3,'#203b2a');circle(8,-22,3,'#203b2a');circle(-10,-29,3,'#d4f3a8');line(-5,-11,5,-11,'#3e6338',2);ctx.restore();
  }
  if(e.slow>0){ctx.strokeStyle='#9fe5d0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-8,e.small?17:30,8,0,0,7);ctx.stroke()}
}

function updateUI(){$('depthname').textContent=level===1?'THE UPPER HOLLOW':'THE DEEPER WILDS';$('level').textContent=String(level).padStart(2,'0');$('score').textContent=String(score).padStart(6,'0');$('common').textContent=common;$('rare').textContent=rare;$('hp0').style.width=heroes[0].hp/heroes[0].max*100+'%';$('hptext0').textContent=heroes[0].hp+' / '+heroes[0].max+' HP';$('hero0').style.opacity=heroes[0].hp?1:.45;$('shieldStatus').textContent=shieldHits?'◈ '+shieldHits:'';$('shieldStatus').hidden=!shieldHits;$('area').textContent=level===1?'THE UPPER HOLLOW':`THE DEEPER WILDS · STRATUM ${level}`;updateLightUI()}
function save(){try{localStorage.setItem('stick-below-v1',JSON.stringify({contentVersion:1,shieldHits,slowTime,traps,treasureRooms,balanceVersion:BALANCE_VERSION,dimensions:{cols,rows},weaponTiers,lightBoost,level,score,common,rare,ammo,equipped,heroes,p,seen,enemies,loot}))}catch{}}let saved;try{saved=JSON.parse(localStorage.getItem('stick-below-v1'))}catch{}makeLevel();if(saved){$('start').innerHTML='Continue the search <span aria-hidden="true">➜</span>'}
function start(fresh=false){if(saved&&!fresh){({level,score,common,rare,ammo,equipped,heroes}=saved);weaponTiers={spear:depthTier(),rock:depthTier(),dart:depthTier(),bomb:depthTier(),seed:depthTier(),trap:depthTier(),...saved.weaponTiers};ammo={rock:0,dart:0,bomb:0,seed:0,trap:0,...ammo};if(saved.active===1&&heroes[0].hp<=0)heroes[0].hp=Math.max(1,Math.round(heroes[1].hp/heroes[1].max*heroes[0].max));heroes[1].hp=heroes[1].max;makeLevel(saved.dimensions||{cols:5+level,rows:3+Math.min(3,Math.floor(level/4))});p=saved.p;follower={x:p.x-p.dir*55,y:p.y};seen=saved.seen;enemies=saved.enemies;loot=saved.loot;shieldHits=Math.max(0,Math.min(3,Number(saved.shieldHits)||0));slowTime=Math.max(0,Number(saved.slowTime)||0);traps=saved.traps||[];treasureRooms=saved.treasureRooms||[];lightBoost=Math.max(0,Math.min(SUNSPORE_SECONDS,Number(saved.lightBoost)||0));if(saved.balanceVersion!==BALANCE_VERSION){for(const e of enemies){const type=types.find(type=>type.name===e.name);if(!type)continue;const fraction=Math.max(0,e.hp/(e.max||e.hp||1)),stats=enemyStats(type,!!e.elite);if(e.small){stats.max=Math.max(1,Math.ceil(stats.max*.35));stats.damage=Math.max(1,Math.round(stats.damage*.5));stats.speed*=1.35;stats.points=Math.round(stats.points*.25)}Object.assign(e,stats,{hp:Math.ceil(stats.max*fraction)})}for(const item of loot)if(['rock','dart','bomb'].includes(item.type))item.tier=depthTier();if(!loot.some(item=>item.type==='sunspore')){const i=routeToExit()[Math.max(1,Math.floor(routeToExit().length*.3))],a=cells[i];loot.push({type:'sunspore',x:a.c*CW+110,y:a.r*RH+180,r:a.r,c:a.c})}}saved=null}mode='play';document.body.classList.remove('is-landing');$('overlay').classList.add('hidden');$('viewport').focus();updateUI();refreshCameraFrame();followCamera(0,true);note('ROOT: Find Sunspores to brighten Donald’s torch.');beep(520)}
function pause(){if(mode==='intro'||mode==='celebrate'||mode==='dead')return;if(mode==='play'){mode='paused';showOverlay('A moment to breathe.','The cave can wait. Your expedition is paused.','Resume expedition',()=>{mode='play';$('overlay').classList.add('hidden');$('viewport').focus();refreshCameraFrame();followCamera(0,true)})}else{mode='play';$('overlay').classList.add('hidden');refreshCameraFrame();followCamera(0,true)}$('pause').innerHTML=mode==='paused'?'▶ <span>Resume</span>':'Ⅱ <span>Pause</span>'}
function showOverlay(title,text,label,fn){clearControls();$('overlay').classList.remove('hidden');$('screenTitle').textContent=title;document.querySelector('.intro .eyebrow').textContent=mode==='paused'?'A MOMENT OF QUIET':mode==='celebrate'?'ANOTHER STEP CLOSER':'THE EXPEDITION ENDS';document.querySelector('.intro p').textContent=text;$('start').innerHTML=label+' <span>↗</span>';$('start').onclick=fn}
$('landingHelp').onclick=()=>$('help').click();$('landingInstall').onclick=()=>$('install').click();$('start').onclick=()=>start();$('pause').onclick=pause;$('help').onclick=()=>{if(mode==='play')pause();$('guide').showModal()};$('closeguide').onclick=()=>$('guide').close();$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';beep()};$('restart').onclick=()=>{if(!confirm('Start a new expedition? Your current progress will be replaced.'))return;level=1;score=common=rare=0;ammo={rock:0,dart:0,bomb:0,seed:0,trap:0};equipped='spear';weaponTiers={spear:1,rock:1,dart:1,bomb:1,seed:1,trap:1};lightBoost=0;shieldHits=0;slowTime=0;heroes=[{hp:100,max:100},{hp:120,max:120}];saved=null;makeLevel();save();start(true)};
window.addEventListener('keydown',e=>{if($('guide').open)return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(!keys[k]){if(k==='escape'||k==='p')pause();if(k==='e'&&mode==='play')descend();if('123456'.includes(k)&&mode==='play'){const w=['spear','rock','dart','bomb','seed','trap'][+k-1];if(w==='spear'||ammo[w]>0){equipped=w;updateUI()}}}keys[k]=true});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(mode==='play')pause()});const touchPointers=new Map();
function releaseTouch(e){const held=touchPointers.get(e.pointerId);if(!held)return;touchPointers.delete(e.pointerId);keys[held.key]=[...touchPointers.values()].some(v=>v.key===held.key);held.button.classList.remove('pressed')}
function clearControls(){Object.keys(keys).forEach(k=>keys[k]=false);touchPointers.forEach(v=>v.button.classList.remove('pressed'));touchPointers.clear();resetJoystick()}
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();if(mode!=='play')return;b.setPointerCapture(e.pointerId);touchPointers.set(e.pointerId,{key:b.dataset.key,button:b});keys[b.dataset.key]=true;b.classList.add('pressed');if(b.dataset.key==='e')descend()};b.onpointerup=b.onpointercancel=b.onlostpointercapture=releaseTouch;b.oncontextmenu=e=>e.preventDefault()});
// The same thumb-drag interaction as Sticks in the Woods, with a dead zone
// and vertical bias so climbing does not make the player drift off a ladder.
const joystick={id:null,x:0,y:0},joyArea=$('joyArea'),joyThumb=$('joyThumb');
function resetJoystick(){joystick.id=null;joystick.x=joystick.y=0;joyThumb.style.transform='none';joyArea.classList.remove('pressed')}
function moveJoystick(e){
  const b=joyArea.getBoundingClientRect(),radius=b.width*.35;
  const dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2;
  const length=Math.hypot(dx,dy),amount=Math.min(1,Math.max(0,(length/radius-.18)/.82));
  joystick.x=length?dx/length*amount:0;joystick.y=length?dy/length*amount:0;
  joyThumb.style.transform=`translate(${length?dx/length*Math.min(length,radius):0}px,${length?dy/length*Math.min(length,radius):0}px)`;
}
joyArea.onpointerdown=e=>{e.preventDefault();if(mode!=='play'||joystick.id!==null)return;joystick.id=e.pointerId;joyArea.setPointerCapture(e.pointerId);joyArea.classList.add('pressed');moveJoystick(e)};
joyArea.onpointermove=e=>{if(e.pointerId===joystick.id){e.preventDefault();moveJoystick(e)}};
joyArea.onpointerup=joyArea.onpointercancel=joyArea.onlostpointercapture=e=>{if(e.pointerId===joystick.id)resetJoystick()};
joyArea.oncontextmenu=e=>e.preventDefault();
window.addEventListener('resize',clearControls);
function cycleWeapon(){if(mode!=='play')return;const weapons=['spear','rock','dart','bomb','seed','trap'].filter(w=>w==='spear'||ammo[w]>0);equipped=weapons[(weapons.indexOf(equipped)+1)%weapons.length];updateUI();note(names[equipped]+' equipped')}
document.querySelectorAll('[data-action]').forEach(b=>{
  b.onpointerdown=e=>{e.preventDefault();cycleWeapon()};
  // Keyboard and assistive activation still use click. Pointer input acts once on down.
  b.onclick=e=>{if(e.detail===0)cycleWeapon()};
});
// Safari can interpret two gameplay fingers as pinch/double-tap zoom, including
// touches between buttons. Cancel native gestures only on the active play surface.
function preventPlayZoom(e){
  if(mode!=='play'||$('guide').open||$('installguide').open)return;
  if(e.target?.closest?.('.game-shell')&&!e.target.closest('#overlay, dialog')&&e.cancelable)e.preventDefault();
}
for(const type of ['touchstart','touchmove','touchend','gesturestart','gesturechange','gestureend','dblclick']){
  document.addEventListener(type,preventPlayZoom,{passive:false});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();if(mode==='play'){save();pause()}}});window.addEventListener('blur',clearControls);
function descend(){if(Math.abs(p.x-(cols*CW-160))>90||Math.abs(p.y-((rows-1)*RH+180))>65){note('Find the glowing cave entrance in the deepest tunnel.');return}mode='celebrate';score+=level*150;heroes[0].hp=Math.min(heroes[0].max,heroes[0].hp+15);heroes[1].hp=heroes[1].max;for(let i=0;i<130;i++)particles.push({x:p.x,y:p.y-60,vx:rnd(-240,240),vy:rnd(-350,-80),life:3,color:['#d7b972','#a8dbae','#dce4c0'][i%3]});beep(660,.5);updateUI();$('root').textContent='“A trace of my cousin’s mycelium! We’re getting closer. You’re ready to go deeper.”';showOverlay('Deeper, together.',`Stratum ${level} explored. +${level*150} points. Stickolas recovers 15 HP. A fresh network of tunnels awaits below.`,`Descend to level ${level+1}`,()=>{level++;makeLevel();mode='play';$('overlay').classList.add('hidden');refreshCameraFrame();followCamera(0,true);save();$('viewport').focus();note('+15 HP at the exit · Spear Mk '+weaponTiers.spear+' · A new hollow awaits.')})}
function burst(x,y,color,n=9){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-100,100),vy:rnd(-160,20),life:rnd(.2,.6),color})}function hit(e,d,sourceX=p.x,weapon=equipped){if(e.hp<=0)return;if(e.name==='beetle'&&['windup','charge'].includes(e.state)&&(sourceX-e.x)*e.dir>=0&&weapon!=='bomb'){burst(e.x,e.y-25,'#ddbd7a',4);if(!e.blockTime){note('Armored charge · jump over, then strike while dazed!');e.blockTime=1.5}return}e.hp-=d*(e.name==='beetle'&&e.state==='recover'?2:1);burst(e.x,e.y-25,'#c2b679');beep(190);if(e.hp<=0){if(e.name==='slime'&&!e.small)splitSlime(e);score+=e.points;note(e.name==='slime'&&!e.small?'Slime split · defeat the two little ones!':`${e.name.toUpperCase()} defeated · +${e.points} points`);if(rand()<.35)loot.push({x:e.x,y:e.r*RH+180,type:rand()<.12?'rare':'common'});updateUI()}}
function attack(){
  if(cool>0||heroes[0].hp<=0)return;
  cool=equipped==='bomb'?.7:equipped==='trap'?.5:equipped==='spear'?.42:.35;beep(330);
  if(equipped==='spear'){
    for(const e of [...enemies])if(e.hp>0&&Math.abs(e.y-p.y)<75&&(e.x-p.x)*p.dir>-18&&(e.x-p.x)*p.dir<110)hit(e,weaponDamage('spear'));
  }else{
    const w=equipped;
    if(w==='trap'){
      const c=Math.max(0,Math.min(cols-1,Math.floor(p.x/CW))),r=Math.max(0,Math.min(rows-1,Math.floor(p.y/RH)));
      traps.push({x:Math.max(c*CW+60,Math.min((c+1)*CW-60,p.x+p.dir*65)),y:r*RH+180,r,c,owner:'player',life:8,radius:65});
      note('Sticky trap set · slows enemies for 8 seconds');
    }else shots.push({x:p.x+p.dir*25,y:p.y-39,vx:p.dir*(w==='dart'?620:w==='seed'?430:390),vy:w==='dart'?0:w==='seed'?-70:-140,type:w,damage:weaponDamage(w),bounces:w==='seed'?3:0,life:w==='seed'?4:2.3,r:Math.max(0,Math.min(rows-1,Math.floor(p.y/RH)))});
    ammo[w]=Math.max(0,(ammo[w]||0)-1);if(!ammo[w]){equipped='spear';note('Out of ammo · spear equipped')}updateUI();
  }
}
function step(dt){t+=dt;cool=Math.max(0,cool-dt);toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');if(mode!=='play'){for(const a of particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=240*dt;a.life-=dt}particles=particles.filter(a=>a.life>0);return}lightBoost=Math.max(0,lightBoost-dt);hurtCooldown=Math.max(0,hurtCooldown-dt);updateLightUI();updateTraps(dt);if(mode!=='play')return;const r=Math.max(0,Math.min(rows-1,Math.floor((p.y+5)/RH))),c=Math.max(0,Math.min(cols-1,Math.floor(p.x/CW))),a=cell(c,r),floor=r*RH+180;seen[r*cols+c]=true;const joyX=Math.abs(joystick.x)>Math.abs(joystick.y)*.65?joystick.x:0;let dir=Math.max(-1,Math.min(1,(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joyX));p.vx=dir*210*(slowTime>0?.5:1);if(dir)p.dir=Math.sign(dir);p.x+=p.vx*dt;let min=c*CW+54,max=(c+1)*CW-54;if(c>0&&cell(c-1,r).right)min-=CW;if(a.right)max+=CW;p.x=Math.max(min,Math.min(max,p.x));p.x=Math.max(25,Math.min(cols*CW-25,p.x));let climbed=false;const lx=c*CW+CW*.52;if(Math.abs(p.x-lx)<49){if((keys.s||keys.arrowdown||joystick.y>.35)&&a.down){p.y+=150*dt;climbed=true}if((keys.w||keys.arrowup||joystick.y<-.35)&&r>0&&cell(c,r-1).down){p.y-=150*dt;climbed=true}if((keys.w||keys.arrowup||joystick.y<-.35)&&a.down&&p.y>floor+5){p.y-=150*dt;climbed=true}}if(!climbed){if(p.y>floor&&p.y<floor+RH-15&&a.down&&Math.abs(p.x-lx)<49){p.vy=0}else{if((keys[' ']||keys.k)&&p.on){p.vy=-390;p.on=false;beep(300)}p.vy+=980*dt;p.y+=p.vy*dt;if(p.y>=floor){p.y=floor;p.vy=0;p.on=true}}}else{p.vy=0;p.on=false}if(keys.j||keys.f)attack();if(Math.abs(follower.y-p.y)>90){follower.y=p.y;follower.x=p.x-p.dir*55}else{follower.x+=(p.x-p.dir*60-follower.x)*Math.min(1,dt*4);follower.y+=(p.y-follower.y)*Math.min(1,dt*6)}
for(const e of [...enemies]){if(e.hp<=0)continue;updateEnemy(e,dt);if(Math.abs(e.y-p.y)<(e.name==='beetle'?38:e.small?24:e.name==='bat'||e.name==='grub'&&e.state==='fall'?65:44)&&Math.abs(e.x-p.x)<(e.small?25:39)&&e.timer<=0&&hurtCooldown<=0){e.timer=.9;hurtPlayer(e.damage);if(mode==='dead')return}}
for(const it of loot){if(it.got)continue;if(Math.abs(p.x-it.x)<36&&Math.abs(p.y-it.y)<55){if(it.type==='vault'&&guardCount(it.guardId)){if(!it.noticed){note('Guarded treasure · defeat its guardians to open');it.noticed=true}continue}it.got=true;if(it.type==='common'){common++;const points=treasurePoints();score+=points;note('Common treasure · +'+points+' points')}else if(it.type==='rare'){rare++;const points=treasurePoints(true);score+=points;note('Rare amber relic · +'+points+' points')}else if(it.type==='fungi'){heroes[0].hp=Math.min(heroes[0].max,heroes[0].hp+15);note('Living fungi · +15 health');$('root').textContent='“Living fungi! A small beginning. Keep looking, explorers.”'}else if(it.type==='sunspore'){activateSunspore()}else if(it.type==='shield'){shieldHits=3;note('Bark shield · absorbs the next 3 hits')}else if(it.type==='vault'){openVault(it)}else{ammo[it.type]=(ammo[it.type]||0)+({rock:8,dart:15,bomb:3,seed:12,trap:3}[it.type]||0);weaponTiers[it.type]=Math.max(weaponTiers[it.type]||1,it.tier||depthTier());equipped=it.type;note(names[it.type]+(it.type==='trap'?'':' Mk '+weaponTiers[it.type])+' equipped · Attack to use')}burst(it.x,it.y-20,'#b9d391');beep(720,.15);updateUI();save()}}
for(const s of shots)updateShot(s,dt);shots=shots.filter(s=>s.life>0);for(const a of particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=240*dt;a.life-=dt}particles=particles.filter(a=>a.life>0);followCamera(dt);saveClock+=dt;if(saveClock>3){saveClock=0;save()}}
function path(points,fill,stroke,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}function line(x,y,x2,y2,color,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}function glow(x,y,r,color){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function mushroom(x,y,s=1,col='#a5c5aa'){ctx.save();ctx.translate(x,y);ctx.scale(s,s);glow(0,-12,45,'#75ae9830');line(0,0,0,-14,'#8caa92',3);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0,-15,12,6,0,Math.PI,Math.PI*2);ctx.fill();circle(-5,-17,1.2,'#e1e5bd');circle(3,-19,1,'#e1e5bd');ctx.restore()}
// Match the Pea Pod Blaster artwork in Sticks in the Woods.
function drawPeaPod(x,y,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  line(-8,0,35,0,'#4e703c',5);line(-7,-1,35,-1,'#acd48b',2.4);
  line(23,0,48,-1,'#43824b',7);
  ctx.fillStyle='#63b96d';ctx.beginPath();ctx.ellipse(47,-2,20,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#9be89b';ctx.beginPath();ctx.ellipse(50,-5,13,5,0,0,Math.PI*2);ctx.fill();
  circle(57,-2,4,'#3d7543');circle(33,-2,3,'#b2f3a8');line(51,0,64,0,'#7bd57f',4);
  ctx.restore();
}
function drawPea(shot){
  const dir=Math.sign(shot.vx)||1;
  line(shot.x-dir*18,shot.y,shot.x-dir*5,shot.y,'#89e28b90',3);
  circle(shot.x,shot.y,7,'#3d853c');
  circle(shot.x-1,shot.y-2,5,'#91ef83');
  circle(shot.x+2,shot.y-3,1.8,'#f5ffd3');
}
function hero(x,y,donald=false,dir=1,lead=false,portrait=false){ctx.save();ctx.translate(x,y);ctx.scale(dir,1);let walk=mode==='play'&&Math.abs(p.vx)>0?Math.sin(t*11)*7:Math.sin(t*2)*1;ctx.lineCap='round';ctx.strokeStyle='#1c2117';ctx.lineWidth=8;line(-9,-24,-12+walk,-7,'#2b2a1c',8);line(9,-24,13-walk,-4,'#2b2a1c',8);line(-9,-24,-12+walk,-7,'#9e8453',4);line(9,-24,13-walk,-4,'#ae9363',4);line(-13,-49,-25,-27+walk/3,'#94754c',5);line(12,-48,28,-35,'#a88b59',5);let bw=donald?43:27,bh=donald?45:64;path([[-bw/2,-25],[-bw/2-2,-25-bh],[bw/2-2,-28-bh],[bw/2+3,-26]],donald?'#9e8056':'#b29765','#302e20',3);for(let i=0;i<8;i++){let xx=-bw/2+4+i*(bw-6)/8;line(xx,-30,xx-2,-21-bh,i%2?'#6d573c':'#bba176',i%2?2:1)}let ey=-bh-6;line(-9,ey,-3,ey-1,'#332c20',3);circle(-5,ey+6,2.5,'#171d17');circle(8,ey+5,2.5,'#171d17');if(donald){line(-8,ey+20,10,ey+20,'#30261b',3);line(-5,ey+18,3,ey+17,'#30261b',4)}else{ctx.strokeStyle='#342d20';ctx.lineWidth=2;ctx.beginPath();ctx.arc(3,ey+14,5,0,Math.PI);ctx.stroke();line(0,-bh-25,0,-bh-41,'#8c8f49',2);for(let k=0;k<4;k++){ctx.save();ctx.translate(0,-bh-30);ctx.rotate(-1.2+k*.7);path([[0,0],[-5,-13],[0,-24],[6,-12]],['#a4ad5e','#b3bb70','#789855','#a3aa53'][k],null);ctx.restore()}}if(donald&&!portrait){const sway=Math.sin(t*11)*2+Math.sin(t*17)*1.2;line(15,-47,28,-60,'#bba171',5);line(28,-38,28,-88,'#76502e',6);line(28,-38,28,-88,'#c09b5f',3);for(let i=0;i<4;i++)line(23,-77-i*3,33,-77-i*3,'#d3b176',2);glow(28,-94,lightBoost>0?75:43,lightBoost>0?'#fff0a399':'#ffc36b65');path([[22,-85],[17,-96],[23,-107],[27+sway,-121],[33,-105],[39,-97],[34,-85]],'#e99a3d');path([[25,-85],[22,-96],[29+sway*.6,-110],[34,-96],[31,-85]],'#ffdb82');path([[27,-86],[25,-94],[29,-101],[32,-93]],'#fff0be');for(let i=0;i<3;i++){let age=(t*1.1+i*.33)%1;circle(28+Math.sin(t*3+i)*8,-104-age*32,1.1*(1-age),'#efc37b')}}let attackPose=cool>.15&&lead;let weaponY=-37;if(lead&&equipped==='spear'){ctx.save();ctx.translate(25,weaponY);ctx.rotate(attackPose?1.4:.16);line(0,30,0,-53,'#b99c68',4);path([[0,-68],[-6,-49],[5,-50]],'#c9cab1','#72755c',1);line(-4,-44,4,-44,'#676e42',3);ctx.restore()}if(lead&&!portrait&&shieldHits>0)drawBarkShield(-22,-43,1,shieldHits);if(lead&&equipped!=='spear'){if(equipped==='dart'){drawPeaPod(10,-39,.65)}else if(equipped==='seed'){drawSeeds(25,-38,.8)}else if(equipped==='trap'){drawSapJar(25,-38,.8)}else circle(27,-37,6,equipped==='bomb'?'#d8b25d':'#a2aaa0')}ctx.restore()}
function enemy(e){if(e.hp<=0)return;ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.dir,1);drawNewEnemy(e);if(e.name==='snake'){ctx.strokeStyle='#91a477';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-25,-5);ctx.bezierCurveTo(-10,-20,0,7,12,-9);ctx.bezierCurveTo(24,-25,9,-34,23,-34);ctx.stroke();circle(26,-34,7,'#a8b987');circle(29,-36,1.6,'#d5c96c');line(32,-30,40,-29,'#ca947c',1)}if(e.name==='rat'){ctx.fillStyle='#9c9380';ctx.beginPath();ctx.ellipse(0,-14,22,12,0,0,7);ctx.fill();path([[12,-22],[33,-12],[13,-6]],'#9c9380');circle(14,-26,7,'#ad9b89');circle(16,-26,4,'#7e6860');circle(24,-17,2,'#1a211d');line(-18,-12,-37,-9,'#a28b77',3);line(-7,-5,-12,0,'#c2aa89',2);line(11,-5,16,0,'#c2aa89',2)}if(e.name==='bat'){let flap=Math.sin(t*12)*14;path([[-3,-22],[-35,-38-flap],[-30,-14],[-19,-21],[-10,-7],[0,-14]],'#6f778a','#9c9aa0',1);path([[3,-22],[35,-38-flap],[30,-14],[19,-21],[10,-7],[0,-14]],'#6f778a','#9c9aa0',1);ctx.fillStyle='#8d8996';ctx.fillRect(-6,-28,12,18);path([[-6,-25],[-8,-35],[0,-29],[8,-35],[6,-25]],'#8d8996');circle(-3,-24,1.5,'#ebc788');circle(3,-24,1.5,'#ebc788')}
if(e.name==='spider'){for(let i=0;i<4;i++){let v=Math.sin(t*8+i)*3;line(-6,-18,-20-i*3,-27+i*8+v,'#969b88',2);line(-20-i*3,-27+i*8+v,-29-i*3,-6+i,'#969b88',2);line(6,-18,20+i*3,-27+i*8-v,'#969b88',2);line(20+i*3,-27+i*8-v,29+i*3,-6+i,'#969b88',2)}circle(0,-21,15,'#666e62');circle(0,-10,10,'#8b927c');circle(-4,-9,2,'#caa868');circle(4,-9,2,'#caa868')}if(e.elite){ctx.fillStyle='#d6b978';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText('VETERAN',0,-65)}if(e.hp<e.max||e.elite){ctx.fillStyle='#353c2c';ctx.fillRect(-20,-55,40,3);ctx.fillStyle='#c49476';ctx.fillRect(-20,-55,40*e.hp/e.max,3)}ctx.restore()}
// Donald is the only cave light source. The outer falloff is fully opaque.
const TORCH_FALLOFF=[[0,1],[.18,1],[.45,.88],[.72,.4],[1,0]];
function torchLight(){return{x:follower.x+p.dir*28,y:follower.y-96,radius:330+Math.sin(t*7)*5+Math.sin(t*13)*3}}
function visibilityAt(x,y){const light=torchLight(),distance=Math.hypot(x-light.x,y-light.y)/light.radius;for(let i=1;i<TORCH_FALLOFF.length;i++){const [edge,value]=TORCH_FALLOFF[i],[previous,prevValue]=TORCH_FALLOFF[i-1];if(distance<=edge){const normal=prevValue+(value-prevValue)*(distance-previous)/(edge-previous);return boostStrength()+(1-boostStrength())*normal}}return boostStrength()}
function drawTorchlight(){const light=torchLight(),x=light.x-Math.round(camX),y=light.y-Math.round(camY);ctx.save();ctx.globalCompositeOperation='screen';glow(x,y,140,'#ffb45b38');ctx.restore();darkness.globalCompositeOperation='source-over';darkness.fillStyle='#020605';darkness.fillRect(0,0,W,H);darkness.globalCompositeOperation='destination-out';const halo=darkness.createRadialGradient(x,y,0,x,y,light.radius);for(const [edge,value]of TORCH_FALLOFF)halo.addColorStop(edge,`rgba(0,0,0,${value})`);darkness.fillStyle=halo;darkness.fillRect(0,0,W,H);darkness.globalCompositeOperation='source-over';ctx.save();ctx.globalAlpha=1-boostStrength();ctx.drawImage(darknessCanvas,0,0);ctx.restore()}
function draw(){ctx.fillStyle='#101b1b';ctx.fillRect(0,0,W,H);let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#111e20');bg.addColorStop(.65,'#1b2c2a');bg.addColorStop(1,'#14201f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);for(let i=0;i<28;i++){let x=((i*163-camX*.22)%(W+160)+W+160)%(W+160)-80;let y=-50+(i%4)*42-camY*.1;path([[x-55,y],[x+46,y-10],[x+20,y+180+(i%3)*60]],i%2?'#172526':'#1a2a2b');}ctx.save();ctx.translate(-Math.round(camX),-Math.round(camY));
let lo=Math.max(0,Math.floor(camX/CW)-1),hi=Math.min(cols-1,Math.ceil((camX+W)/CW));for(let r=0;r<rows;r++)for(let c=lo;c<=hi;c++){let a=cell(c,r),x=c*CW,y=r*RH+180;glow(x+220,y-85,210,'#6685790b');path([[x,y+8],[x+CW,y+8],[x+CW,y+RH-10],[x,y+RH-10]],'#26332c');path([[x,y+11],[x+80,y+4],[x+155,y+9],[x+244,y+1],[x+320,y+8],[x+CW,y+3],[x+CW,y+30],[x,y+32]],'#52604a');line(x,y+8,x+CW,y+8,'#7c8660',2);for(let i=0;i<17;i++){let xx=x+i*27+Math.sin(i*43+c)*8,yy=y+40+(i%4)*26;path([[xx,yy],[xx+25,yy-5],[xx+39,yy+15],[xx+5,yy+22]],['#2d3b30','#303f33','#344237'][i%3]);line(xx+5,y+9,xx+9,y+2,'#88926777',1)}if(!a.right){const wx=x+CW;path([[wx-46,y-240],[wx+43,y-246],[wx+54,y-193],[wx+38,y-131],[wx+49,y-54],[wx+40,y+18],[wx-44,y+17],[wx-56,y-34],[wx-40,y-91],[wx-49,y-162]],'#344238','#687256',3);path([[wx-46,y-240],[wx-20,y-205],[wx-27,y-146],[wx-15,y-83],[wx-29,y-31],[wx-22,y+15],[wx-44,y+17],[wx-56,y-34],[wx-40,y-91],[wx-49,y-162]],'#4a5843');path([[wx+22,y-240],[wx+43,y-246],[wx+54,y-193],[wx+38,y-131],[wx+49,y-54],[wx+40,y+18],[wx+17,y+17],[wx+29,y-58],[wx+17,y-126]],'#22342d');for(let k=0;k<5;k++){let yy=y-215+k*46;line(wx-27,yy,wx+25,yy+12,'#71805a55',2);line(wx+4,yy+7,wx-8,yy+36,'#152a2455',2)}mushroom(wx-45,y,.7);line(wx-37,y-199,wx-34,y-150,'#81965a',3)}if(a.down){let lx=x+CW*.52;ctx.fillStyle='#111f1b';ctx.fillRect(lx-27,y+4,54,RH-14);line(lx-20,y-5,lx-20,y+RH,'#aca577',3);line(lx+20,y-5,lx+20,y+RH,'#aca577',3);for(let j=0;j<RH;j+=19)line(lx-20,y+j,lx+20,y+j,'#a69a6c',3);glow(lx,y+90,75,'#b8b36b15')}for(let j=0;j<6;j++){let xx=x+50+j*69,yy=y-RH+32;path([[xx-13,yy-30],[xx+12,yy-24],[xx+3,yy+20+(j%3)*13]],'#35453c');}for(let j=0;j<7;j++){let xx=x+25+((j*89+c*53)%CW);if(j%3===0)mushroom(xx,y-1,.6+(j%2)*.45);else{line(xx,y,xx-7,y-15,'#657c58',2);line(xx,y,xx+5,y-22,'#6f845c',2);line(xx,y-1,xx+13,y-9,'#536c4e',2)}}}
// An arched passage recedes into the rock, with stairs and living fungi.
const ex=cols*CW-160,ey=(rows-1)*RH+180;glow(ex,ey-55,145,'#83cfaa25');
path([[ex-75,ey+2],[ex-77,ey-54],[ex-66,ey-104],[ex-41,ey-135],[ex-5,ey-149],[ex+33,ey-139],[ex+63,ey-110],[ex+77,ey-67],[ex+73,ey+2]],'#415448','#7d8b65',3);
path([[ex-55,ey],[ex-57,ey-51],[ex-45,ey-97],[ex-25,ey-119],[ex+2,ey-128],[ex+31,ey-111],[ex+49,ey-82],[ex+55,ey-43],[ex+52,ey]],'#071714','#263e33',2);
path([[ex-55,ey],[ex-25,ey-30],[ex+5,ey-45],[ex+26,ey-43],[ex+52,ey]],'#233d31');
for(let i=0;i<5;i++){let z=i/5,yy=ey-i*8;line(ex-49+z*55,yy,ex+46-z*21,yy,'#8a9e7244',3)}
for(let i=0;i<6;i++){let angle=Math.PI+i*Math.PI/5;let xx=ex+Math.cos(angle)*65,yy=ey-48+Math.sin(angle)*84;line(xx-8,yy-6,xx+9,yy+9,'#203a2c',3)}
mushroom(ex-68,ey,1.4);mushroom(ex+67,ey,.9);mushroom(ex+49,ey-11,.55);glow(ex+13,ey-64,37,'#7ecca92a');
ctx.fillStyle='#c6dfb5';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('THE WAY DOWN',ex,ey-166);ctx.fillText('↓  ENTER THE CAVE',ex,ey+24);
drawTraps();drawTreasureRooms();
for(const it of loot){if(it.got||it.x<camX-50||it.x>camX+W+50)continue;let x=it.x,y=it.y;if(drawDiscovery(it))continue;if(it.type==='fungi'){mushroom(x,y,1.5);continue}if(it.type==='sunspore'){const bob=Math.sin(t*3+x)*3;glow(x,y-22+bob,55,'#f2ce6744');circle(x,y-20+bob,10,'#eac76f');circle(x,y-20+bob,5,'#fff4bc');for(let ray=0;ray<8;ray++){const angle=ray*Math.PI/4+t*.3;line(x+Math.cos(angle)*14,y-20+bob+Math.sin(angle)*14,x+Math.cos(angle)*21,y-20+bob+Math.sin(angle)*21,'#e1c878',2)}ctx.fillStyle='#efdaa2';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('SUNSPORE',x,y-52);continue}glow(x,y-15,40,it.type==='rare'?'#d4b26424':'#b9c89212');if(it.type==='common'||it.type==='rare'){ctx.fillStyle=it.type==='rare'?'#ad8f4c':'#8c8053';ctx.fillRect(x-13,y-23,26,21);path([[x-13,y-23],[x-10,y-30],[x+10,y-30],[x+13,y-23]],it.type==='rare'?'#c6aa66':'#b1a16d');line(x-13,y-20,x+13,y-20,'#d7bd7b',2);ctx.fillStyle='#e2ca8b';ctx.fillRect(x-2,y-23,4,7)}else if(it.type==='rock'){circle(x-5,y-8,8,'#aab0a0');circle(x+6,y-6,6,'#7c8e81')}else if(it.type==='dart'){drawPeaPod(x-22,y-13,.65)}else{circle(x,y-13,11,'#d1a859');line(x,y-22,x+4,y-30,'#9baf74',3)}ctx.fillStyle='#bec5a0';ctx.font='7px monospace';ctx.textAlign='center';ctx.fillText((it.type==='dart'?'PEA POD BLASTER':it.type.toUpperCase())+(it.tier>1&&['rock','dart','bomb'].includes(it.type)?' Mk '+it.tier:''),x,y-40)}
for(const e of enemies)if(e.x>camX-80&&e.x<camX+W+80)enemy(e);hero(follower.x,follower.y,true,p.dir,false);hero(p.x,p.y,false,p.dir,true);for(const s of shots){if(s.type==='dart')drawPea(s);else if(s.type==='seed'){drawSeeds(s.x,s.y,.7)}else circle(s.x,s.y,s.type==='bomb'?7:5,s.type==='bomb'?'#d6ae56':'#c3cab0')}for(const a of particles)circle(a.x,a.y,2,a.color);ctx.restore();
for(let i=0;i<33;i++){let x=(i*79+Math.sin(t*.2+i)*35-camX*.12)%W,y=(i*47-t*(4+i%3))%H;if(y<0)y+=H;circle(x,y,i%4===0?1.5:.7,i%4===0?'#b4c69d55':'#b4c69d22')}drawTorchlight();
// Revealed-room map.
let mw=W<600?85:130,mh=rows/cols*mw,mx=W-mw-24,my=W<600?160:220,sz=mw/cols;ctx.fillStyle='#0b1919bb';ctx.fillRect(mx-10,my-10,mw+20,mh+38);ctx.font='7px monospace';ctx.fillStyle='#9aa98b';ctx.textAlign='left';ctx.fillText('TUNNEL SURVEY',mx,my+mh+20);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let i=r*cols+c;if(!seen[i]&&!(c===0&&r===0))continue;let a=cell(c,r);ctx.fillStyle='#697e64';ctx.fillRect(mx+c*sz+2,my+r*sz+2,sz-4,sz-4);if(a.right){ctx.fillRect(mx+(c+1)*sz-3,my+r*sz+sz/2-1,6,2)}if(a.down)ctx.fillRect(mx+c*sz+sz/2-1,my+(r+1)*sz-3,2,6)}let pc=Math.max(0,Math.min(cols-1,Math.floor(p.x/CW))),pr=Math.max(0,Math.min(rows-1,Math.floor((p.y+5)/RH)));circle(mx+(pc+.5)*sz,my+(pr+.5)*sz,3,'#e4c17c');if(seen[cols*rows-1])circle(mx+(cols-.5)*sz,my+(rows-.5)*sz,3,'#aad4a6');texture.needsUpdate=true;renderer.render(scene,camera)}
function frame(ms){let dt=Math.min(.035,(ms-last)/1000||.016);last=ms;step(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Use the same character drawing for portraits and the cave sprites.
function drawPortraits(){
  const caveContext=ctx;
  try{
    for(const [id,donald] of [['brandPortrait',false],['stickolasPortrait',false]]){
      const portrait=$(id);
      ctx=portrait.getContext('2d');
      ctx.clearRect(0,0,portrait.width,portrait.height);
      ctx.save();
      ctx.translate(48,112);
      ctx.scale(1.5,1.5);
      hero(0,donald?12:30,donald,1,false,true);
      ctx.restore();
    }
  }finally{ctx=caveContext}
}
drawPortraits();
// Read-only diagnostics for local verification.
window.expedition={get state(){return{level,score,cols,rows,mode,camera:{x:camX,y:camY,...cameraFrame,width:W,height:H},p:{...p},ammo:{...ammo},weaponTiers:{...weaponTiers},shieldHits,slowTime,traps:traps.map(a=>({...a})),treasureRooms:treasureRooms.map(a=>({...a})),lightBoost,equipped,heroes:heroes.map(h=>({...h})),enemies:enemies.filter(e=>e.hp>0).length}},get maze(){return cells.map(a=>({...a}))}};
