# Ghost Post

*Some things won't deliver themselves.*

A first-person delivery adventure through a haunted lantern district, playable in the browser and in VR on Meta Quest through WebXR. No install.

**Play:** https://minigurlyy.github.io/ghost-post/ (greybox build, desktop + Meta Quest)

**Status:** rebuild in progress. See [`docs/PLAN.md`](docs/PLAN.md).

## Run locally

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # game-rule tests
```

To try VR on a Quest during development, use the deployed link (WebXR needs HTTPS).

- `docs/PLAN.md`: vision, art direction, scene flow, milestones
- `src/`: the game (`core/` rules, `scenes/`, `input/`, `guide/`, `ui/`)
- `legacy/`: the original ChatGPT/Codex web and VR prototypes (reference)

Built by Srra Zahid with Three.js and WebXR.
