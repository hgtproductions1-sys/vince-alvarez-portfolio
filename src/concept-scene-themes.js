import * as THREE from 'three';

// Theme factories return only resize/pose hooks. The shared scene owns the
// renderer, observers, pause state, and recursive GPU-resource disposal.
export function createConceptTheme(theme, { sculpture, frames, lineMaterial }) {
  if (theme === 'sora') return createContactSheet(sculpture, lineMaterial);
  if (theme === 'mara') return createNeighborhood(sculpture, frames, lineMaterial);
  if (theme === 'foundry') return createSteelFrame(sculpture, frames, lineMaterial);
  return null;
}

function createContactSheet(sculpture, lineMaterial) {
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(cube);
  const circle = new THREE.CircleGeometry(.48, 24);
  const paper = new THREE.MeshStandardMaterial({ color: 0xf7faff, roughness: .9, metalness: 0 });
  const crimson = new THREE.MeshBasicMaterial({ color: 0xc3283d });
  const mist = new THREE.MeshBasicMaterial({ color: 0xd7e7f4 });
  const ink = new THREE.MeshBasicMaterial({ color: 0x111d2e });
  const panels = [crimson, mist, ink];
  const cards = [];
  lineMaterial.opacity = .8;
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Group();
    const back = new THREE.Mesh(cube, paper);
    back.scale.set(2.05, 2.72, .045); card.add(back);
    const border = new THREE.LineSegments(edges, lineMaterial);
    border.scale.copy(back.scale); card.add(border);
    const image = new THREE.Mesh(cube, panels[i]);
    image.scale.set(1.79, 1.92, .018); image.position.set(0, .22, .037); card.add(image);
    const subject = new THREE.Mesh(circle, i === 0 ? mist : crimson);
    subject.position.set(i === 1 ? -.27 : .18, .2, .05);
    subject.scale.set(i === 2 ? .9 : .7, i === 0 ? 1.35 : .7, 1);
    card.add(subject);
    const caption = new THREE.Mesh(cube, ink);
    caption.scale.set(.83, .035, .014); caption.position.set(-.45, -1.02, .04); card.add(caption);
    const x = (i - 1) * 1.7, y = i === 1 ? .65 : -.35, z = -i * .55;
    card.position.set(x, y, z);
    card.rotation.set(-.1 + i * .08, -.15 + i * .12, -.18 + i * .2);
    card.userData.baseY = y;
    card.userData.baseZ = card.rotation.z;
    sculpture.add(card); cards.push(card);
  }
  return {
    resize(aspect, mobile) {
      // The wide hero places the quiet sheet arrangement in the space between
      // the headline and photographic composition; small screens keep it high.
      sculpture.position.set(mobile ? .4 : .8, mobile ? 1.5 : -.4, -2.1);
      sculpture.scale.setScalar(Math.min(mobile ? .65 : 1.1, aspect * 1.1));
    },
    pose(elapsed, pointer) {
      sculpture.rotation.set(.05 + pointer.y * .025, Math.sin(elapsed * .12) * .1 + pointer.x * .06, -.03);
      for (let i = 0; i < cards.length; i++) {
        cards[i].position.y = cards[i].userData.baseY + Math.sin(elapsed * .38 + i * 1.7) * .13;
        cards[i].rotation.z = cards[i].userData.baseZ + Math.sin(elapsed * .24 + i) * .025;
      }
    },
  };
}

