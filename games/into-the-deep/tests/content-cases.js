// Runs in the real game VM after the base regression suite.
for(const depth of [...Array.from({length:50},(_,i)=>i+1),100,1000]){
  level=depth;makeLevel();const route=routeToExit();
  check(loot.some(it=>it.type==='shield'&&route.includes(it.r*cols+it.c)),'Bark shield available on the route from depth 1');
  for(const [name,first] of [['beetle',2],['grub',3],['slime',4]])check(enemies.some(e=>e.name===name)===(depth>=first),'Enemy introduction gate: '+name);
  for(const [name,first] of [['seed',2],['trap',3]])check(loot.some(it=>it.type===name&&route.includes(it.r*cols+it.c))===(depth>=first),'Guaranteed equipment gate: '+name);
  check(treasureRooms.length===(depth<3?0:depth<7?1:2),'Guarded rooms are bounded and depth gated');
  check((traps.length>0)===(depth>=3),'Wild sap introduced at depth 3');
  for(const room of treasureRooms){check(room.c+room.r>0&&room.r*cols+room.c!==cells.length-1,'Cache never replaces entrance or exit');check(guardCount(room.id)===2,'Each cache starts with exactly two marked guardians');check(loot.some(it=>it.type==='vault'&&it.guardId===room.id),'Each guarded room has its chest')}
}
console.log('PASS: New enemy/item/room depth gates and guaranteed supplies through depth 1000.');
function contentReset(){
  level=4;makeLevel();mode='play';clearControls();enemies=[];loot=[];shots=[];traps=[];treasureRooms=[];shieldHits=0;slowTime=0;hurtCooldown=0;cool=0;lightBoost=0;
  p={x:220,y:180,vx:0,vy:0,dir:1,on:true};follower={x:160,y:180};heroes=[{hp:100,max:100},{hp:120,max:120}];ammo={rock:0,dart:0,bomb:0,seed:0,trap:0};weaponTiers={spear:1,rock:1,dart:1,bomb:1,seed:1,trap:1};equipped='spear';
}
contentReset();loot=[{type:'shield',x:p.x,y:p.y}];step(.016);check(shieldHits===3,'Shield pickup grants three blocks');
for(let i=2;i>=0;i--){hurtCooldown=0;hurtPlayer(10);check(shieldHits===i&&heroes[0].hp===100,'Each shield hit blocks damage')}
hurtPlayer(10);check(heroes[0].hp===100,'Hit immunity also follows a blocked hit');hurtCooldown=0;hurtPlayer(10);check(heroes[0].hp===90,'Damage resumes after shield breaks');
shieldHits=1;loot=[{type:'shield',x:p.x,y:p.y}];step(.016);check(shieldHits===3,'Shield pickups refill rather than stack');
contentReset();const beetle=newEnemy(types[4],cell(0,0));beetle.x=100;p.x=300;updateEnemy(beetle,.016);check(beetle.state==='windup'&&beetle.x===100,'Beetle visibly warns before charging');
updateEnemy(beetle,.71);check(beetle.state==='charge'&&beetle.x===100,'Windup locks direction and delays movement');updateEnemy(beetle,.1);check(beetle.x>120,'Beetle then charges');
updateEnemy(beetle,.7);check(beetle.state==='recover','Charge ends in recovery');let before=beetle.hp;hit(beetle,1);check(beetle.hp===before-2,'Dazed beetle takes double damage');
beetle.state='walk';before=beetle.hp;hit(beetle,1);check(beetle.hp===before-1,'Active shell takes normal damage');
contentReset();const grub=newEnemy(types[5],cell(0,0));grub.x=p.x;updateEnemy(grub,.016);check(grub.state==='warn'&&grub.y===10,'Grub hangs overhead and warns when approached');updateEnemy(grub,.56);check(grub.state==='fall','Warning precedes drop');updateEnemy(grub,.2);check(grub.y>10&&grub.y<180,'Grub physically falls instead of teleporting');updateEnemy(grub,.6);check(grub.y===180&&grub.state==='crawl','Grub lands and can be fought on the ground');
contentReset();const slime=newEnemy(types[6],cell(0,0));slime.x=320;slime.guardId='test-cache';enemies=[slime];const initialScore=score;hit(slime,100);let children=enemies.filter(e=>e.hp>0);check(children.length===2&&children.every(e=>e.small&&e.guardId==='test-cache'),'Slime splits once and children inherit guard membership');
hit(slime,100);check(enemies.length===3,'Hitting a dead parent cannot split it twice');for(const child of children)hit(child,100);check(enemies.every(e=>e.hp<=0)&&enemies.length===3,'Small slimes never split');check(score>initialScore,'Defeats score normally');
contentReset();cells[0].right=false;let seedShot={type:'seed',x:CW-4,y:140,vx:430,vy:0,r:0,life:4,damage:2,bounces:3};updateShot(seedShot,.02);check(seedShot.vx<0&&seedShot.x<CW&&seedShot.bounces===2,'Seed rebounds at a solid wall');
seedShot.x=200;seedShot.y=179;seedShot.vy=160;updateShot(seedShot,.016);check(seedShot.vy<0&&seedShot.y<177&&seedShot.bounces===1,'Seed rebounds from the floor');
seedShot.bounces=0;seedShot.y=180;updateShot(seedShot,.016);check(seedShot.life===0,'Seed expires after its bounded bounce count');
const seedTarget={...newEnemy(types[2],cell(0,0)),x:300,y:180,hp:10,max:10};enemies=[seedTarget];weaponTiers.seed=9;seedShot={type:'seed',x:300,y:155,vx:0,vy:0,r:0,life:4,damage:2,bounces:3};updateShot(seedShot,.016);check(seedTarget.hp===8&&seedShot.life===0,'Seed hits once with its launch damage');
loot=[{type:'seed',x:p.x,y:p.y,tier:1}];enemies=[];step(.016);check(equipped==='seed'&&ammo.seed===12,'Seed pickup equips twelve rounds');ammo.seed=1;cool=0;attack();check(equipped==='spear'&&ammo.seed===0,'Last seed falls back to spear');
contentReset();ammo.trap=1;equipped='trap';attack();check(traps.length===1&&traps[0].owner==='player'&&ammo.trap===0&&equipped==='spear','Trap weapon deploys a patch and consumes one charge');
const trapped=newEnemy(types[2],cell(0,0));trapped.x=traps[0].x;enemies=[trapped];p.x=traps[0].x;updateTraps(.1);check(trapped.slow>0&&slowTime===0,'Player trap slows enemies without slowing Stickolas');
const oldEnemyX=trapped.x;p.x=400;updateEnemy(trapped,.1);check(trapped.x-oldEnemyX<trapped.speed*.1,'Trapped enemy really moves more slowly');
const trapLife=traps[0].life;mode='paused';step(2);check(traps[0].life===trapLife,'Pause freezes placed trap duration');mode='play';updateTraps(9);check(traps.length===0,'Placed trap expires after eight gameplay seconds');
traps=[{x:220,y:180,c:0,r:0,radius:46,owner:'cave',life:null}];p.x=220;p.y=180;updateTraps(.1);check(slowTime>0,'Grounded player is slowed by wild sap');const oldPlayerX=p.x;keys.d=true;step(.05);keys.d=false;check(p.x-oldPlayerX<8,'Wild sap reduces actual movement speed');
slowTime=0;p.y=110;updateTraps(.1);check(slowTime===0,'Jumping clears wild sap');updateTraps(100);check(traps.length===1,'Natural sap does not silently expire');
contentReset();treasureRooms=[{id:'test-cache',c:0,r:0,opened:false}];const guard=newEnemy(types[6],cell(0,0));guard.x=340;guard.guardId='test-cache';enemies=[guard];loot=[{type:'vault',x:p.x,y:p.y,c:0,r:0,guardId:'test-cache'}];const rareBefore=rare;step(.016);check(!loot[0].got&&rare===rareBefore,'Guarded chest cannot be collected early');
hit(guard,100);step(.016);check(!loot[0].got&&guardCount('test-cache')===2,'Splitting guardians keep the chest locked');for(const child of [...enemies])if(child.hp>0)hit(child,100);
heroes[0].hp=50;step(.016);check(loot[0].got&&rare===rareBefore+3&&heroes[0].hp===75&&ammo.seed===12&&treasureRooms[0].opened,'Defeating all guardians unlocks treasure, healing and ammo');
step(.016);check(rare===rareBefore+3&&ammo.seed===12,'Cache rewards cannot be collected twice');
// Saving preserves active AI, shield charges, split descendants and traps.
contentReset();shieldHits=2;slowTime=.3;ammo.seed=9;ammo.trap=2;equipped='seed';traps=[{x:250,y:180,c:0,r:0,owner:'player',life:4.5,radius:65}];treasureRooms=[{id:'saved-cache',c:0,r:0,opened:false}];
const savedGuard=newEnemy(types[6],cell(0,0));savedGuard.guardId='saved-cache';enemies=[savedGuard];hit(savedGuard,100);const savedBeetle=newEnemy(types[4],cell(1,0));savedBeetle.state='recover';savedBeetle.aiTime=.8;enemies.push(savedBeetle);loot=[{type:'vault',x:220,y:180,c:0,r:0,guardId:'saved-cache'}];
let contentSave;localStorage.setItem=(key,value)=>contentSave=JSON.parse(value);save();saved=contentSave;start();check(shieldHits===2&&slowTime===.3&&ammo.seed===9&&ammo.trap===2&&equipped==='seed','New inventory and effects survive reload');check(traps[0].life===4.5&&guardCount('saved-cache')===2&&treasureRooms.length===1,'Trap duration and guardian descendants survive reload');check(enemies.find(e=>e.name==='beetle').aiTime===.8,'Enemy warning/recovery state survives reload');
mode='paused';const beforeAI=enemies.find(e=>e.name==='beetle').aiTime;step(3);check(enemies.find(e=>e.name==='beetle').aiTime===beforeAI&&traps[0].life===4.5,'Pause freezes AI and traps after reload');
const legacy={...contentSave,ammo:{rock:8,dart:0,bomb:0}};for(const field of ['contentVersion','shieldHits','slowTime','traps','treasureRooms'])delete legacy[field];saved=legacy;start();check(shieldHits===0&&slowTime===0&&ammo.seed===0&&ammo.trap===0&&traps.length===0&&treasureRooms.length===0,'Older saves receive safe defaults without injecting new encounters');
// Optional encounters never lock the exit or reset the shield at the next floor.
contentReset();enemies=[{...newEnemy(types[4],cell(0,0)),guardId:'uncleared'}];shieldHits=2;p.x=cols*CW-160;p.y=(rows-1)*RH+180;descend();check(mode==='celebrate','Uncleared treasure rooms do not block the exit');$('start').onclick();check(mode==='play'&&shieldHits===2&&traps.every(s=>s.owner==='cave'),'Next floor carries shield and clears old placed traps');
for(const state of ['walk','windup','charge','recover'])enemy({...newEnemy(types[4],cell(0,0)),state});for(const state of ['hang','warn','fall','crawl'])enemy({...newEnemy(types[5],cell(0,0)),state});enemy({...newEnemy(types[6],cell(0,0)),small:true});draw();
console.log('PASS: Shield blocks/refills, beetle windup/charge/recovery, grub drops, bounded slime splitting, seed rebounds/damage/ammo, trap ownership/slow/expiry/pause, locked cache rewards, save compatibility and optional progression.');
