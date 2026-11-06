/* Original, quiet piano-style score synthesized locally. No recordings or requests. */
(() => {
  'use strict';
  const clamp=n=>Math.max(0,Math.min(1,n));
  function create({audio,isMuted}) {
    let context=audio,owned=false,master,disposed=false,stopped=false,index=0,lastTime=null,lastAudioTime=0;
    const voices=new Set(),samples=new Map();
    try {
      if(!context){context=new(window.AudioContext||window.webkitAudioContext)();owned=true;}
      if(context.state==='closed')throw Error('Audio closed');
      master=context.createGain();master.gain.value=0;master.connect(context.destination);
    }catch{return {available:false,frame(){},refresh(){},pause(){},stop(){},dispose(){}};}
    // Eight unhurried four-second bars, with a sparse melody and rolled chords.
    const chords=[[48,60,64,67,74],[45,57,60,64,67],[41,57,60,64,67],[43,55,62,67,69],
      [48,60,64,67,69],[45,57,60,64,67],[41,57,60,64,67],[48,60,64,67,74]];
    const melody=[[67,69],[72,71],[69,67],[67,62],[64,67],[69,72],[69,67],[64,60]];
    const events=[];
    chords.forEach((chord,bar)=>{
      const at=.8+bar*4;
      events.push({at,note:chord[0],volume:.085});
      chord.slice(1).forEach((note,i)=>events.push({at:at+i*.9,note,volume:.095}));
      melody[bar].forEach((note,i)=>events.push({at:at+.45+i*2,note,volume:.13}));
    });
    events.sort((a,b)=>a.at-b.at);
    function sample(note){
      if(samples.has(note))return samples.get(note);
      const rate=22050,duration=4.6,buffer=context.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0);
      const frequency=440*Math.pow(2,(note-69)/12),partials=[[1,.68,2.1],[2,.18,1.35],[3,.065,.95],[4,.025,.7],[5,.01,.5]];
      // Rounded hammer attack and independently decaying harmonics; no noise source.
      for(let i=0;i<data.length;i++){
        const t=i/rate,attack=1-Math.exp(-t/.018),tail=clamp((duration-t)/.25);
        let value=0;
        for(const [harmonic,amplitude,decay] of partials)value+=Math.sin(2*Math.PI*frequency*harmonic*t)*amplitude*Math.exp(-t/decay);
        value+=Math.sin(2*Math.PI*frequency*1.0015*t)*.035*Math.exp(-t/2.7);
        data[i]=value*attack*tail*.7;
      }
      samples.set(note,buffer);return buffer;
    }
    function play(event){
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=sample(event.note);gain.gain.value=event.volume;
      source.connect(gain);gain.connect(master);voices.add(source);
      source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start();
    }
    function silence(){
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(0,context.currentTime,.02);
      for(const source of voices){try{source.stop(context.currentTime+.1);}catch{}}
      voices.clear();
    }
    function refresh(){
      if(disposed||stopped)return;
      if(isMuted())silence();
      else if(context.state==='suspended')context.resume().catch(()=>{});
    }
    function frame(t){
      if(disposed||stopped)return;
      const now=context.currentTime;
      // Seeking/fast-forwarding never replays the notes that were skipped.
      const seeking=lastTime!==null&&(t-lastTime)-(now-lastAudioTime)>.08;
      lastTime=t;lastAudioTime=now;
      const quiet=isMuted()||document.hidden;
      const fade=clamp((t-.4)/1.8)*clamp((37-t)/2.5);
      master.gain.setTargetAtTime(quiet?0:.34*fade,now,.06);
      while(index<events.length&&events[index].at<=t){
        const event=events[index++];
        if(!quiet&&!seeking&&context.state==='running'&&t-event.at<.15)play(event);
      }
    }
    function stop(){if(stopped||disposed)return;stopped=true;silence();}
    function dispose(){if(disposed)return;stop();disposed=true;samples.clear();if(owned)context.close().catch(()=>{});else setTimeout(()=>master.disconnect(),150);}
    refresh();
    return {available:true,frame,refresh,pause:silence,stop,dispose};
  }
  window.WoodsEndingMusic={create};
})();