function createNeighborhood(sculpture, frames, lineMaterial) {
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(cube);
  const roof = new THREE.ConeGeometry(1, .46, 4);
  const pale = new THREE.MeshStandardMaterial({ color: 0xf3e6eb, roughness: .8, metalness: 0 });
  const plum = new THREE.MeshStandardMaterial({ color: 0x51374f, roughness: .7, metalness: .05 });
  const teal = new THREE.MeshStandardMaterial({ color: 0x235d62, roughness: .8, metalness: 0 });
  const road = new THREE.MeshBasicMaterial({ color: 0xc7acbd, transparent: true, opacity: .42 });
  lineMaterial.opacity = .54;
  const ground = new THREE.Mesh(cube, pale);
  ground.scale.set(5.7, .06, 4.5); ground.position.y = -.84; sculpture.add(ground);
  const street = new THREE.Mesh(cube, road);
  street.scale.set(5.7, .025, .5); street.position.y = -.79; sculpture.add(street);
  const crossing = new THREE.Mesh(cube, road);
  crossing.scale.set(.42, .025, 4.5); crossing.position.set(.65, -.785, 0); sculpture.add(crossing);
  for (let i = 0; i < 6; i++) {
    const home = new THREE.Group();
    const height = [.85, 1.15, .7, 1, .75, 1.1][i];
    const width = i === 4 ? 1.05 : .85;
    const block = new THREE.Mesh(cube, i % 3 === 0 ? teal : pale);
    block.scale.set(width, height, .94); block.position.y = height / 2;
    home.add(block);
    const outline = new THREE.LineSegments(edges, lineMaterial);
    outline.scale.copy(block.scale); outline.position.copy(block.position); home.add(outline);
    const top = new THREE.Mesh(roof, plum);
    top.rotation.y = Math.PI / 4;
    top.scale.set(width * .79, 1, .75); top.position.y = height + .23;
    home.add(top);
    home.position.set([-1.95, -.7, 1.8][i % 3], -.77, i < 3 ? -1.2 : 1.2);
    sculpture.add(home);
    const garden = new THREE.Mesh(cube, teal);
    garden.scale.set(.75, .025, .35);
    garden.position.set(home.position.x, -.78, home.position.z + (i < 3 ? .72 : -.72));
    sculpture.add(garden);
  }
  const boundary = new THREE.LineSegments(edges, lineMaterial);
  boundary.scale.set(5.85, .08, 4.65); boundary.position.y = -.87; frames.add(boundary);
  return {
    resize(aspect, mobile) {
      // The scene sits above/around the featured property, never over the copy.
      const scale = Math.min(mobile ? 1.4 : 1.75, aspect * .75);
      sculpture.scale.setScalar(scale); frames.scale.setScalar(scale);
      sculpture.position.set(0, .55, -.4);
      frames.position.copy(sculpture.position);
    },
    pose(elapsed, pointer) {
      sculpture.rotation.set(.48 + pointer.y * .025, -.49 + Math.sin(elapsed * .13) * .13 + pointer.x * .06, -.055);
      frames.rotation.copy(sculpture.rotation);
    },
  };
}

function createSteelFrame(sculpture, frames, lineMaterial) {
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const edgeCube = new THREE.EdgesGeometry(cube);
  const steel = new THREE.MeshStandardMaterial({ color: 0xa9bccb, roughness: .4, metalness: .65 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf8cf3c, roughness: .45, metalness: .2 });
  const footing = new THREE.MeshStandardMaterial({ color: 0x667786, roughness: .95, metalness: 0 });
  lineMaterial.opacity = .55;
  const topBeams = [];
  const beam = (width, height, depth, x, y, z, material = steel) => {
    const mesh = new THREE.Mesh(cube, material);
    mesh.scale.set(width, height, depth); mesh.position.set(x, y, z);
    sculpture.add(mesh); return mesh;
  };
  for (let x = 0; x < 4; x++) {
    const positionX = (x - 1.5) * 1.35;
    for (let z = 0; z < 2; z++) {
      const positionZ = z === 0 ? -1.1 : 1.1;
      beam(.11, 3.45, .15, positionX, 0, positionZ);
      beam(.35, .16, .4, positionX, -1.78, positionZ, footing);
    }
    for (let level = 0; level < 3; level++) {
      const cross = beam(.12, .15, 2.36, positionX, (level - 1) * 1.65, 0, level === 2 && x % 2 === 0 ? yellow : steel);
      if (level === 2 && x % 2 === 0) topBeams.push(cross);
    }
  }
  for (let level = 0; level < 3; level++) for (let z = 0; z < 2; z++) {
    beam(4.2, .16, .12, 0, (level - 1) * 1.65, z === 0 ? -1.1 : 1.1, level === 2 ? yellow : steel);
  }
  // Diagonal side braces make this read as a construction frame, rather than
  // the architectural floor plates used by the existing FORME study.
  for (let side = 0; side < 2; side++) {
    const brace = beam(.065, 3.05, .065, 0, -.82, side === 0 ? -1.11 : 1.11, yellow);
    brace.rotation.z = side === 0 ? -.99 : .99;
  }
  const base = new THREE.LineSegments(edgeCube, lineMaterial);
  base.scale.set(4.8, .05, 2.95); base.position.y = -1.89; frames.add(base);
  return {
    resize(aspect) {
      const scale = Math.min(1.5, Math.max(.55, aspect * .9));
      sculpture.scale.setScalar(scale); frames.scale.setScalar(scale);
      sculpture.position.set(0, .04, 0); frames.position.copy(sculpture.position);
    },
    pose(elapsed, pointer) {
      sculpture.rotation.set(.22 + pointer.y * .035, -.52 + Math.sin(elapsed * .16) * .16 + pointer.x * .07, -.025);
      frames.rotation.copy(sculpture.rotation);
      for (let i = 0; i < topBeams.length; i++) topBeams[i].position.y = 1.65 + Math.sin(elapsed * .36 + i * 1.5) * .045;
    },
  };
}
