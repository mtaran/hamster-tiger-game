// Random per-game rule that classifies thoughts as "good" or "bad".
// The player doesn't see the rule — they have to infer it from the
// tiger's reactions.

export const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond'];

// Fixed odd sizes: triangles and stars need a centered apex column,
// which only works on odd widths. Picking from a small list also
// makes the size rule visually obvious instead of subtle.
export const SIZES = [7, 9, 11, 13];
const SIZE_CUTOFF = 10;        // splits SIZES into [7,9] and [11,13]

// Discrete color categories. Thoughts pick from these, so the player
// sees a small set of distinct colors instead of an analog rainbow,
// which makes the hue rule learnable without splitting hairs.
export const HUE_CATEGORIES = [
  { name: 'red',    hue:   0 },
  { name: 'orange', hue:  28 },
  { name: 'yellow', hue:  55 },
  { name: 'green',  hue: 120 },
  { name: 'cyan',   hue: 180 },
  { name: 'blue',   hue: 220 },
  { name: 'purple', hue: 280 },
  { name: 'pink',   hue: 320 },
];

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
  if (r < 0.50) {
    return {
      kind: 'size',
      cutoff: SIZE_CUTOFF,
      dir: rng() < 0.5 ? 'gt' : 'lt',
    };
  }
  if (r < 0.75) {
    // Contiguous slice of HUE_CATEGORIES, may wrap. Length 2 or 3
    // out of 8, so 25–37% of categories are good.
    const n = HUE_CATEGORIES.length;
    return {
      kind: 'hue',
      start: Math.floor(rng() * n),
      length: rng() < 0.5 ? 2 : 3,
    };
  }
  return {
    kind: 'brightness',
    cutoff: 0.55,
    dir: rng() < 0.5 ? 'gt' : 'lt',
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
    case 'hue': {
      const n = HUE_CATEGORIES.length;
      const offset = (props.hueIndex - rule.start + n) % n;
      return offset < rule.length;
    }
  }
  return false;
}

// Generate a random thought params bag.
export function makeThoughtProps(rng = Math.random) {
  const hueIndex = Math.floor(rng() * HUE_CATEGORIES.length);
  const hue = HUE_CATEGORIES[hueIndex].hue;
  const brightness = 0.3 + rng() * 0.7;
  const sat = 75 + rng() * 15;
  const lightness = Math.floor(35 + brightness * 35);
  const color = `hsl(${hue} ${sat}% ${lightness}%)`;
  return {
    shape: pick(rng, SHAPES),
    size: pick(rng, SIZES),
    hueIndex,
    hue,
    brightness,
    color,
  };
}
