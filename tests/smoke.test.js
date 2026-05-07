// Smoke test: stand up enough of a Canvas/DOM mock to import the
// rendering code, wire the full game, and step a few frames. Catches
// any module-load errors, wiring mistakes, and runtime exceptions in
// the systems we'd otherwise only see in a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';

function makeCanvasMock() {
  // A no-op 2D context that swallows every draw call.
  const ctxProto = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'canvas') return { width: 480, height: 320 };
      // Accessor props that callers read back.
      if (prop === 'fillStyle' || prop === 'strokeStyle' ||
          prop === 'globalAlpha' || prop === 'lineWidth' ||
          prop === 'font' || prop === 'imageSmoothingEnabled') {
        return undefined;
      }
      return () => {};
    },
    set() { return true; },
  });
  return ctxProto;
}

function installDomMocks() {
  if (globalThis.document) return;
  globalThis.document = {
    createElement(tag) {
      if (tag !== 'canvas') return {};
      const c = {
        width: 0, height: 0,
        getContext: () => makeCanvasMock(),
      };
      return c;
    },
    getElementById: () => null,
  };
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.performance = { now: () => Date.now() };
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 0);
}

test('game wires up and steps without throwing', async () => {
  installDomMocks();
  const { createGame } = await import('../src/game.js');
  const fakeCanvas = {
    width: 480, height: 320,
    getContext: () => makeCanvasMock(),
  };
  const world = createGame(fakeCanvas);
  // Step a handful of frames covering anger build-up / decay paths.
  for (let i = 0; i < 30; i++) world.step(1 / 60);
  // Force tiger into angry mode and step a bit so fireballs spawn + collide.
  const tiger = [...world.query('tigerState')][0];
  tiger.tigerState.anger = 200;
  for (let i = 0; i < 30; i++) world.step(1 / 60);
  const fireballs = [...world.query('fireball')];
  assert.ok(fireballs.length >= 0); // existence is fine; just must not throw
});
