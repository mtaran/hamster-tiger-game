# Hamster &amp; Tiger

A tiny top-down 2D game built with vanilla JavaScript and HTML5
Canvas. A hamster and a tiger love each other and want to share
thoughts. The hamster fires thoughts at the tiger; some are good,
some are bad, **and the rule for which is which is randomized
every restart**. The tiger gets upset from misses and bad thoughts.
Push him too far and he catches fire and spews fireballs at random
angles — run!

## Running

It's a static page — just open `index.html` in any modern browser:

```
open index.html
# or, if your browser blocks ES modules from file://
npm run serve     # python3 -m http.server 8000
# then visit http://localhost:8000
```

No build step, no install.

## Deploying to GitHub Pages

Because this is plain static files, GitHub Pages works with no config.
With the [`gh` CLI](https://cli.github.com/) authenticated, from the
repo root:

```sh
# 1. Create the repo and push current branch.
gh repo create mtaran/hamster-tiger-game --public --source=. --remote=origin --description "A tiny top-down 2D game where a hamster shares thoughts with a tiger." --push

# 2. Enable Pages, serving from main branch root.
gh api -X POST repos/mtaran/hamster-tiger-game/pages -f 'source[branch]=main' -f 'source[path]=/'
```

After ~30–60s, the game is live at:

    https://mtaran.github.io/hamster-tiger-game/

To redeploy, just push to `main`. To turn Pages off:
`gh api -X DELETE repos/mtaran/hamster-tiger-game/pages`.

## Controls

| Key                | Action                              |
|--------------------|-------------------------------------|
| Arrow keys / WASD  | Move the hamster                    |
| Space              | Share the front thought (it flies in the direction the hamster is facing) |
| R                  | Restart — re-rolls the good/bad rule |

## How it plays

- A conveyor belt of thoughts runs across the top of the screen.
  Each thought is a little procedural shape with random color, size,
  texture, etc.
- One hidden rule decides whether a given thought is "good" or "bad"
  for the tiger — e.g. *good iff its hue is reddish*, or *good iff
  its shape is a star or a circle*. You can't see the rule; you have
  to learn it from the tiger's reactions.
- A good thought hitting the tiger calms him.
- A bad thought hitting the tiger upsets him a lot.
- A thought that misses (flies past or expires) upsets him a little.
- The tiger's mood meter is in the top right. When it fills, the tiger
  catches fire and starts spewing fireballs in random directions for
  a few seconds.
- Fireballs hurt — the hamster catches fire briefly, turns to ash,
  then sits there crying. Tears fall and pool into puddles. The
  tiger calms down faster when this happens (he feels bad), and
  finishes his angry phase early in a sad mood.
- When the hamster recovers, you can keep playing. Constants are
  tuned so even a perfect player will eventually have to dodge fire.

## Tests

```
npm test
```

Runs the full test suite with `node --test` (no install needed):

- `world.test.js` — ECS core: entity lifecycle, component queries,
  deferred destruction, system ordering, mid-iteration mutation.
- `valence.test.js` — random-rule generation and evaluation across
  all rule kinds (shape, size, hue, brightness, texture).
- `movement.test.js` — velocity application, play-area clamping.
- `tiger.test.js` — anger meter, state transitions
  (neutral ⇄ angry ⇄ sad), fireball spawn cadence, look tracking.
- `projectiles.test.js` — collision detection, thought hit/miss
  bookkeeping, fireball-vs-hamster, anger clamping under
  rapid-fire misses.
- `smoke.test.js` — wires the entire game with a Canvas mock and
  steps through several seconds; catches any module-load or runtime
  errors that don't show up in unit tests.

## Architecture

A minimal Entity-Component-System lives in `src/ecs/world.js`:

- **Entities** are integer IDs.
- **Components** are plain JS objects stored in
  `Map<componentName, Map<entityId, data>>`.
- **Systems** are functions called each tick with
  `(world, dt, ctx)`. Queries iterate the smallest matching
  component map.
- Component names are constants in `src/components.js`.

```
src/
  ecs/world.js              # ~110 lines, fully tested
  components.js             # name constants
  valence.js                # random good/bad rule + thought generator
  art/
    paint.js                # bitmap-from-character-grid helper
    hamster.js              # 16x16 sprites, 4 facings × 4 states
    tiger.js                # 32x32 sprites, 4 facings × 3 states
    effects.js              # fireballs, thoughts, puddle, floor, fire ring
  systems/
    input.js                # keyboard input + per-frame "just-pressed"
    movement.js             # velocity → position, player clamping
    tiger.js                # anger AI, fireball spawning, state changes
    thoughts.js             # conveyor belt + space-to-shoot
    projectiles.js          # collisions
    hamster.js              # damage state machine, tears → puddles
    lifetime.js             # time-based + offscreen cleanup, miss tagging
    render.js               # z-sorted sprite renderer with cache
    hud.js                  # anger meter, thought belt, controls hint
  game.js                   # wires the world, defines system order
  main.js                   # boot
tests/                       # node --test
index.html                   # the entire UI
```

All sprites are generated procedurally at boot, so the repo has no
binary asset files.

## Iterating

The ECS makes it easy to add new behaviour without touching
unrelated systems:

- Want a second NPC? Give it `Position` + `Sprite` and any custom
  components; reuse `movementSystem`.
- Want a new tiger reaction (e.g. a "delighted" mode)? Add a
  branch in `tigerSystem` and a palette in `art/tiger.js`.
- Want different thought distributions? Edit
  `makeThoughtProps` in `valence.js`.
- The tuning constants for anger gain/loss, durations, speeds, etc.
  are exported from each system module so they can be re-tuned in
  one place.
