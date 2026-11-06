# Ghost Post: notes for Claude

A first-person web + WebXR delivery adventure (Three.js). Read `docs/PLAN.md` before making changes. It holds the vision, scene flow, art direction and milestones.

## Non-negotiables
- **Quest 2 at 72 fps.** Budgets: ≤ 100 draw calls and ≤ 300k triangles in view, KTX2 textures ≤ 2048, baked lighting, no real-time shadows or post-processing in XR. Desktop may enable a "High" tier.
- **One game, two inputs.** Scenes and rules are shared; only `src/input/` and UI presentation differ between desktop and XR.
- **Never lost.** One objective at a time. The ember wisp guide plus amber lighting lead the player. Amber/warm is reserved for the next interactable or a safe zone. No floating paragraphs of instructions.
- **Rules are pure.** Game logic in `src/core/` has no Three.js or DOM imports and is covered by tests.

## Art direction
Grounded realism (PBR, realistic humans from Mixamo) with a warm/cool palette: amber = safe/interactable, teal mist = danger/spirit world. One focal point per view.

## Conventions
- Readable, formatted ES modules. No minified one-line files.
- Assets: glTF → `gltf-transform` (meshopt + KTX2) → `public/assets/`. Credit any CC-BY asset in `CREDITS.md`.
- `legacy/` is reference only: the ChatGPT/Codex web 0.4.1 and VR builds. Port ideas and logic from it; don't import from it.
- Every push to `main` deploys to GitHub Pages. Keep `main` playable.

## Commands (available once M0 is set up)
- `npm run dev`: local dev server
- `npm test`: logic tests
- `npm run build`: production build
