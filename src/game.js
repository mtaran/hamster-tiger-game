import { World } from './ecs/world.js';
import * as C from './components.js';
import { createInputResource, inputSystem, inputEndOfFrameSystem } from './systems/input.js';
import { movementSystem } from './systems/movement.js';
import { renderSystem } from './systems/render.js';

const VIEW_W = 240;
const VIEW_H = 160;
const SCALE = 2;

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W * SCALE;
  canvas.height = VIEW_H * SCALE;
  ctx.imageSmoothingEnabled = false;

  const world = new World();
  world.resources = {
    input: createInputResource(),
    canvas,
    ctx,
    viewW: VIEW_W,
    viewH: VIEW_H,
    scale: SCALE,
    time: 0,
    shake: { t: 0, amp: 0 },
  };

  // Hamster
  world.createEntity({
    [C.Position]:     { x: 80, y: 120 },
    [C.Velocity]:     { dx: 0, dy: 0 },
    [C.Facing]:       { dir: 'up' },
    [C.Player]:       {},
    [C.Sprite]:       { canvas: null, w: 16, h: 16 },
    [C.HamsterState]: { state: 'normal', timer: 0 },
    [C.Collider]:     { radius: 5 },
  });

  // Tiger (static — no Velocity)
  world.createEntity({
    [C.Position]:    { x: 160, y: 60 },
    [C.Sprite]:      { canvas: null, w: 32, h: 32 },
    [C.TigerState]:  {
      state: 'neutral',     // neutral | angry | sad
      facing: 'down',
      lookDir: 'down',
      anger: 0,             // 0..100
      sadTimer: 0,
      fireCooldown: 0,
      angryTimer: 0,
    },
    [C.Collider]:    { radius: 14 },
  });

  // Systems run in this order each tick.
  world.addSystem(inputSystem);
  world.addSystem(movementSystem);
  world.addSystem(renderSystem);
  world.addSystem(inputEndOfFrameSystem);

  return world;
}

export function startLoop(world) {
  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    world.resources.time += dt;
    if (world.resources.shake.t > 0) world.resources.shake.t -= dt;
    world.step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
