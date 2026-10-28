import { pointerControl } from './pointer-target.js';
import { createHoverSamples } from './hover-sound.js';
// Opt-in sound: a locally composed ambient loop, paper foley and a quiet tap.
export function createPortfolioAudio({ button, video, opening, env = globalThis }) {
  if (!button) return () => {};
  const AudioEngine = env.AudioContext || env.webkitAudioContext;
  if (!AudioEngine) return () => {};
  const doc = env.document;
  const files = { music: '/audio/portfolio-chill.mp3', unfold: '/audio/paper-unfold.mp3', lift: '/audio/paper-lift.mp3' };
  const effects = new Set(), removers = [];
  let context, master, musicGain, effectsGain, music, buffers, loading;
  let enabled = false, disposed = false, pageAway = false, suspendTimer, revision = 0;
  let lastHover = -Infinity, hoverBuffer, hoverCount = 0;
  const listen = (target, type, handler) => {
    target?.addEventListener(type, handler);
    removers.push(() => target?.removeEventListener(type, handler));
  };
  const videoPlaying = () => video && !video.paused && !video.ended;
  const audible = () => enabled && !disposed && !pageAway && !doc.hidden && !videoPlaying();
  const update = () => {
    const state = !enabled ? 'off' : videoPlaying() ? 'video' : pageAway || doc.hidden ? 'hidden' : !buffers ? 'loading' : 'on';
    button.setAttribute('aria-pressed', String(enabled));
    button.dataset.soundState = state;
    button.querySelector('[data-sound-label]').textContent = state === 'loading' ? 'Loading sound…' : enabled ? 'Sound on' : 'Sound off';
    button.setAttribute('aria-label', enabled ? 'Sound on — turn off music and effects' : 'Sound off — turn on music and effects');
    button.title = state === 'video' ? 'Sound pauses while the introduction video plays. Click to turn sound off.' : enabled ? 'Turn off music and sound effects' : 'Turn on quiet music and soft paper sounds';
    doc.documentElement.dataset.audioState = state;
    doc.documentElement.dataset.audioContext = context?.state || 'not-created';
  };
  const fade = (parameter, value, seconds = .18) => {
    const now = context.currentTime;
    if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
    else { parameter.cancelScheduledValues(now); parameter.setValueAtTime(parameter.value, now); }
    parameter.linearRampToValueAtTime(value, now + seconds);
  };
  const stopEffects = () => {
    for (const source of effects) { try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); }
    effects.clear();
  };
  const unavailable = () => {
    enabled = false; revision++;
    if (context && master) { fade(master.gain, 0); stopEffects(); void context.suspend().catch(() => {}); }
    update(); button.title = 'Sound could not start. Click to try again.';
  };
  const reconcile = async () => {
    env.clearTimeout(suspendTimer);
    update();
    if (!context) return;
    if (!audible()) {
      fade(master.gain, 0); stopEffects();
      suspendTimer = env.setTimeout(() => { if (!audible()) void context.suspend().then(update).catch(() => {}); }, 210);
      return;
    }
    try {
      await context.resume();
      if (!audible()) return;
      fade(master.gain, 1, .45); update();
    } catch { unavailable(); }
  };
  const initialize = () => {
    if (context) return;
    context = new AudioEngine({ latencyHint: 'playback' });
    master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
    musicGain = context.createGain(); musicGain.gain.value = .2; musicGain.connect(master);
    effectsGain = context.createGain(); effectsGain.gain.value = .2; effectsGain.connect(master);
    listen(context, 'statechange', update);
  };
  const load = () => {
    if (!loading) loading = Promise.all(Object.entries(files).map(async ([name, url]) => {
      const response = await env.fetch(url);
      if (!response.ok) throw Error('Audio unavailable');
      return [name, await context.decodeAudioData(await response.arrayBuffer())];
    })).then(entries => { buffers = Object.fromEntries(entries); }).catch(error => { loading = null; throw error; });
    return loading;
  };
  const track = source => {
    effects.add(source);
    source.onended = () => { effects.delete(source); source.disconnect(); };
  };
  const paperSound = (phase, elapsed) => {
    if (!audible() || context?.state !== 'running' || !buffers || !opening?.active) return;
    const name = phase === 'unfold' ? 'unfold' : phase === 'lift' ? 'lift' : null;
    if (!name) return;
    const offset = Math.max(0, (elapsed - (name === 'unfold' ? 100 : 1350)) / 1000);
    if (offset >= buffers[name].duration) return;
    const source = context.createBufferSource(); source.buffer = buffers[name]; source.connect(effectsGain);
    track(source); source.start(0, offset);
  };
  const tap = () => {
    if (!audible() || context?.state !== 'running') return;
    const now = context.currentTime, source = context.createOscillator(), envelope = context.createGain();
    source.type = 'sine'; source.frequency.setValueAtTime(310, now); source.frequency.exponentialRampToValueAtTime(170, now + .065);
    envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(.32, now+.004); envelope.gain.exponentialRampToValueAtTime(.0001, now+.075);
    source.connect(envelope); envelope.connect(effectsGain); track(source);
    source.onended = () => { effects.delete(source); source.disconnect(); envelope.disconnect(); };
    source.start(now); source.stop(now+.085);
  };
  const hoverTick = event => {
    if (event.pointerType !== 'mouse' || !env.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches) return;
    const control = pointerControl(event.target);
    if (!control || control === pointerControl(event.relatedTarget)) return;
    if (!audible() || context?.state !== 'running' || context.currentTime - lastHover < .12) return;
    lastHover = context.currentTime;
    // Local synthesis is ready immediately; it never waits for the music download.
    if (!hoverBuffer) {
      const samples = createHoverSamples(context.sampleRate);
      hoverBuffer = context.createBuffer(1, samples.length, context.sampleRate);
      hoverBuffer.getChannelData(0).set(samples);
    }
    const source = context.createBufferSource(); source.buffer = hoverBuffer; source.connect(effectsGain);
    track(source); source.start();
    doc.documentElement.dataset.audioHoverCount = String(++hoverCount);
  };
  const toggle = async () => {
    enabled = !enabled; const request = ++revision; update();
    if (!enabled) { await reconcile(); return; }
    try {
      // Create/resume inside this explicit click, before fetching or decoding.
      initialize(); await context.resume();
      if (disposed || request !== revision || !enabled) return;
      await reconcile();
      await load();
      if (disposed || request !== revision || !enabled) return;
      if (!music) {
        music = context.createBufferSource(); music.buffer = buffers.music; music.loop = true;
        music.loopEnd = Math.min(32, buffers.music.duration); music.connect(musicGain); music.start();
        doc.documentElement.dataset.audioLoopSeconds = String(music.loopEnd);
      }
      await reconcile();
      if (request !== revision || !audible()) return;
      const elapsed = Number(doc.documentElement.dataset.paperElapsed || 0);
      if (opening?.active && elapsed >= 100 && elapsed < 850) paperSound('unfold', elapsed);
      else if (opening?.active && elapsed >= 1350) paperSound('lift', elapsed);
      else tap();
    } catch { if (!disposed && request === revision) unavailable(); }
  };
  button.hidden = false; update(); listen(button, 'click', toggle);
  listen(doc, 'visibilitychange', reconcile);
  for (const type of ['play', 'pause', 'ended', 'emptied']) listen(video, type, reconcile);
  listen(doc, 'portfolio:paper-phase', event => paperSound(event.detail.phase, event.detail.elapsed));
  listen(doc, 'pointerover', hoverTick);
  listen(doc, 'click', event => {
    if (event.target.closest('.menu-toggle,[data-filter],.faq-list summary,.copy-email,.copy-brief,[data-motion-toggle]')) tap();
  });
  opening?.done.then(() => { if (context) stopEffects(); });
  const dispose = () => {
    if (disposed) return;
    disposed = true; enabled = false; revision++;
    env.clearTimeout(suspendTimer); stopEffects();
    try { music?.stop(); } catch { /* Already stopped. */ }
    music?.disconnect(); master?.disconnect(); musicGain?.disconnect(); effectsGain?.disconnect();
    removers.forEach(remove => remove()); if (context) void context.close().catch(() => {});
  };
  listen(env, 'pagehide', event => { if (event.persisted) { pageAway = true; void reconcile(); } else dispose(); });
  listen(env, 'pageshow', () => { pageAway = false; void reconcile(); });
  return dispose;
}
