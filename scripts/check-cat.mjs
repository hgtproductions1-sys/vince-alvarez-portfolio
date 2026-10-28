import assert from 'node:assert/strict';
import { createCursorCat } from '../src/cursor-cat.js';
class Target {
  events = new Map(); dataset = {}; style = {}; attributes = {}; hidden = false;
  addEventListener(type, fn) { if (!this.events.has(type)) this.events.set(type, new Set()); this.events.get(type).add(fn); }
  removeEventListener(type, fn) { this.events.get(type)?.delete(fn); }
  emit(type, event = {}) { for (const fn of this.events.get(type) || []) fn(event); }
  setAttribute(key, value) { this.attributes[key] = value; }
  remove() { this.removed = true; }
}
function fixture({ fine = true, reduced = false, saved = false, opening = false } = {}) {
  const env = new Target(), doc = new Target(), button = new Target(), media = new Target(), reduce = new Target();
  media.matches = fine; reduce.matches = reduced;
  let cat, finish, subscriber;
  const storage = new Map([['vince-cat-hidden', String(saved)]]), frames = new Map(); let id = 0;
  doc.createElement = () => { cat = new Target(); cat.firstElementChild = new Target(); return cat; }; doc.body = { append() {} };
  env.document = doc; env.innerWidth = 320; env.innerHeight = 600;
  env.matchMedia = query => query.includes('reduced') ? reduce : media;
  env.localStorage = { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) };
  env.requestAnimationFrame = fn => { frames.set(++id, fn); return id; }; env.cancelAnimationFrame = key => frames.delete(key);
  const motion = { paused: false, subscribe(fn) { subscriber = fn; fn(); return () => { subscriber = null; }; } };
  const gate = { active: opening, done: new Promise(resolve => { finish = resolve; }) };
  const dispose = createCursorCat({ button, motion, opening: gate, env });
  const move = (x=80,y=100,target={closest:()=>null},pointerType='mouse') => doc.emit('pointermove',{clientX:x,clientY:y,target,pointerType});
  return {env,doc,button,media,reduce,motion,storage,frames,cat,dispose,move,finish,pause(value) {motion.paused=value;subscriber?.();},settle() {for(let t=16;frames.size&&t<5000;t+=16){const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(t));}assert.equal(frames.size,0,'No animation loop after settling');}};
}
let f = fixture({opening:true}); f.move(); assert.equal(f.cat.dataset.visible,'false'); assert.equal(f.button.hidden,true);
f.finish(); await Promise.resolve(); assert.equal(f.cat.dataset.visible,'true'); f.settle();
f.move(319,599); f.settle(); assert.match(f.cat.style.transform,/276\.00px,556\.00px/,'Pet stays in viewport');
f.move(1,1); f.settle(); assert.equal(f.cat.firstElementChild.style.transform,'scaleX(-1)');
f.doc.emit('pointerover',{pointerType:'mouse',target:{closest:()=>({})}}); assert.equal(f.cat.dataset.visible,'false'); assert.equal(f.frames.size,0);
f.move(); f.pause(true); assert.equal(f.cat.dataset.visible,'false'); f.pause(false); assert.equal(f.cat.dataset.visible,'true');
f.reduce.matches=true; f.reduce.emit('change'); assert.equal(f.cat.dataset.visible,'false');
f.reduce.matches=false; f.reduce.emit('change'); f.button.emit('click'); assert.equal(f.cat.dataset.visible,'false'); assert.equal(f.storage.get('vince-cat-hidden'),'true'); assert.equal(f.button.textContent,'Show cat');
f.button.emit('click'); f.move(); assert.equal(f.cat.dataset.visible,'true');
f.doc.emit('keydown'); assert.equal(f.cat.dataset.visible,'false'); f.move();
f.doc.hidden=true; f.doc.emit('visibilitychange'); assert.equal(f.cat.dataset.visible,'false'); f.doc.hidden=false; f.doc.emit('visibilitychange'); assert.equal(f.cat.dataset.visible,'false');
f.move(); f.env.emit('pagehide',{persisted:true}); assert.equal(f.cat.dataset.visible,'false'); f.env.emit('pageshow'); assert.equal(f.cat.dataset.visible,'false');
f.move(); f.doc.emit('pointerout',{relatedTarget:null}); assert.equal(f.cat.dataset.visible,'false');
f.move(10,10,undefined,'touch'); assert.equal(f.cat.dataset.visible,'false');
f.env.emit('pagehide',{persisted:false}); assert.equal(f.cat.removed,true); assert.equal(f.frames.size,0); assert.equal(f.doc.events.get('pointermove').size,0);
f=fixture({fine:false}); f.move(); assert.equal(f.button.hidden,true); assert.equal(f.cat.dataset.visible,'false'); f.dispose();
f=fixture({saved:true}); f.move(); assert.equal(f.cat.dataset.visible,'false'); assert.equal(f.button.textContent,'Show cat'); f.dispose();
console.log('PASS: intro gating, viewport edges, resting loop, control avoidance, pause/reduced motion, persistence, keyboard/touch, visibility/history and cleanup.');
