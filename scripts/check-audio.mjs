import assert from 'node:assert/strict';
import { createPortfolioAudio } from '../src/audio.js';
import { createHoverSamples } from '../src/hover-sound.js';
const hoverSamples=createHoverSamples(24000);
const hoverPeak=Math.max(...hoverSamples.map(Math.abs))*.2;
assert.ok(hoverPeak>.03&&hoverPeak<.07,'Hover must remain gently audible; catch the previous -60 dB regression');
assert.equal(hoverSamples[0],0,'Soft attack avoids a discontinuity');
class Target {
  events=new Map();dataset={};attributes={};hidden=true;textContent='';
  addEventListener(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);}
  removeEventListener(name,fn){this.events.get(name)?.delete(fn);}
  async emit(name,event={}){for(const fn of this.events.get(name)||[])await fn(event);}
  setAttribute(name,value){this.attributes[name]=value;}
  querySelector(){return this.label ||= new Target();}
}
const parameter=()=>({value:0,cancelAndHoldAtTime(){},cancelScheduledValues(){},setValueAtTime(value){this.value=value;},linearRampToValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});
function fixture({fail=false,delay=false,unsupported=false}={}){
  const doc=new Target();doc.hidden=false;doc.documentElement=new Target();
  const button=new Target(),video=new Target(),env=new Target();video.paused=true;video.ended=false;
  let requests=0,contexts=0,release,finish;
  const wait=new Promise(r=>release=r), timers=new Map(),nodes=[];
  const opening={active:true,done:new Promise(r=>finish=r)};
  class Context extends Target{
    state='suspended';currentTime=0;destination={};sampleRate=24000;
    constructor(){super();contexts++;env.context=this;}
    async resume(){this.state='running';await this.emit('statechange');}
    async suspend(){this.state='suspended';await this.emit('statechange');}
    async close(){this.state='closed';}
    createGain(){const node={kind:'gain',gain:parameter(),connect(){},disconnect(){}};nodes.push(node);return node;}
    createBufferSource(){const node={kind:'buffer',connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(node);return node;}
    createOscillator(){const node={kind:'oscillator',frequency:parameter(),connect(){},disconnect(){},start(){},stop(){}};nodes.push(node);return node;}
    createBuffer(channels,length){return {duration:length/this.sampleRate,getChannelData:()=>new Float32Array(length)};}
    async decodeAudioData(){return {duration:32};}
  }
  env.AudioContext=unsupported?null:Context;env.document=doc;
  env.matchMedia=()=>({matches:true});
  env.fetch=async()=>{requests++;if(delay)await wait;return {ok:!fail,arrayBuffer:async()=>new ArrayBuffer(1)};};
  env.setTimeout=fn=>{const key=Symbol();timers.set(key,fn);return key;};env.clearTimeout=key=>timers.delete(key);
  const dispose=createPortfolioAudio({button,video,opening,env});
  return {doc,button,video,env,nodes,opening,dispose,release,finish,get requests(){return requests;},get contexts(){return contexts;},async flush(){for(const fn of [...timers.values()])fn();timers.clear();await Promise.resolve();await Promise.resolve();}};
}
let f=fixture();assert.equal(f.contexts,0);assert.equal(f.requests,0,'No audio fetched before explicit opt-in');assert.equal(f.button.hidden,false);
const control={matches:()=>false,closest:()=>null};
const child={closest:()=>control};
const hover={pointerType:'mouse',target:child,relatedTarget:null};
await f.doc.emit('pointerover',hover);assert.equal(f.contexts,0,'Hover cannot unlock sound');
await f.button.emit('click');assert.equal(f.requests,3);assert.equal(f.contexts,1);assert.equal(f.doc.documentElement.dataset.audioState,'on');
assert.equal(f.nodes.filter(n=>n.loop&&n.started).length,1,'One ambient source');assert.equal(f.doc.documentElement.dataset.audioLoopSeconds,'32');
let hoverCount=f.nodes.filter(n=>n.kind==='buffer').length;
await f.doc.emit('pointerover',hover);assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,hoverCount+1,'Mouse entry emits paper tick');
f.env.context.currentTime=.2;
await f.doc.emit('pointerover',{...hover,relatedTarget:child});assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,hoverCount+1,'Nested content does not retrigger');
await f.doc.emit('pointerover',hover);assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,hoverCount+2,'Re-entry after cooldown plays');
f.env.context.currentTime=.25;
await f.doc.emit('pointerover',hover);assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,hoverCount+2,'Rapid entries are throttled');
f.env.context.currentTime=.5;
await f.doc.emit('pointerover',{...hover,pointerType:'touch'});
await f.doc.emit('pointerover',{...hover,target:{closest:()=>({matches:()=>true})}});
assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,hoverCount+2,'Touch and disabled controls stay silent');
let count=f.nodes.filter(n=>n.kind==='buffer').length;
await f.doc.emit('portfolio:paper-phase',{detail:{phase:'unfold',elapsed:100}});
assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,count+1,'Unfold foley follows the actual paper phase');
await f.doc.emit('portfolio:paper-phase',{detail:{phase:'lift',elapsed:1350}});
assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,count+2,'Lift foley follows the actual paper phase');
count=f.nodes.filter(n=>n.kind==='oscillator').length;
await f.doc.emit('click',{target:{closest:()=>true}});
assert.equal(f.nodes.filter(n=>n.kind==='oscillator').length,count+1,'Intentional controls get a soft tap');
await f.button.emit('click');await f.flush();assert.equal(f.env.context.state,'suspended');assert.equal(f.button.attributes['aria-pressed'],'false');
count=f.nodes.filter(n=>n.kind==='buffer').length;
await f.doc.emit('pointerover',hover);assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,count,'Muted hover stays silent');
await f.doc.emit('portfolio:paper-phase',{detail:{phase:'unfold',elapsed:100}});
assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,count,'Muted opening effects remain silent');
await f.button.emit('click');assert.equal(f.requests,3,'Decoded audio reused');assert.equal(f.nodes.filter(n=>n.loop&&n.started).length,1,'No doubled loop after re-enabling');
f.video.paused=false;await f.video.emit('play');await f.flush();assert.equal(f.env.context.state,'suspended');assert.equal(f.doc.documentElement.dataset.audioState,'video');
count=f.nodes.filter(n=>n.kind==='buffer').length;await f.doc.emit('pointerover',hover);assert.equal(f.nodes.filter(n=>n.kind==='buffer').length,count,'No hover over video audio');
f.video.paused=true;await f.video.emit('pause');assert.equal(f.env.context.state,'running');
f.doc.hidden=true;await f.doc.emit('visibilitychange');await f.flush();assert.equal(f.env.context.state,'suspended');
f.doc.hidden=false;await f.doc.emit('visibilitychange');assert.equal(f.env.context.state,'running');
f.video.paused=false;await f.video.emit('play');await f.button.emit('click');f.video.paused=true;await f.video.emit('ended');await f.flush();assert.equal(f.env.context.state,'suspended','Video ending cannot override explicit mute');
await f.env.emit('pagehide',{persisted:true});await f.env.emit('pageshow');await f.flush();assert.equal(f.env.context.state,'suspended','History restore cannot override mute');
f.dispose();assert.equal(f.env.context.state,'closed');assert.equal(f.button.events.get('click').size,0);
f=fixture({delay:true});const pending=f.button.emit('click');await f.button.emit('click');f.release();await pending;await f.flush();assert.equal(f.doc.documentElement.dataset.audioState,'off');assert.equal(f.nodes.filter(n=>n.kind==='buffer'&&n.started).length,0,'Loading completion cannot override mute');f.dispose();
f=fixture({delay:true});const loadingMusic=f.button.emit('click');
for(let step=0;step<20&&f.requests===0;step++)await Promise.resolve();
assert.equal(f.requests,3,'Music download started');
await f.doc.emit('pointerover',hover);
assert.equal(f.doc.documentElement.dataset.audioHoverCount,'1','Hover works while music is still loading');
assert.equal(f.doc.documentElement.dataset.audioState,'loading');
f.release();await loadingMusic;assert.equal(f.doc.documentElement.dataset.audioState,'on');f.dispose();
f=fixture({fail:true});await f.button.emit('click');assert.equal(f.doc.documentElement.dataset.audioState,'off');assert.equal(f.env.context.state,'suspended');f.dispose();
f=fixture({unsupported:true});assert.equal(f.button.hidden,true);assert.equal(f.requests,0);
console.log('PASS: opt-in only, one loop, mute/re-enable, video and hidden-tab pause, history/mute races, delayed loading, fetch failure and cleanup.');
