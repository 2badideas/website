// The challenge pass must reward jumping, rather than merely increasing HP totals.
function chargeTrial(jump){
  contentReset();p.x=220;const b=newEnemy(types[4],cell(0,0));b.x=90;b.dir=1;b.state='charge';b.aiTime=.65;enemies=[b];
  for(let i=0;i<50;i++){keys[' ']=jump&&i===0;step(.016)}keys[' ']=false;return heroes[0].hp;
}
const standingChargeHP=chargeTrial(false),jumpingChargeHP=chargeTrial(true);
check(standingChargeHP<100&&jumpingChargeHP===100,'A timed jump clears a charge that hits a grounded player');
function sapTrial(jump){
  contentReset();p.x=90;traps=[{x:220,y:180,r:0,c:0,owner:'cave',life:null,radius:46}];let jumped=false;keys.d=true;
  for(let i=0;i<80;i++){keys[' ']=jump&&!jumped&&p.x>=135;if(keys[' '])jumped=true;step(.016)}clearControls();return heroes[0].hp;
}
const walkingSapHP=sapTrial(false),jumpingSapHP=sapTrial(true);
check(walkingSapHP<100&&jumpingSapHP===100,'Jumping over wild sap avoids damage that walking takes');
contentReset();shieldHits=3;const pressure=newEnemy(types[2],cell(0,0));pressure.x=p.x;enemies=[pressure];let seconds=0;
while(mode==='play'&&seconds<15){step(.016);seconds+=.016}
check(mode==='dead'&&seconds<15&&shieldHits===0,'Standing in danger is lethal even with a full shield');
console.log('PASS: Charge HP standing/jumping='+standingChargeHP+'/'+jumpingChargeHP+', sap HP walking/jumping='+walkingSapHP+'/'+jumpingSapHP+', shielded idle defeat='+seconds.toFixed(1)+'s.');
contentReset();const shell=newEnemy(types[4],cell(0,0));shell.x=200;shell.dir=1;shell.state='charge';enemies=[shell];const shellHP=shell.hp;
hit(shell,2,300,'seed');check(shell.hp===shellHP,'Frontal projectiles cannot erase a charge');hit(shell,1,300,'spear');check(shell.hp===shellHP,'Frontal melee cannot erase a charge');
hit(shell,1,100,'seed');check(shell.hp===shellHP-1,'A ricochet or flank can strike behind the shell');hit(shell,1,300,'bomb');check(shell.hp===shellHP-2,'Limited bombs can break through charge armor');
shell.state='recover';hit(shell,1,300,'spear');check(shell.hp===shellHP-4,'Recovery still rewards a double-damage counterattack');
contentReset();heroes[0].hp=37;p.x=cols*CW-160;p.y=(rows-1)*RH+180;descend();check(heroes[0].hp===52,'Exit no longer erases the floor damage');$('start').onclick();check(heroes[0].hp===52,'Wounds carry into the next floor');
contentReset();heroes[0].hp=95;p.x=cols*CW-160;p.y=(rows-1)*RH+180;descend();check(heroes[0].hp===100,'Exit healing remains capped at max HP');
contentReset();heroes[0].hp=50;loot=[{type:'fungi',x:p.x,y:p.y}];step(.016);check(heroes[0].hp===65,'Fungi heal fifteen HP');
// Existing saves receive the new threat stats while preserving wounds, minions and AI.
contentReset();const oldSmall={...newEnemy(types[6],cell(0,0)),hp:1,max:2,small:true,guardId:'legacy-room'};const oldBeetle={...newEnemy(types[4],cell(0,0)),hp:2,max:4,damage:12,speed:24,state:'windup',aiTime:.3};enemies=[oldSmall,oldBeetle];
let balanceSave;localStorage.setItem=(key,value)=>balanceSave=JSON.parse(value);save();balanceSave.balanceVersion=2;saved=balanceSave;start();
const upgraded=enemies.find(e=>e.name==='beetle'),minion=enemies.find(e=>e.small);check(upgraded.damage>12&&upgraded.speed>24&&upgraded.hp===2&&upgraded.state==='windup'&&upgraded.aiTime===.3,'Old enemies gain threat without resetting wounds or windup');check(minion.max<enemyStats(types[6]).max&&minion.guardId==='legacy-room'&&minion.hp>0,'Migrated small slimes stay small and retain their guard membership');
contentReset();heroes[0].hp=1;traps=[{x:p.x,y:p.y,r:0,c:0,owner:'cave',life:null,radius:46}];loot=[{type:'fungi',x:p.x,y:p.y}];step(.016);check(mode==='dead'&&heroes[0].hp===0&&!loot[0].got,'Lethal sap cannot be undone by a pickup in the same frame');
console.log('PASS: Armor/flanking/bomb counters, limited exit/fungi healing, wound persistence, old-save rebalance and lethal hazard ordering.');
