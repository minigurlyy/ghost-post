# Ghost Post: Build Plan v1

*November 2026 · Draft for review*

## 1. What we're making

Ghost Post is a first-person delivery adventure set in a haunted lantern district. You play a night-shift courier carrying a parcel that holds a living light across a city full of restless spirits. It runs in the browser on desktop and on Meta Quest 2 through WebXR, from one link, with nothing to install.

**Goal:** a polished, publicly playable episode of about 10–12 minutes, built to portfolio quality, with a case study and trailer for LinkedIn.

### Pillars
1. **Never lost.** The world shows you where to go. A new player reaches their first interaction in under 20 seconds without reading anything.
2. **Warm vs. haunted.** Realistic materials with a warm/cool hybrid palette. Amber means safe, inhabited and "go here". Teal mist means danger and the spirit world. Colour is how the game communicates.
3. **One game, two ways to play.** Web and VR share the same scenes, rules and story. Only input and UI presentation differ.
4. **Runs on a Quest 2.** Every visual decision has to hold 72 fps on Quest 2 hardware.

## 2. Where we're starting from

There are two separate codebases. ChatGPT/Codex built them in October 2026.

| | Web 0.4.1 (`legacy/web`) | VR (`legacy/vr`) |
|---|---|---|
| Scope | Full route, 1–8 players, server-authoritative | Full solo route, all four scenes |
| Art | Procedural boxes, rounded blocks | Procedural, plus one realistic GLB (dispatch officer) |
| Story | Recipient "Master Ashen", Room 808, floor 8 | Recipient "Major Ash", Room 07, floor 7 |
| Keep | Rules, seal and circuit puzzles, tests, map | Rules, voice clips, dialogue, procedural audio, lift and rooftop logic, officer model |
| Replace | One-line minified code, DOM puzzles, HUD overload | 53 KB monolithic `vr.js`, sign clutter, proximity-gated pointers |

### Playtest problems to solve
- Four gates (title → lobby → countdown → click overlay) before the player can move.
- Step 2 (parcel sorter) is behind the spawn point. The only wayfinding is a small "← Left · 12 m" text line.
- No "you're close" feedback. The prompt appears only inside a 4.5 m radius, and the counter blocks the approach.
- In VR, 5–7 identical teal signs are visible at once, paragraph text is unreadable at distance, and pointing at something you're too far from gives a "move closer" error.
- Three competing art styles: painterly title, gritty key art, flat in-game.

## 3. Story canon (decided)

- **Recipient:** Major Ash.
- **Address:** Room 07, seventh floor, the Old Foundry. This matches the existing VR dialogue and voice clips.
- **The parcel:** "the last ember", a light Major Ash thought was lost (from the VR dialogue).
- **The guide:** the ember itself. Once the seal opens, a small warm wisp leaves the parcel and leads you. This replaces arrows and most signage.

## 4. Art direction

**Look:** grounded realism (PBR materials, believable scale, realistic humans) under a stylised warm/cool lighting palette, like a moody cinematic still. References: the title key art (blue mist, orange lanterns, wet stone) plus the warmth of the title-screen painting.

| Zone | Palette | Light |
|---|---|---|
| Post office (safe) | Amber, brass, worn timber, green enamel | Warm baked interior light, lantern pools |
| Lantern Street (danger) | Teal-blue mist, wet stone, amber windows | Moonlit, cool fog; lanterns are the only warm light |
| Storm rooftops | Desaturated slate, cyan lightning | Lightning flashes reveal the path |
| Foundry (safe again) | Copper, ember orange, soot | Forge glow from below |

**Rules**
- **Warm = interactable or safe.** Anything the player should touch next glows amber, and nothing else does.
- **One focal point per view.** Everything else is darker, cooler or lower contrast.
- **Characters:** realistic, rigged humans (Mixamo). Spirits are translucent and emissive, never solid toys.

**Asset sources:** Blender for hero props (counter, parcel, stamp, lift, sorter); Mixamo for characters and animation; Poly Haven and ambientCG for CC0 textures and skies; Sketchfab CC-BY only with a credits page.

## 5. Quest 2 performance budget

| Item | Budget |
|---|---|
| Frame rate | 72 fps, never below |
| Draw calls in view | ≤ 100 (merge static geometry, use instancing) |
| Triangles in view | ≤ 300k |
| Textures | KTX2/Basis compressed, ≤ 2048 px, shared atlases |
| Lighting | Baked lightmaps in Blender; 0 real-time shadows in VR |
| Glow | Emissive materials + sprite halos; no post-processing bloom in VR |
| Fog | Yes (cheap, and it sells the mood) |
| Scene memory | One scene loaded at a time |

The desktop web build can turn on a "High" tier (bloom, real-time shadows, higher resolution) on capable machines.

**Scene streaming trick:** the transitions double as loading screens. The post-office doors, the storm portal and the elevator ride each hide the load of the next scene.

## 6. The episode, scene by scene

### Scene 1: Dispatch (about 2–3 min)
1. **Spawn** 3 m from the dispatch counter, facing the officer. Nothing else is lit.
2. **The officer speaks** (voice clip). The courier pass on the counter glows amber.
3. **Stamp your pass.** The first action is physical: grab the stamp and press it in VR, or click it on web. It teaches "amber = touch this".
4. **The parcel wakes.** The sorter behind the counter lights up and the camera framing points at it. Match the three-symbol seal by pressing three physical stamps.
5. **The ember wisp emerges** and becomes your guide. The front doors swing open and you see the street vista. This is the hero shot for the portfolio.
6. **Choose your tool, learn it in context:** pick the pistol or the lantern at the counter. Two paper spirits then drift through the doorway, with a single contextual hint.

