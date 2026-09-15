# Crown Defender TD 3D

A static browser game: 3D action tower defense with a MOBA-style camera. You control a hero, hold the castle through 30 waves, pick upgrades on level-up, and unlock a cosmetic crown for winning.

There is no backend. Serve the files locally or publish them on GitHub Pages.

## Gameplay

There is one mode, `TD Defense`. The hero moves freely around a 3D arena under an isometric camera. Creeps come in waves through a magic portal on the right and walk toward the castle. Clear wave 30 to win; the run is lost when the castle's health reaches zero.

Enemies give experience, and stronger ones give more. Each level-up offers 3 random upgrades. A reroll button refreshes them and recharges every 3 waves. Winning unlocks a crown you can wear in later runs.

## Features

- 3D arena with grass, a blended stone road, trees, rocks, torches, and dynamic lights; a castle with towers, roofs, windows, and runes.
- Hero model with a walk animation and four weapon styles: sword and shield (melee), bow (ranged), staff (magic), and chains (medium range).
- Elemental abilities: meteor, fire, ice.
- Enemies: minion, runner, brute, shield, boss.
- Mobile HUD with a joystick and ability buttons, plus keyboard controls for laptops.
- `x2` game speed toggle.
- Two-player multiplayer MVP over a lightweight WebSocket relay.
- Progress saved in `localStorage`: best score, best wave, crown unlock and equip state, current run.

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

Saves use browser `localStorage`.

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

Many browsers can also open `index.html` as a file, but a local server is safer: browsers treat local assets differently.

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
├── COMPARISON.md              # same brief built by Claude Code — what differs
├── LICENSE                    # MIT license for project code
├── tools/
│   └── check-assets.mjs       # verifies every referenced texture exists
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

### Checking assets

The game loads 27 textures by name. A renamed or missing file does not throw:
Three.js quietly renders a black material, and the problem surfaces during play.
This check catches it first, and also reports files nothing references — worth
knowing when textures are 7.7 MB of an 8 MB repository.

```bash
node tools/check-assets.mjs
node tools/check-assets.mjs --strict   # unreferenced files also fail the run
```

No dependencies. Exit code `1` means something is missing.

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

The game deploys as static files; GitHub Pages is the simplest option.

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
