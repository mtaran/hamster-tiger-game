import { paint, flipH, compose } from './paint.js';

// 16x16 sprite grids. Characters describe pixel roles; palette swaps
// give us state variants (normal / ash / etc.) without re-drawing.
//
// B = body outline / dark
// F = fur (main body color)
// C = light belly / cheek
// P = pink ear inside
// E = eye / nose dark
// W = eye white
// L = pupil / look direction
// .   = transparent

const DOWN = [
  '................',
  '...BB......BB...',
  '..BPPB....BPPB..',
  '..BPPB....BPPB..',
  '..BBPB....BPBB..',
  '...BBBFFFFBBB...',
  '..BFFFFFFFFFFB..',
  '.BFFEEEFFEEEFFB.',
  '.BFEWWLEEWWLEFB.',
  '.BFEWWWFFWWWEFB.',
  '.BFFEEFFFFEEFFB.',
  '.BFFFCCEECCFFFB.',
  '.BFCCFFEEFFCCFB.',
  '..BFFFFFFFFFFB..',
  '...BBBFFFFBBB...',
  '.....BBBBBB.....',
];

const UP = [
  '................',
  '...BB......BB...',
  '..BBPB....BPBB..',
  '..BPPB....BPPB..',
  '..BBPB....BPBB..',
  '...BBBFFFFBBB...',
  '..BFFFFFFFFFFB..',
  '.BFFFFFFFFFFFFB.',
  '.BFFFFFCCFFFFFB.',
  '.BFFFCCCCCCFFFB.',
  '.BFCCCCCCCCCCFB.',
  '.BFCCCCCCCCCCFB.',
  '.BFFCCCCCCCCFFB.',
  '..BFFCCCCCCFFB..',
  '...BBBFFFFBBB...',
  '.....BBBBBB.....',
];

const LEFT = [
  '................',
  '......BB........',
  '.....BPPB.......',
  '.....BPPB.......',
  '....BBBPB.......',
  '...BFFFFBBBB....',
  '..BFEEFFFFFFB...',
  '.BFEWWEFFFFFFB..',
  '.BFELWEFFFFFFFB.',
  '.BFEWWEFFFFFFFB.',
  '.BFFEEFFFFCCFFB.',
  '.BFFFFCCCCCCFFB.',
  '..BFCCCCCCCCFB..',
  '...BFFCCCCCFB...',
  '....BBBBBBBB....',
  '......BBBB......',
];

const PALETTE_NORMAL = {
  '.': null,
  'B': '#3a1e0a',
  'F': '#e0b070',
  'C': '#f5dca8',
  'P': '#f8a0c0',
  'E': '#1a0a05',
  'W': '#ffffff',
  'L': '#1a0a05',
};

const PALETTE_ASH = {
  '.': null,
  'B': '#0c0c0c',
  'F': '#2a2a2a',
  'C': '#3a3a3a',
  'P': '#202020',
  'E': '#000000',
  'W': '#cccccc',
  'L': '#000000',
};

// Tear overlay grids — drawn over an ash hamster.
const TEAR_DOWN = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..T..........T..',
  '..T..........T..',
  '..t..........t..',
  '................',
  '................',
  '................',
  '................',
];

const TEAR_LEFT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..T.............',
  '..T.............',
  '..t.............',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const PALETTE_TEAR = {
  '.': null,
  'T': '#7ad0ff',
  't': '#3a90d8',
};

// Tiny flame overlay for the briefly-burning hamster.
const FLAME = [
  '................',
  '......yY..yY....',
  '.....YyOOYYOY...',
  '.....YOOyOyOY...',
  '......OOyOyO....',
  '....yY......Yy..',
  '...YO........OY.',
  '..YO..........OY',
  '..YO..........OY',
  '...YO........OY.',
  '....YO......OY..',
  '.....YOOOOOOY...',
  '......YYOOYY....',
  '................',
  '................',
  '................',
];
const PALETTE_FLAME = {
  '.': null,
  'O': '#ff5020',
  'Y': '#ffb030',
  'y': '#ffe070',
};

function build(grid, palette) {
  return paint(grid, palette);
}

// Returns a sprite canvas for (direction, state).
// direction ∈ 'down' | 'up' | 'left' | 'right'
// state     ∈ 'normal' | 'burning' | 'ash' | 'sad'
export function hamsterSprite(direction, state) {
  let base;
  switch (direction) {
    case 'down': base = DOWN; break;
    case 'up':   base = UP;   break;
    case 'left': base = LEFT; break;
    case 'right':
      // Build LEFT then horizontally flip.
      return wrapState(flipH(build(LEFT, paletteFor(state))), state, 'right');
    default: base = DOWN;
  }
  return wrapState(build(base, paletteFor(state)), state, direction);
}

function paletteFor(state) {
  if (state === 'ash' || state === 'sad') return PALETTE_ASH;
  return PALETTE_NORMAL;
}

function wrapState(bodyCanvas, state, direction) {
  if (state === 'burning') {
    return compose(bodyCanvas, build(FLAME, PALETTE_FLAME));
  }
  if (state === 'sad') {
    let tearGrid;
    if (direction === 'down' || direction === 'up') tearGrid = TEAR_DOWN;
    else if (direction === 'left') tearGrid = TEAR_LEFT;
    else tearGrid = null; // 'right'
    if (!tearGrid) {
      const leftTears = build(TEAR_LEFT, PALETTE_TEAR);
      return compose(bodyCanvas, flipH(leftTears));
    }
    return compose(bodyCanvas, build(tearGrid, PALETTE_TEAR));
  }
  return bodyCanvas;
}

export const HAMSTER_SIZE = 16;
