import * as C from '../components.js';
import { applyThoughtToTiger, calmTigerToSad } from './tiger.js';

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

  // Fireball vs Hamster.
  if (player && tiger) {
    for (const e of world.query(C.Fireball, C.Position, C.Collider)) {
      if (player.hamsterState.state !== 'normal') continue;
      if (circlesCollide(e.position, e.collider, player.position, player.collider)) {
        player.hamsterState.state = 'burning';
        player.hamsterState.timer = 0.7;
        calmTigerToSad(tiger.tigerState);
        world.destroyEntity(e.id);
        const shake = world.resources.shake;
        shake.t = 0.3;
        shake.amp = 1.4;
      }
    }
  }
}

export function circlesCollide(p1, c1, p2, c2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const r = c1.radius + c2.radius;
  return dx * dx + dy * dy <= r * r;
}
