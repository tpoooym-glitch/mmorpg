# Arelia Online architecture

## 1. Runtime overview

```text
Browser
  │
  ├── client/index.html
  │      ├── css/style.css
  │      └── js/main.js
  │             ├── world / terrain / collision
  │             ├── entities / mobs / NPCs
  │             ├── quest / inventory / crafting
  │             ├── combat / movement
  │             ├── rendering / UI
  │             └── multiplayer/network-client
  │
  └──────── WebSocket (optional multiplayer path) ────────┐
                                                          ▼
                                               Node.js server
                                                          │
                                  ┌────────────────────────┼────────────────────┐
                                  ▼                        ▼                    ▼
                              network/                 world/               combat/
                          message routing          world state          combat service
                                                          │
                                                          ▼
                                                   persistence/
                                               save-service (memory)
```

The repository contains both a playable browser-client foundation and a lightweight multiplayer server foundation. The architecture describes intended boundaries; it does not claim that every MMORPG feature is production-ready.

## 2. Client architecture

- `client/index.html` — document shell and UI containers.
- `client/css/` — visual presentation.
- `client/js/core/` — shared state/configuration.
- `client/js/input/` — keyboard/input handling.
- `client/js/world/` — map loading, terrain and collision.
- `client/js/entities/` — player, NPC and monster models/factories.
- `client/js/systems/` — movement and gameplay systems.
- `client/js/quest/` — quest lifecycle and progress.
- `client/js/inventory/` — inventory state.
- `client/js/equipment/` — equipment contracts.
- `client/js/npc/` — NPC interaction.
- `client/js/shop/` — shop contracts.
- `client/js/crafting/` — crafting logic and interaction.
- `client/js/multiplayer/` — WebSocket client and remote-player synchronization.
- `client/js/save/` — browser save contract.
- `client/js/render/` — Canvas rendering and asset loading.
- `client/js/ui/` — HUD, quest and crafting panels.

### Current client data flow

```text
main.js
  │
  ├── loadZone() ───────► maps/emerald-vales-v19.json
  ├── loadSkills() ─────► data/skills.json
  ├── loadQuests() ─────► data/quests.json
  ├── loadRecipes() ────► data/recipes.json
  ├── loadAssets() ─────► client/assets/
  └── game loop
        ├── movement
        ├── combat
        ├── interactions
        ├── camera
        └── render
```

## 3. Multiplayer / WebSocket model

The current server uses the `ws` package.

Connection lifecycle:

1. Browser opens a WebSocket connection.
2. Server assigns a generated connection/player ID.
3. Server sends a `welcome` message containing the current player snapshot.
4. Client can send `join`, `state` and `chat` messages.
5. Server broadcasts the current player snapshot to connected clients.
6. Disconnect removes the player from the in-memory registry.

Current message shapes are lightweight and intentionally incomplete. Movement/state messages are not yet protected by authentication or full server-side validation.

## 4. Server boundaries

- `server/server.js` — HTTP health response and WebSocket connection lifecycle.
- `server/network/message-router.js` — reusable message-handler routing contract.
- `server/network/player-registry.js` — in-memory connected-player registry.
- `server/world/world-state.js` — world-state container for zones, players, monsters and NPCs.
- `server/combat/combat-service.js` — server-side combat service contract.
- `server/persistence/save-service.js` — current in-memory save contract.

## 5. Persistence

There is **no external database yet**. `save-service.js` currently stores cloned player data in memory. A future database layer can replace this implementation without changing gameplay modules if the save contract remains stable.

Potential future layers:

```text
Gameplay state
     │
     ▼
Persistence service
     │
     ├── SQL database
     └── document/key-value store
```

The schema should be designed only when persistent multiplayer accounts are implemented; the current project does not pretend that a database already exists.

## 6. Authority and security direction

For multiplayer gameplay, the server should become authoritative over:

- player identity/session
- movement validation
- combat results
- HP/MP/EXP/Gold
- inventory mutations
- quest progress and rewards
- item ownership
- monster state and drops

The client should primarily send player intent and render server-confirmed state.

This is especially important for the planned combat and inventory architecture: damage and inventory changes should not be accepted solely because a browser client claims that they happened.

## 7. Data contracts

Static game definitions live under `data/`:

- classes
- skills
- items
- monsters
- NPCs
- quests
- recipes
- shops

Map definitions live under `maps/`.

The current design keeps definitions separate from runtime player state so content can be expanded without rewriting the core systems.

## 8. GitHub Pages deployment

GitHub Pages is a static-client deployment only. The workflow creates a temporary `_site/` artifact containing:

- root `index.html`
- `client/`
- `data/`
- `maps/`

The Node.js WebSocket server is not deployed by GitHub Pages.

## 9. Known incomplete areas

- production authentication/session management
- authoritative movement validation
- persistent database storage
- complete monster AI
- full inventory/equipment/shop gameplay
- production combat synchronization
- complete WebSocket client integration
- automated test suite
- final tilemap/tileset pipeline
- final asset organization and optimization
