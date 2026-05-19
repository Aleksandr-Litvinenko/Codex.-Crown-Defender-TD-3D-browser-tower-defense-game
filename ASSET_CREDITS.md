# Asset Credits

This project uses a runtime texture pack in `assets/textures/v2`. The pack is built from generated game-specific compositions and processed third-party CC0 texture sources.

## Runtime Texture Pack

Runtime assets included in the repository:

```text
assets/textures/v2/
```

These files are required by the game at runtime. They include grass, stone road, castle stone, rune, bark, leaves, rocks, hero equipment, monster, elemental effect, and contact sheet textures.

## Source Asset Providers

### Kenney

- Asset pack: Retro Textures Fantasy
- Creator: Kenney
- Website: https://www.kenney.nl
- License: Creative Commons Zero, CC0
- License URL: https://creativecommons.org/publicdomain/zero/1.0/

Kenney credit is appreciated by the creator but not required by the CC0 license.

### Poly Haven

- Website: https://polyhaven.com
- License: Creative Commons Zero, CC0
- License URL: https://creativecommons.org/publicdomain/zero/1.0/

Used as source material for natural and stone texture processing.

### ambientCG

- Website: https://ambientcg.com
- License: Creative Commons Zero, CC0
- License URL: https://creativecommons.org/publicdomain/zero/1.0/

Used as source material for paving stone texture processing.

## Library Credits

### Three.js

- Website: https://threejs.org
- License: MIT
- Bundled file: `vendor/three.min.js`

The bundled Three.js file includes its upstream license header.

## Repository Policy

The repository should include only runtime-ready texture assets required to play the game.

The following are intentionally excluded:

- downloaded source archives;
- extracted third-party source texture folders;
- local debug screenshots;
- temporary generated contact sheets outside the runtime texture pack.

If the texture pipeline is rebuilt later, document the pipeline and commit only the optimized runtime output unless raw sources are explicitly needed.
