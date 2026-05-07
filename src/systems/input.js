import * as C from '../components.js';

// The input resource holds keyboard state. Created once and stored on
// world.resources.input. `wasJustPressed` is reset at end-of-frame.

export function createInputResource() {
  const down = new Set();
  const just = new Set();

  function onKeyDown(e) {
    // Avoid scrolling with arrow keys / space when game has focus.
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!down.has(e.code)) just.add(e.code);
    down.add(e.code);
  }
  function onKeyUp(e) { down.delete(e.code); }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    isDown: (code) => down.has(code),
    wasJustPressed: (code) => just.has(code),
    endFrame: () => just.clear(),
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}

// Drives the player's velocity + facing from current keyboard state.
// The hamster cannot move while in burning/ash states (briefly stunned).
export function inputSystem(world, dt) {
  const input = world.resources.input;
  const speed = 60; // logical px / second

  for (const e of world.query(C.Player, C.Velocity, C.Facing, C.HamsterState)) {
    let dx = 0, dy = 0;
    if (e.hamsterState.state !== 'burning' && e.hamsterState.state !== 'ash') {
      if (input.isDown('ArrowLeft')  || input.isDown('KeyA')) dx -= 1;
      if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;
      if (input.isDown('ArrowUp')    || input.isDown('KeyW')) dy -= 1;
      if (input.isDown('ArrowDown')  || input.isDown('KeyS')) dy += 1;
    }

    if (dx !== 0 && dy !== 0) {
      // Normalize so diagonal isn't faster.
      const inv = 1 / Math.sqrt(2);
      dx *= inv;
      dy *= inv;
    }
    e.velocity.dx = dx * speed;
    e.velocity.dy = dy * speed;

    // Update facing to whichever axis is dominant; preserve last facing
    // when stationary so the hamster keeps "looking" somewhere.
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) e.facing.dir = 'left';
      else if (dx > 0) e.facing.dir = 'right';
    } else {
      if (dy < 0) e.facing.dir = 'up';
      else if (dy > 0) e.facing.dir = 'down';
    }
  }
}

// Runs at the very end of each tick to clear "just-pressed" state.
export function inputEndOfFrameSystem(world) {
  world.resources.input.endFrame();
}
