import * as C from '../components.js';
import { makeThoughtProps, evaluateValence } from '../valence.js';
import { thoughtSprite } from '../art/effects.js';

export const QUEUE_CAP = 6;
export const SLOT_X0 = 24;
export const SLOT_DX = 28;
export const SLOT_Y = 12;
export const THOUGHT_SPEED = 130;
export const THOUGHT_LIFETIME_S = 1.4;

// Maintains world.resources.thoughtQueue — an array of "queued"
// thoughts (each with props + valence) that the player will fire from
// the conveyor at the top of the screen.
export function thoughtConveyorSystem(world, dt) {
  const q = world.resources.thoughtQueue;
  const rule = world.resources.valenceRule;
  while (q.length < QUEUE_CAP) {
    const props = makeThoughtProps();
    q.push({
      props,
      valence: evaluateValence(rule, props),
      sprite: thoughtSprite(props),
    });
  }
}

// Space key -> launch the front thought as a projectile in the
// hamster's facing direction.
export function shootingSystem(world) {
  const input = world.resources.input;
  if (!input.wasJustPressed('Space')) return;
  const player = world.queryFirst(C.Player, C.Position, C.Facing, C.HamsterState);
  if (!player) return;
  if (player.hamsterState.state === 'burning' || player.hamsterState.state === 'ash') return;
  const q = world.resources.thoughtQueue;
  if (q.length === 0) return;

  const t = q.shift();
  const [dx, dy] = facingToVec(player.facing.dir);

  world.createEntity({
    [C.Position]: { x: player.position.x + dx * 6, y: player.position.y + dy * 6 },
    [C.Velocity]: { dx: dx * THOUGHT_SPEED, dy: dy * THOUGHT_SPEED },
    [C.Sprite]:   { canvas: t.sprite, w: t.sprite.width, h: t.sprite.height },
    [C.Thought]:  { props: t.props, valence: t.valence },
    [C.Projectile]: { kind: 'thought' },
    [C.Collider]: { radius: Math.max(3, t.props.size / 2) },
    [C.Lifetime]: { remaining: THOUGHT_LIFETIME_S },
  });
}

function facingToVec(dir) {
  switch (dir) {
    case 'up':    return [0, -1];
    case 'down':  return [0, 1];
    case 'left':  return [-1, 0];
    case 'right': return [1, 0];
  }
  return [0, 1];
}

