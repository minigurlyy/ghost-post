// Desktop input: pointer-lock mouse look, WASD, Shift to run, Space to jump,
// click / E to interact. Produces the same intent shape as XRInput.

export class DesktopInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.yawDelta = 0;
    this.pitchDelta = 0;
    this.interactQueued = false;
    this.sensitivity = 0.0022;

    addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
      this.keys.add(k);
      if (k === 'e' && !e.repeat) this.interactQueued = true;
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yawDelta -= e.movementX * this.sensitivity;
      this.pitchDelta -= e.movementY * this.sensitivity;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (!this.locked) this.lock();
      else this.interactQueued = true;
    });
  }

  get locked() { return document.pointerLockElement === this.canvas; }
  lock() { this.canvas.requestPointerLock?.()?.catch?.(() => {}); }

  /** Called once per frame. Returns intent and clears one-shot inputs. */
  read() {
    const k = this.keys;
    const intent = {
      move: { x: (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0), y: (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0) },
      run: k.has('shift'),
      jump: k.has(' '),
      yawDelta: this.yawDelta + ((k.has('arrowleft') ? 1 : 0) - (k.has('arrowright') ? 1 : 0)) * 0.03,
      pitchDelta: this.pitchDelta,
      snapTurn: 0,
      interact: this.interactQueued,
    };
    this.yawDelta = 0;
    this.pitchDelta = 0;
    this.interactQueued = false;
    return intent;
  }
}
