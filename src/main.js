// Entry point — wired up later as systems come online.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

ctx.fillStyle = '#2b1f3a';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#eee';
ctx.font = '12px monospace';
ctx.fillText('Loading…', 16, 24);
