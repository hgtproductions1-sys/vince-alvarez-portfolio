export const FRAME_COUNT = 48;
export const CACHE_LIMIT = 12;
export const frameIndex = progress => Math.round(Math.max(0, Math.min(1, progress)) * (FRAME_COUNT - 1));

// The HTML poster is the default. Enhance only after the first frame decodes.
export function createBlueprintScroll(section, motion) {
  if (!section || !globalThis.createImageBitmap || !globalThis.IntersectionObserver) return () => {};
  const canvas = section.querySelector('canvas');
  let context;
  try { context = canvas.getContext('2d', { alpha: false }); } catch { return () => {}; }
  if (!context) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const cache = new Map();
  const pending = new Map();
  let near = false, inView = false, disposed = false, failed = false, suspended = false;
  let width = mobile.matches ? 640 : 960;
  let target = 0, displayed = -1, raf = 0, epoch = 0;
  let hashTarget;
  try { hashTarget = document.getElementById?.(decodeURIComponent(window.location?.hash?.slice(1) || '')); } catch { /* Invalid hash. */ }
  const restoreLayout = window.history?.state?.vinceBlueprintActive === true;
  // A direct link below this section must keep its native anchor position.
  // Enhance on the way back up, once the section's beginning is in view.
  let deferred = !restoreLayout && !!hashTarget && !!(section.compareDocumentPosition(hashTarget) & 4);
  let lastScrollY = window.scrollY || 0;
  section.dataset.scrollMode = 'static';
  if (restoreLayout && !motion.paused && !reduced.matches) {
    section.classList.add('is-animated');
    section.dataset.scrollMode = 'restoring';
  }
  const rememberLayout = () => {
    try {
      const active = section.classList.contains('is-animated');
      if (window.history?.state?.vinceBlueprintActive === active) return;
      window.history?.replaceState({ ...window.history.state, vinceBlueprintActive: active }, '');
    } catch { /* History state is optional. */ }
  };
  const allowed = () => !deferred && !disposed && !failed && !suspended && !document.hidden && !motion.paused && !reduced.matches;
  const diagnostics = () => {
    section.dataset.frameCache = String(cache.size);
    section.dataset.framePending = String(pending.size);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const changeLayout = change => {
    // Lazy enhancement must not move an anchored section (for example #work),
    // or shift content when this section is entirely above the viewport.
    const before = section.getBoundingClientRect();
    const height = section.offsetHeight;
    let anchor;
    try { anchor = document.getElementById?.(decodeURIComponent(window.location?.hash?.slice(1) || '')); } catch { /* Malformed hashes are harmless. */ }
    const anchorTop = anchor?.getBoundingClientRect().top;
    const trackAnchor = anchor && (section.compareDocumentPosition(anchor) & 4) && anchorTop >= 0 && anchorTop < innerHeight;
    change();
    const delta = trackAnchor ? anchor.getBoundingClientRect().top - anchorTop : before.bottom <= 0 ? section.offsetHeight - height : 0;
    if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
  };
  const clear = () => {
    epoch++;
    for (const { controller, timer } of pending.values()) { clearTimeout(timer); controller.abort(); }
    pending.clear();
    for (const bitmap of cache.values()) bitmap.close();
    cache.clear();
    displayed = -1;
    diagnostics();
  };
  const staticMode = () => {
    stop(); clear();
    changeLayout(() => section.classList.remove('is-animated', 'has-frame'));
    rememberLayout();
    section.dataset.scrollMode = failed ? 'fallback' : 'static';
    delete section.dataset.frame;
  };
  const fail = () => { failed = true; staticMode(); };
  const progress = () => {
    const rect = section.getBoundingClientRect();
    const travel = section.classList.contains('is-animated')
      ? section.offsetHeight - section.querySelector('.blueprint-stage').offsetHeight
      : innerHeight * (mobile.matches ? .7 : 1);
    return frameIndex(-rect.top / Math.max(1, travel));
  };
  const desired = () => {
    const list = [target];
    for (let distance = 1; list.length < CACHE_LIMIT; distance++) {
      if (target + distance < FRAME_COUNT) list.push(target + distance);
      if (list.length < CACHE_LIMIT && target - distance >= 0) list.push(target - distance);
    }
    return list;
  };
  const schedule = () => {
    if (!raf && allowed() && near && inView) raf = requestAnimationFrame(update);
  };
  const pump = () => {
    if (!allowed() || !near) return;
    const wanted = desired();
    for (const [index, job] of pending) {
      if (!wanted.includes(index)) { job.controller.abort(); clearTimeout(job.timer); pending.delete(index); }
    }
    for (const index of wanted) {
      if (pending.size >= 2) break;
      if (cache.has(index) || pending.has(index)) continue;
      const controller = new AbortController();
      const generation = epoch;
      const job = { controller, timer: setTimeout(fail, 8000) };
      pending.set(index, job);
      diagnostics();
      fetch(`/animation/blueprint/${width}/${String(index).padStart(3, '0')}.webp`, { signal: controller.signal })
        .then(response => { if (!response.ok) throw Error('Frame unavailable'); return response.blob(); })
        .then(blob => controller.signal.aborted ? null : createImageBitmap(blob))
        .then(bitmap => {
          if (!bitmap) return;
          if (generation !== epoch || controller.signal.aborted || !allowed() || !near) { bitmap.close(); return; }
          while (cache.size >= CACHE_LIMIT) {
            const oldest = [...cache.keys()].find(key => !desired().includes(key)) ?? cache.keys().next().value;
            cache.get(oldest).close(); cache.delete(oldest);
          }
          cache.set(index, bitmap);
          if (index === target) {
            if (!section.classList.contains('is-animated')) changeLayout(() => section.classList.add('is-animated'));
            rememberLayout();
            section.dataset.scrollMode = 'scroll';
          }
          schedule();
        })
        .catch(error => { if (error.name !== 'AbortError' && generation === epoch) fail(); })
        .finally(() => {
          clearTimeout(job.timer);
          if (pending.get(index) === job) pending.delete(index);
          diagnostics();
          if (generation === epoch) pump();
        });
    }
  };
  function update() {
    raf = 0;
    if (!allowed() || !inView || !near) return;
    target = progress();
    const bitmap = cache.get(target);
    if (bitmap && displayed !== target) {
      if (canvas.width !== width) { canvas.width = width; canvas.height = width * 9 / 16; }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      cache.delete(target); cache.set(target, bitmap);
      displayed = target;
      section.dataset.frame = String(target);
      section.classList.add('has-frame');
    }
    pump();
  }
  const prepare = () => {
    if (!allowed() || !near) return;
    target = progress();
    pump(); schedule();
  };
  const scroll = () => {
    const currentY = window.scrollY || 0;
    if (deferred && currentY < lastScrollY && section.getBoundingClientRect().top >= 0) {
      deferred = false;
      prepare();
    }
    lastScrollY = currentY;
    schedule();
  };
  const syncMotion = () => { if (motion.paused || reduced.matches) staticMode(); else prepare(); };
  const resize = () => {
    const nextWidth = mobile.matches ? 640 : 960;
    if (width !== nextWidth) { clear(); width = nextWidth; section.classList.remove('has-frame'); }
    prepare();
  };
  const visibility = () => { if (document.hidden) { stop(); clear(); } else prepare(); };
  const hide = () => { rememberLayout(); suspended = true; stop(); clear(); };
  const show = () => { suspended = false; prepare(); };
  const nearby = new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) prepare();
    else { stop(); clear(); }
  }, { rootMargin: '80% 0px' });
  const visible = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) prepare(); else stop();
  });
  nearby.observe(section); visible.observe(section);
  const unsubscribe = motion.subscribe(syncMotion);
  reduced.addEventListener('change', syncMotion);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('hashchange', rememberLayout);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  return () => {
    // Keep geometry unchanged during navigation so history saves the right
    // scroll offset. Only release resources; the outgoing DOM is discarded.
    disposed = true; stop(); clear(); unsubscribe(); nearby.disconnect(); visible.disconnect();
    reduced.removeEventListener('change', syncMotion);
    window.removeEventListener('scroll', scroll); window.removeEventListener('hashchange', rememberLayout); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show);
  };
}
