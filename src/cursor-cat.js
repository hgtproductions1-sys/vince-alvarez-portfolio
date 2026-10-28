import { controlSelector } from './pointer-target.js';

export function createCursorCat({ button, motion, opening, env = globalThis }) {
  if (!button) return () => {};
  const doc = env.document;
  const fine = env.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reduced = env.matchMedia('(prefers-reduced-motion: reduce)');
  const cat = doc.createElement('div');
  cat.className = 'cursor-cat'; cat.setAttribute('aria-hidden', 'true');
  cat.innerHTML = `<svg viewBox="0 0 48 48" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 35 43 25 40 40 29 42" fill="#1632bd"/>
    <path d="m14 24 17 1 7 17H11Z" fill="#2448ff"/>
    <path d="m14 24 12 11-15 7Z" fill="#5470ff"/><path d="m31 25-5 10 12 7Z" fill="#1835ca"/>
    <path class="cat-ear" d="M9 18 8 4 19 12M25 12 36 5 34 21" fill="#2448ff"/>
    <path d="m8 16 13-7 15 8-6 13-13 1Z" fill="#2448ff"/>
    <path d="m8 16 13 4-4 11Z" fill="#6d84ff"/><path d="m21 9 0 11 15-3Z" fill="#4b69ff"/>
    <path d="m21 20 9 10-13 1Z" fill="#1937ce"/><path d="m21 20 3 4-4 1Z" fill="#f2efe7"/>
    <path d="m13 18 3 1m12-1 3-1" stroke="#f2efe7" stroke-width="1.4" stroke-linecap="round"/>
    <path d="m26 35 1 7M14 24l12 11" stroke="#a2b0ff" stroke-opacity=".5" stroke-width=".7"/>
  </svg>`;
  doc.body.append(cat);
  const removers = [];
  let hidden = false;
  try { hidden = env.localStorage.getItem('vince-cat-hidden') === 'true'; } catch { /* Optional preference. */ }
  let ready = !opening?.active, inside = false, blocked = false, away = false, disposed = false;
  let x = 0, y = 0, targetX = 0, targetY = 0, pointerX = 0, pointerY = 0, positioned = false, raf = 0, lastTime = 0, facing = 1;
  const listen = (target, name, fn, options) => { target.addEventListener(name, fn, options); removers.push(() => target.removeEventListener(name, fn, options)); };
  const allowed = () => ready && fine.matches && !reduced.matches && !motion.paused && !hidden && !doc.hidden && !away;
  const stop = () => { if (raf) env.cancelAnimationFrame(raf); raf = 0; lastTime = 0; };
  const paint = () => { cat.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`; cat.firstElementChild.style.transform = `scaleX(${facing})`; };
  const frame = time => {
    raf = 0;
    if (!allowed() || !inside || blocked || disposed) { stop(); return; }
    const amount = 1 - Math.exp(-Math.min(lastTime ? time - lastTime : 16, 64) / 140);
    lastTime = time;
    x += (targetX - x) * amount; y += (targetY - y) * amount;
    if (Math.abs(targetX - x) + Math.abs(targetY - y) < .2) { x = targetX; y = targetY; lastTime = 0; paint(); return; }
    paint(); raf = env.requestAnimationFrame(frame);
  };
  const sync = () => {
    button.hidden = !fine.matches || !ready;
    button.textContent = hidden ? 'Show cat' : 'Hide cat';
    button.setAttribute('aria-pressed', String(!hidden));
    const visible = allowed() && inside && !blocked;
    cat.dataset.visible = String(visible);
    if (!visible) stop();
    else if (!raf) raf = env.requestAnimationFrame(frame);
  };
  const place = () => {
    targetX = Math.max(4, Math.min(env.innerWidth - 44, pointerX + 28));
    targetY = Math.max(4, Math.min(env.innerHeight - 44, pointerY + 28));
  };
  const isBlocked = target => !!target?.closest?.(`${controlSelector},[contenteditable]:not([contenteditable="false"]),video,[inert]`);
  const move = event => {
    if (event.pointerType !== 'mouse') { inside = false; sync(); return; }
    if (positioned && Math.abs(event.clientX - pointerX) > 1) facing = event.clientX > pointerX ? 1 : -1;
    pointerX = event.clientX; pointerY = event.clientY; inside = true; blocked = isBlocked(event.target); place();
    if (!positioned) { x = targetX; y = targetY; positioned = true; paint(); }
    sync();
  };
  const over = event => {
    if (event.pointerType !== 'mouse') return;
    const next = isBlocked(event.target);
    cat.dataset.alert = String(next);
    blocked = next; sync();
  };
  listen(doc, 'pointermove', move, { passive: true });
  listen(doc, 'pointerover', over, { passive: true });
  listen(doc, 'pointerout', event => { if (!event.relatedTarget) { inside = false; positioned = false; sync(); } });
  listen(doc, 'keydown', () => { inside = false; sync(); });
  listen(doc, 'scroll', () => { inside = false; sync(); }, { passive: true, capture: true });
  listen(doc, 'visibilitychange', () => { inside = false; sync(); });
  listen(env, 'blur', () => { inside = false; sync(); });
  listen(env, 'resize', () => { place(); sync(); });
  listen(fine, 'change', sync); listen(reduced, 'change', sync);
  listen(button, 'click', () => {
    hidden = !hidden;
    try { env.localStorage.setItem('vince-cat-hidden', String(hidden)); } catch { /* Optional preference. */ }
    sync();
  });
  const unsubscribe = motion.subscribe(sync);
  opening?.done.then(() => { if (!disposed) { ready = true; sync(); } });
  const dispose = () => { if (disposed) return; disposed = true; stop(); unsubscribe(); removers.forEach(remove => remove()); cat.remove(); button.hidden = true; };
  listen(env, 'pagehide', event => { if (event.persisted) { away = true; inside = false; sync(); } else dispose(); });
  listen(env, 'pageshow', () => { away = false; sync(); });
  sync();
  return dispose;
}
