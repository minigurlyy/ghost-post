// Weapon rules shared by desktop and VR. Pure: positions are plain {x, y, z}.

export const PISTOL = { magazine: 12, reloadTime: 1.2, cooldown: 0.22, range: 40 };
export const LANTERN = { maxCharge: 1, drain: 0.9, recharge: 0.35, range: 6, halfAngleDeg: 30 };

export class Pistol {
  constructor() { this.ammo = PISTOL.magazine; this.reload = 0; this.cooldown = 0; }
  get ready() { return this.reload === 0 && this.cooldown === 0 && this.ammo > 0; }
  /** Returns true if a shot was fired. */
  fire() {
    if (!this.ready) return false;
    this.ammo--;
    this.cooldown = PISTOL.cooldown;
    if (this.ammo === 0) this.reload = PISTOL.reloadTime;
    return true;
  }
  startReload() { if (this.reload === 0 && this.ammo < PISTOL.magazine) this.reload = PISTOL.reloadTime; }
  tick(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reload > 0) {
      this.reload = Math.max(0, this.reload - dt);
      if (this.reload === 0) this.ammo = PISTOL.magazine;
    }
  }
}

/** The lantern annihilates spirits in a short cone while held on, draining charge. */
export class Lantern {
  constructor() { this.charge = LANTERN.maxCharge; this.on = false; this.overheated = false; }
  get active() { return this.on && !this.overheated && this.charge > 0; }
  tick(dt, held) {
    this.on = held;
    if (this.active) {
      this.charge = Math.max(0, this.charge - LANTERN.drain * dt);
      if (this.charge === 0) this.overheated = true;
    } else {
      this.charge = Math.min(LANTERN.maxCharge, this.charge + LANTERN.recharge * dt);
      if (this.overheated && this.charge >= 0.4) this.overheated = false;
    }
  }
}

/** Which targets sit inside the lantern's cone. `dir` must be normalised. */
export function inCone(origin, dir, targets, range = LANTERN.range, halfAngleDeg = LANTERN.halfAngleDeg) {
  const cos = Math.cos(halfAngleDeg * Math.PI / 180);
  return targets.filter((t) => {
    const dx = t.x - origin.x, dy = t.y - origin.y, dz = t.z - origin.z;
    const d = Math.hypot(dx, dy, dz);
    if (d === 0 || d > range) return false;
    return (dx * dir.x + dy * dir.y + dz * dir.z) / d >= cos;
  });
}
