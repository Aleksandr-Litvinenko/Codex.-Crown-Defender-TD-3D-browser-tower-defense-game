# Architecture

`Crown Defender TD 3D` is a static browser game implemented with HTML, CSS, JavaScript, and Three.js. There is no build step and no backend.

## Runtime Files

- `index.html`: canvas, HUD, touch controls, menus, result screens, and upgrade modal.
- `styles.css`: responsive HUD, controls, overlays, danger states, and mobile layout.
- `game.js`: game state, rendering, input, combat, waves, persistence, and animation.
- `vendor/three.min.js`: Three.js runtime.
- `assets/textures/v2`: active runtime texture pack.

## Main Systems

### Renderer

The renderer is a `THREE.WebGLRenderer` attached to `#gameCanvas`. It owns the main 3D draw loop and renders a perspective scene with shadowed lights, textured terrain, props, castle geometry, the hero, enemies, projectiles, and VFX.

### Camera

The camera uses a MOBA-like isometric angle. It follows the hero through a smoothed focus point instead of snapping every frame. This keeps movement readable while preserving a broad view of the lane and castle.

### World

The arena is built from Three.js primitives and textured materials:

- grass floor;
- blended stone road;
- castle with towers, roofs, windows, and runes;
- trees, stones, torches, and dynamic point lights.

Most geometry is intentionally procedural so the game can remain a small static project without a model-loading pipeline.

### Hero

The hero is assembled from mesh parts. The model supports:

- walking animation;
- attack timing animation;
- weapon visibility switching;
- crown visibility when unlocked and equipped.

Weapon style is determined by selected upgrades:

- sword and shield;
- bow;
- magic staff;
- chains.

### Enemies

Enemy types are defined in `enemyTypes` inside `game.js`. Each type has health, speed, damage, radius, score value, armor, and experience reward.

The current enemy model system uses procedural mesh construction with different silhouettes and textures per enemy family.

### Combat

The combat system supports:

- basic attack by active style;
- dash strike;
- elemental / area ability;
- guard ability;
- projectiles and impact VFX;
- status effects such as burn, freeze, and slow;
- vampirism and stat scaling from upgrades.

### Progression

Enemies grant experience on kill. When the hero reaches a new level, the game pauses into an upgrade choice modal. The player receives three random choices and can reroll when the reroll charge is available.

Upgrade categories:

- combat styles;
- elemental skills;
- raw stats;
- castle defense.

### Persistence

The game uses `localStorage` for MVP persistence. No data leaves the browser.

Persisted data:

- crown unlock state;
- crown equipped state;
- high score;
- best reached wave;
- current run snapshot.

## Design Constraints

- No backend dependency.
- No package manager dependency.
- No build step.
- Runtime assets must stay optimized enough for static hosting.
- UI must remain playable on touch screens and laptop keyboards.
- The project should avoid copying protected game assets, UI, characters, names, logos, or exact layouts from commercial MOBAs.

## Future Architecture Options

The next technical improvements should be considered only when needed:

- move game systems into modules;
- add GLTF model support for hero and monsters;
- add an asset manifest;
- add a small test harness for deterministic wave simulation;
- add an optional build step for texture compression and cache busting.
