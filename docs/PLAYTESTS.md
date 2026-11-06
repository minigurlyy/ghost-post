# Playtest log

## Baseline: legacy VR build (October 2026)

**Build:** ChatGPT/Codex VR prototype (`legacy/vr`), Quest 2. The web build (`legacy/web`) had two earlier tests that weren't recorded.
**Testers:** 2 recorded sessions (gameplay capture only, no face cam), plus earlier informal tests.
**Footage:** `ghostpostvr_sc1.mp4`, `ghostpostvr_sc2.mov`, `ghostpostvr_sc3.MP4` (kept outside the repo).

### What testers said, and what we change

| # | Tester quote | Problem | Response in the rebuild |
|---|---|---|---|
| 1 | "Oh the controllers are odd. Have you never played a game before? They're a little different." | Controller mapping feels non-standard, even after a pass toward industry conventions | Follow Meta Quest conventions exactly (PLAN §8). Light up the relevant button on the controller model only when needed. Add a controls QA checklist and test with one experienced VR gamer and one first-timer. |
| 2 | "Oh I'm supposed to shoot the ghosts?? I couldn't tell, I was just running past. Why aren't they shooting back??" | Enemies don't read as hostile; no threat, no feedback | Spirits telegraph, then attack (wind-up glow → projectile or lunge). First encounter is a scripted teaching beat at the post-office door. Hits get clear feedback: haptics, a screen-edge pulse and a sound. |
| 3 | "Wait, where am I going? I don't see this Major Ash they're talking about." *(said in dispatch)* | Dialogue names a far-away goal while the player needs the next step; they searched the room for Major Ash | Dialogue frames Major Ash as *across the district*. The open doors reveal the foundry silhouette on the skyline. The objective only ever shows the immediate step; the wisp handles direction. |
| 4 | "Oh I keep falling on the rooftop." | Jumps too hard in VR; falls are punishing | Amber landing markers, a generous jump buffer and edge grace period, optional assisted leap (aim → arc → commit), respawn on the last roof. Tune gap distances separately for VR. |
| 5 | "Woah, the elevator is super cool." | ✅ Works | Keep it and make it the emotional beat: a quiet ride with the city view and the music drop (PLAN §6, Scene 4). |
| 6 | "Omg you built all this from scratch?? Using AI?? So cool, I didn't know you could do this!" | ✅ Strong reaction to the story behind it | A case-study angle: designer-led, AI-assisted game development. |

### Metrics to capture in the next round (M1 greybox)
- Time from Play to first interaction
- Number of "where do I go?" moments
- Number of falls per rooftop attempt
- Whether the player engaged the first spirit without being told
- Moments where the player asked about controls
