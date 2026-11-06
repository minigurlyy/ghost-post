// Scene 1 greybox: the Ghost Post dispatch hall.
// Layout follows docs/PLAN.md §6: spawn facing the counter, the next target is
// always the only warm thing, and everything happens in front of the player.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SEAL } from '../core/episode.js';

const AMBER = new THREE.Color(0xf0a64a);
const GLYPH = { MOON: '☾', WAVE: '≈', LANTERN: '♨', STAR: '✦' };

function labelTexture(lines, { w = 512, h = 256, bg = '#162a2d', fg = '#f4eddb', size = 64 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((line, i) => {
    g.font = `${i === 0 ? 600 : 400} ${i === 0 ? size : size * 0.6}px system-ui, sans-serif`;
    g.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const mat = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });

export function createDispatch(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const interactables = [];
  const obstacles = []; // AABBs on the floor plane: {minX, maxX, minZ, maxZ}

  const box = (w, h, d, material, x, y, z, solid = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    root.add(m);
    if (solid) obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return m;
  };

  // ---- Shell: 10 m × 9.5 m hall, warm timber floor, plaster walls ----
  const ROOM = { minX: -5, maxX: 5, minZ: -4.5, maxZ: 5 };
  box(10, 0.1, 9.5, mat(0x5a3b28), 0, -0.05, 0.25);               // floor
  box(10, 0.1, 9.5, mat(0x1f3133), 0, 4.05, 0.25);                // ceiling
  box(0.2, 4, 9.5, mat(0x8c7a64), -5.1, 2, 0.25);                 // left wall
  box(0.2, 4, 9.5, mat(0x8c7a64), 5.1, 2, 0.25);                  // right wall
  box(10, 4, 0.2, mat(0x8c7a64), 0, 2, 5.1);                      // wall behind spawn
  // Back wall with a 2.4 m doorway in the centre.
  box(3.8, 4, 0.2, mat(0x8c7a64), -3.1, 2, -4.6);
  box(3.8, 4, 0.2, mat(0x8c7a64), 3.1, 2, -4.6);
  box(2.4, 1, 0.2, mat(0x8c7a64), 0, 3.5, -4.6);

  // Doors: they swing open when the delivery begins.
  const doors = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 1.2, 0, -4.6);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 0.08), mat(0x2e4a45, 0.6));
    leaf.position.set(-side * 0.6, 1.5, 0);
    pivot.add(leaf);
    root.add(pivot);
    return { pivot, side };
  });
  let doorOpen = 0;

  // Outside, beyond the doors: cool mist and a few warm lanterns (a teaser for Lantern Street).
  const street = new THREE.Group();
  root.add(street);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 30), mat(0x24363a));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -20);
  street.add(ground);
  for (let i = 0; i < 6; i++) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    lamp.position.set(i % 2 ? 2.4 : -2.4, 2.6, -8 - i * 4);
    street.add(lamp);
  }
  // The foundry on the skyline, so "Major Ash is across the district" is something you can see.
  const foundry = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 4), mat(0x1a2a2c));
  foundry.position.set(1.5, 7, -34);
  street.add(foundry);
  const furnace = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  furnace.position.set(1.5, 11, -31.9);
  street.add(furnace);

  // ---- Dispatch counter + officer (centre, 3 m in front of spawn) ----
  box(3.2, 1.05, 0.7, mat(0x4b2f22, 0.7), 0, 0.525, 0, true);
  box(3.3, 0.06, 0.8, mat(0x7a5236, 0.5), 0, 1.08, 0);
  obstacles.push({ minX: -1.7, maxX: 1.7, minZ: -1.3, maxZ: 0.35 }); // officer's side

  const officer = new THREE.Group();
  officer.position.set(0, 0, -0.75);
  root.add(officer);
  new GLTFLoader().load(`${import.meta.env.BASE_URL}assets/characters/dispatch-officer.glb`, (gltf) => {
    gltf.scene.traverse((o) => {
      // The model ships in a T-pose; lower the arms until it has proper animation (M2).
      // (GLTFLoader strips the ':' from Mixamo bone names.)
      if (o.isBone && /LeftArm$/.test(o.name)) o.rotation.x += 1.25;
      if (o.isBone && /RightArm$/.test(o.name)) o.rotation.x += 1.25;
    });
    officer.add(gltf.scene);
  });

  // Courier pass + stamp on the counter: the first interaction.
  const pass = box(0.22, 0.01, 0.14, mat(0xe9dcc0), 0.25, 1.115, 0.15);
  const stampMat = mat(0x6b4a2c, 0.5);
  const stamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 16), stampMat);
  stamp.position.set(-0.2, 1.19, 0.15);
  root.add(stamp);
  const stampedMark = box(0.08, 0.012, 0.08, new THREE.MeshBasicMaterial({ color: 0xb83a2a }), 0.28, 1.12, 0.15);
  stampedMark.visible = false;
  interactables.push({ mesh: stamp, action: 'stamp', active: (s) => s === 'dispatch', materials: [stampMat] });

  // ---- Parcel sorter (right of the counter, in view from spawn) ----
  box(1.6, 1.0, 0.7, mat(0x3c4a3f, 0.7), 3.2, 0.5, -0.4, true);
  const ticketTex = labelTexture(['YOUR SEAL', SEAL.map((s) => `${GLYPH[s]} ${s}`).join('   ')], { w: 1024, h: 256, size: 70 });
  const ticket = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: ticketTex }));
  ticket.position.set(3.2, 1.75, -0.75);
  root.add(ticket);
  const sealSymbols = ['MOON', 'STAR', 'WAVE', 'LANTERN'];
  const sealButtons = sealSymbols.map((sym, i) => {
    const m = mat(0x8f8a7c, 0.5);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20), m);
    b.position.set(2.75 + i * 0.3, 1.03, -0.3);
    root.add(b);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), new THREE.MeshBasicMaterial({ map: labelTexture([GLYPH[sym]], { w: 128, h: 128, size: 90, bg: '#2a2f2a' }) }));
    face.rotation.x = -Math.PI / 2;
    face.position.set(b.position.x, 1.057, -0.3);
    root.add(face);
    interactables.push({ mesh: b, extra: [face], action: 'seal:' + sym, active: (s) => s === 'seal', materials: [m] });
    return { mesh: b, sym };
  });

  // ---- Ward rack (left of the counter): pistol or lantern ----
  box(1.6, 1.0, 0.7, mat(0x3c4a3f, 0.7), -3.2, 0.5, -0.4, true);
  const pistolMat = mat(0x2b2b2e, 0.4);
  const pistol = new THREE.Group();
  const pistolBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.04), pistolMat);
  const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.035), pistolMat);
  pistolGrip.position.set(0.07, -0.06, 0);
  pistolGrip.rotation.z = -0.25;
  pistol.add(pistolBody, pistolGrip);
  pistol.position.set(-3.6, 1.12, -0.4);
  root.add(pistol);
  const lanternMat = mat(0x8a6a3a, 0.4);
  const lantern = new THREE.Group();
  const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.22, 12), lanternMat);
  const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12), new THREE.MeshBasicMaterial({ color: 0x9fe0d8, transparent: true, opacity: 0.6 }));
  lantern.add(lanternBody, lanternGlass);
  lantern.position.set(-2.8, 1.12, -0.4);
  root.add(lantern);
  interactables.push({ mesh: pistolBody, extra: [pistolGrip], action: 'weapon:pistol', active: (s) => s === 'arm', materials: [pistolMat] });
  interactables.push({ mesh: lanternBody, extra: [lanternGlass], action: 'weapon:lantern', active: (s) => s === 'arm', materials: [lanternMat] });

  // ---- Light: warm over the counter, cool everywhere else ----
  const counterLight = new THREE.PointLight(0xffb066, 6, 9, 2);
  counterLight.position.set(0, 3.2, 0.8);
  root.add(counterLight);
  const sideLight = new THREE.PointLight(0xffb066, 0, 6, 2);
  root.add(sideLight);

  // Where the wisp should go for each stage.
  const targets = {
    dispatch: stamp.position.clone(),
    seal: new THREE.Vector3(3.2, 1.1, -0.3),
    arm: new THREE.Vector3(-3.2, 1.15, -0.4),
    street: new THREE.Vector3(0, 1.4, -5.5),
  };

  return {
    root,
    interactables,
    spawn: { position: new THREE.Vector3(0, 0, 3), yaw: 0 },
    bounds: ROOM,
    obstacles,
    target(stage) { return targets[stage] ?? null; },
    /** Can the player walk to (x, z)? Doorway stays shut until the delivery starts. */
    walkable(x, z, r = 0.3) {
      const inRoom = x > ROOM.minX + r && x < ROOM.maxX - r && z > ROOM.minZ + r && z < ROOM.maxZ - r;
      const throughDoor = doorOpen > 0.9 && Math.abs(x) < 1.1 - r && z <= ROOM.minZ + r && z > -30;
      if (!inRoom && !throughDoor) return false;
      return !obstacles.some((b) => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
    },
    onEvent(ev, episode) {
      if (ev.type === 'stage' && ev.to === 'seal') stampedMark.visible = true;
      if (ev.type === 'sealLit') {
        const b = sealButtons.find((x) => x.sym === episode.sealProgress[ev.count - 1]);
        b?.mesh.material.emissive.set(0xffc27a);
      }
      if (ev.type === 'sealReset') sealButtons.forEach((b) => b.mesh.material.emissive.set(0x000000));
      if (ev.type === 'stage' && ev.to === 'street') {
        (episode.weapon === 'pistol' ? pistol : lantern).visible = false;
      }
    },
    update(dt, t, stage) {
      // Pulse amber on whatever is next; everything else stays neutral.
      const pulse = 0.35 + 0.25 * Math.sin(t * 4);
      for (const it of interactables) {
        const on = it.active(stage);
        for (const m of it.materials) {
          if (stage === 'seal' && it.action.startsWith('seal:') && m.emissive.getHex() === 0xffc27a) continue;
          m.emissive.copy(on ? AMBER : new THREE.Color(0)).multiplyScalar(on ? pulse : 0);
        }
      }
      // Lights follow the story: the counter dims once you've stamped, the next station warms.
      const target = targets[stage];
      counterLight.intensity = THREE.MathUtils.lerp(counterLight.intensity, stage === 'dispatch' ? 6 : 2.5, dt * 2);
      if (target && stage !== 'dispatch') {
        sideLight.position.set(target.x, 2.6, target.z + 0.4);
        sideLight.intensity = THREE.MathUtils.lerp(sideLight.intensity, 5, dt * 2);
      }
      // Doors open when the delivery starts.
      if (stage === 'street') {
        doorOpen = Math.min(1, doorOpen + dt * 0.6);
        const ease = doorOpen * doorOpen * (3 - 2 * doorOpen);
        for (const d of doors) d.pivot.rotation.y = d.side * ease * 1.6;
      }
    },
  };
}
