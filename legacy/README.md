# Legacy builds (reference only)

These are the ChatGPT/Codex prototypes from October 2026, archived as the starting point for the rebuild. They are not part of the new game's build.

- `web/`: web build 0.4.1 (multiplayer Node server, Three.js). Run it with `node server.mjs --open` (Node 20+). The webcam gesture models were removed to keep the repo small; gestures are postponed.
- `vr/`: the WebXR solo build, as published at ghostpost.alertslug32.chatgpt.site/vr (downloaded 2026-11-05). Serve the folder statically and open `vr.html`.

Port logic and ideas from here into `src/`; don't import from `legacy/` directly.
