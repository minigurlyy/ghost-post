// Ghost Post: bootstrap. One renderer, one rig, two input modes (desktop / WebXR).
import * as THREE from 'three';
import { Episode } from './core/episode.js';
import { DesktopInput } from './input/desktop.js';
import { XRInput } from './input/xr.js';
import { Wisp } from './guide/wisp.js';
import { Hud } from './ui/hud.js';
import { createDispatch } from './scenes/dispatch.js';

const canvas = document.querySelector('#world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.xr.enabled = true;
renderer.xr.setFoveation(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1c1f);
scene.fog = new THREE.FogExp2(0x16292c, 0.045);
scene.add(new THREE.HemisphereLight(0x7fa8a6, 0x3a2a1e, 1.5));

// The rig carries the player. In XR the headset moves the camera inside it;
// on desktop the camera sits at eye height and we pitch it ourselves.
const rig = new THREE.Group();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 200);
camera.position.y = 1.6;
rig.add(camera);
scene.add(rig);

const episode = new Episode();
const world = createDispatch(scene);
const wisp = new Wisp();
scene.add(wisp.group);
const hud = new Hud(camera);
const desktop = new DesktopInput(canvas);
const xr = new XRInput(renderer, rig);
const raycaster = new THREE.Raycaster();
raycaster.far = 7; // generous reach: no "move closer" failures

rig.position.copy(world.spawn.position);
rig.rotation.y = world.spawn.yaw;
wisp.group.position.copy(world.target('dispatch')).add(new THREE.Vector3(0, 0.4, 0));
let pitch = 0;
let playing = false;

const voice = new Audio();
const VOICE_FOR_STAGE = { seal: 'dispatch', street: 'parcel' };
function playVoice(id) {
  voice.src = `${import.meta.env.BASE_URL}assets/voices/${id}.mp3`;
  voice.play().catch(() => {});
}

// ---- Title screen ----
const title = document.querySelector('#title');
const vrButton = document.querySelector('#playVR');
const vrNote = document.querySelector('#vrNote');
function start() {
  title.hidden = true;
  hud.show(true);
  playing = true;
}
document.querySelector('#playDesktop').onclick = () => { start(); desktop.lock(); };
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    vrButton.hidden = !ok;
    if (!ok) vrNote.textContent = 'Open this page in the Meta Quest browser to play in VR.';
  }).catch(() => {});
} else {
  vrNote.textContent = 'Open this page in the Meta Quest browser to play in VR.';
}
vrButton.onclick = async () => {
  const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
  renderer.xr.setReferenceSpaceType('local-floor');
  await renderer.xr.setSession(session);
  camera.position.y = 0; // the headset supplies height
  pitch = 0;
  camera.rotation.set(0, 0, 0);
  start();
  session.addEventListener('end', () => { camera.position.y = 1.6; title.hidden = false; hud.show(false); playing = false; });
};

// ---- Interaction ----
const pickables = () => world.interactables.filter((it) => it.active(episode.stage));
function pick(origin, direction) {
  const list = pickables();
  raycaster.set(origin, direction);
  const meshes = list.flatMap((it) => [it.mesh, ...(it.extra || [])]);
  const hit = raycaster.intersectObjects(meshes, false)[0];
  return hit && list.find((it) => it.mesh === hit.object || it.extra?.includes(hit.object));
}
function act(action) {
  if (action === 'stamp') episode.stampPass();
  else if (action.startsWith('seal:')) episode.pressSeal(action.slice(5));
  else if (action.startsWith('weapon:')) episode.chooseWeapon(action.slice(7));
}

// ---- Movement ----
const WALK = 1.8, RUN = 3.4;
const tmp = new THREE.Vector3(), dir = new THREE.Vector3(), q = new THREE.Quaternion();
function move(intent, dt) {
  const speed = intent.run ? RUN : WALK;
  const len = Math.hypot(intent.move.x, intent.move.y);
  if (len < 0.01) return false;
  // Move relative to where the player is looking (headset or mouse), flattened.
  camera.getWorldQuaternion(q);
  const fwd = tmp.set(0, 0, -1).applyQuaternion(q).setY(0).normalize();
  const right = dir.set(-fwd.z, 0, fwd.x);
  const scale = speed * dt / Math.max(1, len);
  const dx = (fwd.x * intent.move.y + right.x * intent.move.x) * scale;
  const dz = (fwd.z * intent.move.y + right.z * intent.move.x) * scale;
  // Collision uses the head position, so room-scale steps are respected too.
  camera.getWorldPosition(tmp);
  if (world.walkable(tmp.x + dx, tmp.z)) rig.position.x += dx;
  camera.getWorldPosition(tmp);
  if (world.walkable(tmp.x, tmp.z + dz)) rig.position.z += dz;
  return true;
}

// ---- Loop ----
const timer = new THREE.Timer();
const head = new THREE.Vector3();
const origin = new THREE.Vector3(), forward = new THREE.Vector3();
renderer.setAnimationLoop((now) => {
  timer.update(now);
  const dt = Math.min(0.05, timer.getDelta());
  const t = timer.getElapsed();
  const inXR = renderer.xr.isPresenting;
  const intent = inXR ? xr.read() : desktop.read();
  let moved = false;
  let hint = '';

  if (playing) {
    // Look
    if (inXR) {
      if (intent.snapTurn) {
        camera.getWorldPosition(head);
        rig.position.sub(head).applyAxisAngle(THREE.Object3D.DEFAULT_UP, intent.snapTurn).add(head);
        rig.rotation.y += intent.snapTurn;
      }
    } else {
      rig.rotation.y += intent.yawDelta;
      pitch = THREE.MathUtils.clamp(pitch + intent.pitchDelta, -1.3, 1.3);
      camera.rotation.x = pitch;
    }
    moved = move(intent, dt);

    // Aim: the crosshair on desktop, the controller ray in VR.
    let aimed = null;
    if (inXR) {
      for (const c of xr.controllers) {
        c.getWorldPosition(origin);
        forward.set(0, 0, -1).applyQuaternion(c.getWorldQuaternion(q));
        const hit = pick(origin, forward);
        c.userData.line.scale.z = hit ? 1.5 : 4;
        if (hit && (!intent.ray || intent.ray === c)) aimed = hit;
      }
    } else {
      camera.getWorldPosition(origin);
      camera.getWorldDirection(forward);
      aimed = pick(origin, forward);
      if (aimed) hint = 'Click or press E';
      else if (!desktop.locked) hint = 'Click to look around';
    }
    if (aimed && inXR) hint = 'Pull the trigger';
    if (intent.interact && aimed) act(aimed.action);

    for (const ev of episode.drain()) {
      world.onEvent(ev, episode);
      if (ev.type === 'stage' && VOICE_FOR_STAGE[ev.to]) playVoice(VOICE_FOR_STAGE[ev.to]);
    }
    episode.tick(dt);
  }

  const objective = episode.stage === 'street' ? 'Head out: Lantern Street arrives in the next build' : episode.objective;
  hud.set(playing ? objective : '', playing ? hint : '', inXR);
  world.update(dt, t, episode.stage);
  wisp.setTarget(world.target(episode.stage));
  camera.getWorldPosition(head);
  wisp.update(dt, head, moved || !playing);
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Expose for automated checks and debugging.
window.__ghostpost = {
  episode, rig, camera, world,
  look(yaw, p) { rig.rotation.y = yaw; pitch = p; },
};
