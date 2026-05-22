# Crown Defender TD 3D

`Crown Defender TD 3D` is a static browser game: a 3D MOBA-inspired action tower defense where the player controls a hero, protects a castle, clears 30 waves, earns experience, chooses upgrades, and unlocks a cosmetic crown after victory.

The project is designed to run without a backend. Open it locally, serve it as static files, or publish it through GitHub Pages.


## Gameplay

- One mode: `TD Defense`.
- The hero moves freely on a 3D arena with an isometric MOBA-style camera.
- Creeps spawn in waves and move toward the castle.
- Creeps enter through a magic portal on the right side of the arena.
- The player wins after clearing wave 30.
- The player loses when the castle health reaches zero.
- Enemies grant experience. Stronger enemies grant more experience.
- Level-ups present 3 random upgrade choices.
- A reroll button refreshes upgrade choices and recharges every 3 waves.
- Victory unlocks a crown that can be equipped in future runs.

## Features

- 3D arena with grass, blended stone road, trees, rocks, torches, and dynamic lights.
- Castle with towers, roofs, windows, and rune details.
- Hero model with walking animation and weapon switching.
- Weapon styles:
  - sword and shield for melee;
  - bow for ranged attacks;
  - staff for magic;
  - chains for medium-range attacks.
- Elemental ability branch:
  - meteor;
  - fire;
  - ice.
- Enemy types:
  - minion;
  - runner;
  - brute;
  - shield;
  - boss.
- Mobile HUD with joystick and ability buttons.
- Toggleable `x2` game speed.
- Two-player multiplayer MVP through a lightweight WebSocket relay.
- Desktop controls for laptop play.
- Local browser save through `localStorage`.
- Best score, best wave, crown unlock, crown equipped state, and current run progress are persisted.

## Controls

### Desktop

| Action | Key |
| --- | --- |
| Move | `WASD` or arrow keys |
| Attack | `;` |
| Dash | `[` |
| Elemental / area skill | `]` |
| Guard | `'` |
| Toggle x2 speed | speed button or `X` |
| Pause | pause button in HUD |

### Mobile / Touch

| Action | Control |
| --- | --- |
| Move | left virtual joystick |
| Attack | large right attack button |
| Dash | right ability button |
| Elemental / area skill | right ability button |
| Guard | right ability button |

## Save System

The MVP save system uses browser `localStorage`.

Storage keys:

- `crownDefender.crownUnlocked`
- `crownDefender.crownEquipped`
- `crownDefender.highScore`
- `crownDefender.bestLevel`
- `crownDefender.run`

Saved progress includes the current wave, score, castle health, hero health, hero level, experience, selected upgrades, equipped crown state, and active combat style.

To reset progress, use the in-game reset button on the start screen.

## Running Locally

The game is static HTML/CSS/JavaScript. Use any simple local server.

```bash
python3 -m http.server 8010
```

For multiplayer testing, also run:

```bash
node server/multiplayer-server.mjs
```

Then open:

```text
http://localhost:8010/index.html
```

Open the game in two browser windows and click `Мультиплеер` in both. The first player waits; when the second player connects, a 5-second countdown starts and the two-player match begins.

The game can also be opened directly as a file in many browsers, but a local server is recommended because browser security rules around local assets vary.

## Project Structure

```text
.
├── index.html                 # DOM shell, HUD, overlays, controls
├── styles.css                 # responsive HUD and menu styling
├── game.js                    # Three.js game logic and rendering
├── server/
│   └── multiplayer-server.mjs # dependency-free WebSocket room server
├── PRD.md                     # product requirements document
├── ASSET_CREDITS.md           # third-party asset and library credits
├── LICENSE                    # MIT license for project code
├── docs/
│   ├── ARCHITECTURE.md        # implementation overview
│   ├── DEPLOYMENT.md          # static hosting and GitHub Pages notes
│   └── QA_CHECKLIST.md        # manual QA checklist
├── vendor/
│   └── three.min.js           # bundled Three.js runtime
└── assets/
    └── textures/
        └── v2/                # runtime texture pack used by the game
```

The repository intentionally excludes source texture archives, extracted raw sources, and debug screenshots. Runtime-ready assets are stored in `assets/textures/v2`.

## Technical Overview

- Rendering: Three.js WebGL renderer.
- Game loop: requestAnimationFrame-driven update/render cycle.
- Camera: smoothed isometric follow camera.
- World: procedural Three.js meshes with texture maps from `assets/textures/v2`.
- UI: HTML/CSS HUD layered over the WebGL canvas.
- Input: pointer/touch joystick, mobile buttons, and keyboard controls.
- Multiplayer: first player hosts simulation, second player sends input through WebSocket, host relays state snapshots.
- Persistence: `localStorage`.
- Build step: none.
- Performance budget: capped render pixel ratio, reduced shadow cost, throttled HUD updates, and runtime-only asset pack.

More detail is available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deployment

This project can be deployed as static files. GitHub Pages is the simplest target.

1. Push the repository to GitHub.
2. Open repository settings.
3. Enable Pages from the `main` branch root.
4. Open the generated GitHub Pages URL.

Detailed deployment notes are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## QA

Before publishing changes, run:

```bash
node --check game.js
python3 -m http.server 8010
```

Then verify the game in a browser:

- the scene renders;
- the hero moves with keyboard and joystick;
- attacks and abilities trigger;
- x2 speed button toggles the match speed;
- multiplayer pairs two clients, starts after a 5-second countdown, and enters the match;
- enemies spawn from the right portal;
- waves spawn and progress;
- upgrade choices appear after level-up;
- save/continue works after refresh;
- victory unlocks the crown;
- HUD remains readable on desktop and mobile sizes.

Full checklist: [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md).

## Asset Credits

The runtime texture pack contains derived or processed assets from CC0 sources and generated game-specific texture compositions.

Primary credits:

- Kenney Retro Textures Fantasy, CC0.
- Poly Haven textures, CC0.
- ambientCG textures, CC0.
- Three.js, MIT license.

See [ASSET_CREDITS.md](ASSET_CREDITS.md) for full attribution and license notes.

## License

Project code is licensed under MIT. See [LICENSE](LICENSE).

Third-party assets and libraries retain their own licenses. See [ASSET_CREDITS.md](ASSET_CREDITS.md).
