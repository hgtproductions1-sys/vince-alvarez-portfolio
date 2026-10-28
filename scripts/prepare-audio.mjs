// Original score and foley synthesized locally. No sampled or third-party audio.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHoverSamples } from '../src/hover-sound.js';
const root = resolve(import.meta.dirname, '..');
const destination = resolve(root, 'public/audio');
const masters = resolve(root, '.qa/audio-masters');
await mkdir(destination, { recursive: true }); await mkdir(masters, { recursive: true });
const rate = 24000, tau = Math.PI * 2;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
let seed = 20261023;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const smooth = n => { n = Math.max(0, Math.min(1, n)); return n*n*(3-2*n); };
function normalize(channels, peak = .5) {
  let highest = 0;
  for (const samples of channels) for (const value of samples) highest = Math.max(highest, Math.abs(value));
  for (const samples of channels) for (let i=0;i<samples.length;i++) samples[i] *= peak / highest;
  return channels;
}
function wav(channels) {
  const samples = channels[0].length, bytes = Buffer.alloc(44 + samples * channels.length * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length-8,4); bytes.write('WAVEfmt ',8);
  bytes.writeUInt32LE(16,16); bytes.writeUInt16LE(1,20); bytes.writeUInt16LE(channels.length,22);
  bytes.writeUInt32LE(rate,24); bytes.writeUInt32LE(rate*channels.length*2,28);
  bytes.writeUInt16LE(channels.length*2,32); bytes.writeUInt16LE(16,34); bytes.write('data',36); bytes.writeUInt32LE(bytes.length-44,40);
  for (let i=0;i<samples;i++) for(let c=0;c<channels.length;c++) bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),44+(i*channels.length+c)*2);
  return bytes;
}
function compose() {
  const duration=32, count=rate*duration, mono=new Float32Array(count), left=new Float32Array(count), right=new Float32Array(count);
  const chords=[[48,55,59,62,64],[45,52,55,59,60],[50,57,60,64,65],[43,53,57,59,64]];
  // 60 BPM: warm major/minor ninth voicings, relaxed syncopation, no drone.
  // Render note tails modulo the loop so the last bar flows into the first.
  const note=(midi,start,level,length,bass=false)=>{
    const f=frequency(midi);
    for(let j=0;j<Math.round(length*rate);j++) {
      const t=j/rate, i=(Math.round(start*rate)+j)%count;
      const envelope=smooth(t/(bass?.025:.018))*Math.exp(-t/(bass?.65:1.65))*smooth((length-t)/.3);
      const tone=bass ? Math.sin(tau*f*t)+.12*Math.sin(tau*f*2*t) : Math.sin(tau*f*t+.32*Math.exp(-t*3)*Math.sin(tau*f*2*t))+.08*Math.sin(tau*f*3*t)*Math.exp(-t*3);
      mono[i]+=tone*envelope*level*(bass?1:.94+.06*Math.sin(tau*2.5*t));
    }
  };
  for(let chord=0;chord<4;chord++) {
    for(const [beat,level] of [[0,.047],[3.5,.03],[6,.025]])
      chords[chord].forEach((midi,voice)=>note(midi,chord*8+beat+voice*.012,level,5));
    for(const beat of [0,4,6.5]) note(chords[chord][0]-12,chord*8+beat,.065,2.2,true);
    for(const [offset,midi] of [[2.5,chords[chord][3]+12],[5.5,chords[chord][2]+12]]) note(midi,chord*8+offset,.012,3.5);
  }
  for(let i=0;i<count;i++) {
    left[i]=mono[i]*.72;right[i]=mono[i]*.72;
    for(const [delay,gain] of [[.19,.12],[.39,.08],[.61,.045],[.93,.025]]) {
      left[i]+=mono[(i-Math.round(delay*rate)+count)%count]*gain;
      right[i]+=mono[(i-Math.round((delay+.023)*rate)+count)%count]*gain;
    }
  }
  return normalize([left,right],.42);
}
function paper(duration, lift) {
  const samples=new Float32Array(Math.round(duration*rate));let low=0, high=0;
  for(let i=0;i<samples.length;i++) {
    const t=i/rate;
    low += .58*(noise()-low); high += .09*(low-high);
    let envelope=0;
    if(lift) envelope=Math.sin(Math.PI*t/duration)**2 * (.7+.3*Math.sin(tau*12*t)**2);
    else for(const [center,width,level] of [[.09,.035,.45],[.19,.047,.7],[.33,.065,1],[.49,.04,.55],[.62,.07,.7]]) envelope+=level*Math.exp(-(((t-center)/width)**2));
    samples[i]=(low-high)*envelope*(.7+.3*Math.sin(tau*83*t)**2);
  }
  return normalize([samples], lift?.32:.42);
}
await writeFile(resolve(masters,'hover-pop-preview.wav'),wav([Float32Array.from(createHoverSamples(rate),value=>value*.2)]));
const assets=process.argv.includes('--music-only') ? [['portfolio-chill',compose()]] : [['portfolio-chill',compose()],['paper-unfold',paper(.85,false)],['paper-lift',paper(.4,true)]];
for(const [name,channels] of assets) {
  const master=resolve(masters,name+'.wav'), output=resolve(destination,name+'.mp3');
  await writeFile(master,wav(channels));
  const result=spawnSync(process.env.PORTFOLIO_FFMPEG || 'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',master,'-codec:a','libmp3lame','-b:a',name==='portfolio-chill'?'96k':'80k',output],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.error?.message||result.stderr||'Audio encoding failed');
  console.log('Created '+name+'.mp3');
}
