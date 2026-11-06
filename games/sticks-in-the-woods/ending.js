/* Silent HTML/SVG ending. No images, audio, network APIs or persistence. */
(() => {
  'use strict';
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  function create({stats,onReturn}) {
    const root=document.createElement('section');
    root.className='woods-ending';root.setAttribute('aria-label','The end of the woods');
    root.innerHTML=`<section class="woods-ending-results" hidden aria-label="Final statistics"><h2>THE WOODS ARE QUIET.</h2><dl></dl><p class="woods-ending-credit">Made by 2badIdeas</p><button class="woods-ending-return" hidden>Return to title</button></section>
      <div class="woods-ending-tools"><button class="woods-ending-skip">Skip to stats</button></div>`;
    const scene=window.WoodsEndingScene.create();root.prepend(scene.element);document.body.append(root);
    const results=root.querySelector('.woods-ending-results');
    const skip=root.querySelector('.woods-ending-skip'),back=root.querySelector('.woods-ending-return');
    for(const [label,value] of [['Waves cleared',stats.waves],['Creatures defeated',stats.kills],['Final score',stats.score],['Time survived',`${Math.floor(stats.seconds/60)}m ${Math.floor(stats.seconds%60)}s`],['XP earned',stats.xp]]) {
      const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=label;dd.textContent=typeof value==='number'?value.toLocaleString('en-US'):value;row.append(dt,dd);results.querySelector('dl').append(row);
    }
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed=0,previous=null,disposed=false,finished=false;
    const ready=Promise.resolve();
    function finish(){
      if(finished)return;finished=true;skip.hidden=true;
      results.hidden=false;results.style.opacity='0';
    }
    function frame(now){
      if(disposed)return;
      if(previous!==null&&!document.hidden)elapsed+=Math.min(.1,(now-previous)/1000);previous=now;
      if(elapsed>=39)finish();
      if(finished){results.style.opacity=String(ease((elapsed-39)/3));if(elapsed>=44&&back.hidden){back.hidden=false;back.focus({preventScroll:true});}}
      scene.setTime(elapsed,reduced);
    }
    function visibility(){previous=null;}
    document.addEventListener('visibilitychange',visibility);
    skip.onclick=()=>{elapsed=39;finish();};
    function dispose(){
      if(disposed)return;disposed=true;
      document.removeEventListener('visibilitychange',visibility);root.remove();
    }
    back.onclick=()=>{dispose();onReturn();};
    return {frame,dispose,ready};
  }
  window.WoodsEnding={create};
})();
