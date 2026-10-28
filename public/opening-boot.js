// Runs before paint; the page always releases even if the application cannot load.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let eligible = false;
  try {
    eligible = !location.hash && !reduced.matches &&
      localStorage.getItem('vince-motion-paused') !== 'true' &&
      performance.getEntriesByType('navigation')[0]?.type !== 'back_forward';
  } catch { /* Optional storage: show the portfolio directly. */ }
  let resolve;
  const done = new Promise(finish => { resolve = finish; });
  const opening = { active: eligible, deadline: performance.now() + 3000, done };
  let timer;
  const finish = (reason = 'skipped') => {
    if (!opening.active) return;
    opening.active = false;
    clearTimeout(timer);
    root.dataset.opening = reason === 'complete' ? 'revealed' : 'skipped';
    root.dataset.openingResult = reason;
    root.dataset.openingElapsed = String(Math.round(performance.now() - opening.deadline + 3000));
    document.querySelector('.paper-opening')?.remove();
    document.removeEventListener('keydown', keyboard, true);
    document.removeEventListener('click', click, true);
    window.removeEventListener('pagehide', leave);
    reduced.removeEventListener('change', preference);
    resolve(reason);
  };
  const keyboard = event => { if (event.key === 'Escape' || event.key === 'Tab') finish(); };
  const click = event => { if (event.target.closest('[data-skip-opening]')) finish(); };
  const preference = () => { if (reduced.matches) finish(); };
  const leave = () => finish();
  opening.finish = finish;
  window.__paperOpening = opening;
  if (!eligible) { root.dataset.opening = 'skipped'; root.dataset.openingResult = 'not-eligible'; resolve('skipped'); return; }
  root.dataset.opening = 'pending';
  timer = setTimeout(() => finish('timeout'), 3000);
  document.addEventListener('keydown', keyboard, true);
  document.addEventListener('click', click, true);
  window.addEventListener('pagehide', leave);
  reduced.addEventListener('change', preference);
})();
