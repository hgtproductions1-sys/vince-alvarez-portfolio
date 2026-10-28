// Entrances enhance content that is already visible. Cancelling an animation
// immediately returns to its ordinary CSS; there is no persistent hidden state.
export function mountConceptEntrances(root, motion) {
  if (!root?.querySelectorAll || !motion || !window.IntersectionObserver) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const candidates = [];
  const sections = [...root.querySelectorAll('section')];
  sections.forEach((section, sectionIndex) => {
    if (section.closest('[data-concept-story]') || section.querySelector('[data-concept-scene]') || [...section.classList].some(name => name.endsWith('-hero'))) return;
    const elements = [...section.querySelectorAll('h2, h3, p, figure, picture, img')]
      .filter(element => element.closest('section') === section && typeof element.animate === 'function')
      .filter(element => !element.closest('[hidden], [aria-hidden="true"], [aria-live], [role="status"], .sr-only'));
    // A figure/picture moves as a whole; its child photograph must not travel a
    // second time. The same rule keeps any selected text container unnested.
    const outermost = elements.filter(element => !elements.some(other => other !== element && other.contains(element)));
    outermost.forEach((element, index) => candidates.push({ element, sectionIndex, index, rank: element.matches('h2, h3') ? 0 : element.matches('p') ? 1 : 2 }));
  });
  if (!candidates.length) return () => {};

  const metadata = new Map(candidates.map(candidate => [candidate.element, candidate]));
  const animations = new Set();
  const seen = new WeakSet();
  let disposed = false;
  const allowed = () => !disposed && !motion.paused && !reduced.matches && !document.hidden;
  const cancel = () => {
    for (const animation of animations) animation.cancel();
    animations.clear();
  };
  const sync = () => { if (!allowed()) cancel(); };
  const observer = new window.IntersectionObserver(entries => {
    if (disposed) return;
    const entering = entries.filter(entry => entry.isIntersecting && !seen.has(entry.target))
      .sort((first, second) => {
        const a = metadata.get(first.target), b = metadata.get(second.target);
        return a.sectionIndex - b.sectionIndex || a.rank - b.rank || a.index - b.index;
      });
    entering.forEach((entry, index) => {
      const element = entry.target;
      seen.add(element); observer.unobserve(element);
      if (!allowed() || element.closest('[hidden]') || element.contains(document.activeElement)) return;
      // Preserve any authored static rotation/scale rather than replacing it.
      const base = window.getComputedStyle(element).transform;
      const transform = !base || base === 'none' ? '' : ` ${base}`;
      try {
        const animation = element.animate([
          { opacity: 0, transform: `translateY(20px)${transform}` },
          { opacity: 1, transform: base || 'none' },
        ], { duration: 650, delay: Math.min(index * 75, 225), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      } catch { /* Web Animations may be disabled; ordinary content stays visible. */ }
    });
  }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
  candidates.forEach(({ element }) => observer.observe(element));
  const unsubscribe = motion.subscribe(sync);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('focusin', cancel);
  window.addEventListener('pagehide', cancel);

  return () => {
    disposed = true; cancel(); observer.disconnect(); unsubscribe();
    reduced.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    document.removeEventListener('focusin', cancel);
    window.removeEventListener('pagehide', cancel);
  };
}
