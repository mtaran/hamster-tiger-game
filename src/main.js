import { createGame, startLoop } from './game.js';
import { setupTouchControls } from './touch.js';

const canvas = document.getElementById('game');
const world = createGame(canvas);
startLoop(world);
setupTouchControls();

// Expose for ad-hoc poking from devtools.
globalThis.world = world;
