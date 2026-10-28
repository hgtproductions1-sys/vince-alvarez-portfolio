import assert from 'node:assert/strict';
import { createMotionController, createTicker } from '../src/motion.js';
import { createScene } from '../src/scene.js';

class Events {
  listeners = new Map();
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  removeEventListener(type) { this.listeners.delete(type); }
  emit(type) { this.listeners.get(type)?.(); }
}
const media = Object.assign(new Events(), { matches: true });
globalThis.matchMedia = () => media;
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.document = Object.assign(new Events(), {
  documentElement: { dataset: {} }, hidden: false, fonts: { ready: Promise.resolve() },
  createElementNS() { throw new Error('WebGL is unavailable'); },
});
const button = Object.assign(new Events(), { attributes: {}, setAttribute(k,v) { this.attributes[k]=v; } });
const heroButton = Object.assign(new Events(), { attributes: {}, setAttribute(k,v) { this.attributes[k]=v; } });
const motion = createMotionController([button, heroButton]);
assert.equal(motion.paused, true, 'Reduced motion starts paused');
assert.equal(document.documentElement.dataset.motionReduced, 'true');
assert.throws(() => createScene({}, motion), /WebGL/, 'Simulate an unavailable renderer');
heroButton.emit('click');
assert.equal(motion.paused, false, 'Motion control still works without WebGL');
assert.equal(button.attributes['aria-pressed'], 'false', 'Footer control follows the hero control');
assert.equal(heroButton.textContent, button.textContent, 'Both controls show the same action');
assert.equal(document.documentElement.dataset.motionReduced, 'false', 'Explicit play enables both animations');
const duplicate = { setAttribute(k,v){this[k]=v}, classList:{add(){}}, remove(){} };
const group = { cloneNode:()=>duplicate, getBoundingClientRect:()=>({width:1400}) };
const track = { style:{setProperty(k,v){this[k]=v}}, append(){} };
const strip = { querySelector:s=>s==='.capability-track'?track:group, classList:{add(){}} };
globalThis.ResizeObserver = class { constructor(fn){this.fn=fn} observe(){this.fn()} disconnect(){} };
let visibility;
globalThis.IntersectionObserver = class { constructor(fn){visibility=fn} observe(){} disconnect(){} };
const dispose = createTicker(strip,motion);
assert.equal(track.style['--ticker-duration'],'50s','1400px loop at 28px/second');
assert.equal(track.style['--ticker-distance'],'1400px','Loop moves one complete group');
assert.equal(duplicate['aria-hidden'],'true','Duplicate is hidden from screen readers');
button.emit('click');assert.equal(track.style.animationPlayState,'paused');
assert.equal(heroButton.attributes['aria-pressed'], 'true', 'Hero control follows the footer control');
button.emit('click');assert.equal(track.style.animationPlayState,'running');
visibility([{isIntersecting:false}]);assert.equal(track.style.animationPlayState,'paused');
visibility([{isIntersecting:true}]);assert.equal(track.style.animationPlayState,'running');
document.hidden=true;document.emit('visibilitychange');assert.equal(track.style.animationPlayState,'paused');
media.emit('change');assert.equal(motion.paused,true);assert.equal(document.documentElement.dataset.motionReduced,'true');
dispose();motion.dispose();
console.log('PASS: reduced motion, explicit play, pause/resume, unavailable WebGL, 28px/s loop, accessibility duplicate, offscreen and hidden-tab pause.');
