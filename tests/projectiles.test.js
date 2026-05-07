import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/ecs/world.js';
import * as C from '../src/components.js';
import { projectileSystem, circlesCollide } from '../src/systems/projectiles.js';
import { lifetimeSystem } from '../src/systems/lifetime.js';
import { ANGER_MAX } from '../src/systems/tiger.js';

function setupWorld() {
  const w = new World();
  w.resources = { viewW: 240, viewH: 160, shake: { t: 0, amp: 0 } };
  const tiger = w.createEntity({
    [C.Position]: { x: 100, y: 50 },
    [C.Collider]: { radius: 14 },
    [C.TigerState]: {
      state: 'neutral', facing: 'down', lookDir: 'down',
      anger: 50, sadTimer: 0, fireCooldown: 0, angryTimer: 0,
    },
  });
  const player = w.createEntity({
    [C.Player]: {},
    [C.Position]: { x: 100, y: 130 },
    [C.Collider]: { radius: 5 },
    [C.HamsterState]: { state: 'normal', timer: 0 },
  });
  return { w, tiger, player };
}

test('circlesCollide handles touching, overlapping, and separate cases', () => {
  const a = { x: 0, y: 0 }, ra = { radius: 5 };
  const b = { x: 8, y: 0 }, rb = { radius: 5 };
  const c = { x: 11, y: 0 };
  assert.equal(circlesCollide(a, ra, b, rb), true);    // overlap
  assert.equal(circlesCollide(a, ra, c, rb), false);   // separate
});

test('thought hitting tiger: applies valence, destroys projectile', () => {
  const { w, tiger } = setupWorld();
  const beforeAnger = w.getComponent(tiger, C.TigerState).anger;
  const id = w.createEntity({
    [C.Position]: { x: 100, y: 50 },
    [C.Collider]: { radius: 4 },
    [C.Thought]:    { props: {}, valence: true },
    [C.Projectile]: { kind: 'thought' },
  });
  projectileSystem(w);
  w.step(0); // flush deferred destroy
  assert.equal(w.isAlive(id), false);
  assert.ok(w.getComponent(tiger, C.TigerState).anger < beforeAnger);
});

test('bad thought hitting tiger raises anger', () => {
  const { w, tiger } = setupWorld();
  const beforeAnger = w.getComponent(tiger, C.TigerState).anger;
  w.createEntity({
    [C.Position]: { x: 100, y: 50 },
    [C.Collider]: { radius: 4 },
    [C.Thought]:    { props: {}, valence: false },
    [C.Projectile]: { kind: 'thought' },
  });
  projectileSystem(w);
  assert.ok(w.getComponent(tiger, C.TigerState).anger > beforeAnger);
});

test('off-screen thought is destroyed and counts as a miss', () => {
  const { w, tiger } = setupWorld();
  const beforeAnger = w.getComponent(tiger, C.TigerState).anger;
  const id = w.createEntity({
    [C.Position]: { x: -50, y: 50 },        // already off-screen
    [C.Velocity]: { dx: 0, dy: 0 },
    [C.Thought]:    { props: {}, valence: true },
    [C.Projectile]: { kind: 'thought' },
    [C.Lifetime]:   { remaining: 5 },
  });
  lifetimeSystem(w, 0.016);
  w.step(0);
  assert.equal(w.isAlive(id), false);
  assert.ok(w.getComponent(tiger, C.TigerState).anger > beforeAnger);
});

test('expired thought (lifetime <= 0) also counts as a miss', () => {
  const { w, tiger } = setupWorld();
  const beforeAnger = w.getComponent(tiger, C.TigerState).anger;
  const id = w.createEntity({
    [C.Position]: { x: 50, y: 50 },
    [C.Velocity]: { dx: 0, dy: 0 },
    [C.Thought]:    { props: {}, valence: true },
    [C.Projectile]: { kind: 'thought' },
    [C.Lifetime]:   { remaining: 0.005 },
  });
  lifetimeSystem(w, 0.016);
  w.step(0);
  assert.equal(w.isAlive(id), false);
  assert.ok(w.getComponent(tiger, C.TigerState).anger > beforeAnger);
});

test('fireball hitting hamster sets it to burning and tiger to sad', () => {
  const { w, tiger, player } = setupWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'angry';
  ts.angryTimer = 5;

  const fb = w.createEntity({
    [C.Position]: { x: 100, y: 130 },
    [C.Collider]: { radius: 3 },
    [C.Fireball]: {},
  });
  projectileSystem(w);
  w.step(0);

  assert.equal(w.isAlive(fb), false);
  assert.equal(w.getComponent(player, C.HamsterState).state, 'burning');
  assert.equal(ts.state, 'sad');
});

test('fireball passing by a non-normal hamster does NOT re-trigger', () => {
  const { w, player } = setupWorld();
  w.getComponent(player, C.HamsterState).state = 'ash';
  w.createEntity({
    [C.Position]: { x: 100, y: 130 },     // overlapping hamster
    [C.Collider]: { radius: 3 },
    [C.Fireball]: {},
  });
  projectileSystem(w);
  // Should still be 'ash', not bumped back to 'burning'.
  assert.equal(w.getComponent(player, C.HamsterState).state, 'ash');
});

test('miss does not push anger past ANGER_MAX', () => {
  const { w, tiger } = setupWorld();
  w.getComponent(tiger, C.TigerState).anger = ANGER_MAX - 1;
  for (let i = 0; i < 10; i++) {
    w.createEntity({
      [C.Position]: { x: -50, y: 50 },
      [C.Thought]:    { props: {}, valence: false },
      [C.Projectile]: { kind: 'thought' },
      [C.Lifetime]:   { remaining: 0.001 },
    });
  }
  lifetimeSystem(w, 0.016);
  assert.equal(w.getComponent(tiger, C.TigerState).anger, ANGER_MAX);
});
