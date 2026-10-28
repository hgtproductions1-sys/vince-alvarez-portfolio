import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { playPaperOpening } from '../src/paper-opening.js';

const source = await readFile(new URL('../public/opening-boot.js', import.meta.url), 'utf8');
function boot(options = {}) {
  const events = new Map(), windowEvents = new Map(), preferences = new Map();
  const session = options.session || new Map();
  let timer, removed = false;
  const media = { matches: !!options.reduced, addEventListener: (k,v) => preferences.set(k,v), removeEventListener: k => preferences.delete(k) };
  const document = { documentElement: { dataset: {} }, querySelector: () => ({ remove() { removed = true; } }), addEventListener: (k,v) => events.set(k,v), removeEventListener: k => events.delete(k) };
  const window = { addEventListener: (k,v) => windowEvents.set(k,v), removeEventListener: k => windowEvents.delete(k) };
  vm.runInNewContext(source, { window, document, location: { hash: options.hash || '' }, matchMedia: () => media,
    localStorage: { getItem: () => { if (options.storageBlocked) throw Error('blocked'); return options.paused ? 'true' : null; } },
    sessionStorage: { getItem(k) { if (options.storageBlocked) throw Error('blocked'); return session.get(k); }, setItem: (k,v) => session.set(k,v) },
    performance: { now: () => 0, getEntriesByType: () => [{ type: options.navigation || 'navigate' }] },
    setTimeout(fn, delay) { assert.equal(delay, 3000); timer = fn; return 1; }, clearTimeout() { timer = null; },
  });
  return { opening: window.__paperOpening, document, events, session, windowEvents, media, preferences, timeout: () => timer?.(), get removed() { return removed; } };
}
let first = boot(); assert.equal(first.opening.active, true);
assert.equal(boot({ session: first.session }).opening.active, true, 'Repeat visit replays');
assert.equal(boot({ navigation: 'reload', session: new Map([['vince-paper-seen','true']]) }).opening.active, true, 'Reload ignores legacy seen preference');
for (const options of [{hash:'#about'}, {reduced:true}, {paused:true}, {navigation:'back_forward'}, {storageBlocked:true}]) {
  const result = boot(options); assert.equal(result.opening.active, false); assert.equal(result.document.documentElement.dataset.opening, 'skipped');
}
for (const key of ['Tab', 'Escape']) {
  const result = boot(); result.events.get('keydown')({key});
  assert.equal(result.opening.active, false); assert.equal(result.removed, true); assert.equal(result.events.size, 0);
}
const clicked = boot(); clicked.events.get('click')({target:{closest:()=>true}}); assert.equal(clicked.opening.active,false);
const slow = boot(); slow.timeout(); assert.equal(slow.opening.active,false); assert.equal(slow.document.documentElement.dataset.opening,'skipped');
const changed = boot(); changed.media.matches=true; changed.preferences.get('change')(); assert.equal(changed.opening.active,false);
const back = boot(); back.windowEvents.get('pagehide')(); assert.equal(back.opening.active,false);
const completed = boot(); completed.opening.finish('complete'); assert.equal(await completed.opening.done,'complete'); assert.equal(completed.document.documentElement.dataset.opening,'revealed');
globalThis.document = { createElementNS() { throw Error('No WebGL'); } };
globalThis.window = { removeEventListener() {} };
globalThis.cancelAnimationFrame = () => {};
const fallback = boot(); playPaperOpening({},fallback.opening); assert.equal(await fallback.opening.done,'fallback');
console.log('PASS: first/repeat visits, anchor/back skips, storage denial, reduced motion, saved pause, Skip/Tab/Escape, preference change, timeout and WebGL failure.');
