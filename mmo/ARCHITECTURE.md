# Arelia Online structure

The client is split into small ES modules so each game concern has one home.

- client/js/core: shared state and math helpers
- client/js/input: keyboard and control handling
- client/js/world: map loading, terrain, collisions, and decoration
- client/js/entities: players and mobs
- client/js/systems: movement and combat rules
- client/js/render: image loading and canvas rendering
- client/js/ui: HUD updates
- client/assets/environment: trees and rocks
- client/assets/buildings: houses and structures
- data: classes and quests
- maps: playable world data
- server: online server code

The public game URL remains the same: /mmorpg/.