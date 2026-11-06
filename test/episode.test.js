import { describe, it, expect } from 'vitest';
import { Episode, SEAL, LIFT_DURATION, MAX_HEALTH, liftFrame } from '../src/core/episode.js';
import { Pistol, Lantern, inCone, PISTOL } from '../src/core/weapons.js';

function playTo(stage) {
  const ep = new Episode();
  const steps = [
    () => ep.stampPass(),
    () => SEAL.forEach((s) => ep.pressSeal(s)),
    () => ep.chooseWeapon('pistol'),
    () => ep.enterPortal(),
    () => ep.reachFoundry(),
    () => { for (const v of [0, 1, 2]) while (ep.stage === 'foundry' && ep.valves[v] !== 1) ep.turnValve(v); },
    () => ep.tick(LIFT_DURATION),
    () => ep.deliver(),
  ];
  for (const step of steps) { if (ep.stage === stage) break; step(); }
  return ep;
}

describe('Episode flow', () => {
  it('starts at dispatch with one short objective', () => {
    const ep = new Episode();
    expect(ep.stage).toBe('dispatch');
    expect(ep.scene).toBe('dispatch');
    expect(ep.objective).toBe('Stamp your courier pass');
  });

  it('plays the full delivery in order', () => {
    const ep = playTo('delivered');
    expect(ep.stage).toBe('delivered');
    expect(ep.done).toBe(true);
    expect(ep.objective).toBe('Delivery complete');
  });

  it('ignores actions out of order', () => {
    const ep = new Episode();
    expect(ep.enterPortal()).toBe(false);
    expect(ep.deliver()).toBe(false);
    expect(ep.chooseWeapon('pistol')).toBe(false);
    expect(ep.stage).toBe('dispatch');
  });

  it('emits scene changes when crossing scene boundaries', () => {
    const ep = playTo('arm');
    ep.drain();
    ep.chooseWeapon('lantern');
    const events = ep.drain();
    expect(events).toContainEqual({ type: 'scene', scene: 'street' });
    expect(ep.weapon).toBe('lantern');
  });
});

describe('Seal puzzle', () => {
  it('resets on a wrong symbol', () => {
    const ep = playTo('seal');
    expect(ep.pressSeal('MOON')).toBe(true);
    expect(ep.pressSeal('STAR')).toBe(false);
    expect(ep.sealProgress).toEqual([]);
    expect(ep.stage).toBe('seal');
  });
  it('opens on the correct order', () => {
    const ep = playTo('seal');
    SEAL.forEach((s) => ep.pressSeal(s));
    expect(ep.stage).toBe('arm');
  });
});

describe('Rooftops', () => {
  it('respawns on the last roof landed, not the start', () => {
    const ep = playTo('rooftops');
    ep.landRoof(1); ep.landRoof(2); ep.landRoof(3);
    const cp = ep.fall();
    expect(cp).toEqual({ scene: 'rooftops', id: 'roof-3' });
    expect(ep.stats.falls).toBe(1);
    expect(ep.stage).toBe('rooftops');
  });
  it('does not move the checkpoint backwards', () => {
    const ep = playTo('rooftops');
    ep.landRoof(4);
    expect(ep.landRoof(2)).toBe(false);
    expect(ep.checkpoint.id).toBe('roof-4');
  });
});

describe('Foundry and lift', () => {
  it('starts the lift once all valves point up, then arrives', () => {
    const ep = playTo('lift');
    expect(ep.stage).toBe('lift');
    ep.tick(LIFT_DURATION / 2);
    expect(ep.stage).toBe('lift');
    ep.tick(LIFT_DURATION / 2);
    expect(ep.stage).toBe('recipient');
  });
  it('lift frame opens doors at both ends and rises six floors', () => {
    expect(liftFrame(0).doors).toBe(1);
    expect(liftFrame(5).doors).toBe(0);
    expect(liftFrame(LIFT_DURATION).doors).toBeCloseTo(1);
    expect(liftFrame(LIFT_DURATION).floor).toBe(7);
  });
});

describe('Combat', () => {
  it('cannot be hurt in safe areas', () => {
    const ep = playTo('arm');
    expect(ep.hurt()).toBe(false);
    expect(ep.health).toBe(MAX_HEALTH);
  });
  it('has grace after a hit and respawns at the checkpoint on defeat', () => {
    const ep = playTo('street');
    ep.reachCheckpoint('market');
    expect(ep.hurt()).toBe(true);
    expect(ep.hurt()).toBe(false); // grace
    ep.tick(2); ep.hurt(); ep.tick(2); ep.hurt();
    expect(ep.stats.respawns).toBe(1);
    expect(ep.health).toBe(MAX_HEALTH);
    expect(ep.drain().at(-1)).toEqual({ type: 'respawn', checkpoint: { scene: 'street', id: 'market' }, reason: 'defeat' });
  });
});

describe('Weapons', () => {
  it('pistol empties, auto-reloads and refills', () => {
    const p = new Pistol();
    let shots = 0;
    while (p.fire()) { shots++; p.tick(PISTOL.cooldown); }
    expect(shots).toBe(PISTOL.magazine);
    expect(p.reload).toBeGreaterThan(0);
    p.tick(PISTOL.reloadTime);
    expect(p.ammo).toBe(PISTOL.magazine);
  });
  it('lantern overheats when held too long and recovers', () => {
    const l = new Lantern();
    for (let i = 0; i < 20; i++) l.tick(0.1, true);
    expect(l.overheated).toBe(true);
    expect(l.active).toBe(false);
    for (let i = 0; i < 20; i++) l.tick(0.1, false);
    expect(l.overheated).toBe(false);
  });
  it('lantern cone hits targets ahead within range only', () => {
    const o = { x: 0, y: 0, z: 0 }, dir = { x: 0, y: 0, z: -1 };
    const hits = inCone(o, dir, [
      { id: 'ahead', x: 0, y: 0, z: -4 },
      { id: 'tooFar', x: 0, y: 0, z: -9 },
      { id: 'behind', x: 0, y: 0, z: 3 },
      { id: 'side', x: 4, y: 0, z: -1 },
    ]);
    expect(hits.map((h) => h.id)).toEqual(['ahead']);
  });
});
