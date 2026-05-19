# Deployment

The game is a static site. It can be hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any web server that serves static files.

## Local Smoke Test

From the repository root:

```bash
python3 -m http.server 8010
```

Open:

```text
http://localhost:8010/index.html
```

Before publishing, check syntax:

```bash
node --check game.js
```

## GitHub Pages

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings -> Pages`.
4. Set source to `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/root`.
7. Save.
8. Open the generated Pages URL after deployment completes.

## Static Host Requirements

Required file types:

- `.html`
- `.css`
- `.js`
- `.png`

No special server routing is required.

## Cache Busting

The HTML currently references CSS and JS with a query version:

```html
styles.css?v=textures-v2
game.js?v=textures-v2
```

When making visible changes, update the query suffix to force browsers to load the latest files.

## Files That Must Be Published

```text
index.html
styles.css
game.js
vendor/three.min.js
assets/textures/v2/**
PRD.md
README.md
ASSET_CREDITS.md
LICENSE
docs/**
```

## Files That Should Not Be Published

```text
debug/
assets/source_textures/
assets/textures/*.png
```

The active game uses `assets/textures/v2`, so the previous direct `assets/textures/*.png` pack is intentionally excluded from the publication set.
