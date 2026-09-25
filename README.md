# Arelia Online

Arelia Online is a browser-based 2D top-down RPG/MMORPG foundation rebuilt from the old prototype. The repository is intentionally data-driven and modular so gameplay systems can be developed independently.

## Repository structure

- `client/` — browser game client
  - `index.html` — client entry page
  - `css/` — presentation styles
  - `js/` — game logic, systems, UI, rendering and networking
  - `assets/buildings/` — building, road, terrain and village art
  - `assets/environment/` — terrain/environment assets and encoded WebP data used by the current loader
  - `assets/player/` — current player sprite assets
- `data/` — JSON game data such as classes, skills, items, monsters, NPCs, quests and recipes
- `maps/` — world/map definitions and map references
- `server/` — Node.js WebSocket server foundation
- `.github/workflows/pages.yml` — GitHub Pages deployment
- `ARCHITECTURE.md` — system boundaries and data flow

The old monolithic `client/arelia-single.html` prototype is no longer part of the runtime; the active client is split into HTML, CSS and ES modules.

## Requirements

- Node.js 18+ recommended
- A modern browser with ES module and Canvas support
- npm for the multiplayer server

## Local development

### Run the browser client

The client uses `fetch()` to load JSON and assets, so serve the repository over HTTP instead of opening `client/index.html` directly with `file://`.

From the repository root:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/client/index.html
```

### Run the WebSocket server

```bash
cd server
npm install
npm start
```

The server listens on port `8080` by default and can be changed with the `PORT` environment variable.

## Testing

There is currently no dedicated automated test suite. Before pushing gameplay changes:

1. Start the static client server.
2. Open the browser console and confirm there are no module or asset-loading errors.
3. Test movement, collision, NPC interaction and the affected gameplay system.
4. If the server is involved, start `server/` and verify the WebSocket connection and message flow.
5. Run a JavaScript syntax check for server-side changes when appropriate:

```bash
node --check server/server.js
```

## GitHub Pages

GitHub Pages publishes only the runtime web files required by the browser client: the root entry page, `client/`, `data/`, and `maps/`. Server code and development documentation are kept out of the Pages artifact.

## Asset policy

Binary images and audio should be committed as binary files, never pasted into source files as raw binary text. Small base64-encoded WebP chunks currently used by `client/js/render/asset-loader.js` are a deliberate compatibility format and should not be confused with accidental binary dumps. Duplicate binary copies should be removed when an identical real asset already exists.

For future very large assets, Git LFS can be introduced deliberately rather than converting the existing repository blindly.

## Security

Do not commit API keys, database passwords, private keys, session tokens or other secrets. Local environment files are ignored by default. The current multiplayer server is a foundation and does not yet provide production authentication or authoritative anti-cheat protection.

## Development principle

Build the game system-by-system. Prefer small, testable modules and data-driven JSON contracts over returning to a monolithic HTML implementation.
