import { createGame, startLoop } from './game.js';

const canvas = document.getElementById('game');
const world = createGame(canvas);
startLoop(world);

// Expose for ad-hoc poking from devtools.
globalThis.world = world;
