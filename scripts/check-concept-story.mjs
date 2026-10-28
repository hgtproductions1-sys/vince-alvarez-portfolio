import assert from 'node:assert/strict';
import { mountConceptStory, conceptStoryProgress, conceptStoryChapter } from '../src/concept-story.js';

class Events {
  listeners = new Map();
  addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name, event = {}) { for (const callback of [...(this.listeners.get(name) || [])]) callback(event); }
  get count() { return [...this.listeners.values()].reduce((sum, list) => sum + list.size, 0); }
}
class Element extends Events {
  dataset = {}; attrs = new Map(); inert = false; id = ''; children = []; parent = null;
  constructor() {
    super(); const classes = new Set(); const values = new Map();
    this.activeAdds = 0;
    this.classList = { add: name => { if (name === 'is-story-active') this.activeAdds++; classes.add(name); }, remove: name => classes.delete(name), contains: name => classes.has(name) };
    this.style = { setProperty: (key, value) => values.set(key, value), getPropertyValue: key => values.get(key) || '', getPropertyPriority: () => '', removeProperty: key => values.delete(key) };
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  removeAttribute(name) { this.attrs.delete(name); }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  compareDocumentPosition(target) { return target?.below ? 4 : 0; }
  getBoundingClientRect() { return { top: this.top || 0, bottom: (this.top || 0) + this.offsetHeight, height: this.offsetHeight }; }
  get offsetHeight() { return this.height || 50; }
  get scrollHeight() { return this.offsetHeight; }
  get clientHeight() { return this.offsetHeight; }
}
const original = { window: globalThis.window, document: globalThis.document };
function setup(options = {}) {
  const section = new Element(), stage = new Element(), steps = [new Element(), new Element(), new Element()];
  const image = new Element(); image.complete = options.image !== 'pending'; image.naturalWidth = options.image === 'broken' ? 0 : 1200; image.decode = () => Promise.resolve();
  const visual = new Element(); visual.dataset.storyImage = '0';
  const anchor = new Element(); anchor.below = true; anchor.top = 0;
  section.children = [stage]; stage.children = [...steps, visual]; steps[0].children = [image];
  section.querySelector = () => stage;
  section.querySelectorAll = selector => selector === '[data-story-step]' ? steps : selector === 'img' ? [image] : [visual];
  const active = () => section.classList.contains('is-story-active');
  Object.defineProperty(section, 'offsetHeight', { get: () => active() ? Number.parseFloat(section.style.getPropertyValue('height')) || 760 : 1800 });
  Object.defineProperty(stage, 'offsetHeight', { get: () => active() ? options.stageHeight || 758 : 1800 });
  const rafs = new Map(), timers = new Map(), observers = [], resizers = []; let nextId = 1;
  class Observer {
    constructor(callback, settings) { this.callback = callback; this.settings = settings; observers.push(this); }
    observe() {} disconnect() { this.disconnected = true; }
    fire(value) { this.callback([{ isIntersecting: value }]); }
  }
  class Resize { constructor(callback) { this.callback = callback; resizers.push(this); } observe() {} disconnect() { this.disconnected = true; } fire() { this.callback(); } }
  const reduced = new Events(); reduced.matches = !!options.reduced;
  const mobile = new Events(); mobile.matches = !!options.mobile;
  const window = Object.assign(new Events(), {
    innerHeight: options.viewportHeight || 800, innerWidth: options.mobile ? 390 : 1440, scrollY: options.scrollY || 0,
    location: { pathname: '/concepts/test/', hash: options.hash || '' },
    performance: { getEntriesByType: () => [{ type: options.back ? 'back_forward' : 'navigate' }] },
    history: { state: options.back ? { vinceConceptStories: { '/concepts/test/:0': true } } : {}, replaceState(value) { this.state = value; } },
    matchMedia: query => query.includes('reduced') ? reduced : mobile,
    IntersectionObserver: Observer, ResizeObserver: Resize,
    requestAnimationFrame(callback) { const id = nextId++; rafs.set(id, callback); return id; }, cancelAnimationFrame(id) { rafs.delete(id); },
    setTimeout(callback) { const id = nextId++; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); },
    getComputedStyle: () => ({ top: options.stickyTop === undefined ? '42px' : `${options.stickyTop}px` }),
    scrollBy(value) { this.scrollY += value.top; },
  });
  const fontEvents = new Events();
  const document = Object.assign(new Events(), { hidden: false, activeElement: null, fonts: fontEvents, getElementById: id => id === 'below' ? anchor : null, querySelectorAll: () => [section] });
  const motionListeners = new Set();
  const motion = { paused: !!options.paused, subscribe(callback) { motionListeners.add(callback); callback(); return () => motionListeners.delete(callback); }, set(paused) { this.paused = paused; for (const callback of motionListeners) callback(); } };
  globalThis.window = window; globalThis.document = document;
  const cleanup = mountConceptStory(section, motion);
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); for (const [id, callback] of [...rafs]) { rafs.delete(id); callback(); } await Promise.resolve(); };
  const enter = async () => { observers[0].fire(true); observers[1].fire(true); await flush(); await flush(); };
  return { section, stage, steps, image, visual, window, document, motion, rafs, timers, observers, resizers, fontEvents, options, reduced, mobile, cleanup, flush, enter };
}
try {
  assert.equal(conceptStoryProgress(42, 42, 800), 0);
  assert.equal(conceptStoryProgress(-758, 42, 800), 1);
  assert.equal(conceptStoryProgress(-358, 42, 800), .5);
  assert.equal(conceptStoryChapter(1, 3), 2);
  assert.equal(conceptStoryChapter(-1, 3), 0);

  let test = setup();
  assert.equal(test.section.dataset.storyStatic, 'true', 'The unenhanced page stays readable');
  await test.enter();
  assert.equal(test.section.dataset.storyMode, 'scroll');
  assert.equal(test.section.offsetHeight, 1558, 'Stage plus one viewport of native travel');
  assert.deepEqual(test.steps.map(step => step.dataset.storyStep), ['0', '1', '2'], 'Empty chapter values are enumerated');
  assert.equal(test.steps[0].inert, false); assert.equal(test.steps[1].inert, true);
  test.section.top = -358; test.window.emit('scroll'); await test.flush();
  assert.equal(test.section.dataset.storyStep, '1', 'Forward scroll selects the middle chapter');
  test.section.top = 42; test.window.emit('scroll'); await test.flush();
  assert.equal(test.section.dataset.storyStep, '0', 'Reverse scroll restores the first chapter');
  test.document.activeElement = test.image; test.section.top = -758; test.window.emit('scroll'); await test.flush();
  assert.equal(test.section.dataset.storyStep, '0', 'Focused chapter stays visible');
  test.document.activeElement = null; test.section.emit('focusout'); await test.flush();
  assert.equal(test.section.dataset.storyStep, '2');
  test.observers[1].fire(false); test.window.emit('scroll'); assert.equal(test.rafs.size, 0, 'No RAF while offscreen');
  test.motion.set(true);
  assert.equal(test.section.dataset.storyStatic, 'true'); assert.equal(test.section.style.getPropertyValue('height'), '');
  assert.ok(test.steps.every(step => !step.inert && step.getAttribute('aria-hidden') === null), 'Static mode restores all chapter access');
  test.cleanup(); assert.equal(test.window.count, 0); assert.equal(test.document.count, 0); assert.equal(test.timers.size, 0); assert.ok(test.observers.every(observer => observer.disconnected));

  for (const options of [{ paused: true }, { reduced: true }, { viewportHeight: 500 }, { image: 'broken' }]) {
    test = setup(options); await test.enter();
    assert.equal(test.section.dataset.storyStatic, 'true', JSON.stringify(options)); test.cleanup();
  }
  test = setup({ mobile: true }); await test.enter(); assert.equal(test.section.offsetHeight, 1318, 'Mobile uses seventy percent of a viewport'); test.cleanup();
  test = setup({ stickyTop: 44, stageHeight: 756 }); await test.enter(); assert.equal(test.section.dataset.storyMode, 'scroll', 'Tide uses its own sticky offset'); test.cleanup();
  test = setup({ hash: '#below', scrollY: 2500 }); await test.enter(); assert.equal(test.section.dataset.storyMode, 'deferred');
  test.section.top = 100; test.window.scrollY = 200; test.window.emit('scroll'); await test.flush(); await test.flush(); assert.equal(test.section.dataset.storyMode, 'scroll', 'Returning above the story permits enhancement'); test.cleanup();
  test = setup({ hash: '#below', back: true }); assert.equal(test.section.classList.contains('is-story-active'), true, 'Back restores geometry before image startup'); test.cleanup();
  test = setup({ image: 'pending' }); await test.enter(); assert.equal(test.timers.size, 1); for (const callback of [...test.timers.values()]) callback(); await test.flush(); assert.equal(test.section.dataset.storyMode, 'fallback', 'Slow image startup falls back to normal flow'); test.cleanup();
  test = setup({ stageHeight: 900 }); await test.enter(); assert.equal(test.section.dataset.storyMode, 'viewport');
  const attempts = test.section.activeAdds;
  for (let index = 0; index < 30; index++) { test.resizers[0].fire(); test.window.emit('resize'); }
  assert.equal(test.section.activeAdds, attempts, 'ResizeObserver and unchanged viewport events cannot retry a failed fit');
  test.options.stageHeight = 758; test.window.innerWidth = 1200; test.window.emit('resize'); await test.flush();
  assert.equal(test.section.dataset.storyMode, 'scroll', 'A real viewport change permits measuring again'); test.cleanup();
  test = setup({ stageHeight: 900 }); await test.enter(); test.options.stageHeight = 758; test.fontEvents.emit('loadingdone'); await test.flush();
  assert.equal(test.section.dataset.storyMode, 'scroll', 'Completed font loading permits measuring again'); test.cleanup(); assert.equal(test.fontEvents.count, 0);
  test = setup({ viewportHeight: 500 }); await test.enter(); assert.equal(test.section.activeAdds, 0, 'Very short viewports reject pinning before changing layout'); test.cleanup();
  test = setup(); Object.defineProperty(test.steps[2], 'scrollHeight', { get: () => 250 }); await test.enter();
  assert.equal(test.section.dataset.storyMode, 'viewport', 'Clipped chapter content uses normal flow');
  const clippedAttempts = test.section.activeAdds;
  for (let index = 0; index < 30; index++) test.resizers[0].fire();
  assert.equal(test.section.activeAdds, clippedAttempts, 'Clipped-content fallback cannot oscillate through ResizeObserver'); test.cleanup();
  console.log('PASS: native forward/reverse chapters, desktop/mobile travel, tide sticky offset, focus/inert access, pause/reduced motion, short viewport, failed/slow images, direct anchors, Back geometry, offscreen scheduling, failed-fit observer latch, resize/font recovery and cleanup.');
} finally {
  if (original.window === undefined) delete globalThis.window; else globalThis.window = original.window;
  if (original.document === undefined) delete globalThis.document; else globalThis.document = original.document;
}
