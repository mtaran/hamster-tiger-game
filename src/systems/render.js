import * as C from '../components.js';
import { hamsterSprite } from '../art/hamster.js';
import { tigerSprite } from '../art/tiger.js';
import { drawFireRing, fireballSprite, puddleSprite, floorTile } from '../art/effects.js';
import { FIRE_RING_RADIUS } from './tiger.js';

// Cache sprite canvases per (kind, key) so we don't re-paint every
// frame. State-driven rebuilds (e.g. tiger angry vs neutral) are
// keyed by the relevant inputs.
const cache = new Map();
function cached(key, build) {
  let c = cache.get(key);
  if (!c) { c = build(); cache.set(key, c); }
  return c;
}

let floorTileCanvas = null;
function getFloor() {
  if (!floorTileCanvas) floorTileCanvas = floorTile();
  return floorTileCanvas;
}

export function renderSystem(world) {
  const ctx = world.resources.ctx;
  const { viewW, viewH, scale, time } = world.resources;

  // Reset to identity, then scale up the logical view.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, world.resources.canvas.width, world.resources.canvas.height);

  // Apply screen shake (used during fireball impacts).
  let shakeX = 0, shakeY = 0;
  const shake = world.resources.shake;
  if (shake && shake.t > 0) {
    shakeX = (Math.random() - 0.5) * shake.amp * 2;
    shakeY = (Math.random() - 0.5) * shake.amp * 2;
  }
  ctx.setTransform(scale, 0, 0, scale, shakeX, shakeY);

  // Tiled floor.
  const tile = getFloor();
  for (let y = 0; y < viewH; y += tile.height) {
    for (let x = 0; x < viewW; x += tile.width) {
      ctx.drawImage(tile, x, y);
    }
  }

  // Puddles drawn on the floor before any sprites.
  for (const e of world.query(C.Puddle, C.Position)) {
    const p = puddleSprite(e.puddle.size);
    ctx.drawImage(p, Math.round(e.position.x - p.width / 2), Math.round(e.position.y - p.height / 2));
  }

  // Tiger fire ring drawn behind the tiger so flames wrap around.
  for (const e of world.query(C.TigerState, C.Position)) {
    if (e.tigerState.state === 'angry') {
      drawFireRing(ctx, e.position.x, e.position.y, FIRE_RING_RADIUS, time);
    }
  }

  // Z-sort sprites by y.
  const drawables = [];
  for (const e of world.query(C.Position, C.Sprite)) {
    drawables.push(e);
  }
  drawables.sort((a, b) => a.position.y - b.position.y);

  for (const e of drawables) {
    const canvas = resolveSprite(e, world);
    if (!canvas) continue;
    const x = Math.round(e.position.x - canvas.width / 2);
    const y = Math.round(e.position.y - canvas.height / 2);
    ctx.drawImage(canvas, x, y);
  }

  // Inner fire glow on top of angry tiger to give flames depth.
  for (const e of world.query(C.TigerState, C.Position)) {
    if (e.tigerState.state === 'angry') {
      drawFireRing(ctx, e.position.x, e.position.y, FIRE_RING_RADIUS - 8, time + 0.5);
    }
  }

  // Tears — small enough that we just plot them as 1x2 pixels here.
  for (const e of world.query(C.Tear, C.Position)) {
    ctx.fillStyle = '#7ad0ff';
    ctx.fillRect(Math.round(e.position.x), Math.round(e.position.y), 1, 2);
  }
}

function resolveSprite(e, world) {
  // Hamster: rebuild based on facing × hamsterState.state
  if (world.hasComponent(e.id, C.HamsterState) && world.hasComponent(e.id, C.Facing)) {
    const facing = world.getComponent(e.id, C.Facing).dir;
    const state = world.getComponent(e.id, C.HamsterState).state;
    return cached(`hamster:${facing}:${state}`, () => hamsterSprite(facing, state));
  }
  // Tiger: rebuild based on facing × state × lookDir
  if (world.hasComponent(e.id, C.TigerState)) {
    const ts = world.getComponent(e.id, C.TigerState);
    return cached(`tiger:${ts.facing}:${ts.state}:${ts.lookDir}`,
      () => tigerSprite(ts.facing, ts.state, ts.lookDir));
  }
  // Fireball: animate by phase
  if (world.hasComponent(e.id, C.FireballAnim)) {
    const phase = world.getComponent(e.id, C.FireballAnim).phase;
    return cached(`fireball:${phase}`, () => fireballSprite(phase));
  }
  // Anything else: use the static canvas already on the Sprite component.
  return e.sprite.canvas;
}
