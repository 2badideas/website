/* Local canvas ending and original Web Audio score. No network or persistence. */
(() => {
  'use strict';
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const ease = n => { n=clamp(n); return n*n*(3-2*n); };
  const TAU = Math.PI*2;
  function create({stats,audio,isMuted,toggleMute,onReturn}) {
    const root=document.createElement('section');
    root.className='woods-ending';root.setAttribute('aria-label','The end of the woods');
    root.innerHTML=`<canvas aria-label="A breathing stump in a burnt wasteland, surrounded by fallen woodland creatures"></canvas>
      <section class="woods-ending-results" hidden aria-label="Final statistics"><h2>THE WOODS ARE QUIET.</h2><dl></dl><p class="woods-ending-credit">Made by 2badIdeas</p><button class="woods-ending-return" hidden>Return to title</button></section>
      <div class="woods-ending-tools"><button class="woods-ending-sound"></button><button class="woods-ending-skip">Skip to stats</button></div>`;
    document.body.append(root);
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),results=root.querySelector('.woods-ending-results');
    const soundButton=root.querySelector('.woods-ending-sound'),skip=root.querySelector('.woods-ending-skip'),back=root.querySelector('.woods-ending-return');
    for(const [label,value] of [['Waves cleared',stats.waves],['Creatures defeated',stats.kills],['Final score',stats.score],['Time survived',`${Math.floor(stats.seconds/60)}m ${Math.floor(stats.seconds%60)}s`],['XP earned',stats.xp]]) {
      const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=label;dd.textContent=typeof value==='number'?value.toLocaleString('en-US'):value;row.append(dt,dd);results.querySelector('dl').append(row);
    }
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed=0,previous=null,disposed=false,finished=false,noteAt=1,breathAt=0,phrase=0,master=null,coda=false;
    const voices=new Set();
    // Deterministic scenery keeps the reveal still and avoids recording a large kill history.
    let seed=100;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
    const bodies=Array.from({length:Math.min(stats.kills,180)},(_,i)=>{
      const angle=random()*TAU,r=90+Math.sqrt(random())*760;
      return {x:Math.cos(angle)*r,y:Math.sin(angle)*r*.48+65,angle:random()*.9-.45,type:i%6,size:10+random()*12};
    }).sort((a,b)=>a.y-b.y);
    const stumps=Array.from({length:42},()=>({x:(random()-.5)*2000,y:(random()-.5)*900,r:8+random()*15}));
    try{if(audio){master=audio.createGain();master.gain.value=0;master.connect(audio.destination);}}catch{master=null;}
    function stopVoices(){for(const node of voices){try{node.stop();}catch{}}voices.clear();}
    function voice(node,gain){
      voices.add(node);node.connect(gain);gain.connect(master);
      node.onended=()=>{voices.delete(node);node.disconnect();gain.disconnect();};
    }
    function note(freq,duration,volume){
      if(!master||audio.state!=='running')return;
      const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;
      g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      voice(o,g);o.start(now);o.stop(now+duration+.02);
    }
    function breath(volume){
      if(!master||audio.state!=='running')return;
      const now=audio.currentTime,buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*1.25),audio.sampleRate),data=buffer.getChannelData(0);
      let smooth=0;for(let i=0;i<data.length;i++){smooth=smooth*.87+(Math.random()*2-1)*.13;data[i]=smooth;}
      const source=audio.createBufferSource(),g=audio.createGain();source.buffer=buffer;
      g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+.2);g.gain.linearRampToValueAtTime(volume*.35,now+.65);g.gain.linearRampToValueAtTime(0,now+1.25);
      voice(source,g);source.start(now);source.stop(now+1.26);
    }
    function score(t){
      if(!master)return;
      master.gain.setTargetAtTime(isMuted()||document.hidden?0:.65*clamp((37-t)/2),audio.currentTime,.06);
      if(isMuted()||document.hidden)return;
      if(t>=32&&!coda){coda=true;note(146.83,4.8,.055);}
      if(t<32&&t>=noteAt){
        const swell=clamp((t-10)/23),melody=[220,261.63,329.63,293.66,220,196,261.63,164.81];
        note(melody[phrase%melody.length],1.9-swell*.9,.025+swell*.055);
        if(phrase%4===0)note(110,2.8,.018+swell*.03);
        phrase++;noteAt=t+1.15-swell*.78;
      }
      if(t<37&&t>=breathAt){breath(t<12?.75:.35);breathAt=t+2.15;}
    }
    function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
    function line(points,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
    function fallen(b){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);const r=b.size;
      ellipse(0,5,r*1.8,r*.5,'#0d0c0b');
      const colors=['#655144','#75644e','#63535c','#82776b','#615c43','#72553c'];
      ellipse(0,0,r*1.4,r*.62,colors[b.type]);
      if(b.type===1){ellipse(-r*.7,-r*.6,r*.25,r*.85,'#75644e');ellipse(-r*.1,-r*.6,r*.25,r*.85,'#75644e');}
      else if(b.type===2){ellipse(0,-r*.3,r*1.1,r*.5,'#6d5667');ellipse(-r*.6,-r*.45,r*.16,r*.1,'#b49c92');}
      else if(b.type===3||b.type===4){line([[-r*.8,-r*.3],[-r,-r*.9],[-r*.5,-r*.5]],r*.18,colors[b.type]);}
      else if(b.type===5){ellipse(r*1.3,0,r*.65,r*.33,'#3d3029');}
      for(const side of [-1,1])line([[side*r*.6,r*.2],[side*r,r*.8]],r*.18,colors[b.type]);
      line([[-r*.9,-r*.08],[-r*.65,r*.06]],1,'#241f1c');ctx.restore();
    }
    function character(t){
      const sit=ease((t-32)/5),breathing=Math.sin(t*3.1)*(.65-sit*.3),drop=sit*21;
      ctx.save();ctx.translate(0,drop);
      ellipse(0,39-drop,37,10,'#11100e');
      for(const side of [-1,1]){
        const knee=side*(12+sit*19);
        line([[side*12,17],[knee,31-sit*10],[side*(18+sit*22),38-drop]],9,'#573b29');
        line([[side*12,17],[knee,31-sit*10],[side*(18+sit*22),38-drop]],5,'#9a714b');
        line([[side*20,-8+breathing],[side*(30-sit*2),10],[side*(31-sit*9),23-sit*4]],7,'#8c6544');
      }
      const wood=ctx.createLinearGradient(-22,0,23,0);wood.addColorStop(0,'#4d3428');wood.addColorStop(.4,'#b0875d');wood.addColorStop(1,'#65452f');
      ctx.fillStyle=wood;ctx.beginPath();ctx.moveTo(-20,-23+breathing);ctx.bezierCurveTo(-24,-4,-22,17,-17,20);ctx.quadraticCurveTo(0,26,18,19);ctx.bezierCurveTo(23,7,24,-8,20,-23+breathing);ctx.closePath();ctx.fill();
      ellipse(0,-22+breathing,20,7,'#b08a61');ellipse(0,-22+breathing,14,4.5,'#765438');ellipse(0,-22+breathing,9,2.5,'#c29b70');
      line([[-16,-13],[-14,12]],1.5,'#433127');line([[13,-13],[15,15]],1.5,'#d0a878');line([[-3,-17],[-5,-8]],1,'#62422f');
      for(const side of [-1,1]){
        ellipse(side*7,-4+breathing,3.2,3.7,'#241e18');ellipse(side*7-.7,-5+breathing,1,1.2,'#ddd0aa');
        line([[side*4,-10+breathing],[side*11,-9+breathing]],1.8,'#4c3629');
      }
      ellipse(0,9+breathing,2.8,2.2+Math.max(0,Math.sin(t*3.1))*2,'#32241e');
      line([[7,12],[12,9]],1,'#594233');ctx.restore();
    }
    function draw(t){
      const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
      if(t<4||t>=37)return;
      const reveal=ease((t-12)/20),wide=Math.min(w/1000,h/650),close=Math.min(w/42,h/48),zoom=reduced?wide:close*Math.pow(wide/close,reveal);
      ctx.save();ctx.globalAlpha=ease((t-4)/3);
      const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#171515');sky.addColorStop(1,'#494035');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      ctx.translate(w/2,h*.51);ctx.scale(zoom,zoom);ctx.translate(0,reduced?0:6*(1-reveal));
      ctx.fillStyle='#342e27';ctx.fillRect(-2400,-1600,4800,3200);
      ctx.save();ctx.globalAlpha*=ease((t-12)/8);
      for(const s of stumps){ellipse(s.x,s.y,s.r*2,s.r*.6,'#24221e');line([[s.x,s.y],[s.x-3,s.y-s.r*2]],s.r*.7,'#25231f');}
      // Motionless bodies are revealed by the camera rather than appearing during the shot.
      for(const b of bodies)if(b.y<0)fallen(b);
      ctx.restore();character(t);
      ctx.save();ctx.globalAlpha*=ease((t-12)/8);
      for(const b of bodies)if(b.y>=0)fallen(b);
      ctx.restore();
      if(!reduced)for(let i=0;i<22;i++){const x=Math.sin(i*12.7)*690,y=((i*61-t*9)%620+620)%620-310;ellipse(x,y,1.1,1.8,'#c47d3a88');}
      ctx.restore();
      const shade=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.68);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#000b');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
    }
    function finish(){
      if(finished)return;finished=true;stopVoices();if(master)master.gain.value=0;
      skip.hidden=true;results.hidden=false;results.style.opacity='0';
    }
    function frame(now){
      if(disposed)return;
      if(previous!==null&&!document.hidden)elapsed+=Math.min(.1,(now-previous)/1000);previous=now;
      soundButton.textContent=isMuted()?'Sound off':'Sound on';
      if(elapsed>=37&&!finished){stopVoices();if(master)master.gain.value=0;}
      if(elapsed>=39)finish();
      if(finished){results.style.opacity=String(ease((elapsed-39)/3));if(elapsed>=44&&back.hidden){back.hidden=false;back.focus({preventScroll:true});}}
      else if(elapsed<37)score(elapsed);
      draw(elapsed);
    }
    function visibility(){previous=null;if(master&&document.hidden){master.gain.value=0;stopVoices();}}
    document.addEventListener('visibilitychange',visibility);
    soundButton.onclick=()=>{toggleMute();if(master&&isMuted()){master.gain.value=0;stopVoices();}else if(audio?.state==='suspended')audio.resume().catch(()=>{});};
    skip.onclick=()=>{elapsed=39;finish();};
    function dispose(){if(disposed)return;disposed=true;stopVoices();master?.disconnect();document.removeEventListener('visibilitychange',visibility);root.remove();}
    back.onclick=()=>{dispose();onReturn();};
    return {frame,dispose};
  }
  window.WoodsEnding={create};
})();
