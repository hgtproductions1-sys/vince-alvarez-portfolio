import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { createBlueprintScroll, frameIndex } from '../src/blueprint-scroll.js';

const root = resolve(import.meta.dirname, '..');
const source = JSON.parse(await readFile(resolve(root, 'output/portfolio-animation-v1/scroll-frame-manifest.json')));
assert.equal(source.frameCount, 48);
assert.equal(source.sourceIndices[0], 0);
assert.equal(source.sourceIndices.at(-1), Number(source.source.nb_frames) - 1);
for (const width of [640, 960]) for (let index = 0; index < 48; index++) {
  const file = resolve(root, `public/animation/blueprint/${width}/${String(index).padStart(3, '0')}.webp`);
  const meta = await sharp(file).metadata();
  assert.equal(meta.width, width); assert.equal(meta.height, width * 9 / 16);
  assert.ok((await stat(file)).size > 1000);
}
assert.equal(frameIndex(-1), 0); assert.equal(frameIndex(1), 47); assert.equal(frameIndex(.5), 24);

// Exercise async decoding, real scroll mapping, preference changes, and cleanup
// without a browser renderer. Browser screenshots verify the visual composition.
class Events {
  listeners = new Map();
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event = {}) { this.listeners.get(type)?.forEach(callback => callback(event)); }
}
const page = new Events(), doc = new Events(); doc.hidden = false;
globalThis.window = page; globalThis.document = doc; globalThis.innerHeight = 800;
const reduced = new Events(), mobile = new Events(); reduced.matches = false; mobile.matches = false;
globalThis.matchMedia = query => query.includes('reduced') ? reduced : mobile;
let rafID = 0; const rafs = new Map();
globalThis.requestAnimationFrame = callback => { rafs.set(++rafID, callback); return rafID; };
globalThis.cancelAnimationFrame = id => rafs.delete(id);
const observers = [];
globalThis.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe() {} disconnect() { this.disconnected = true; }
  emit(value) { this.callback([{ isIntersecting: value }]); }
};
let draws = 0, requests = 0, alive = 0, failedFrame = false;
globalThis.fetch = async (url, { signal }) => {
  requests++; await Promise.resolve();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return { ok: !failedFrame, blob: async () => ({ url }) };
};
globalThis.createImageBitmap = async () => { alive++; let closed = false; return { close() { if (!closed) { alive--; closed = true; } } }; };
const classes = new Set(); let top = 400;
const canvas = { width: 960, height: 540, getContext: () => ({ drawImage: () => draws++ }) };
const section = {
  classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) },
  dataset: {},
  querySelector: selector => selector === 'canvas' ? canvas : { offsetHeight: 800 },
  getBoundingClientRect: () => ({ top, bottom: top + section.offsetHeight }),
  compareDocumentPosition: () => 4,
  get offsetHeight() { return classes.has('is-animated') ? 1600 : 1000; },
};
const listeners = new Set();
page.scrollBy = ({ top: delta }) => { top -= delta; };
const motion = { paused: false, subscribe(callback) { listeners.add(callback); callback(); return () => listeners.delete(callback); } };
const settle = async () => {
  for (let step = 0; step < 80; step++) {
    await new Promise(resolve => setImmediate(resolve));
    const callbacks = [...rafs.values()]; rafs.clear(); callbacks.forEach(callback => callback());
    assert.ok(Number(section.dataset.frameCache || 0) <= 12, 'Decoded cache exceeds 12');
  }
};
const dispose = createBlueprintScroll(section, motion);
observers[0].emit(true); observers[1].emit(true); await settle();
assert.equal(section.dataset.frame, '0');
assert.equal(section.dataset.frameCache, '12');
top = -400; page.emit('scroll'); await settle(); assert.equal(section.dataset.frame, '24');
top = -800; page.emit('scroll'); await settle(); assert.equal(section.dataset.frame, '47');
top = -100; page.emit('scroll'); await settle(); assert.equal(section.dataset.frame, '6', 'Reverse scroll');
const stillDraws = draws; page.emit('scroll'); await settle(); assert.equal(draws, stillDraws, 'Redraws unchanged frame');
observers[1].emit(false); const offscreenDraws = draws; top = -300; page.emit('scroll'); await settle(); assert.equal(draws, offscreenDraws);
observers[0].emit(false); await settle(); assert.equal(alive, 0, 'Offscreen bitmap cleanup');
const idleRequests = requests; page.emit('scroll'); await settle(); assert.equal(requests, idleRequests);
observers[0].emit(true); observers[1].emit(true); await settle();
motion.paused = true; listeners.forEach(callback => callback()); await settle();
assert.ok(!classes.has('is-animated')); assert.equal(alive, 0);
motion.paused = false; listeners.forEach(callback => callback()); await settle(); assert.ok(classes.has('is-animated'));
reduced.matches = true; reduced.emit('change'); await settle(); assert.ok(!classes.has('is-animated'));
reduced.matches = false; reduced.emit('change'); await settle();
doc.hidden = true; doc.emit('visibilitychange'); await settle(); assert.equal(alive, 0);
doc.hidden = false; doc.emit('visibilitychange'); await settle();
mobile.matches = true; page.emit('resize'); await settle(); assert.equal(canvas.width, 640);
mobile.matches = false; page.emit('resize'); await settle(); assert.equal(canvas.width, 960);
page.emit('pagehide'); await settle(); assert.equal(alive, 0);
page.emit('pageshow'); await settle(); assert.ok(classes.has('is-animated'));
dispose(); await settle(); assert.equal(alive, 0); assert.equal(listeners.size, 0); assert.ok(observers.every(observer => observer.disconnected));

