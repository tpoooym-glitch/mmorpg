# Arelia Online architecture

The client is split into small ES modules so each game concern has one home. This pass defines interfaces and data contracts; it does not claim the MMORPG is finished.

## Client
- `js/core/` shared state, configuration, entities and events
- `js/input/` keyboard and controls
- `js/world/` map loading, zones, terrain and collision contracts
- `js/entities/` player, NPC and monster models
- `js/systems/` movement and existing gameplay systems
- `js/combat/` damage and skill contracts
- `js/quest/` quest lifecycle
- `js/inventory/` item storage
- `js/equipment/` equipment slots
- `js/npc/` NPC interaction
- `js/shop/` shop transactions
- `js/multiplayer/` WebSocket client and remote-player synchronization
- `js/save/` browser save contract
- `js/render/` replaceable sprites and animation
- `js/data/` JSON loading
- `js/ui/` UI panel state and existing HUD

## Server
- `network/` messages and connected-player registry
- `world/` authoritative world state
- `combat/` server-side combat authority
- `persistence/` server persistence contract

## Data
JSON files define classes, skills, items, monsters, NPCs, quests and shops. Graphics remain replaceable and are intentionally not required by these contracts.

## Still to implement later
Authoritative multiplayer simulation, real database persistence, complete UI wiring, complete monster AI, complete quest/inventory/equipment/shop gameplay, production combat, full Tilemap+Tileset rendering, and final asset integration.
