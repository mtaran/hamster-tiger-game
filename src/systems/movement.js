import * as C from '../components.js';

// Apply velocities to positions, then clamp the player to the play
// area. Other entities (projectiles) are killed in their own systems
// when they leave bounds.
export function movementSystem(world, dt) {
  const { viewW, viewH } = world.resources;
  for (const e of world.query(C.Position, C.Velocity)) {
    e.position.x += e.velocity.dx * dt;
    e.position.y += e.velocity.dy * dt;
  }
  // Clamp player.
  for (const e of world.query(C.Player, C.Position)) {
    const margin = 8;
    if (e.position.x < margin) e.position.x = margin;
    if (e.position.x > viewW - margin) e.position.x = viewW - margin;
    if (e.position.y < margin + 16) e.position.y = margin + 16; // leave HUD strip
    if (e.position.y > viewH - margin) e.position.y = viewH - margin;
  }
}
