import * as C from '../components.js';
import { applyMissToTiger } from './tiger.js';

// Decrement Lifetime.remaining and destroy entities whose timer hits
// zero or that have left the play area. Tears are skipped here — the
// tearLandingSystem destroys them after spawning a puddle.
//
// Thoughts that get destroyed here (without having hit the tiger) count
// as a miss, so the tiger gets angrier.
export function lifetimeSystem(world, dt) {
  const { viewW, viewH } = world.resources;
  const tiger = world.queryFirst(C.TigerState);

  for (const e of world.query(C.Lifetime)) {
    e.lifetime.remaining -= dt;
  }

  for (const e of world.query(C.Lifetime, C.Position)) {
    const offscreen =
      e.position.x < -10 || e.position.x > viewW + 10 ||
      e.position.y < -10 || e.position.y > viewH + 10;
    const expired = e.lifetime.remaining <= 0;
    if (!offscreen && !expired) continue;
    if (world.hasComponent(e.id, C.Tear)) continue;        // tears handled elsewhere
    // Misses bump the tiger's anger up a notch.
    if (world.hasComponent(e.id, C.Thought) && tiger) {
      applyMissToTiger(tiger.tigerState);
    }
    world.destroyEntity(e.id);
  }
}
