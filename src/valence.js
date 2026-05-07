// Random per-game rule that classifies thoughts as "good" or "bad".
// The player doesn't see the rule — they have to infer it from the
// tiger's reactions.

export const SHAPES = ['circle', 'square', 'triangle', 'star', 'blob'];
export const TEXTURES = ['solid', 'spots', 'stripes', 'glow'];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickSubset(rng, arr, count) {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// Build a fresh valence rule. The rule is opaque to the player but
// applied via evaluateValence() to every thought spawned this game.
export function makeValenceRule(rng = Math.random) {
  const r = rng();
  if (r < 0.25) {
    return {
      kind: 'shape',
      good: pickSubset(rng, SHAPES, 2),
    };
  }
  if (r < 0.45) {
    return {
      kind: 'size',
      cutoff: 9.5,                   // mid-range of 6..14
      dir: rng() < 0.5 ? 'gt' : 'lt',
    };
  }
  if (r < 0.65) {
    // Hue range — pick a 90-degree window on the color wheel.
    const start = Math.floor(rng() * 360);
    return {
      kind: 'hue',
      start,
      end: (start + 90) % 360,
    };
  }
  if (r < 0.85) {
    return {
      kind: 'brightness',
      cutoff: 0.55,
      dir: rng() < 0.5 ? 'gt' : 'lt',
    };
  }
  return {
    kind: 'texture',
    good: pickSubset(rng, TEXTURES, 2),
  };
}

export function evaluateValence(rule, props) {
  switch (rule.kind) {
    case 'shape':
      return rule.good.includes(props.shape);
    case 'size':
      return rule.dir === 'gt' ? props.size > rule.cutoff : props.size < rule.cutoff;
    case 'brightness':
      return rule.dir === 'gt' ? props.brightness > rule.cutoff : props.brightness < rule.cutoff;
    case 'texture':
      return rule.good.includes(props.texture);
    case 'hue': {
      const h = props.hue;
      if (rule.start <= rule.end) return h >= rule.start && h <= rule.end;
      return h >= rule.start || h <= rule.end;        // wraps around 360
    }
  }
  return false;
}

// Generate a random thought params bag.
export function makeThoughtProps(rng = Math.random) {
  const hue = Math.floor(rng() * 360);
  const brightness = 0.3 + rng() * 0.7;
  const sat = 60 + rng() * 30;
  const lightness = Math.floor(35 + brightness * 35);
  const color = `hsl(${hue} ${sat}% ${lightness}%)`;
  const accent = `hsl(${(hue + 180) % 360} ${sat}% ${Math.min(95, lightness + 30)}%)`;
  return {
    shape: pick(rng, SHAPES),
    texture: pick(rng, TEXTURES),
    size: 6 + Math.floor(rng() * 9),  // 6..14
    hue,
    brightness,
    color,
    accent,
  };
}
