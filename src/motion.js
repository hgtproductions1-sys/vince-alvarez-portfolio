// One preference drives the 3D scene and the capabilities ticker independently.
export function createMotionController(button, labels = {}) {
  const buttons = typeof button?.[Symbol.iterator] === 'function' ? [...button] : [button];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let rememberedPause = false;
  try { rememberedPause = localStorage.getItem('vince-motion-paused') === 'true'; } catch { /* Storage is optional. */ }
  let paused = media.matches || rememberedPause;
  let manualMotion = false;
  const listeners = new Set();
  const publish = () => {
    document.documentElement.dataset.motionPaused = String(paused);
    document.documentElement.dataset.motionReduced = String(media.matches && !manualMotion);
    buttons.forEach(control => {
      control.setAttribute('aria-pressed', String(paused));
      control.setAttribute('aria-label', paused ? (labels.play || 'Play background and strip motion') : (labels.pause || 'Pause background and strip motion'));
      control.textContent = paused ? 'Play motion ▷' : 'Pause motion Ⅱ';
    });
    listeners.forEach(listener => listener(paused));
  };
  const toggle = () => {
    paused = !paused;
    manualMotion = !paused;
    rememberedPause = paused;
    try { localStorage.setItem('vince-motion-paused', String(paused)); } catch { /* Storage is optional. */ }
    publish();
  };
  const preferenceChanged = () => { manualMotion = false; paused = media.matches || rememberedPause; publish(); };
  buttons.forEach(control => control.addEventListener('click', toggle));
  media.addEventListener('change', preferenceChanged);
  publish();
  return {
    get paused() { return paused; },
    subscribe(listener) { listeners.add(listener); listener(paused); return () => listeners.delete(listener); },
    dispose() { buttons.forEach(control => control.removeEventListener('click', toggle)); media.removeEventListener('change', preferenceChanged); listeners.clear(); },
  };
}

export function createTicker(strip, motion) {
  const track = strip.querySelector('.capability-track');
  const group = strip.querySelector('.capability-group');
  const duplicate = group.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.classList.add('capability-copy');
  track.append(duplicate);
  strip.classList.add('ticker-ready');
  let inView = true;
  const sync = () => { track.style.animationPlayState = motion.paused || document.hidden || !inView ? 'paused' : 'running'; };
  const measure = () => {
    const width = group.getBoundingClientRect().width;
    if (width) {
      track.style.setProperty('--ticker-distance', `${width}px`);
      track.style.setProperty('--ticker-duration', `${width / 28}s`);
    }
  };
  const unsubscribe = motion.subscribe(sync);
  const resize = new ResizeObserver(measure);
  resize.observe(group);
  const intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); });
  intersection.observe(strip);
  document.addEventListener('visibilitychange', sync);
  document.fonts.ready.then(measure);
  measure();
  return () => { unsubscribe(); resize.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', sync); duplicate.remove(); };
}
