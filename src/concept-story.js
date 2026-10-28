const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const conceptStoryProgress = (sectionTop, stickyTop, travel) => clamp((stickyTop - sectionTop) / Math.max(1, travel));
export const conceptStoryChapter = (progress, count) => Math.max(0, Math.min(count - 1, Math.floor(clamp(progress) * count)));

// Every chapter is readable in HTML. Pinning is an optional, event-driven layer.
export function mountConceptStory(section, motion) {
  const stage = section?.querySelector('[data-story-stage]');
  const steps = [...(section?.querySelectorAll('[data-story-step]') || [])];
  if (!stage || steps.length < 2 || !motion || !window.IntersectionObserver || !window.requestAnimationFrame) {
    if (section) section.dataset.storyStatic = 'true';
    return () => {};
  }
  const images = [...new Set(section.querySelectorAll('img'))];
  const separateImages = [...section.querySelectorAll('[data-story-image]')].filter(image => !steps.some(step => step.contains(image)));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const originalStyle = ['height', 'min-height'].map(name => [name, section.style.getPropertyValue(name), section.style.getPropertyPriority(name)]);
  const originalAccessibility = new Map([...steps, ...separateImages].map(node => [node, { inert: node.inert, hidden: node.getAttribute('aria-hidden') }]));
  const originalLoading = new Map(images.map(image => [image, image.getAttribute('loading')]));
  steps.forEach((step, index) => { step.dataset.storyStep = String(index); });

  const key = `${window.location.pathname}:${section.id || [...document.querySelectorAll('[data-concept-story]')].indexOf(section)}`;
  const navigation = window.performance?.getEntriesByType?.('navigation')?.[0]?.type;
  const restoring = navigation === 'back_forward' && window.history?.state?.vinceConceptStories?.[key] === true;
  const targetForHash = () => {
    try { return document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch { return null; }
  };
  const isBelow = target => !!target && !section.contains(target) && !!(section.compareDocumentPosition(target) & 4);
  let deferred = !restoring && isBelow(targetForHash());
  let disposed = false, suspended = false, failed = false, near = false, visible = false, ready = images.length === 0, loading = false;
  let raf = 0, epoch = 0, displayed = -1, travel = 0, stickyTop = 0, lastScroll = window.scrollY || 0;
  let blockedFit = '', fontRevision = 0;
  const fitKey = () => `${window.innerWidth}:${window.innerHeight}:${mobile.matches}:${fontRevision}`;
  const imageWaiters = new Set();
  section.dataset.storyStatic = 'true';
  section.dataset.storyMode = deferred ? 'deferred' : 'static';

  const remember = () => {
    try {
      const active = section.classList.contains('is-story-active');
      const existing = window.history.state?.vinceConceptStories || {};
      if (existing[key] !== active) window.history.replaceState({ ...window.history.state, vinceConceptStories: { ...existing, [key]: active } }, '');
    } catch { /* Private browsing or an embedded preview may restrict history. */ }
  };
  const stop = () => { if (raf) window.cancelAnimationFrame(raf); raf = 0; };
  const cancelImages = () => {
    epoch++;
    for (const cancel of [...imageWaiters]) cancel();
    imageWaiters.clear(); loading = false;
  };
  const changeLayout = change => {
    const before = section.getBoundingClientRect(), height = section.offsetHeight;
    const anchor = targetForHash(), anchorTop = anchor?.getBoundingClientRect().top;
    const trackAnchor = isBelow(anchor) && anchorTop >= 0 && anchorTop < window.innerHeight;
    change();
    const delta = trackAnchor ? anchor.getBoundingClientRect().top - anchorTop : before.bottom <= 0 ? section.offsetHeight - height : 0;
    if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
  };
  const restoreAccessibility = () => {
    for (const [node, original] of originalAccessibility) {
      node.inert = original.inert;
      if (original.hidden === null) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', original.hidden);
    }
  };
  const staticMode = reason => {
    stop(); cancelImages();
    changeLayout(() => {
      section.classList.remove('is-story-active');
      for (const [name, value, priority] of originalStyle) {
        if (value) section.style.setProperty(name, value, priority); else section.style.removeProperty(name);
      }
      section.style.removeProperty('--story-progress');
      restoreAccessibility();
    });
    section.dataset.storyStatic = 'true'; section.dataset.storyMode = reason;
    delete section.dataset.storyStep; displayed = -1;
    remember();
  };
  const eligible = () => !disposed && !failed && !deferred && !motion.paused && !reduced.matches;
  const canWork = () => eligible() && !suspended && !document.hidden;
  const setChapter = progress => {
    let index = conceptStoryChapter(progress, steps.length);
    // A focused link remains visible until focus leaves its chapter; Tab never
    // moves into a chapter that is hidden by scrolling.
    const focused = steps.findIndex(step => step.contains(document.activeElement));
    if (focused >= 0) index = focused;
    section.style.setProperty('--story-progress', progress.toFixed(4));
    if (index === displayed) return;
    displayed = index; section.dataset.storyStep = String(index);
    steps.forEach((step, position) => { step.inert = position !== index; step.setAttribute('aria-hidden', String(position !== index)); });
    separateImages.forEach(image => image.setAttribute('aria-hidden', String(Number(image.dataset.storyImage) !== index)));
  };
  const fits = () => {
    stickyTop = Math.max(0, Number.parseFloat(window.getComputedStyle(stage).top) || 0);
    const height = stage.getBoundingClientRect().height;
    if (!height || height > window.innerHeight - stickyTop + 2 || window.innerHeight < 540) return false;
    if (stage.scrollHeight > stage.clientHeight + 4) return false;
    return steps.every(step => step.scrollHeight <= step.clientHeight + 4);
  };
  const activate = () => {
    // Failed pinning changes the observed stage back to its normal-flow height.
    // Do not let that ResizeObserver notification retry the same failing layout.
    // Actual viewport changes or completed font loading produce a new key.
    const measurementKey = fitKey();
    if (blockedFit === measurementKey) return false;
    if (window.innerHeight < 540) {
      blockedFit = measurementKey; staticMode('viewport'); return false;
    }
    let valid = false;
    changeLayout(() => {
      section.classList.add('is-story-active');
      // Set an initial chapter before measuring absolute panels.
      if (displayed < 0) setChapter(0);
      valid = fits();
      if (!valid) return;
      travel = window.innerHeight * (mobile.matches ? .7 : 1);
      const height = `${Math.ceil(stage.getBoundingClientRect().height + travel)}px`;
      section.style.setProperty('height', height); section.style.setProperty('min-height', height);
    });
    if (!valid) { blockedFit = measurementKey; staticMode('viewport'); return false; }
    blockedFit = '';
    section.dataset.storyStatic = 'false'; section.dataset.storyMode = ready ? 'scroll' : 'restoring';
    remember(); return true;
  };
  const schedule = () => {
    if (!raf && canWork() && visible && section.classList.contains('is-story-active')) raf = window.requestAnimationFrame(update);
  };
  function update() {
    raf = 0;
    if (!canWork() || !visible || !section.classList.contains('is-story-active')) return;
    setChapter(conceptStoryProgress(section.getBoundingClientRect().top, stickyTop, travel));
  }
  const waitForImage = image => new Promise((resolve, reject) => {
    let settled = false;
    const finish = error => {
      if (settled) return; settled = true;
      window.clearTimeout(timer); image.removeEventListener('load', loaded); image.removeEventListener('error', broken); imageWaiters.delete(cancel);
      if (error) reject(error); else resolve();
    };
    const loaded = () => {
      if (!image.naturalWidth) { finish(Error('Image unavailable')); return; }
      if (image.decode) image.decode().then(() => finish(), () => finish(Error('Image decode failed')));
      else finish();
    };
    const broken = () => finish(Error('Image unavailable'));
    const cancel = () => finish(Object.assign(Error('Cancelled'), { name: 'AbortError' }));
    const timer = window.setTimeout(() => finish(Error('Image startup timed out')), 8000);
    imageWaiters.add(cancel); image.addEventListener('load', loaded); image.addEventListener('error', broken);
    image.loading = 'eager';
    if (image.complete) loaded();
  });
  const prepareImages = () => {
    if (loading || ready || !near || !canWork()) return;
    loading = true;
    const generation = epoch;
    Promise.all(images.map(waitForImage)).then(() => {
      if (generation !== epoch || disposed) return;
      loading = false; ready = true; sync();
    }).catch(error => {
      if (generation !== epoch || disposed || error.name === 'AbortError') return;
      failed = true; staticMode('fallback');
    });
  };
  function sync() {
    if (disposed) return;
    if (!eligible()) { staticMode(failed ? 'fallback' : deferred ? 'deferred' : 'static'); return; }
    if (!canWork()) { stop(); return; }
    if (ready && (near || section.classList.contains('is-story-active'))) {
      if (activate()) schedule();
    } else prepareImages();
  }
  const scroll = () => {
    const next = window.scrollY || 0;
    if (deferred && near && next < lastScroll && section.getBoundingClientRect().top >= 0) {
      deferred = false; sync();
    }
    lastScroll = next; schedule();
  };
  const visibility = () => { if (document.hidden) { stop(); cancelImages(); } else sync(); };
  const hide = () => { remember(); suspended = true; stop(); cancelImages(); };
  const show = () => { suspended = false; sync(); };
  const hash = () => { if (!section.classList.contains('is-story-active') && isBelow(targetForHash())) deferred = true; remember(); sync(); };
  const nearObserver = new window.IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) sync(); else { stop(); cancelImages(); }
  }, { rootMargin: '80% 0px' });
  const visibleObserver = new window.IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) sync(); else stop(); });
  const resizeObserver = window.ResizeObserver ? new window.ResizeObserver(() => { if (near) sync(); }) : null;
  nearObserver.observe(section); visibleObserver.observe(section); resizeObserver?.observe(stage);
  const unsubscribe = motion.subscribe(sync);
  reduced.addEventListener('change', sync); mobile.addEventListener('change', sync);
  window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', sync); window.addEventListener('hashchange', hash);
  window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
  document.addEventListener('visibilitychange', visibility); section.addEventListener('focusin', schedule); section.addEventListener('focusout', schedule);
  const fontsChanged = () => { if (!disposed) { fontRevision++; sync(); } };
  document.fonts?.ready?.then(fontsChanged);
  document.fonts?.addEventListener?.('loadingdone', fontsChanged);
  // Restore the previous history entry's geometry before the browser restores
  // its scroll offset. Image preparation still waits until the section is near.
  if (restoring && eligible()) activate();

  return () => {
    // Keep outgoing geometry intact so Back records the correct scroll offset.
    remember(); disposed = true; stop(); cancelImages(); unsubscribe();
    nearObserver.disconnect(); visibleObserver.disconnect(); resizeObserver?.disconnect();
    reduced.removeEventListener('change', sync); mobile.removeEventListener('change', sync);
    window.removeEventListener('scroll', scroll); window.removeEventListener('resize', sync); window.removeEventListener('hashchange', hash);
    window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); document.removeEventListener('visibilitychange', visibility);
    document.fonts?.removeEventListener?.('loadingdone', fontsChanged);
    section.removeEventListener('focusin', schedule); section.removeEventListener('focusout', schedule);
    for (const [image, loadingAttribute] of originalLoading) {
      if (loadingAttribute === null) image.removeAttribute('loading'); else image.setAttribute('loading', loadingAttribute);
    }
  };
}
