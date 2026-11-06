// Quest controller input, following Meta conventions (docs/PLAN.md §8):
// left stick = smooth move, left-stick click = run toggle,
// right stick = 30° snap turn, trigger or grip = interact, A = jump.
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const SNAP_DEG = 30;
const DEADZONE = 0.2;

function dz(v) { return Math.abs(v) < DEADZONE ? 0 : Math.sign(v) * (Math.abs(v) - DEADZONE) / (1 - DEADZONE); }

export class XRInput {
  constructor(renderer, rig) {
    this.renderer = renderer;
    this.controllers = [];
    this.running = false;
    this.snapReady = true;
    this.runHeld = false;
    this.interactFrom = null; // controller that pressed trigger/grip this frame

    const factory = new XRControllerModelFactory();
    for (let i = 0; i < 2; i++) {
      const ray = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(factory.createControllerModel(grip));
      // A visible amber pointer: thicker than the legacy hairline so it reads in the headset.
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 1, 6).translate(0, 0.5, 0).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xf0a64a, transparent: true, opacity: 0.75 }),
      );
      line.scale.z = 4;
      ray.add(line);
      ray.userData.line = line;
      const press = () => { this.interactFrom = ray; };
      ray.addEventListener('selectstart', press);
      ray.addEventListener('squeezestart', press);
      ray.addEventListener('connected', (e) => { ray.userData.handedness = e.data.handedness; });
      rig.add(ray, grip);
      this.controllers.push(ray);
    }
  }

  read() {
    const intent = { move: { x: 0, y: 0 }, run: this.running, jump: false, yawDelta: 0, pitchDelta: 0, snapTurn: 0, interact: false, ray: null };
    const session = this.renderer.xr.getSession();
    if (session) {
      for (const source of session.inputSources) {
        const pad = source.gamepad;
        if (!pad) continue;
        const [, , sx = 0, sy = 0] = pad.axes;
        if (source.handedness === 'left') {
          intent.move.x = dz(sx);
          intent.move.y = -dz(sy);
          const click = pad.buttons[3]?.pressed;
          if (click && !this.runHeld) this.running = !this.running;
          this.runHeld = !!click;
          if (Math.hypot(intent.move.x, intent.move.y) < 0.05) this.running = false;
          intent.run = this.running;
        } else if (source.handedness === 'right') {
          if (Math.abs(sx) > 0.7 && this.snapReady) {
            intent.snapTurn = -Math.sign(sx) * SNAP_DEG * Math.PI / 180;
            this.snapReady = false;
          } else if (Math.abs(sx) < 0.3) {
            this.snapReady = true;
          }
          intent.jump = !!pad.buttons[4]?.pressed; // A
        }
      }
    }
    if (this.interactFrom) {
      intent.interact = true;
      intent.ray = this.interactFrom;
      this.interactFrom = null;
    }
    return intent;
  }
}
