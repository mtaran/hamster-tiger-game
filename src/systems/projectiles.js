import * as C from '../components.js';
import { applyThoughtToTiger, calmTigerToSad, FIRE_RING_RADIUS } from './tiger.js';

// Move-driven collision detection only. Cleanup of off-screen / timed-out
// projectiles (and the resulting "miss" reaction) lives in lifetimeSystem.
export function projectileSystem(world) {
  const tiger = world.queryFirst(C.TigerState, C.Position, C.Collider);
  const player = world.queryFirst(C.Player, C.Position, C.Collider, C.HamsterState);

  // Thought vs Tiger.
  if (tiger) {
    for (const e of world.query(C.Thought, C.Projectile, C.Position, C.Collider)) {
      if (circlesCollide(e.position, e.collider, tiger.position, tiger.collider)) {
        applyThoughtToTiger(tiger.tigerState, e.thought.valence);
        world.destroyEntity(e.id);
      }
    }
  }

  // Fireball vs Hamster, and fire-ring contact.
  if (player && tiger && player.hamsterState.state === 'normal') {
    // Fireballs (the projectiles flying outward).
    for (const e of world.query(C.Fireball, C.Position, C.Collider)) {
      if (circlesCollide(e.position, e.collider, player.position, player.collider)) {
        burnHamster(world, player, tiger);
        world.destroyEntity(e.id);
        return;
      }
    }
    // Visible fire ring around an angry tiger — touching it also burns.
    if (tiger.tigerState.state === 'angry') {
      const dx = player.position.x - tiger.position.x;
      const dy = player.position.y - tiger.position.y;
      const reach = FIRE_RING_RADIUS + player.collider.radius;
      if (dx * dx + dy * dy <= reach * reach) {
        burnHamster(world, player, tiger);
      }
    }
  }
}

function burnHamster(world, player, tiger) {
  player.hamsterState.state = 'burning';
  player.hamsterState.timer = 0.7;
  calmTigerToSad(tiger.tigerState);
  const shake = world.resources.shake;
  shake.t = 0.3;
  shake.amp = 1.4;
}

export function circlesCollide(p1, c1, p2, c2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const r = c1.radius + c2.radius;
  return dx * dx + dy * dy <= r * r;
}
