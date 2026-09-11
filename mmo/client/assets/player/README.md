# Player Sprite Assets

## Warrior

The Warrior uses two separate transparent PNG sprite sheets:

- `warrior-walk.png` — 4 columns × 8 rows, 48×48 px per frame, 32 frames total.
- `warrior-attack.png` — 8 columns × 8 rows, 48×48 px per frame, 64 frames total.

Direction rows are ordered:

1. Down
2. Down-left
3. Left
4. Up-left
5. Up
6. Up-right
7. Right
8. Down-right

The renderer reads one 48×48 source frame at a time and displays it at 96×96 px.

Keep both files as real RGBA PNGs with transparent backgrounds. Do not rename them unless `js/render/asset-loader.js` is updated at the same time.
