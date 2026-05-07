import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/ecs/world.js';

test('createEntity assigns unique ids and registers components', () => {
  const w = new World();
  const a = w.createEntity({ pos: { x: 1, y: 2 } });
  const b = w.createEntity({ pos: { x: 3, y: 4 }, vel: { dx: 1 } });

  assert.notEqual(a, b);
  assert.deepEqual(w.getComponent(a, 'pos'), { x: 1, y: 2 });
  assert.deepEqual(w.getComponent(b, 'vel'), { dx: 1 });
  assert.equal(w.hasComponent(a, 'vel'), false);
});

test('query yields entities that have all components', () => {
  const w = new World();
  const a = w.createEntity({ pos: {}, vel: {} });
  w.createEntity({ pos: {} });          // missing vel
  w.createEntity({ vel: {} });          // missing pos
  const d = w.createEntity({ pos: {}, vel: {}, tag: {} });

  const ids = [...w.query('pos', 'vel')].map(e => e.id).sort();
  assert.deepEqual(ids, [a, d].sort());
});

test('query exposes component data on yielded objects', () => {
  const w = new World();
  w.createEntity({ pos: { x: 7 }, vel: { dx: 9 } });
  const [hit] = [...w.query('pos', 'vel')];
  assert.equal(hit.pos.x, 7);
  assert.equal(hit.vel.dx, 9);
  assert.ok(typeof hit.id === 'number');
});

test('query returns nothing when a component name is unused', () => {
  const w = new World();
  w.createEntity({ pos: {} });
  assert.deepEqual([...w.query('pos', 'nonexistent')], []);
});

test('destroyEntity defers cleanup until step()', () => {
  const w = new World();
  const a = w.createEntity({ pos: {} });
  w.destroyEntity(a);
  // Still has component until step() runs.
  assert.equal(w.hasComponent(a, 'pos'), true);
  assert.equal(w.isAlive(a), false);
  w.step(0);
  assert.equal(w.hasComponent(a, 'pos'), false);
});

test('systems run in registration order each step', () => {
  const w = new World();
  const calls = [];
  w.addSystem(() => calls.push('a'));
  w.addSystem(() => calls.push('b'));
  w.step(0);
  w.step(0);
  assert.deepEqual(calls, ['a', 'b', 'a', 'b']);
});

test('system can iterate query and mutate components safely', () => {
  const w = new World();
  for (let i = 0; i < 5; i++) {
    w.createEntity({ pos: { x: 0 }, vel: { dx: i } });
  }
  w.addSystem((world, dt) => {
    for (const e of world.query('pos', 'vel')) {
      e.pos.x += e.vel.dx * dt;
    }
  });
  w.step(2);
  const xs = [...w.query('pos', 'vel')].map(e => e.pos.x).sort((a, b) => a - b);
  assert.deepEqual(xs, [0, 2, 4, 6, 8]);
});

test('system can destroy and create entities during iteration', () => {
  const w = new World();
  const a = w.createEntity({ doomed: {} });
  w.createEntity({ doomed: {} });
  w.addSystem((world) => {
    for (const e of world.query('doomed')) world.destroyEntity(e.id);
  });
  w.step(0);
  assert.equal([...w.query('doomed')].length, 0);
  assert.equal(w.isAlive(a), false);
});

test('removeComponent makes the entity drop out of queries', () => {
  const w = new World();
  const a = w.createEntity({ pos: {}, vel: {} });
  w.removeComponent(a, 'vel');
  assert.deepEqual([...w.query('pos', 'vel')], []);
  assert.deepEqual([...w.query('pos')].map(e => e.id), [a]);
});
