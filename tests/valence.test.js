import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeValenceRule, evaluateValence, makeThoughtProps,
  SHAPES, TEXTURES,
} from '../src/valence.js';

// Deterministic RNG so we can assert exact shapes.
function seqRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('shape rule classifies thoughts by their shape membership', () => {
  const rule = { kind: 'shape', good: ['circle', 'star'] };
  assert.equal(evaluateValence(rule, { shape: 'circle' }), true);
  assert.equal(evaluateValence(rule, { shape: 'star' }), true);
  assert.equal(evaluateValence(rule, { shape: 'square' }), false);
});

test('size rule respects gt/lt direction', () => {
  const gt = { kind: 'size', cutoff: 10, dir: 'gt' };
  const lt = { kind: 'size', cutoff: 10, dir: 'lt' };
  assert.equal(evaluateValence(gt, { size: 12 }), true);
  assert.equal(evaluateValence(gt, { size: 8 }),  false);
  assert.equal(evaluateValence(lt, { size: 8 }),  true);
});

test('brightness rule respects gt/lt direction', () => {
  const gt = { kind: 'brightness', cutoff: 0.5, dir: 'gt' };
  assert.equal(evaluateValence(gt, { brightness: 0.8 }), true);
  assert.equal(evaluateValence(gt, { brightness: 0.2 }), false);
});

test('hue rule with non-wrapping window', () => {
  const rule = { kind: 'hue', start: 30, end: 120 };
  assert.equal(evaluateValence(rule, { hue: 60 }), true);
  assert.equal(evaluateValence(rule, { hue: 5 }),  false);
  assert.equal(evaluateValence(rule, { hue: 200 }), false);
});

test('hue rule that wraps past 360 still works', () => {
  const rule = { kind: 'hue', start: 330, end: 60 }; // window crosses 0
  assert.equal(evaluateValence(rule, { hue: 0 }),   true);
  assert.equal(evaluateValence(rule, { hue: 350 }), true);
  assert.equal(evaluateValence(rule, { hue: 30 }),  true);
  assert.equal(evaluateValence(rule, { hue: 180 }), false);
});

test('makeValenceRule produces a usable rule for any rng draw', () => {
  // Sample several rule-types by stepping rng through the bands.
  const rngs = [
    seqRng([0.1, 0.5, 0.5]),    // shape branch
    seqRng([0.3, 0.5, 0.5]),    // size
    seqRng([0.55, 0.5, 0.5]),   // hue
    seqRng([0.75, 0.5, 0.5]),   // brightness
    seqRng([0.95, 0.5, 0.5]),   // texture
  ];
  const kinds = rngs.map(r => makeValenceRule(r).kind);
  assert.deepEqual(kinds.sort(),
    ['brightness', 'hue', 'shape', 'size', 'texture']);
});

test('makeThoughtProps yields valid prop bags inside expected ranges', () => {
  for (let i = 0; i < 50; i++) {
    const p = makeThoughtProps();
    assert.ok(SHAPES.includes(p.shape));
    assert.ok(TEXTURES.includes(p.texture));
    assert.ok(p.size >= 6 && p.size <= 14);
    assert.ok(p.hue >= 0 && p.hue < 360);
    assert.ok(p.brightness >= 0.3 && p.brightness <= 1);
    assert.match(p.color, /^hsl\(/);
  }
});

test('rule + props combined: every prop bag has a definite valence', () => {
  const rule = makeValenceRule();
  for (let i = 0; i < 100; i++) {
    const v = evaluateValence(rule, makeThoughtProps());
    assert.equal(typeof v, 'boolean');
  }
});