### Scene 2: Lantern Street, reworked as a chase (about 3–4 min)
- A tighter, curving street, not a 300 m straight.
- **Hook:** behind you, the lanterns start going out one by one. Darkness is following you. Light pools are checkpoints.
- 2–3 authored ambush moments, with spirits from rooftops and alleys. No constant spawning.
- The wisp waits at turns. If you stall, it circles back.
- Ends at the canal and the storm portal.

**Weapons (player's choice at dispatch):** a realistic spirit pistol (PBR, physical reload) or a warding lantern that annihilates spirits in a short cone. Both share the same damage rules in `src/core/`. The lantern suits players who'd rather not hold a gun.

### Scene 3: Thunder Rooftops (about 2–3 min)
- 5–7 jumps with clear amber landing markers. Lightning flashes briefly light the next roof.
- Falls respawn you on the last roof, not the start of the scene.
- VR comfort: a normal jump plus an optional "assisted leap" (aim, see the arc, commit).

### Scene 4: Foundry and elevator (about 2 min)
- Restore power by turning three physical valves. This reuses the VR dial logic and replaces the 2D pipe grid.
- **Elevator ride:** about 10 quiet seconds. The city is visible through the grille, the ember hums and the music drops. This is the emotional beat before the handoff.
- **Room 07:** deliver to Major Ash, then the ember-release moment, end card, and time and spirits cleared.

## 7. Guidance system (applies everywhere)
- **One objective at a time.** Hidden until relevant, gone once done.
- **The wisp guide** leads and waits, and nudges you if you're idle for 8 s.
- **Lighting leads:** the next target is the brightest warm thing in view.
- **Diegetic prompts:** a small hand/button glyph on the object itself, not floating panels.
- **Controller hints in VR:** the relevant button lights up on the controller model only when it's needed.
- **No "move closer" failures.** Pointer interactions work at range, or the wisp pulls you in.
- **Text:** at most one short line at a time. In VR it's body-locked at a readable 1.5 m with a large font.
- **HUD (web):** an objective chip and parcel status. Health and ammo appear only outside safe zones. The control list lives in the pause menu.

## 8. Controls

| Action | Desktop | Quest 2 |
|---|---|---|
| Move | WASD | Left stick (smooth) |
| Run | Shift (hold) | Left-stick click (toggle) |
| Turn | Mouse | Right stick snap turn (default; smooth optional) |
| Teleport (comfort) | n/a | Right stick forward → arc |
| Interact / grab | E or click | Grip to grab, trigger to use |
| Jump | Space | A |
| Fire / use weapon | Click | Right trigger |
| Menu | Esc | Menu button |

**Comfort settings:** vignette while moving, snap/smooth turn, seated mode, teleport-only.

## 9. Technical architecture

- **Stack:** Three.js (current release) + WebXR; Vite for dev and build; plain JavaScript ES modules; Vitest for logic tests.
- **Structure:**
  - `src/core/`: game state machine and rules. Pure code with no rendering, fully tested; ported from both legacy builds.
  - `src/scenes/`: one module per scene. Each loads its GLB, sets up triggers and owns its beats.
  - `src/input/`: `DesktopInput` and `XRInput`, both producing the same action events.
  - `src/ui/`: DOM HUD for web, in-world panels for XR, sharing the same content.
  - `src/guide/`: the wisp, target highlighting and hints.
  - `src/audio/`: voice, music, foley.
  - `src/net/`: multiplayer, later.
- **Assets:** Blender → glTF → `gltf-transform` (meshopt + KTX2) → `public/assets/`.
- **Hosting:** GitHub Pages via GitHub Actions, at `minigurlyy.github.io/ghost-post`. Free, always on, HTTPS for WebXR. Every push to `main` deploys.
- **Multiplayer (later):** a small Node WebSocket server on Render; solo never depends on it.

## 10. Milestones

| # | Milestone | Outcome |
|---|---|---|
| M0 | Foundation | Repo, Vite, auto-deploy, legacy code archived, rules ported with tests |
| M1 | **Greybox episode** | All four scenes as simple blocks with the full flow, guidance system and both input modes. **Playtest with 3–5 people.** Fixing confusion is cheapest here. |
| M2 | Dispatch art pass | Scene 1 at final quality, verified at 72 fps on Quest 2. This becomes the visual benchmark. |
| M3 | Art pass, scenes 2–4 | Street, rooftops, foundry, elevator |
| M4 | Feel and polish | Combat tuning, audio and voice, title screen, settings, credits |
| M5 | Launch | Trailer capture, portfolio case study, LinkedIn post |
| Later | Extras | Multiplayer, webcam gestures |

## 11. How we'll know it works
- Time from Play to first interaction: **< 20 s**
- Testers who finish Scene 1 without asking for help: **≥ 4 of 5**
- "Where do I go?" moments per playthrough: **≤ 1**
- Frame rate on Quest 2: **72 fps sustained**
- Full episode completion: **≥ 80%** of testers

## 12. Decisions log
- **Recipient:** Major Ash, Room 07 (2026-11-05)
- **VR locomotion:** smooth movement + snap turn, run on a button press (2026-11-05)
- **Weapons:** player chooses a realistic pistol or an annihilating lantern (2026-11-05)

## 13. Open decisions
1. Is the trailer and portfolio case study part of M5 (Claude helps capture footage, script the trailer, write the case study), or will you produce it separately?