classes.clear(); top = -860; page.location = { hash: '#work' };
page.scrollY = 860;
doc.getElementById = () => ({ getBoundingClientRect: () => ({ top: top + section.offsetHeight }) });
const anchoredDispose = createBlueprintScroll(section, motion);
observers.at(-2).emit(true); observers.at(-1).emit(true); await settle();
assert.equal(top + section.offsetHeight, 140, 'Enhancement moved direct section link');
assert.ok(!classes.has('is-animated'), 'Direct downstream links defer enhancement');
top = 0; page.scrollY = 0; page.emit('scroll'); await settle();
assert.ok(classes.has('is-animated'), 'Scrolling back to the section enables it');
top = -1460;
motion.paused = true; listeners.forEach(callback => callback()); await settle(); assert.equal(top + section.offsetHeight, 140, 'Collapse moved anchored content');
motion.paused = false; listeners.forEach(callback => callback()); await settle();
anchoredDispose(); await settle();
page.location.hash = ''; delete doc.getElementById; top = 400; page.scrollY = 0;

classes.clear(); top = -1200;
page.history = { state: { vinceBlueprintActive: true }, replaceState(state) { this.state = state; } };
const restoredDispose = createBlueprintScroll(section, motion);
assert.ok(classes.has('is-animated'), 'History restores the previous section height before decoding');
observers.at(-2).emit(true); observers.at(-1).emit(true); await settle();
const restoredHeight = section.offsetHeight;
restoredDispose(); assert.equal(section.offsetHeight, restoredHeight, 'Navigation teardown changed history geometry');
delete page.history; top = 400;

classes.clear(); failedFrame = true;
const failedDispose = createBlueprintScroll(section, motion);
observers.at(-2).emit(true); observers.at(-1).emit(true); await settle();
assert.equal(section.dataset.scrollMode, 'fallback'); assert.ok(!classes.has('is-animated')); assert.equal(alive, 0);
failedDispose();
failedFrame = false;
const realTimeout = globalThis.setTimeout; let expire;
globalThis.setTimeout = (callback, delay) => { if (delay === 8000) { expire = callback; return realTimeout(() => {}, 100); } return realTimeout(callback, delay); };
globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
const slowDispose = createBlueprintScroll(section, motion);
observers.at(-2).emit(true); observers.at(-1).emit(true);
assert.ok(!classes.has('is-animated'), 'Poster must remain during startup');
expire(); await settle(); assert.equal(section.dataset.scrollMode, 'fallback'); assert.equal(alive, 0);
slowDispose(); globalThis.setTimeout = realTimeout;
const originalBitmap = globalThis.createImageBitmap; globalThis.createImageBitmap = undefined;
assert.equal(typeof createBlueprintScroll(section, motion), 'function'); globalThis.createImageBitmap = originalBitmap;
console.log('PASS: 96 frame dimensions, endpoints, bounded decoding, forward/reverse scroll, no redundant/offscreen draws, responsive resolution, pause/reduced-motion, hidden tab, Back restoration, loading failure/timeout, unsupported decoding, cleanup.');
