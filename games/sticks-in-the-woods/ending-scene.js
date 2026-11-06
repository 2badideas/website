/* Editable SVG scenery and character animation. No raster images or media. */
(() => {
  'use strict';
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  function create(){
    const stage=document.createElement('div');stage.className='woods-ending-stage';
    stage.setAttribute('role','img');
    stage.setAttribute('aria-label','A steady-eyed stump in a burnt forest. The view pulls back across fallen creatures and his legs disappear before he drops to the ground.');
    let seed=107;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
    // Match the two quadratic curves forming the visible ground's horizon.
    const groundY=x=>{
      const right=x>800,t=clamp(right?(x-800)/900:(x+100)/900);
      return right?(1-t)*(1-t)*464+2*(1-t)*t*409+t*t*458:(1-t)*(1-t)*470+2*(1-t)*t*421+t*t*464;
    };
    const branches=(x,y,s)=>`<path d="M${x} ${y}l${-4*s} ${-64*s} ${8*s} ${-61*s} ${-5*s} ${-51*s}m${2*s} ${81*s}l${-27*s} ${-27*s} ${-15*s} ${-36*s}m${42*s} ${27*s}l${24*s} ${-25*s} ${8*s} ${-26*s}" fill="none" stroke="#252326" stroke-width="${9*s}" stroke-linecap="square"/>`;
    let farTrees='',trees='',ash='',cracks='',bodies='',bark='',flecks='';
    for(let i=0;i<90;i++){
      const x=random()*1900-150,y=390+random()*110,s=.15+(y-390)/210;
      farTrees+=branches(x,y,s);
    }
    for(let i=0;i<27;i++){
      const side=i%2?1:-1,x=800+side*(310+random()*650),y=450+random()*440,s=.5+(y-450)/360;
      trees+=`<g data-tree="true" data-depth="${y}">`+branches(x,y,s);
      trees+=`<path d="M${x-3} ${y-12}l${-2*s} ${-70*s}" stroke="#ab6036" stroke-width="${s}" opacity=".5"/></g>`;
    }
    for(let i=0;i<420;i++){
      const x=random()*1700-50,y=420+random()*500,r=.4+(y-420)/130*random();
      ash+=`<ellipse cx="${x}" cy="${y}" rx="${r*2.4}" ry="${r*.5}" fill="${i%4?'#201f22':'#9c8770'}" opacity=".35"/>`;
    }
    for(let i=0;i<38;i++){
      const x=random()*1700-50,y=500+random()*450,s=(y-420)/500;
      cracks+=`<path d="M${x} ${y}l${-24*s} ${11*s} ${8*s} ${9*s} ${-26*s} ${10*s}m${18*s} ${-19*s}l${24*s} ${7*s}" fill="none" stroke="#17191b" stroke-width="${1.7*s}" opacity=".6"/>`;
    }
    // A fixed, depth-sorted tableau suggests the defeated forest without storing kills.
    const fallen=[];
    function addFallen(count,minY,range,zone){
      for(let i=0;i<count;i++){
        const distance=random(),x=random()*1800-100,horizon=groundY(x);
        const y=zone==='background'?horizon+12+distance*108:Math.max(minY+distance*range,horizon+15);
        if(Math.abs(x-800)<85&&Math.abs(y-565)<90)continue;
        const size=zone==='background'?.065+(y-horizon)/420:.1+(y-horizon)/200;
        fallen.push({x,y,s:size,type:i%6,flip:i%2?-1:1,zone});
      }
    }
    addFallen(86,430,450,'foreground');
    addFallen(250,424,108,'background');
    addFallen(90,495,135,'midground');
    fallen.sort((a,b)=>a.y-b.y);
    for(const b of fallen)bodies+=`<g data-fallen="${b.zone}" data-depth="${b.y+b.s*10}" transform="translate(${b.x} ${b.y}) scale(${b.s*b.flip} ${b.s})"><use x="-70" y="-40" width="140" height="80" href="#we-${['wolf','rabbit','deer','beaver','beetle','mushroom'][b.type]}"/></g>`;
    for(let i=0;i<24;i++){
      const x=-40+i*3.5,top=-110+random()*10,bottom=-29+random()*12;
      bark+=`<path d="M${x} ${top}q${random()*7-3} 17 ${random()*5-2} 34t${random()*5-2} ${bottom-top-34}" fill="none" stroke="${i%3?'#51382b':'#d1a56d'}" stroke-width="${i%4?.55:1.4}" opacity=".6"/>`;
    }
    for(let i=0;i<34;i++){
      const x=random()*1600,y=random()*820;
      flecks+=`<ellipse data-ash="${i}" cx="${x}" cy="${y}" rx="${i%4?1.1:1.8}" ry=".8" fill="${i%6?'#b9a99a':'#ecac62'}" opacity="${i%6?.22:.5}"/>`;
    }
    stage.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="we-sky" x2="0" y2="1"><stop stop-color="#24262d"/><stop offset=".52" stop-color="#6c5750"/><stop offset="1" stop-color="#b27b50"/></linearGradient>
      <radialGradient id="we-light"><stop stop-color="#ddb076" stop-opacity=".8"/><stop offset=".45" stop-color="#bc7d4f" stop-opacity=".3"/><stop offset="1" stop-color="#a96539" stop-opacity="0"/></radialGradient>
      <linearGradient id="we-ground" x2="0" y2="1"><stop stop-color="#746052"/><stop offset=".35" stop-color="#53483f"/><stop offset="1" stop-color="#242529"/></linearGradient>
      <linearGradient id="we-bark"><stop stop-color="#47352c"/><stop offset=".3" stop-color="#936c45"/><stop offset=".68" stop-color="#b18a59"/><stop offset="1" stop-color="#d0a574"/></linearGradient>
      <linearGradient id="we-leg"><stop stop-color="#533c2e"/><stop offset=".6" stop-color="#9e764f"/><stop offset="1" stop-color="#c49a69"/></linearGradient>
      <radialGradient id="we-vignette"><stop offset=".35" stop-color="#090e16" stop-opacity="0"/><stop offset="1" stop-color="#090e16" stop-opacity=".65"/></radialGradient>
      <linearGradient id="we-fog" x2="0" y2="1"><stop stop-color="#a69587" stop-opacity="0"/><stop offset=".5" stop-color="#b8a28a" stop-opacity=".17"/><stop offset="1" stop-color="#a69587" stop-opacity="0"/></linearGradient>
      <clipPath id="we-body-clip"><path d="M-43-113Q-51-72-42-25Q0-8 41-25Q51-65 43-113Z"/></clipPath>
      <symbol id="we-wolf" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="8" rx="51" ry="10" fill="#16181c" opacity=".65"/>
        <path d="M-54 2Q-72-7-67-15L-43-7Q-34-33-10-25Q14-28 30-14L32-31L43-17L54-14L65-3L56 2L32 5L21 11L-14 11L-31 7Z" fill="#716c65" stroke="#302f30" stroke-width="1.4"/>
        <path d="M-30-11l7-7 4 4 9-7 6 6 7-6 10 12M-37-5l5 8M7-7l13 11 19 2" fill="none" stroke="#989183" stroke-width="2"/>
        <path d="M43-8l8 1" stroke="#302c2c" stroke-width="1.5"/><path d="M-14 5l-7 8 18 0M20 3l8 9 14-1" fill="none" stroke="#5a5651" stroke-width="6" stroke-linecap="round"/>
      </symbol>
      <symbol id="we-rabbit" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="9" rx="31" ry="7" fill="#16181c" opacity=".6"/><path d="M-30 4Q-39-2-25-14Q-9-25 9-13Q16-21 20-30Q28-40 28-33L23-14Q29-21 37-24Q45-23 39-18L28-6Q37 0 29 7L-8 11Z" fill="#9b9181" stroke="#49433e"/>
        <path d="M-20-8Q-8-14 2-7M17 1l7 1M-7 7L-15 12 0 11" fill="none" stroke="#5a544d" stroke-width="1.8"/>
      </symbol>
      <symbol id="we-deer" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="11" rx="60" ry="10" fill="#16181c" opacity=".65"/><path d="M-51 3Q-62-25-29-26Q-1-32 19-12L26-16L33-31L36-13L48-12L62 0L52 7L25 5L1 11L-29 11Z" fill="#826953" stroke="#423b35" stroke-width="1.3"/>
        <path d="M-20 0l-18 13 35 0M10 2l13 12 26-1" fill="none" stroke="#68523f" stroke-width="5" stroke-linecap="round"/>
        <path d="M34-15L24-30 22-48M27-33l-10-6M24-30l11-8M40-14L47-28 43-43M46-30l12-8M46-27l-11-5" stroke="#a68c6a" fill="none" stroke-width="2.1"/>
        <path d="M44-7l7 1" stroke="#393431" stroke-width="1.5"/>
      </symbol>
      <symbol id="we-beaver" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="11" rx="49" ry="10" fill="#16181c" opacity=".65"/><path d="M-29 0Q-53-19-66-6Q-72 6-48 11L-22 8Z" fill="#3b3530" stroke="#635244"/>
        <path d="M-37-3Q-40-29-9-30Q16-29 25-15Q47-17 49 0Q51 10 27 11L-19 12Z" fill="#735944" stroke="#392f2a"/><path d="M-29-9l5-5 3 3 6-5 3 3 8-5 4 4 7-4 6 4" fill="none" stroke="#a17b55" stroke-width="1.5"/>
        <circle cx="30" cy="-15" r="5" fill="#69503f"/><path d="M34-3l6 0M-56-8l13 15M-63-3l11 12M-48-10l12 14" stroke="#2e2a27" fill="none"/><path d="M12 7l9 7 13-1" stroke="#514133" fill="none" stroke-width="5"/>
      </symbol>
      <symbol id="we-beetle" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="9" rx="25" ry="6" fill="#16181c"/><path d="M-15-3l-13-8M-15 2l-14 3M-11 6l-9 9M6-5l8-12M9 1l18-2M7 7l15 8" stroke="#52473b" fill="none" stroke-width="2"/>
        <ellipse cx="-1" cy="0" rx="17" ry="12" fill="#62533f" stroke="#272a2c" stroke-width="1.7"/><path d="M-1-11Q4-2-1 11M-13-3q4-6 9-6" stroke="#aa8d5f" fill="none" stroke-width="1.2"/><ellipse cx="19" cy="2" rx="8" ry="7" fill="#3b3831"/>
      </symbol>
      <symbol id="we-mushroom" viewBox="-70 -40 140 80" overflow="visible">
        <ellipse cy="10" rx="30" ry="7" fill="#16181c" opacity=".6"/><path d="M-14-4L-17 8Q0 17 17 8L13-4Z" fill="#ae9c7f" stroke="#5a4e43"/><path d="M-29-6Q-26-32 0-32Q24-32 29-6Q1 4-29-6Z" fill="#71565b" stroke="#423b3d"/>
        <ellipse cx="-11" cy="-22" rx="6" ry="3" fill="#b19b8c"/><ellipse cx="12" cy="-15" rx="4" ry="3" fill="#b19b8c"/><path d="M-10 5l5 0M6 5l5 0M-24-5Q0-12 24-5" stroke="#55453b" fill="none"/>
      </symbol>
    </defs>
    <rect x="-2000" y="-2000" width="5600" height="5000" fill="url(#we-sky)"/>
    <ellipse cx="1270" cy="300" rx="630" ry="400" fill="url(#we-light)"/>
    <path d="M-100 415L40 300 100 323 280 250 370 304 550 270 700 342 870 260 1020 312 1220 236 1400 298 1680 210V600H-100Z" fill="#43414a" opacity=".65"/>
    <path d="M-100 443L90 350 250 410 440 344 680 426 900 353 1080 392 1350 330 1680 410V600H-100Z" fill="#4b4244"/>
    <g opacity=".38">${farTrees}</g>
    <path data-terrain="true" d="M-100 470Q350 421 800 464Q1250 409 1700 458V1400H-100Z" fill="url(#we-ground)"/>
    <path d="M-100 530Q340 456 660 490T1700 512" fill="none" stroke="#a08a73" stroke-width="3" opacity=".25"/>
    <g>${ash}${cracks}</g><g data-depth-layer="true">${trees}${bodies}</g>
    <g data-hero="true" data-depth="588" transform="translate(800 560)">
      <g data-impact-dust="true" opacity="0" fill="#b2a18a"><ellipse cx="-27" cy="24" rx="12" ry="4"/><ellipse cx="25" cy="24" rx="11" ry="4"/><ellipse cx="-46" cy="25" rx="8" ry="3"/><ellipse cx="47" cy="25" rx="8" ry="3"/></g>
      <ellipse cx="1" cy="28" rx="63" ry="13" fill="#11171b" opacity=".7"/>
      <path data-leg-shadow="left" fill="none" stroke="#47372d" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"/><path data-leg="left" stroke-linejoin="round" fill="none" stroke="url(#we-leg)" stroke-width="13" stroke-linecap="round"/>
      <path data-leg-shadow="right" fill="none" stroke="#47372d" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"/><path data-leg="right" stroke-linejoin="round" fill="none" stroke="url(#we-leg)" stroke-width="13" stroke-linecap="round"/>
      <path data-arm-shadow="left" fill="none" stroke="#47372d" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/><path data-arm="left" fill="none" stroke="url(#we-leg)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
      <g data-torso="true">
        <path d="M-43-113Q-51-72-42-25Q0-8 41-25Q51-65 43-113Z" fill="url(#we-bark)" stroke="#47372d" stroke-width="1.5"/>
        <g clip-path="url(#we-body-clip)">${bark}<path d="M-39-76l12-6 7 13-3 19-15 8Z" fill="#262d31" opacity=".6"/><path d="M27-45l9-4 7 18-17 3Z" fill="#333133" opacity=".5"/></g>
        <ellipse cy="-113" rx="43" ry="13" fill="#bd9b6c" stroke="#644a34" stroke-width="1.4"/>
        <ellipse cy="-113" rx="34" ry="9" fill="none" stroke="#735338" stroke-width="1.4"/>
        <ellipse cy="-113" rx="25" ry="6.5" fill="none" stroke="#89633f" stroke-width="1.2"/>
        <ellipse cy="-113" rx="14" ry="3.4" fill="none" stroke="#6c4d36" stroke-width="1"/>
        <path d="M9-126l-5 12 14 4M-33-119l13 7M28-109l12 1" stroke="#634b35" fill="none" stroke-width="1.2"/>
        <g data-expression="steady">
          <path d="M-31-78L-11-78M11-78L31-78" fill="none" stroke="#42352b" stroke-width="3.2" stroke-linecap="round"/>
          <g data-eyes="true">
            <path d="M-31-69Q-22-73-11-69Q-12-57-22-57Q-31-58-31-69Z" fill="#252521"/><path d="M11-69Q22-73 31-69Q31-58 22-57Q12-57 11-69Z" fill="#252521"/>
            <ellipse cx="-22" cy="-65" rx="3" ry="4.4" fill="#141c1d"/><ellipse cx="22" cy="-65" rx="3" ry="4.4" fill="#141c1d"/>
            <circle cx="-23.3" cy="-67" r="1.2" fill="#e6d7ac"/><circle cx="20.7" cy="-67" r="1.2" fill="#e6d7ac"/>
          </g>
          <path d="M-31-70L-11-70M11-70L31-70" stroke="#614832" stroke-width="2"/>
          <ellipse data-mouth="true" cy="-43" rx="5.5" ry="2" fill="#342b25"/><path data-smile="true" d="M-5.5-43Q0-43 5.5-43" fill="none" stroke="#342b25" stroke-width="2.2" stroke-linecap="round" opacity="0"/>
          <path d="M15-49l11-6M15-47l12-6" stroke="#4c3d30" stroke-width=".8"/><path d="M-7-40l13 0" stroke="#c29b67" opacity=".6"/>
        </g>
      </g>
      <path data-arm-shadow="right" fill="none" stroke="#47372d" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/><path data-arm="right" fill="none" stroke="url(#we-leg)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
      <path data-hand="left" fill="none" stroke="#c49a69" stroke-width="2" stroke-linecap="round"/><path data-hand="right" fill="none" stroke="#c49a69" stroke-width="2" stroke-linecap="round"/>
    </g>
    <rect x="-300" y="280" width="2200" height="190" fill="url(#we-fog)" pointer-events="none"/>
    <g data-drifting-ash="true">${flecks}</g>
    <rect x="-2000" y="-2000" width="5600" height="5000" fill="none"/>
    </svg><div class="woods-ending-shade"></div>`;
    // Trees, creatures and the stump share one ground-depth ordering.
    // A nearby trunk must cover bodies farther away, while nearer bodies cover it.
    const depthLayer=stage.querySelector('[data-depth-layer]');
    depthLayer.append(stage.querySelector('[data-hero]'));
    depthLayer.append(...[...depthLayer.children].sort((a,b)=>Number(a.dataset.depth)-Number(b.dataset.depth)));
    const svg=stage.querySelector('svg'),torso=stage.querySelector('[data-torso]'),mouth=stage.querySelector('[data-mouth]'),eyes=stage.querySelector('[data-eyes]');
    const leftLeg=stage.querySelector('[data-leg="left"]'),rightLeg=stage.querySelector('[data-leg="right"]');
    const leftArm=stage.querySelector('[data-arm="left"]'),rightArm=stage.querySelector('[data-arm="right"]'),drift=stage.querySelector('[data-drifting-ash]');
    function setTime(t,reduced){
      stage.style.opacity=t<4||t>=37?'0':String(ease((t-4)/3));
      const pull=ease((t-12)/20);
      const width=reduced?1600:140*Math.pow(1600/140,pull),height=width*9/16,cy=reduced?450:mix(493,450,pull);
      svg.setAttribute('viewBox',`${800-width/2} ${cy-height/2} ${width} ${height}`);
      // Legs vanish first. An accelerating drop lands in 0.32 seconds.
      const fall=clamp((t-32)/.32),contact=t-32.32;
      const rebound=!reduced&&contact>0&&contact<.42?-1.5*Math.sin(contact/.42*Math.PI)*Math.exp(-contact*7):0;
      const drop=40*fall*fall+rebound;
      const squash=!reduced&&contact>=0?.045*Math.exp(-contact*11):0;
      torso.setAttribute('transform',`translate(0 ${drop}) translate(0 -16) scale(${1+squash*.5} ${1-squash}) translate(0 16)`);
      mouth.setAttribute('ry','1.3');
      const smile=ease((t-33.8)/1.2),smilePath=stage.querySelector('[data-smile]');
      mouth.setAttribute('opacity',String(1-smile));
      smilePath.setAttribute('opacity',String(smile));
      smilePath.setAttribute('d',`M${-5.5-smile*3.5} ${-43-smile*2}Q0 ${-43+smile*7} ${5.5+smile*3.5} ${-43-smile*2}`);
      stage.querySelector('[data-expression]').setAttribute('data-expression',smile>0?'smiling':'steady');
      const blink=!reduced&&((t>9.1&&t<9.3)||(t>23.1&&t<23.3));
      eyes.setAttribute('transform',blink?'translate(0 -65) scale(1 .15) translate(0 65)':'');
      const armFall=clamp((t-32-.07)/.32),armDrop=40*armFall*armFall+rebound;
      const swing=contact>0&&contact<.6?Math.sin(contact/.6*Math.PI)*Math.exp(-contact*2):0;
      for(const [side,leg,arm] of [[-1,leftLeg,leftArm],[1,rightLeg,rightArm]]){
        const name=side<0?'left':'right',shadow=stage.querySelector(`[data-leg-shadow="${name}"]`);
        const legPath=`M${side*23} -22L${side*26} 4L${side*35} 26l${side*10} 1`;
        leg.setAttribute('d',legPath);shadow.setAttribute('d',legPath);
        leg.style.display=shadow.style.display=t>=32?'none':'';
        const handX=side*(58+swing*10),handY=-20+armDrop;
        const armPath=`M${side*42} ${-85+drop}L${side*(58+swing*6)} ${-48+armDrop}L${handX} ${handY}`;
        arm.setAttribute('d',armPath);
        stage.querySelector(`[data-arm-shadow="${name}"]`).setAttribute('d',armPath);
        stage.querySelector(`[data-hand="${name}"]`).setAttribute('d',`M${handX} ${handY}l${side*7} 1m${-side*7} -1l${side*5} 4m${-side*5} -4l${side*1} 5`);
      }
      const dust=stage.querySelector('[data-impact-dust]');
      dust.setAttribute('opacity',!reduced&&contact>=0&&contact<.65?String(.4*(1-contact/.65)):'0');
      dust.setAttribute('transform',`translate(0 ${Math.max(0,contact)*-4}) scale(${1+Math.max(0,Math.min(contact,.65))*1.8} 1)`);
      drift.setAttribute('transform',reduced?'':`translate(${Math.sin(t*.15)*8} ${-t*.45})`);
    }
    setTime(0,false);
    return {element:stage,setTime};
  }
  window.WoodsEndingScene={create};
})();
