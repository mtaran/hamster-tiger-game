import * as C from '../components.js';

// Hamster damage state machine:
//   normal  — fully functional
//   burning — caught fire, brief flame overlay, can't move
//   ash     — black/sooty body, can't move
//   sad     — recovered enough to move, with falling tears that pool
//             on the ground; recovers back to normal after a while
const BURNING_TO_ASH_S = 0.8;
const ASH_TO_SAD_S    = 1.0;
const SAD_TO_NORMAL_S = 6.0;
const TEAR_INTERVAL_S = 0.45;

export function hamsterStateSystem(world, dt) {
  for (const e of world.query(C.HamsterState, C.Position)) {
    const s = e.hamsterState;
    s.timer -= dt;
    if (s.state === 'burning' && s.timer <= 0) {
      s.state = 'ash';
      s.timer = ASH_TO_SAD_S;
      continue;
    }
    if (s.state === 'ash' && s.timer <= 0) {
      s.state = 'sad';
      s.timer = SAD_TO_NORMAL_S;
      s.tearTimer = 0;
      continue;
    }
    if (s.state === 'sad') {
      s.tearTimer = (s.tearTimer ?? 0) - dt;
      if (s.tearTimer <= 0) {
        s.tearTimer = TEAR_INTERVAL_S;
        spawnTear(world, e.position);
      }
      if (s.timer <= 0) {
        s.state = 'normal';
        s.timer = 0;
      }
    }
  }
}

function spawnTear(world, origin) {
  // A tear falls a short distance then leaves a puddle.
  world.createEntity({
    [C.Position]: { x: origin.x - 3, y: origin.y - 1 },
    [C.Velocity]: { dx: -8 + Math.random() * 16, dy: 18 + Math.random() * 8 },
    [C.Tear]:     {},
    [C.Lifetime]: { remaining: 0.6 },
  });
  world.createEntity({
    [C.Position]: { x: origin.x + 3, y: origin.y - 1 },
    [C.Velocity]: { dx: -8 + Math.random() * 16, dy: 18 + Math.random() * 8 },
    [C.Tear]:     {},
    [C.Lifetime]: { remaining: 0.6 },
  });
}

// When a tear's lifetime ends, drop a puddle at its final position.
// We hook this in via the lifetime system: tag tears with __makePuddle
// before they're destroyed, then the puddle spawn system here picks
// them up. Simpler: handle it directly in this system by checking
// whether the tear is about to be destroyed.
export function tearLandingSystem(world) {
  for (const e of world.query(C.Tear, C.Lifetime, C.Position)) {
    if (e.lifetime.remaining <= 0) {
      // Coalesce into a puddle if there's already one nearby.
      let merged = false;
      for (const p of world.query(C.Puddle, C.Position)) {
        const dx = p.position.x - e.position.x;
        const dy = p.position.y - e.position.y;
        if (dx * dx + dy * dy < 64) {
          p.puddle.size = Math.min(8, p.puddle.size + 1);
          merged = true;
          break;
        }
      }
      if (!merged) {
        // Place puddle a touch above where the tear lands so it
        // sits near the hamster's feet rather than well below them.
        world.createEntity({
          [C.Position]: { x: e.position.x, y: e.position.y - 8 },
          [C.Puddle]:   { size: 2 },
        });
      }
      world.destroyEntity(e.id);
    }
  }
}
