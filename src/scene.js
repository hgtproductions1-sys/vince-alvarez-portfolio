import * as THREE from 'three';
import { createConceptTheme } from './concept-scene-themes.js';

// Procedural backgrounds share one renderer lifecycle; no model downloads.
export function createScene(container, motion) {
  const finePointer = matchMedia('(pointer: fine)');
  let paused = motion.paused;
  let inView = true;
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const theme = container.dataset.theme || 'portfolio';
  const colors = { portfolio: 0x2448ff, forme: 0xe65b2e, tide: 0xc8ddd5, coffee: 0x996b4b, sora: 0xc3283d, mara: 0x51374f, foundry: 0xf8cf3c };
  const accent = colors[theme] ?? colors.portfolio;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 14);
  const coolTheme = theme === 'sora' || theme === 'mara' || theme === 'foundry';
  scene.add(new THREE.HemisphereLight(theme === 'forme' || coolTheme ? 0xf2f7f5 : 0xf2efe7, theme === 'forme' ? 0x273630 : coolTheme ? 0x29394a : 0x152273, 2));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cb4ff, 1.5);
  rim.position.set(5, -3, 2);
  scene.add(rim);

  const sculpture = new THREE.Group(), frames = new THREE.Group();
  const movingParts = [];
  const lineMaterial = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: theme === 'tide' ? .65 : .42 });
  const surface = new THREE.MeshStandardMaterial({ color: accent, roughness: .55, metalness: .18, transparent: true, opacity: .32 });
  const outline = (geometry, parent, threshold = 20) => {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, threshold), lineMaterial);
    geometry.dispose(); parent.add(edges); return edges;
  };
  const conceptTheme = createConceptTheme(theme, { sculpture, frames, lineMaterial });
  if (conceptTheme) {
    // New concepts reuse this renderer and its lifecycle through pose hooks.
  } else if (theme === 'forme') {
    // A small massing study: horizontal plates open around a sheltered court.
    surface.color.setHex(0xcdd3cf); surface.opacity = .72; surface.metalness = 0;
    lineMaterial.opacity = .7;
    for (let i = 0; i < 4; i++) {
      const level = new THREE.Group();
      const geometry = new THREE.BoxGeometry(4.2, .12, 2.7);
      level.add(new THREE.Mesh(geometry, surface));
      level.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), lineMaterial));
      level.position.y = (i - 1.5) * .85;
      sculpture.add(level); movingParts.push(level);
    }
    for (const x of [-1.75, 1.75]) for (const z of [-1, 1]) {
      const column = new THREE.Mesh(new THREE.BoxGeometry(.065, 3.2, .065), surface);
      column.position.set(x, 0, z); sculpture.add(column);
    }
    const court = outline(new THREE.BoxGeometry(1.3, 3.4, 1.1), frames);
    court.position.x = .3;
  } else if (theme === 'coffee') {
    // Three ceramic-white steam strokes. The real cup remains the photograph.
    for (let i = 0; i < 3; i++) {
      const points = Array.from({ length: 14 }, (_, j) => {
        const t = j / 13;
        return new THREE.Vector3((i - 1) * .58 + Math.sin(t * Math.PI * 2 + i) * .21, t * 2.8 - .55, Math.sin(t * Math.PI + i) * .23);
      });
      const material = new THREE.MeshBasicMaterial({ color: 0xfff8e8, transparent: true, opacity: .38, depthWrite: false });
      const steam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 42, .025, 5, false), material);
      sculpture.add(steam); movingParts.push(steam);
    }
  } else if (theme === 'tide') {
    // A low horizon of procedural wave contours, projected in perspective.
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(85 * 2 * 3), 3));
      const indices = [];
      for (let j = 0; j < 84; j++) { const a = j * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      geometry.setIndex(indices);
      // Vertices move after the first render. Keep a conservative fixed bound
      // for the complete wave envelope instead of a stale first-pose sphere.
      const z = (i - 3.5) * .6;
      geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-12.5, -.231, z - .116), new THREE.Vector3(12.5, .251, z + .116));
      geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
      const material = new THREE.MeshBasicMaterial({ color: 0xc8ddd5, transparent: true, opacity: .055 + (i % 3) * .012, depthWrite: false, side: THREE.DoubleSide });
      const wave = new THREE.Mesh(geometry, material);
      sculpture.add(wave); movingParts.push(wave);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3 + i * .3, .035, 6, 90), surface);
      ring.rotation.set(.55 + i * .18, i * .28, i * .13);
      sculpture.add(ring);
    }
    for (let i = 0; i < 4; i++) {
      const box = outline(new THREE.BoxGeometry(4 + i * .45, 2.6 + i * .3, .6), frames);
      box.rotation.set(i * .13, i * .12, -.18);
    }
  }
  scene.add(sculpture, frames);

  function draw() { if (!disposed && !contextLost) renderer.render(scene, camera); }
  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const mobile = width < 760;
    const aspect = width / height;
    const right = aspect > 1.1 ? aspect * 2.25 : 1.6;
    if (conceptTheme) {
      conceptTheme.resize(aspect, mobile);
    } else if (theme === 'portfolio') {
      sculpture.position.set(right, mobile ? -.8 : .2, -1.5);
      sculpture.scale.setScalar(1.45);
      frames.position.set(-right, mobile ? 1.3 : -1.7, -3);
      frames.scale.setScalar(1.2);
    } else if (theme === 'forme') {
      sculpture.position.set(0, 0, 0); frames.position.set(0, 0, 0);
      const scale = Math.min(1.1, aspect * 1.4);
      sculpture.scale.setScalar(scale); frames.scale.setScalar(scale);
    } else if (theme === 'coffee') {
      sculpture.position.set(0, .55, 0); sculpture.scale.setScalar(1.25);
    } else {
      sculpture.position.set(0, -1.8, -1); sculpture.scale.setScalar(1);
    }
    draw();
  }
  function pose(delta) {
    elapsed += delta;
    const follow = 1 - Math.exp(-delta * 6);
    pointer.x += (pointerTarget.x - pointer.x) * follow;
    pointer.y += (pointerTarget.y - pointer.y) * follow;
    if (conceptTheme) {
      conceptTheme.pose(elapsed, pointer);
    } else if (theme === 'forme') {
      const yaw = -.6 + Math.sin(elapsed * .18) * .16 + pointer.x * .07;
      sculpture.rotation.set(.38 + pointer.y * .035, yaw, -.06);
      frames.rotation.copy(sculpture.rotation);
      movingParts.forEach((plate, i) => { plate.position.y = (i - 1.5) * (.88 + Math.sin(elapsed * .5) * .09); });
    } else if (theme === 'coffee') {
      sculpture.rotation.y = Math.sin(elapsed * .3) * .12;
      movingParts.forEach((steam, i) => {
        const phase = elapsed * .65 + i * 1.6;
        steam.position.set(Math.sin(phase * .7) * .09, Math.sin(phase) * .16, 0);
        steam.material.opacity = .26 + (Math.sin(phase) + 1) * .12;
        steam.scale.x = 1 + Math.sin(phase * .6) * .08;
      });
    } else if (theme === 'tide') {
      sculpture.rotation.set(-.62 + pointer.y * .015, 0, -.035);
      movingParts.forEach((wave, i) => {
        const positions = wave.geometry.attributes.position;
        for (let j = 0; j < 85; j++) {
          const x = (j / 84 - .5) * 25;
          const y = Math.sin(x * .8 + elapsed * .6 + i * .5) * .11 + Math.sin(x * .29 - elapsed * .35) * .12;
          const z = (i - 3.5) * .6;
          const spread = .035 + Math.sin(j / 84 * Math.PI) * .08;
          positions.setXYZ(j * 2, x, y, z - spread);
          positions.setXYZ(j * 2 + 1, x, y + .02, z + spread);
        }
        positions.needsUpdate = true;
      });
    } else {
      sculpture.rotation.set(.12 + Math.sin(elapsed * .23) * .2 + pointer.y * .06, -.4 + elapsed * .13 + pointer.x * .14, -.1 + Math.sin(elapsed * .14) * .13);
      frames.rotation.set(.15 + pointer.y * .025, -.25 - elapsed * .08, Math.sin(elapsed * .12) * .1);
    }
  }
  function animate(time) {
    frame = 0;
    if (disposed || paused || document.hidden || !inView || contextLost) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    pose(delta); draw();
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    container.dataset.motionState = paused || document.hidden || !inView || contextLost ? 'paused' : 'running';
    if (!paused && !document.hidden && inView && !contextLost) frame = requestAnimationFrame(animate);
  }
  function onPointer(event) {
    if (!finePointer.matches || paused) return;
    pointerTarget.x = (event.clientX / innerWidth - .5) * 2;
    pointerTarget.y = (event.clientY / innerHeight - .5) * 2;
  }
  function onContextLost(event) {
    event.preventDefault(); contextLost = true; cancelAnimationFrame(frame);
    container.classList.remove('is-ready');
    renderer.domElement.style.display = 'none';
    container.dataset.renderMode = 'fallback';
    sync();
  }
  function onContextRestored() {
    contextLost = false; renderer.domElement.style.display = '';
    container.classList.add('is-ready'); container.dataset.renderMode = 'webgl'; resize(); sync();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, { threshold: 0 });
  intersection.observe(container);
  const unsubscribe = motion.subscribe(value => { paused = value; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pointermove', onPointer, { passive: true });
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  pose(0); resize(); sync();
  container.classList.add('is-ready');
  container.dataset.renderMode = 'webgl';

  function dispose(event) {
    if (event.persisted) return;
    disposed = true; cancelAnimationFrame(frame);
    resizeObserver.disconnect(); intersection.disconnect();
    unsubscribe();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pointermove', onPointer);
    const geometries = new Set(), materials = new Set([lineMaterial, surface]);
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
    renderer.dispose(); renderer.domElement.remove();
    window.removeEventListener('pagehide', dispose);
  }
  window.addEventListener('pagehide', dispose);
}
