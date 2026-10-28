import * as THREE from 'three';

const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// Integrate connected pleats so adjacent vertices always share a crease.
// Each strip keeps its length as its hinge opens; no sphere-to-plane scaling.
function pleats(length, segments, elapsed, delay, coordinates, depth) {
  coordinates[0] = 0; depth[0] = 0;
  for (let k = 0; k < segments; k++) {
    const remaining = 1 - smooth((elapsed - 100 - delay - Math.abs(k - (segments-1)/2) * 42) / 500);
    const angle = (k % 2 ? -1 : 1) * (1.32 + .22 * Math.sin(k * 2.7)) * remaining;
    coordinates[k+1] = coordinates[k] + Math.cos(angle) * length / segments;
    depth[k+1] = depth[k] + Math.sin(angle) * length / segments;
  }
  const center = coordinates[segments] / 2, zCenter = depth[segments] / 2;
  for (let k = 0; k <= segments; k++) { coordinates[k] -= center; depth[k] -= zCenter; }
}

// Connected crease folds replace the old sphere-to-plane morph.
export function playPaperOpening(host, opening, { frameAt } = {}) {
  if (!opening.active || !host) return;
  let renderer, geometry, material, texture, frame = 0;
  const dispose = () => {
    cancelAnimationFrame(frame);
    geometry?.dispose(); material?.dispose(); texture?.dispose();
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); }
    window.removeEventListener('resize', resize);
  };
  const resize = () => {
    const aspect = innerWidth / innerHeight;
    camera.left = -aspect * 4; camera.right = aspect * 4;
    camera.updateProjectionMatrix();
    paper.scale.setScalar(Math.min(.78, aspect * 1.2));
    renderer.setSize(innerWidth, innerHeight);
  };
  let camera, paper;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', () => opening.finish('fallback'), { once: true });
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 50);
    camera.position.z = 12;

    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f6f1e5'; ctx.fillRect(0, 0, 1024, 1280);
    // Deterministic fine paper fibres and restrained crease lines.
    for (let i = 0; i < 6500; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1024;
      const y = (Math.sin(i * 7.233) * 23421.631 % 1 + 1) % 1 * 1280;
      ctx.fillStyle = i % 2 ? '#ffffff28' : '#78664c12'; ctx.fillRect(x, y, 1, 3);
    }
    for (const [x1,y1,x2,y2] of [[310,0,310,1280],[712,0,712,1280],[0,490,1024,490],[0,790,1024,790],[0,30,1024,1100],[0,1120,1024,120]]) {
      ctx.strokeStyle = '#695c4122'; ctx.lineWidth = 2;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      ctx.strokeStyle = '#ffffff88';ctx.beginPath();ctx.moveTo(x1+3,y1);ctx.lineTo(x2+3,y2);ctx.stroke();
    }
    ctx.save(); ctx.translate(512, 640); ctx.rotate(-.07);
    ctx.strokeStyle = '#2448ff'; ctx.lineWidth = 5; ctx.strokeRect(-375, -165, 750, 330);
    ctx.fillStyle = '#2448ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 112px sans-serif'; ctx.fillText('VINCE', 0, -65); ctx.fillText('ALVAREZ', 0, 65);
    ctx.restore();
    texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    geometry = new THREE.PlaneGeometry(4.8, 6, 48, 60);
    const positions = geometry.attributes.position;
    const flat = positions.array.slice();
    const foldX = new Float32Array(9), depthX = new Float32Array(9);
    const foldY = new Float32Array(11), depthY = new Float32Array(11);
    // Paper only needs a texture and two soft light directions. A small shader
    // avoids compiling the general purpose material before this brief opening.
    material = new THREE.ShaderMaterial({
      uniforms: { paperMap: { value: texture } }, side: THREE.DoubleSide,
      vertexShader: `varying vec2 paperUv; varying vec3 paperNormal;
        void main(){paperUv=uv;paperNormal=normalMatrix*normal;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform sampler2D paperMap;varying vec2 paperUv;varying vec3 paperNormal;
        void main(){vec3 n=normalize(paperNormal)*(gl_FrontFacing?1.0:-1.0);
          float light=.58+.34*max(dot(n,normalize(vec3(-.4,.7,1.))),0.)+.08*max(dot(n,normalize(vec3(.7,-.3,1.))),0.);
          vec3 color=texture2D(paperMap,paperUv).rgb*light;
          gl_FragColor=vec4(pow(color,vec3(1./2.2)),1.);}`,
    });
    paper = new THREE.Mesh(geometry, material); scene.add(paper);
    resize(); window.addEventListener('resize', resize);
    opening.done.then(dispose);
    let start;
    const preparedAt = performance.now();
    const draw = now => {
      if (!opening.active) return;
      const elapsed = frameAt ?? (start === undefined ? 0 : now - start);
      const open = smooth((elapsed - 100) / 750);
      const crumple = 1 - open;
      const lift = smooth((elapsed - 1350) / 400);
      pleats(4.8, 8, elapsed, 0, foldX, depthX);
      pleats(6, 10, elapsed, 60, foldY, depthY);
      for (let i = 0; i < positions.count; i++) {
        const j = i * 3;
        const u = Math.max(0, Math.min(8, (flat[j] + 2.4) / .6 + crumple * (.55 * Math.sin(flat[j+1] * 1.8) + .25 * Math.sin(flat[j+1] * 4.1))));
        const v = Math.max(0, Math.min(10, (flat[j+1] + 3) / .6 + crumple * (.7 * Math.sin(flat[j] * 2.3) + .2 * Math.cos(flat[j] * 4))));
        const ix = Math.min(7, Math.floor(u)), iy = Math.min(9, Math.floor(v));
        const x = THREE.MathUtils.lerp(foldX[ix], foldX[ix+1], u-ix);
        const y = THREE.MathUtils.lerp(foldY[iy], foldY[iy+1], v-iy);
        const crease = .035 * Math.abs(Math.sin(flat[j] * 3.1 + flat[j+1] * 1.7)) + .018 * Math.cos(flat[j+1] * 4 - flat[j]);
        const z = THREE.MathUtils.lerp(depthX[ix], depthX[ix+1], u-ix) + THREE.MathUtils.lerp(depthY[iy], depthY[iy+1], v-iy) + crease;
        const curl = lift * Math.max(0, (flat[j + 1] + 3) / 6);
        positions.array[j] = x + crumple * .14 * Math.sin(flat[j+1] * 3.2 + flat[j] * 1.5);
        positions.array[j + 1] = y - curl * .25 + crumple * .14 * Math.sin(flat[j] * 3 - flat[j+1]);
        positions.array[j + 2] = z + curl * curl * 1.8 + crumple * .2 * Math.sin(flat[j] * 2 + flat[j+1] * 1.3);
      }
      positions.needsUpdate = true; geometry.computeVertexNormals();
      paper.rotation.set(.18 * (1 - open) - lift * .2, -.25 * (1 - open), -.22 * (1 - open) - .045 * open + lift * .12);
      paper.position.y = lift * 10;
      paper.scale.setScalar(Math.min(.78, innerWidth / innerHeight * 1.2) * (1 + crumple * .55));
      host.style.setProperty('--opening-clear', String(lift));
      if (lift > 0) document.documentElement.dataset.openingReveal = 'true';
      const phase = elapsed < 100 ? 'ball' : elapsed < 850 ? 'unfold' : elapsed < 1350 ? 'stamp' : 'lift';
      if (host.dataset.phase !== phase) {
        host.dataset.phase = phase;
        if (frameAt === undefined) document.dispatchEvent(new CustomEvent('portfolio:paper-phase', { detail: { phase, elapsed } }));
      }
      renderer.render(scene, camera);
      document.documentElement.dataset.paperElapsed = String(Math.round(elapsed));
      if (frameAt !== undefined) return; // Local visual fixture samples the real animation geometry.
      // Upload texture and compile before starting. Preserve fixed timing;
      // slow startup skips cleanly rather than rushing through the name.
      if (start === undefined) {
        start = performance.now();
        document.documentElement.dataset.paperCompile = String(Math.round(start - preparedAt));
        document.documentElement.dataset.paperStartup = String(Math.round(start - opening.deadline + 3000));
        if ((opening.deadline ?? start + 3000) - start < 1780) { opening.finish('slow-start'); return; }
      }
      if (elapsed >= 1750) opening.finish('complete');
      else frame = requestAnimationFrame(draw);
    };
    if (frameAt !== undefined) draw(performance.now());
    else frame = requestAnimationFrame(draw);
  } catch {
    dispose(); opening.finish('fallback');
  }
}
