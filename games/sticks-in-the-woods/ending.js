/* Silent painted animatic. Local artwork only; no audio, network APIs or persistence. */
(() => {
  'use strict';
  const assetBase=new URL('./assets/ending/',document.currentScript?.src||location.href);
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  function create({stats,onReturn}) {
    const root=document.createElement('section');
    root.className='woods-ending';root.setAttribute('aria-label','The end of the woods');
    root.innerHTML=`<canvas aria-label="A painted close-up of an exhausted stump, a burnt wasteland and fallen creatures, then the stump seated in ash"></canvas>
      <p class="woods-ending-loading" role="status">Loading scene…</p>
      <section class="woods-ending-results" hidden aria-label="Final statistics"><h2>THE WOODS ARE QUIET.</h2><dl></dl><p class="woods-ending-credit">Made by 2badIdeas</p><button class="woods-ending-return" hidden>Return to title</button></section>
      <div class="woods-ending-tools"><button class="woods-ending-skip">Skip to stats</button></div>`;
    document.body.append(root);
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),results=root.querySelector('.woods-ending-results');
    const loading=root.querySelector('.woods-ending-loading'),skip=root.querySelector('.woods-ending-skip'),back=root.querySelector('.woods-ending-return');
    for(const [label,value] of [['Waves cleared',stats.waves],['Creatures defeated',stats.kills],['Final score',stats.score],['Time survived',`${Math.floor(stats.seconds/60)}m ${Math.floor(stats.seconds%60)}s`],['XP earned',stats.xp]]) {
      const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=label;dd.textContent=typeof value==='number'?value.toLocaleString('en-US'):value;row.append(dt,dd);results.querySelector('dl').append(row);
    }
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed=0,previous=null,disposed=false,finished=false,loaded=false;
    const images={};
    const ready=Promise.all(['close','wide','sit'].map(name=>new Promise((resolve,reject)=>{
      const image=new Image();images[name]=image;
      image.onload=()=>resolve();image.onerror=()=>reject(new Error('Ending artwork unavailable'));
      image.src=new URL('ash-'+name+'.webp',assetBase).href;
    }))).then(()=>{if(!disposed){loaded=true;previous=null;loading.hidden=true;}}).catch(()=>{
      if(!disposed&&!finished)loading.textContent='Artwork could not load. You can still skip to your stats.';
    });
    function draw(t){
      const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
      if(!loaded||t<4||t>=37)return;
      // Preserve the full landscape reveal on phones; the black bars are deliberate.
      const sw=Math.min(w,h*16/9),sh=sw*9/16,x=(w-sw)/2,y=(h-sh)/2;
      ctx.save();ctx.beginPath();ctx.rect(x,y,sw,sh);ctx.clip();
      const fade=ease((t-4)/3);
      function shot(image,opacity,scale,anchor=.5){
        if(opacity<=0)return;
        const fit=Math.max(sw/image.naturalWidth,sh/image.naturalHeight)*scale;
        const iw=image.naturalWidth*fit,ih=image.naturalHeight*fit;
        ctx.globalAlpha=opacity*fade;
        ctx.drawImage(image,x+(sw-iw)/2,y+(sh-ih)*anchor,iw,ih);
      }
      const pullback=ease((t-12)/20),wideFade=ease((t-12)/2.5),sitFade=ease((t-32)/3);
      const breath=reduced?0:Math.sin((t-4)*2.8)*.0025;
      if(t<14.5)shot(images.close,1,1.035-(reduced?0:.025*ease((t-4)/10))+breath,.44);
      if(t>=12)shot(images.wide,wideFade,reduced?1:2.25-1.25*pullback,.6);
      if(t>=32)shot(images.sit,sitFade,1,.6);
      ctx.restore();ctx.globalAlpha=1;
    }
    function finish(){
      if(finished)return;finished=true;loading.hidden=true;skip.hidden=true;
      results.hidden=false;results.style.opacity='0';
    }
    function frame(now){
      if(disposed)return;
      if(previous!==null&&!document.hidden&&(loaded||finished))elapsed+=Math.min(.1,(now-previous)/1000);previous=now;
      if(elapsed>=39)finish();
      if(finished){results.style.opacity=String(ease((elapsed-39)/3));if(elapsed>=44&&back.hidden){back.hidden=false;back.focus({preventScroll:true});}}
      draw(elapsed);
    }
    function visibility(){previous=null;}
    document.addEventListener('visibilitychange',visibility);
    skip.onclick=()=>{elapsed=39;finish();};
    function dispose(){
      if(disposed)return;disposed=true;
      for(const image of Object.values(images)){image.onload=null;image.onerror=null;}
      document.removeEventListener('visibilitychange',visibility);root.remove();
    }
    back.onclick=()=>{dispose();onReturn();};
    return {frame,dispose,ready};
  }
  window.WoodsEnding={create};
})();
