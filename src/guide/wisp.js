// The ember wisp: a small warm light that leads the player to the next target.
// It hovers beside the target, drifts toward the player if they stall, and pulses.
import * as THREE from 'three';

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,236,190,1)');
  grad.addColorStop(0.25, 'rgba(255,170,70,.85)');
  grad.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Wisp {
  constructor() {
    this.group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }));
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.halo.scale.setScalar(0.45);
    this.light = new THREE.PointLight(0xffa24a, 1.2, 3.5, 2);
    this.group.add(core, this.halo, this.light);
    this.target = new THREE.Vector3();
    this.hasTarget = false;
    this.idle = 0;
    this.t = 0;
  }

  /** Point the wisp at a world position (or null to let it rest near the player). */
  setTarget(pos) {
    if (!pos) { this.hasTarget = false; return; }
    if (!this.hasTarget || pos.distanceToSquared(this.target) > 0.01) this.idle = 0;
    this.target.copy(pos);
    this.hasTarget = true;
  }

  update(dt, playerPos, playerMoved) {
    this.t += dt;
    this.idle = playerMoved ? 0 : this.idle + dt;
    const goal = new THREE.Vector3();
    if (this.hasTarget) {
      // If the player has stalled for 8 s, the wisp comes back to fetch them.
      const fetch = this.idle > 8 ? Math.min(1, (this.idle - 8) / 1.5) : 0;
      const nearPlayer = playerPos.clone().add(new THREE.Vector3(0.4, -0.2, -0.8));
      goal.copy(this.target).add(new THREE.Vector3(0, 0.35, 0)).lerp(nearPlayer, fetch * 0.85);
      if (this.idle > 11) this.idle = 0; // then return to the target
    } else {
      goal.copy(playerPos).add(new THREE.Vector3(0.5, -0.15, -0.7));
    }
    goal.y += Math.sin(this.t * 2.2) * 0.05;
    this.group.position.lerp(goal, 1 - Math.exp(-dt * 2.5));
    const pulse = 1 + Math.sin(this.t * 4) * 0.12;
    this.halo.scale.setScalar(0.45 * pulse);
    this.light.intensity = 1.1 * pulse;
  }
}
