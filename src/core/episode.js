// Episode 01 rules: the full delivery as a pure state machine.
// No Three.js, no DOM. Scenes and input call these actions; the UI reads `objective`.
// Ported from legacy/vr (vr-logic.js, vr-delivery-logic.js, vr-rooftop-logic.js)
// and legacy/web (engine.mjs), using the canon in docs/PLAN.md.

export const STAGES = [
  'dispatch',  // Scene 1: stamp your courier pass
  'seal',      // Scene 1: copy the three-symbol seal at the sorter
  'arm',       // Scene 1: choose pistol or lantern
  'street',    // Scene 2: Lantern Street chase to the storm portal
  'rooftops',  // Scene 3: Thunder Rooftops
  'foundry',   // Scene 4: restore power with three valves
  'lift',      // Scene 4: elevator ride to floor seven
  'recipient', // Scene 4: hand the parcel to Major Ash in Room 07
  'delivered',
];

export const SCENE_FOR_STAGE = {
  dispatch: 'dispatch', seal: 'dispatch', arm: 'dispatch',
  street: 'street',
  rooftops: 'rooftops',
  foundry: 'foundry', lift: 'foundry', recipient: 'foundry', delivered: 'foundry',
};

export const SEAL = ['MOON', 'WAVE', 'LANTERN'];
export const SEAL_SYMBOLS = ['MOON', 'WAVE', 'LANTERN', 'STAR'];
export const VALVE_TARGET = [1, 1, 1]; // every valve pointing up
export const VALVE_START = [0, 2, 1];
export const LIFT_DURATION = 10; // seconds
export const MAX_HEALTH = 3;
export const HIT_GRACE = 1.8; // seconds of invulnerability after a hit
export const RESPAWN_GRACE = 4;

// One short line, always the *immediate* next step. Direction comes from the wisp.
const OBJECTIVES = {
  dispatch: 'Stamp your courier pass',
  seal: 'Copy the seal at the sorter',
  arm: 'Choose your ward: pistol or lantern',
  street: 'Follow the ember to the storm portal',
  rooftops: 'Cross the rooftops to the foundry',
  foundry: 'Turn the valves to restore power',
  lift: 'Ride the lift to floor seven',
  recipient: 'Deliver the parcel to Major Ash',
  delivered: 'Delivery complete',
};

export class Episode {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = 'dispatch';
    this.sealProgress = [];
    this.weapon = null;
    this.valves = [...VALVE_START];
    this.liftTime = 0;
    this.health = MAX_HEALTH;
    this.invulnerable = 0;
    this.checkpoint = { scene: 'dispatch', id: 'start' };
    this.lastRoof = 0;
    this.elapsed = 0;
    this.stats = { spiritsCleared: 0, respawns: 0, falls: 0 };
    this.events = [];
  }

  get scene() { return SCENE_FOR_STAGE[this.stage]; }
  get objective() { return OBJECTIVES[this.stage]; }
  get done() { return this.stage === 'delivered'; }
  /** Combat only happens between leaving the post office and reaching the foundry. */
  get dangerous() { return this.stage === 'street' || this.stage === 'rooftops'; }

  /** Drain and return events since the last call (for audio, voice, UI). */
  drain() { const e = this.events; this.events = []; return e; }

  #emit(type, data = {}) { this.events.push({ type, ...data }); }

  #advance(to) {
    const from = this.stage;
    this.stage = to;
    if (SCENE_FOR_STAGE[from] !== SCENE_FOR_STAGE[to]) {
      this.checkpoint = { scene: SCENE_FOR_STAGE[to], id: 'start' };
      this.#emit('scene', { scene: SCENE_FOR_STAGE[to] });
    }
    this.#emit('stage', { from, to });
  }

  // ---- Scene 1: Dispatch ----
  stampPass() {
    if (this.stage !== 'dispatch') return false;
    this.#advance('seal');
    return true;
  }

  pressSeal(symbol) {
    if (this.stage !== 'seal' || !SEAL_SYMBOLS.includes(symbol)) return false;
    if (symbol !== SEAL[this.sealProgress.length]) {
      this.sealProgress = [];
      this.#emit('sealReset');
      return false;
    }
    this.sealProgress.push(symbol);
    this.#emit('sealLit', { count: this.sealProgress.length });
    if (this.sealProgress.length === SEAL.length) this.#advance('arm');
    return true;
  }

  chooseWeapon(kind) {
    if (this.stage !== 'arm' || !['pistol', 'lantern'].includes(kind)) return false;
    this.weapon = kind;
    this.#advance('street');
    return true;
  }

  // ---- Scene 2: Lantern Street ----
  reachCheckpoint(id) {
    if (!this.dangerous) return false;
    this.checkpoint = { scene: this.scene, id };
    this.#emit('checkpoint', { id });
    return true;
  }

  enterPortal() {
    if (this.stage !== 'street') return false;
    this.#advance('rooftops');
    return true;
  }

  // ---- Scene 3: Rooftops ----
  landRoof(index) {
    if (this.stage !== 'rooftops' || index <= this.lastRoof) return false;
    this.lastRoof = index;
    this.checkpoint = { scene: 'rooftops', id: 'roof-' + index };
    return true;
  }

  /** Falling never costs progress: you respawn on the last roof you landed on. */
  fall() {
    if (this.stage !== 'rooftops') return null;
    this.stats.falls++;
    this.#emit('respawn', { checkpoint: this.checkpoint, reason: 'fall' });
    return this.checkpoint;
  }

  reachFoundry() {
    if (this.stage !== 'rooftops') return false;
    this.#advance('foundry');
    return true;
  }

  // ---- Scene 4: Foundry ----
  turnValve(i) {
    if (this.stage !== 'foundry' || ![0, 1, 2].includes(i)) return false;
    this.valves[i] = (this.valves[i] + 1) % 4;
    if (this.valves.every((v, k) => v === VALVE_TARGET[k])) this.#advance('lift');
    return true;
  }

  deliver() {
    if (this.stage !== 'recipient') return false;
    this.#advance('delivered');
    return true;
  }

  // ---- Combat ----
  hurt() {
    if (!this.dangerous || this.invulnerable > 0) return false;
    this.health--;
    this.invulnerable = HIT_GRACE;
    this.#emit('hurt', { health: this.health });
    if (this.health <= 0) {
      this.health = MAX_HEALTH;
      this.invulnerable = RESPAWN_GRACE;
      this.stats.respawns++;
      this.#emit('respawn', { checkpoint: this.checkpoint, reason: 'defeat' });
    }
    return true;
  }

  spiritCleared() {
    this.stats.spiritsCleared++;
  }

  // ---- Time ----
  tick(dt) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (!this.done) this.elapsed += dt;
    if (this.stage === 'lift') {
      this.liftTime = Math.min(LIFT_DURATION, this.liftTime + dt);
      if (this.liftTime >= LIFT_DURATION) this.#advance('recipient');
    }
  }
}

/** Elevator motion for a given ride time: doors close, ease up 7 floors, doors open. */
export function liftFrame(seconds, floorHeight = 3.2, floors = 6) {
  const t = Math.max(0, Math.min(LIFT_DURATION, seconds));
  const u = Math.max(0, Math.min(1, (t - 1.2) / 7));
  const eased = u * u * (3 - 2 * u);
  const doors = t < 1.2 ? 1 - t / 1.2 : t > 8.8 ? (t - 8.8) / 1.2 : 0; // 1 = open
  return { height: eased * floorHeight * floors, doors: Math.min(1, doors), floor: 1 + Math.round(eased * floors) };
}
