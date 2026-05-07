import { paint } from './paint.js';

// Small fireball — drawn 1x then scaled at render time. Two phase frames
// give it a flicker.
const FIREBALL_A = [
  '..yYy...',
  '.yYOYy..',
  'yYOOOYy.',
  'YOOOOOYy',
  '.YOOOOY.',
  '..yYOY..',
  '...yY...',
  '........',
];
const FIREBALL_B = [
  '...yY...',
  '..yYOYy.',
  '.yOOOOYy',
  'YOOOOOYy',
  'yYOOOOY.',
  '..YOYY..',
  '...yY...',
  '........',
];

const FIRE_PALETTE = {
  '.': null,
  'O': '#ff3010',
  'Y': '#ff9020',
  'y': '#ffd860',
};

export function fireballSprite(phase) {
  return paint(phase ? FIREBALL_B : FIREBALL_A, FIRE_PALETTE);
}

// Tear puddle on the ground — grows a bit as more drops collect.
export function puddleSprite(size) {
  const radius = Math.min(8, Math.max(2, size));
  const w = radius * 2 + 2;
  const h = radius + 2;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3a90d8';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, radius, radius / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ad0ff';
  ctx.beginPath();
  ctx.ellipse(w / 2 - 1, h / 2 - 1, Math.max(1, radius / 2), Math.max(1, radius / 4), 0, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

// Procedural "thought" sprite based on a parameter bag, e.g.
//  { shape: 'circle'|'square'|'triangle'|'star'|'blob',
//    color: '#aabbcc',
//    size: int 6..14, brightness: 0..1 }
export function thoughtSprite(props) {
  const size = props.size;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawShape(ctx, props);
  return canvas;
}

function drawShape(ctx, { shape, color, size }) {
  ctx.fillStyle = color;
  const c = size / 2;
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(c, c, c - 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(1, 1, size - 2, size - 2);
      break;
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(c, 1);
      ctx.lineTo(size - 1, size - 1);
      ctx.lineTo(1, size - 1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'star': {
      const spikes = 5;
      const inner = c * 0.45;
      const outer = c - 1;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / spikes;
        const x = c + Math.cos(a) * r;
        const y = c + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'blob': {
      // wobbly polygon
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2;
        const r = c - 1 - ((i * 1.7) % 2);
        const x = c + Math.cos(a) * r;
        const y = c + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

// Floor tile — a 16x16 grass/dirt patch tiled across the play area.
export function floorTile() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5b8a4f';
  ctx.fillRect(0, 0, 16, 16);
  // Speckle to keep tiling from looking flat.
  const speckles = [
    [2, 3, '#487a3c'], [11, 5, '#487a3c'], [7, 12, '#487a3c'],
    [13, 14, '#6ea162'], [4, 9, '#6ea162'], [9, 2, '#6ea162'],
    [15, 8, '#3e6c33'], [1, 13, '#3e6c33'],
  ];
  for (const [x, y, c] of speckles) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  }
  return canvas;
}

// Procedurally rendered flame burst around the angry tiger. Drawn at
// runtime each frame to give the fire a flickering animation. `t` is
// time in seconds.
export function drawFireRing(ctx, cx, cy, radius, t) {
  const flameCount = 14;
  for (let i = 0; i < flameCount; i++) {
    const baseAngle = (i / flameCount) * Math.PI * 2;
    const wobble = Math.sin(t * 8 + i * 1.7) * 0.15;
    const angle = baseAngle + wobble;
    const flicker = 1 + Math.sin(t * 12 + i) * 0.2;
    const r = radius * flicker;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    drawFlameBlob(ctx, x, y, 4 + (i % 3));
  }
}

function drawFlameBlob(ctx, x, y, size) {
  ctx.fillStyle = '#ff5020';
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffa030';
  ctx.beginPath();
  ctx.arc(x - 0.5, y - 0.5, size * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe070';
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}
