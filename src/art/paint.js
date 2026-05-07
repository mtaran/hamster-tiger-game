// Render a sprite from a character grid + palette into an offscreen
// canvas. Caller composes/scales these canvases at draw time.

export function paint(grid, palette) {
  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// Mirror an existing sprite canvas left-to-right (for facing flips).
export function flipH(srcCanvas) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(srcCanvas, 0, 0);
  return out;
}

// Stack/compose multiple sprite canvases of the same size on top of each other.
export function compose(...canvases) {
  const w = canvases[0].width;
  const h = canvases[0].height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  for (const c of canvases) ctx.drawImage(c, 0, 0);
  return out;
}
