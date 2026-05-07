import { paint, flipH, compose } from './paint.js';

// Tiger sprite: 32x32, twice the hamster size in each dimension.
// 4 looking directions × state variants (normal / angry-fire / sad).
//
// O = orange fur (main)
// o = lighter cream belly / muzzle
// B = black stripe / outline
// W = eye white
// L = pupil (looking direction)
// E = eye outline / nose
// .   = transparent

const DOWN = [
  '................................',
  '................................',
  '..........BB..........BB........',
  '.........BOOB........BOOB.......',
  '.........BOOOB......BOOOB.......',
  '........BOOOOOBBBBBBOOOOOB......',
  '.......BOOOOOOOOOOOOOOOOOOOB....',
  '......BOOBBOOOOOOOOOOOOBBOOOB...',
  '.....BOOOBBOOOOOOOOOOOOBBOOOOB..',
  '.....BOOOOOOOOOOOOOOOOOOOOOOOB..',
  '....BOOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '....BOOBBOOoooooooooooooooBBOOB.',
  '....BOOBBoooEEEooooooEEEoooBBOB.',
  '....BOoooooEWLWEoooEWLWEooooooB.',
  '....BOoooooEWWWEoooEWWWEooooooB.',
  '....BOoooooooEEoooooEEoooooooOB.',
  '....BOOoooooooEEEoEEEoooooooBOB.',
  '....BOOBoooooooooooooooooooBBOB.',
  '....BOOBBoooooBBBBBBBBoooooBBOB.',
  '....BOOOoooooBoooooooBoooooooOB.',
  '.....BOoooooooooooooooooooooOB..',
  '.....BOOooooooBBoooooBBooooBOB..',
  '......BOOOoooooooooooooooooOB...',
  '.......BOOOOoooooooooooooOOB....',
  '........BOOOOOOOOOOOOOOOOOB.....',
  '.........BBOOOOOOOOOOOOOBB......',
  '...........BBOOOOOOOOOBB........',
  '.............BBBBBBBBBB.........',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Up-facing — back of head + ears + body.
const UP = [
  '................................',
  '................................',
  '..........BB..........BB........',
  '.........BBOB........BOBB.......',
  '.........BOOOB......BOOOB.......',
  '........BOOOOOBBBBBBOOOOOB......',
  '.......BOOOOOOOOOOOOOOOOOOOB....',
  '......BOOBBOOOOOOOOOOOOBBOOOB...',
  '.....BOOOOOOOOOOOOOOOOOOOOOOOB..',
  '.....BOOOOOOOOOOOOOOOOOOOOOOOB..',
  '....BOOOOOOOBBBOOOOOBBBOOOOOOOB.',
  '....BOOOOOOBOOBOOOOOBOOBOOOOOOB.',
  '....BOOOOOOOBBOOOOOOOBBOOOOOOOB.',
  '....BOOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '....BOOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '....BOOBBOOOOOOOOOOOOOOOOOBBOOB.',
  '....BOOBBOOOOOOOOOOOOOOOOOBBOOB.',
  '....BOOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '....BOOOOOOOBBBBBBBBBBOOOOOOOOB.',
  '....BOOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '.....BOOOOOOOOBBBBBBBOOOOOOOOOB.',
  '.....BOOOOOOOOOOOOOOOOOOOOOOOB..',
  '......BOOOOOOOOOOOOOOOOOOOOOB...',
  '.......BOOOOOOOOOOOOOOOOOOOB....',
  '........BOOOOOOOOOOOOOOOOOB.....',
  '.........BBOOOOOOOOOOOOOBB......',
  '...........BBOOOOOOOOOBB........',
  '.............BBBBBBBBBB.........',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Left-facing — profile.
const LEFT = [
  '................................',
  '................................',
  '...........BB...................',
  '..........BOOB..................',
  '..........BOOOBB................',
  '.........BOOOOOOBBBBBBBBBBB.....',
  '........BOOOOOOOOOOOOOOOOOOB....',
  '.......BOOBBOOOOOOOOOOOOBBOB....',
  '......BOOOBBOOOOOOOOOOOOBBOOB...',
  '......BOOOOOOOOOOOOOOOOOOOOOOB..',
  '.....BOOOOOOOOOOOOOOOOOOOOOOOOB.',
  '.....BoooEEEoooooooooooooBBOOOB.',
  '.....BooEWWLEoooooooooooBBOOOOB.',
  '.....BooEWWWEooooooooooooooooOB.',
  '.....BoooEEooooooooooooooooooOB.',
  '.....BooEEEooooooooooooooooooOB.',
  '.....BoooooEEoooooooooooooooOOB.',
  '.....BoooooooooooooooooooooOOOB.',
  '......BooooooooBBBBBBBBBoooOOB..',
  '......BooooooBoooooooooBoooOB...',
  '.......BoooooooooooooooooooB....',
  '........BoooooBBoooooBBoooB.....',
  '.........BoooooooooooooooB......',
  '..........BBoooooooooooBB.......',
  '............BBBBBBBBBBB.........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

const PALETTE_NORMAL = {
  '.': null,
  'B': '#1a0808',
  'O': '#e87830',
  'o': '#fbe6a8',
  'E': '#1a0808',
  'W': '#ffffff',
  'L': '#1a0808',
};

const PALETTE_ANGRY = {
  '.': null,
  'B': '#1a0000',
  'O': '#d61818',
  'o': '#f8a070',
  'E': '#000000',
  'W': '#ffd860',
  'L': '#1a0000',
};

const PALETTE_SAD = {
  '.': null,
  'B': '#1a0808',
  'O': '#a86028',
  'o': '#d8c098',
  'E': '#1a0808',
  'W': '#cccccc',
  'L': '#1a0808',
};

// Tear overlays for sad tiger. Positions match the eye L's in each
// base sprite; up-facing has no tears since the back of the head is
// shown.
const TEAR_DOWN = [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '.............T.......T..........',
  '.............T.......T..........',
  '.............t.......t..........',
  '................................',
  '................................',
  '.............T.......T..........',
  '................................',
  '.............t.......t..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

const TEAR_LEFT = [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '...........T....................',
  '...........T....................',
  '...........t....................',
  '................................',
  '...........T....................',
  '...........t....................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];
const PALETTE_TEAR = {
  '.': null,
  'T': '#7ad0ff',
  't': '#3a90d8',
};

function paletteFor(state) {
  switch (state) {
    case 'angry': return PALETTE_ANGRY;
    case 'sad':   return PALETTE_SAD;
    default:      return PALETTE_NORMAL;
  }
}

// Look-direction shifts the pupil character in eye rows. We bake this
// into the grid by post-processing the L positions before painting.
function applyLookDirection(grid, lookDir) {
  return grid.map(row => {
    if (!row.includes('L')) return row;
    const chars = row.split('');
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] !== 'L') continue;
      let target = i;
      if (lookDir === 'left' && chars[i - 1] === 'W') target = i - 1;
      else if (lookDir === 'right' && chars[i + 1] === 'W') target = i + 1;
      if (target !== i) {
        chars[i] = 'W';
        chars[target] = 'L';
      }
    }
    return chars.join('');
  });
}

export function tigerSprite(facing, state, lookDir = facing) {
  let base, tearGrid;
  let flip = false;
  switch (facing) {
    case 'down':  base = DOWN; tearGrid = TEAR_DOWN; break;
    case 'up':    base = UP;   tearGrid = null; break;        // back of head — no tears
    case 'left':  base = LEFT; tearGrid = TEAR_LEFT; break;
    case 'right': base = LEFT; tearGrid = TEAR_LEFT; flip = true; break;
    default:      base = DOWN; tearGrid = TEAR_DOWN;
  }

  // Eye-shift only meaningful on the down sprite (front-facing eyes).
  let grid = base;
  if (facing === 'down') grid = applyLookDirection(base, lookDir);

  let body = paint(grid, paletteFor(state));
  if (flip) body = flipH(body);

  if (state === 'sad' && tearGrid) {
    let tears = paint(tearGrid, PALETTE_TEAR);
    if (flip) tears = flipH(tears);
    body = compose(body, tears);
  }
  return body;
}

export const TIGER_SIZE = 32;
