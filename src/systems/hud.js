import * as C from '../components.js';
import { ANGER_MAX } from './tiger.js';
import { QUEUE_CAP, SLOT_X0, SLOT_DX, SLOT_Y } from './thoughts.js';

// Drawn last each frame, in raw screen pixels, on top of the world.
export function hudSystem(world) {
  const ctx = world.resources.ctx;
  const { viewW, scale } = world.resources;
  const screenW = world.resources.canvas.width;
  const screenH = world.resources.canvas.height;

  // Draw the conveyor belt and thoughts in logical (scaled) coords.
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Belt strip
  ctx.fillStyle = '#1c1428';
  ctx.fillRect(0, 0, viewW, 24);
  ctx.fillStyle = '#2c213e';
  ctx.fillRect(0, 22, viewW, 2);

  // Slot frames + thoughts
  const queue = world.resources.thoughtQueue;
  for (let i = 0; i < QUEUE_CAP; i++) {
    const x = SLOT_X0 + i * SLOT_DX;
    ctx.strokeStyle = i === 0 ? '#ffe070' : '#544770';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8, SLOT_Y - 8, 16, 16);
    if (queue[i]) {
      const s = queue[i].sprite;
      ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(SLOT_Y - s.height / 2));
    }
  }

  // "Next" hint above slot 0
  ctx.fillStyle = '#ffe070';
  ctx.font = '6px monospace';
  ctx.fillText('NEXT', SLOT_X0 - 19, SLOT_Y + 2);

  // Anger meter — bottom-right of the belt
  const meterX = viewW - 60, meterY = 4, meterW = 56, meterH = 6;
  ctx.fillStyle = '#000';
  ctx.fillRect(meterX, meterY, meterW, meterH);
  const tiger = world.queryFirst(C.TigerState);
  if (tiger) {
    const frac = Math.min(1, tiger.tigerState.anger / ANGER_MAX);
    const r = Math.floor(80 + frac * 175);
    const g = Math.floor(180 - frac * 160);
    const b = 30;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(meterX + 1, meterY + 1, Math.max(0, (meterW - 2) * frac), meterH - 2);
    ctx.strokeStyle = '#ffe070';
    ctx.strokeRect(meterX, meterY, meterW, meterH);
    ctx.fillStyle = '#ffe070';
    ctx.fillText('TIGER MOOD', meterX, meterY - 1);
  }

  // Controls hint at bottom edge.
  ctx.font = '6px monospace';
  ctx.fillStyle = '#ddc8a8';
  ctx.fillText('WASD/arrows: move    Space: share thought    R: restart', 4, world.resources.viewH - 3);

  // Render tears as little blue ovals (cheaper than per-tear sprite cache).
  for (const e of world.query(C.Tear, C.Position)) {
    ctx.fillStyle = '#7ad0ff';
    ctx.fillRect(Math.round(e.position.x), Math.round(e.position.y), 1, 2);
  }

  // Reset transform so the next frame starts clean.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
