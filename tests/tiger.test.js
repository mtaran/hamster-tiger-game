import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/ecs/world.js';
import * as C from '../src/components.js';
import {
  tigerSystem, applyThoughtToTiger, applyMissToTiger, calmTigerToSad,
  ANGER_MAX, ANGER_LOSS_GOOD_THOUGHT, ANGER_GAIN_BAD_THOUGHT,
} from '../src/systems/tiger.js';

function makeWorld() {
  const w = new World();
  w.resources = { viewW: 240, viewH: 160 };
  const tiger = w.createEntity({
    [C.Position]: { x: 100, y: 50 },
    [C.TigerState]: {
      state: 'neutral', facing: 'down', lookDir: 'down',
      anger: 0, sadTimer: 0, fireCooldown: 0, angryTimer: 0,
    },
  });
  const player = w.createEntity({
    [C.Player]: {},
    [C.Position]: { x: 20, y: 60 },     // far to the left, almost level
  });
  return { w, tiger, player };
}

test('tigerSystem points lookDir at the hamster (left when player to left)', () => {
  const { w, tiger } = makeWorld();
  tigerSystem(w, 0.016);
  assert.equal(w.getComponent(tiger, C.TigerState).lookDir, 'left');
});

test('tigerSystem lookDir snaps to vertical when dy dominates', () => {
  const { w, tiger, player } = makeWorld();
  w.getComponent(player, C.Position).x = 100;          // same x
  w.getComponent(player, C.Position).y = 150;          // below
  tigerSystem(w, 0.016);
  assert.equal(w.getComponent(tiger, C.TigerState).lookDir, 'down');
});

test('good thought decreases anger, bad thought increases it', () => {
  const t = { state: 'neutral', anger: 50 };
  applyThoughtToTiger(t, true);
  assert.equal(t.anger, 50 - ANGER_LOSS_GOOD_THOUGHT);
  applyThoughtToTiger(t, false);
  assert.equal(t.anger, 50 - ANGER_LOSS_GOOD_THOUGHT + ANGER_GAIN_BAD_THOUGHT);
});

test('anger is clamped to [0, ANGER_MAX]', () => {
  const t = { state: 'neutral', anger: 0 };
  applyThoughtToTiger(t, true);                        // would go negative
  assert.equal(t.anger, 0);
  t.anger = ANGER_MAX - 1;
  applyMissToTiger(t);                                 // would exceed cap
  assert.equal(t.anger, ANGER_MAX);
});

test('tiger transitions neutral -> angry when anger maxes out', () => {
  const { w, tiger } = makeWorld();
  // Slight overshoot so that decay-then-check still trips the threshold.
  w.getComponent(tiger, C.TigerState).anger = ANGER_MAX + 1;
  tigerSystem(w, 0.016);
  assert.equal(w.getComponent(tiger, C.TigerState).state, 'angry');
});

test('tiger spawns fireballs while in angry state', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'angry';
  ts.angryTimer = 5;
  ts.fireCooldown = 0;     // ready to fire immediately
  tigerSystem(w, 0.016);
  const fireballs = [...w.query(C.Fireball)];
  assert.equal(fireballs.length, 1);
  // And the cooldown should be reset.
  assert.ok(ts.fireCooldown > 0.2);
});

test('tiger leaves angry state once angryTimer expires, retains residual anger', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'angry';
  ts.angryTimer = 0.001;
  ts.fireCooldown = 99;    // don't fire this tick
  tigerSystem(w, 0.5);
  assert.equal(ts.state, 'neutral');
  assert.ok(ts.anger > 0 && ts.anger < ANGER_MAX);
});

test('calmTigerToSad short-circuits angry state', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'angry';
  ts.angryTimer = 99;
  ts.anger = ANGER_MAX;
  calmTigerToSad(ts);
  assert.equal(ts.state, 'sad');
  assert.ok(ts.anger < ANGER_MAX);
  assert.ok(ts.sadTimer > 0);
});

test('sad state decays back to neutral after sadTimer runs out', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'sad';
  ts.sadTimer = 0.1;
  tigerSystem(w, 0.5);
  assert.equal(ts.state, 'neutral');
  assert.equal(ts.anger, 0);
});

test('anger does NOT change on its own in neutral state', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.anger = 50;
  tigerSystem(w, 1.0);
  assert.equal(ts.anger, 50);                 // unchanged after a full second
  // Even after lots of ticks.
  for (let i = 0; i < 100; i++) tigerSystem(w, 0.1);
  assert.equal(ts.anger, 50);
});

test('anger drains while spewing fire (angry state)', () => {
  const { w, tiger } = makeWorld();
  const ts = w.getComponent(tiger, C.TigerState);
  ts.state = 'angry';
  ts.angryTimer = 5;
  ts.fireCooldown = 99;                       // skip fireball spawn
  ts.anger = 100;
  tigerSystem(w, 1.0);
  assert.ok(ts.anger < 100, `anger should drain, got ${ts.anger}`);
  assert.ok(ts.anger >= 35, `anger should not drop below residual, got ${ts.anger}`);
});
