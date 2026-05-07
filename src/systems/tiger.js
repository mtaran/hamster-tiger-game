import * as C from '../components.js';

// Tiger constants — exposed for tests / tuning.
export const ANGER_MAX = 100;
export const ANGER_RESIDUAL = 35;             // anger left over once an angry phase ends
export const ANGRY_DURATION_S = 7;            // how long an angry phase lasts
export const FIRE_COOLDOWN_S = 0.55;          // gap between fireballs
export const FIRE_SPEED = 80;                 // logical px / s
export const SAD_DURATION_S = 4;
// Tuned so even optimal play (good thoughts hit, bad thoughts thrown
// off-screen) trends upward: -11 + 14 = +3 net per good/bad pair.
// First fire arrives in ~22 player actions; subsequent fires in ~22
// more (anger resets to ANGER_RESIDUAL=35, not 0).
export const ANGER_GAIN_BAD_THOUGHT = 24;
export const ANGER_GAIN_MISS = 14;
export const ANGER_LOSS_GOOD_THOUGHT = 11;

// Tiger state machine + look tracking. Fireball spawning happens here
// while the tiger is angry. The actual movement of the fireballs is
// handled by the projectile system.
export function tigerSystem(world, dt) {
  const player = world.queryFirst(C.Player, C.Position);
  for (const e of world.query(C.TigerState, C.Position)) {
    const t = e.tigerState;

    // The tiger always turns to face the hamster — whole body, not
    // just eyes. Pick the dominant axis to a cardinal direction.
    if (player) {
      const dx = player.position.x - e.position.x;
      const dy = player.position.y - e.position.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        t.facing = dx < 0 ? 'left' : 'right';
      } else {
        t.facing = dy < 0 ? 'up' : 'down';
      }
      t.lookDir = t.facing;
    }

    if (t.state === 'neutral') {
      // Anger does NOT drift on its own — only player hits/misses move it.
      if (t.anger >= ANGER_MAX) {
        t.state = 'angry';
        t.angryTimer = ANGRY_DURATION_S;
        t.fireCooldown = 0.3;
      }
      continue;
    }

    if (t.state === 'angry') {
      t.angryTimer -= dt;
      t.fireCooldown -= dt;
      // While spewing fire, the meter visibly drains as the tiger
      // releases its rage. By end of the angry phase it bottoms out
      // at ANGER_RESIDUAL.
      const drainRate = (ANGER_MAX - ANGER_RESIDUAL) / ANGRY_DURATION_S;
      t.anger = Math.max(ANGER_RESIDUAL, t.anger - drainRate * dt);
      if (t.fireCooldown <= 0) {
        spawnFireball(world, e.position);
        t.fireCooldown = FIRE_COOLDOWN_S;
      }
      if (t.angryTimer <= 0) {
        t.state = 'neutral';
        t.anger = ANGER_RESIDUAL;
      }
      continue;
    }

    if (t.state === 'sad') {
      t.sadTimer -= dt;
      if (t.sadTimer <= 0) {
        t.state = 'neutral';
        t.anger = 0;
      }
    }
  }
}

function spawnFireball(world, origin) {
  const angle = Math.random() * Math.PI * 2;     // any random direction
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  world.createEntity({
    [C.Position]:     { x: origin.x, y: origin.y },
    [C.Velocity]:     { dx: dx * FIRE_SPEED, dy: dy * FIRE_SPEED },
    [C.Sprite]:       { canvas: null, w: 8, h: 8 },
    [C.Fireball]:     {},
    [C.FireballAnim]: { phase: 0, t: 0 },
    [C.Collider]:     { radius: 3 },
    [C.Lifetime]:     { remaining: 3.5 },
  });
}

// Animate fireball flicker.
export function fireballAnimSystem(world, dt) {
  for (const e of world.query(C.FireballAnim)) {
    e.fireballAnim.t += dt;
    if (e.fireballAnim.t > 0.08) {
      e.fireballAnim.t = 0;
      e.fireballAnim.phase = e.fireballAnim.phase ? 0 : 1;
    }
  }
}

// Helper used by the projectile system when a thought hits the tiger.
export function applyThoughtToTiger(tigerState, valence) {
  if (valence) {
    tigerState.anger = Math.max(0, tigerState.anger - ANGER_LOSS_GOOD_THOUGHT);
  } else {
    tigerState.anger = Math.min(ANGER_MAX, tigerState.anger + ANGER_GAIN_BAD_THOUGHT);
  }
}

export function applyMissToTiger(tigerState) {
  tigerState.anger = Math.min(ANGER_MAX, tigerState.anger + ANGER_GAIN_MISS);
}

// Triggered when the hamster gets hit — tiger ends angry phase early
// and switches to sad.
export function calmTigerToSad(tigerState) {
  tigerState.state = 'sad';
  tigerState.sadTimer = SAD_DURATION_S;
  tigerState.anger = 20;
  tigerState.angryTimer = 0;
  tigerState.fireCooldown = 999;     // stop spewing fire
}
