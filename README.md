# Hamster &amp; Tiger

A tiny top-down 2D game built with vanilla JavaScript and HTML5 Canvas.
A hamster and a tiger love each other and want to share thoughts. The
hamster fires thoughts at the tiger; some are good, some are bad, and
the mapping is randomized each time you start. The tiger gets upset
from misses and bad thoughts. Push him too far and he catches fire and
spews fireballs at random angles — run!

## Controls

- **Arrow keys / WASD** — move the hamster
- **Space** — shoot the front thought from the conveyor belt at the top
- **R** — restart (resets the good/bad mapping too)

## Running

It's a static page — just open `index.html` in a modern browser, or:

```
npm run serve   # python3 -m http.server 8000, then visit localhost:8000
```

## Tests

```
npm test
```

Pure-JS ECS core + system tests run with `node --test`. No build step.

## Architecture

A minimal Entity-Component-System lives in `src/ecs/`.
Components are plain JS objects in `src/components/`. Systems
in `src/systems/` consume components and step the world.
Pixel-art sprites are generated procedurally at boot in
`src/art/` so the repo stays self-contained.
