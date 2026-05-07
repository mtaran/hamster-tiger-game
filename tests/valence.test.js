import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeValenceRule, evaluateValence, makeThoughtProps,
  SHAPES, SIZES, HUE_CATEGORIES,
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

test('categorical hue rule covers a contiguous slice', () => {
  // Categories 2,3,4 are good (yellow, green, cyan).
  const rule = { kind: 'hue', start: 2, length: 3 };
  assert.equal(evaluateValence(rule, { hueIndex: 2 }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 3 }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 4 }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 1 }), false);
  assert.equal(evaluateValence(rule, { hueIndex: 5 }), false);
});

test('hue rule slice wraps around the category list', () => {
  // Start at the last category, slice of 3 → wraps to 0,1.
  const lastIdx = HUE_CATEGORIES.length - 1;
  const rule = { kind: 'hue', start: lastIdx, length: 3 };
  assert.equal(evaluateValence(rule, { hueIndex: lastIdx }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 0 }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 1 }), true);
  assert.equal(evaluateValence(rule, { hueIndex: 2 }), false);
  assert.equal(evaluateValence(rule, { hueIndex: lastIdx - 1 }), false);
});

test('makeValenceRule covers all rule kinds across rng range', () => {
  const rngs = [
    seqRng([0.1, 0.5, 0.5]),    // shape branch
    seqRng([0.3, 0.5, 0.5]),    // size
    seqRng([0.55, 0.5, 0.5]),   // hue
    seqRng([0.95, 0.5, 0.5]),   // brightness
  ];
  const kinds = rngs.map(r => makeValenceRule(r).kind);
  assert.deepEqual(kinds.sort(),
    ['brightness', 'hue', 'shape', 'size']);
});

test('makeThoughtProps yields valid prop bags inside expected ranges', () => {
  for (let i = 0; i < 50; i++) {
    const p = makeThoughtProps();
    assert.ok(SHAPES.includes(p.shape));
    assert.ok(SIZES.includes(p.size), `unexpected size ${p.size}`);
    assert.equal(p.size % 2, 1, 'sizes must be odd for shape symmetry');
    assert.ok(p.hueIndex >= 0 && p.hueIndex < HUE_CATEGORIES.length);
    assert.equal(p.hue, HUE_CATEGORIES[p.hueIndex].hue);
    assert.ok(p.brightness >= 0.3 && p.brightness <= 1);
    assert.match(p.color, /^hsl\(/);
    assert.equal(p.texture, undefined);
  }
});

test('rule + props combined: every prop bag has a definite valence', () => {
  const rule = makeValenceRule();
  for (let i = 0; i < 100; i++) {
    const v = evaluateValence(rule, makeThoughtProps());
    assert.equal(typeof v, 'boolean');
  }
});
