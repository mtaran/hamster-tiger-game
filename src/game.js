import { World } from './ecs/world.js';
import * as C from './components.js';
import { createInputResource, inputSystem, inputEndOfFrameSystem } from './systems/input.js';
import { movementSystem } from './systems/movement.js';
import { tigerSystem, fireballAnimSystem } from './systems/tiger.js';
import { thoughtConveyorSystem, shootingSystem } from './systems/thoughts.js';
import { projectileSystem } from './systems/projectiles.js';
import { hamsterStateSystem, tearLandingSystem } from './systems/hamster.js';
import { lifetimeSystem } from './systems/lifetime.js';
import { renderSystem } from './systems/render.js';
import { hudSystem } from './systems/hud.js';
import { makeValenceRule } from './valence.js';

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
    valenceRule: makeValenceRule(),
    thoughtQueue: [],
  };

  spawnEntities(world);

  // Order matters here. Input drives state; movement applies it; tiger
  // updates anger and may spawn fireballs that the projectile system
  // then moves; collisions resolve; lifetimes & state machines tidy up;
  // render last; finally clear "just-pressed" input flags.
  world.addSystem(inputSystem);
  world.addSystem(movementSystem);
  world.addSystem(tigerSystem);
  world.addSystem(fireballAnimSystem);
  world.addSystem(thoughtConveyorSystem);
  world.addSystem(shootingSystem);
  world.addSystem(projectileSystem);
  world.addSystem(hamsterStateSystem);
  world.addSystem(tearLandingSystem);
  world.addSystem(lifetimeSystem);
  world.addSystem(renderSystem);
  world.addSystem(hudSystem);
  world.addSystem(restartSystem);
  world.addSystem(inputEndOfFrameSystem);

  return world;
}

function spawnEntities(world) {
  // Hamster
  world.createEntity({
    [C.Position]:     { x: 80, y: 130 },
    [C.Velocity]:     { dx: 0, dy: 0 },
    [C.Facing]:       { dir: 'up' },
    [C.Player]:       {},
    [C.Sprite]:       { canvas: null, w: 16, h: 16 },
    [C.HamsterState]: { state: 'normal', timer: 0 },
    [C.Collider]:     { radius: 5 },
  });

  // Tiger (static — no Velocity)
  world.createEntity({
    [C.Position]:    { x: 160, y: 70 },
    [C.Sprite]:      { canvas: null, w: 32, h: 32 },
    [C.TigerState]:  {
      state: 'neutral',
      facing: 'down',
      lookDir: 'down',
      anger: 0,
      sadTimer: 0,
      fireCooldown: 0,
      angryTimer: 0,
    },
    [C.Collider]:    { radius: 14 },
  });
}

function restartSystem(world) {
  if (!world.resources.input.wasJustPressed('KeyR')) return;
  // Wipe entities and re-roll the valence rule.
  for (const e of [...world.query(C.Position)]) {
    world.destroyEntity(e.id);
  }
  // step is mid-tick; defer reset until cleanup runs.
  world.resources._pendingReset = true;
}

export function startLoop(world) {
  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    world.resources.time += dt;
    if (world.resources.shake.t > 0) world.resources.shake.t -= dt;
    world.step(dt);
    if (world.resources._pendingReset) {
      world.resources._pendingReset = false;
      world.resources.thoughtQueue = [];
      world.resources.valenceRule = makeValenceRule();
      spawnEntities(world);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
