import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/ecs/world.js';
import * as C from '../src/components.js';
import { movementSystem } from '../src/systems/movement.js';

function makeWorld(playerPos = { x: 50, y: 50 }) {
  const world = new World();
  world.resources = { viewW: 240, viewH: 160 };
  const id = world.createEntity({
    [C.Player]: {},
    [C.Position]: { ...playerPos },
    [C.Velocity]: { dx: 0, dy: 0 },
  });
  return { world, id };
}

test('movementSystem applies velocity scaled by dt', () => {
  const { world, id } = makeWorld({ x: 100, y: 100 });
  world.getComponent(id, C.Velocity).dx = 60;
  world.getComponent(id, C.Velocity).dy = -30;
  movementSystem(world, 0.5);
  const p = world.getComponent(id, C.Position);
  assert.equal(p.x, 130);
  assert.equal(p.y, 85);
});

test('movementSystem clamps player inside the play area', () => {
  const { world, id } = makeWorld({ x: 5, y: 5 });
  world.getComponent(id, C.Velocity).dx = -100;
  world.getComponent(id, C.Velocity).dy = -100;
  movementSystem(world, 1);
  const p = world.getComponent(id, C.Position);
  assert.ok(p.x >= 8, `x=${p.x} should be >= 8`);
  assert.ok(p.y >= 24, `y=${p.y} should be >= 24 (HUD strip clearance)`);
});

test('movementSystem clamps player at the right and bottom edges', () => {
  const { world, id } = makeWorld({ x: 230, y: 150 });
  world.getComponent(id, C.Velocity).dx = 100;
  world.getComponent(id, C.Velocity).dy = 100;
  movementSystem(world, 1);
  const p = world.getComponent(id, C.Position);
  assert.ok(p.x <= 232, `x=${p.x}`);
  assert.ok(p.y <= 152, `y=${p.y}`);
});

test('movementSystem does not move entities without velocity', () => {
  const world = new World();
  world.resources = { viewW: 240, viewH: 160 };
  const id = world.createEntity({ [C.Position]: { x: 10, y: 10 } });
  movementSystem(world, 1);
  assert.deepEqual(world.getComponent(id, C.Position), { x: 10, y: 10 });
});
