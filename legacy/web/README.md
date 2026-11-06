# Clear departure countdown 0.4.1

The countdown now takes over the lobby card: “Your delivery starts in…” with a large number, an explanation of the first destination, and the next-step mouse/keyboard instructions. The Ready button, crew list and room details are hidden during countdown. Multiplayer waiting/ready states keep their own clear wording. Gameplay and the three-second countdown duration are unchanged.

Stop the old server with Control+C, extract into a fresh folder, open Terminal in its ghost-post folder, and run `node server.mjs --open`. Refresh http://localhost:3002. Look for NIGHTFALL UPDATE 0.4.1.

# Nightfall update 0.4.0

- Enemies now stop farther away: hounds approach to about 3 metres, with a 2.8-metre separation radius; flying spirits use 3.4 metres. If you back into an enemy, it seeks a nearby clear position outside your radius. Separation respects walls and nearby couriers; attacks remain active. This is personal space, not an invulnerability shield.
- Replaces the closed elevator box with an open, recessed cabin: rounded enamel side walls, retracted doors, copper jambs and rails, ceiling light, call panel, floor indicator and dark interior. E still takes you to floor 8.
- The courier pass shows an illustrated human face with eyes, nose, mouth, hair and shaded clothing. Skin, jacket and cap controls update the portrait. Name starts empty with the grey placeholder “Type in your name”; leaving it blank uses Courier.
- New bundled title-screen artwork: lantern-lit postal street at blue hour, peach clouds and mist. This illustration is the home-screen background; it is not a replacement for the playable 3D world. The home screen no longer continually renders the hidden 3D scene.

20 automated checks pass, including enemy separation, combat, wall avoidance, rooftop spacing, an open elevator sightline, image serving, full delivery and ground overlaps. Actual Safari appearance, performance and physical webcam tracking still need your playtest.

Stop the old server with Control+C, extract into a fresh folder, open Terminal in its ghost-post folder, then run `node server.mjs --open`. Refresh http://localhost:3002 and look for NIGHTFALL UPDATE 0.4.0.

## Title artwork

Created with the built-in image-generation tool, using the supplied Ghost Post concept as a style reference. Bundled asset: `public/assets/title-dusk.png`. The human portrait is original inline SVG so customization remains editable.

Artwork prompt: Create a new wide 16:9 title-screen background for Ghost Post in polished painterly 3D, using the reference for materials, warmth, architecture, lush planting and peach-teal palette. A magical postal city at blue-hour dusk after rain: glowing amber lanterns, luminous peach clouds, turquoise mist, winding cobbles, weathered cream plaster, curved tiled eaves, flowers and a distant foundry. Warm open post office at centre-left; a few tiny gentle spirits. Keep the left relatively dark for ivory headline copy, main scenery in the middle and right subdued for the courier card. Rounded natural forms and tactile textures. No text, lettering, logos, interface, borders or watermark.

# Storm & foundry scenery 0.3.2

- Replaces the oversized, clipped portal instruction banner with two compact placards beside the landing: SPACE · JUMP and SHIFT · RUN. All signs now measure and shrink their text, with an explicit maximum drawing width.
- Canal approach: hanging lights, bowed copper pipes and neighborhood signs. Portal: stone feet and copper arch details.
- Storm route: edge-mounted vents and downspouts, small side railings, arched industrial windows, curved distant roofs, tanks, rotating fans and rising steam. No new roof-top floor overlays or changes to jump gaps.
- Foundry: large entry arch, copper columns and pipework, glowing windows, curved entrance canopy, and an eighth-floor delivery salon with display cabinets, ceramic vessels, arches and a circular ornament behind Master Ashen.
- Static scenery is merged by material to reduce draw calls. Reduced-motion setting stops the new fans, steam and hanging-light animation.

Gameplay, camera recognition and server files are unchanged. Automated delivery, scene geometry and floor-overlap checks pass. Actual Safari graphics and frame rate still need playtesting.

Stop the old server with Control+C, unzip into a fresh folder, open Terminal in its ghost-post folder, then run `node server.mjs --open`. Refresh http://localhost:3002 and look for STORM & FOUNDRY UPDATE 0.3.2.

# Curved architecture + stable ground 0.3.1

- Replaces rectangular house shells with rounded-corner meshes; adds arched shop windows, projecting bays, curved shop canopies, balcony railings and pitched, swept roofs on outer buildings. The inner rooftop course retains its existing landing heights. Shop names and wall colors vary.
- Replaces the oversized box pistol and sleeve with a compact rounded model, metal barrel, brass rings and curved grip. Shooting behavior is unchanged.
- Removes overlapping base/road/cross-street slabs and pavement overlays. The new street ground is one non-overlapping partition. Removes duplicate storm roof tops, including coincident building and slab faces. Camera depth precision is improved and shadow position quantized to reduce shimmer.
- Regression checks raycast the actual scene at nine road locations and all seven storm landing pads: each has one visible top surface. Curved geometry and merged mesh attributes are checked for finite values. Full delivery, controls, gestures and jump checks remain passing.

This is locally authored procedural 3D, not an imported commercial environment asset pack or a match for the concept render yet. Plugin discovery did not surface a dedicated 3D authoring connector. Static architectural meshes are merged by material to reduce draw calls. Actual Safari GPU appearance, flicker resolution and frame rate still require testing on your Mac.

Stop the old server with Control+C, unzip into a fresh folder, open Terminal in its ghost-post folder, and run `node server.mjs --open`. Refresh http://localhost:3002. The title should read CURVED ARCHITECTURE UPDATE 0.3.1.

# Lantern Street visual update 0.3.0

The post office and opening street have a new procedural art pass: warm plaster and timber framing, grain-textured floors, coffered ceiling, parcel cabinets, brass details, red pillar box, curved tiled eaves, stone paving, lattice windows, climbing plants and potted flowers. A moving cloud sky uses peach and teal tones; nearby trees sway. Warm interior lights and local sun shadows add depth.

This is an incremental playable art update, not a reproduction of the concept image or a finished asset-production pass. The rest of the district retains its earlier art. New repetitive details use instancing to reduce draw calls. All artwork is generated locally by the game; no asset downloads or additional installations are needed.

Controls, collision, jumps, camera tracking, checkpoints, puzzles, combat and multiplayer are unchanged from 0.2.2. Automated gameplay and scene checks pass; Safari GPU appearance and frame rate need a playtest on your Mac. If performance is lower, please report where it happens (inside post office or outside).

To install: stop your old server with Control+C, unzip this version into a fresh folder, open Terminal in its ghost-post folder, and run `node server.mjs --open`. Open http://localhost:3002 and reload. The title screen should say LANTERN STREET ART UPDATE 0.3.0.

# Jump + pinch update 0.2.2

- Roof gaps are now 2.5 metres (previously 4), with wider landing surfaces and a higher/longer jump. Normal walking jumps can clear the route; Shift provides extra distance.
- Space sends a separate jump command so a quick tap cannot disappear between movement updates. A 250 ms jump buffer and 200 ms edge grace period make timing less strict. Camera crouching does not slow horizontal travel while airborne.
- Nodding has been removed. The “clock it” action uses thumb/index pinch detection from a locally bundled hand landmark model. Show one hand, separate the thumb and index finger, then touch their tips for about 0.2 seconds. Separate them again before repeating. A pinch only confirms at dispatch/delivery prompts; E remains available.
- Hand tracking and face tracking are independent: looking down can still duck, but never confirms an interaction. Settings display feedback for both face and hand tracking. Use the pinned webcam preview to check that your whole hand is visible.
- Tests verify pinch/release behavior and missed hand tracking, a quick Space tap, queued jump input, and a complete rooftop crossing at walking speed. Physical webcam gesture recognition and visual jump feel still require player testing.

# Camera fix 0.2.1

The camera now actually references `/vendor/vision/face_landmarker.task`. The previous 0.2 ZIP mistakenly retained the broken external URL despite including the model file. The regression check now reads the configured model path from the served camera code and requests that exact asset.

# Ghost Post 0.2 — Camera repair, shared district, and storm route

This replaces the previous alpha. Stop the old server, unzip this version into a fresh folder, start it, and refresh Safari. Use the same http://localhost:3002 address.

## What changed

- Face tracking is now bundled locally: JavaScript, both WebAssembly variants, and the face landmark model. The Enable camera button no longer fetches a model from an external website. Camera permission is still required.
- Click to begin delivery explicitly captures the mouse before movement starts. If capture is unavailable, the prompt provides right-drag/arrow-key controls. Fullscreen and pointer capture remain subject to browser permissions.
- Join shared multiplayer connects everyone on this server to one shared district, with an eight-player capacity. No room code entry. Players joining during a delivery wait for the next round. Solo delivery stays private. If the racing crew disconnects, the lobby resets for those waiting.
- At about 150 metres from the post office exit, the light turns mistier. At about 300 metres, interact with the storm portal. Cross seven separated rooftops using Shift + Space; the gaps require jumps. Falls restart at the portal with the parcel. Near 450 metres, the storm gives way to the foundry approach. These are route landmarks, not accumulated walking-distance triggers.
- Master Ashen, the dragon-human recipient, has horns, a long coat, folded wings, a snout, and an animated tail.
- Overall world length is unchanged (approximately 700 metres). The requested new maximum travel distance was not specified, so no new limit was guessed.

## Run on your Mac

1. Stop the old Ghost Post Terminal using Control+C.
2. Unzip the download into a fresh folder.
3. Open Terminal. Type `cd ` (with a space), drag the new **ghost-post** folder into Terminal, and press Return.
4. Run `node server.mjs --open`.
5. Open http://localhost:3002. If an old page is still open, reload it.

Keep Terminal open while playing. No npm installation is required. Node.js 20+ is required.

## Controls

WASD move · Shift run · Space jump · Ctrl duck · Q/C lean · E interact · Click/F fire · R recharge · M map · V webcam · G fullscreen · Esc menu · T radio.

The map continues live during play. Settings pause solo deliveries; shared multiplayer keeps moving. Hiding the camera preview does not stop tracking. Disabling the camera stops its video stream.

## Camera

Open settings → Enable camera. Sit normally and look ahead during the two-second calibration. Lean sideways, lower your head to duck, or show one hand and pinch your thumb and index fingertip together to confirm at the dispatch/recipient prompt. Each gesture can be disabled independently. Recalibrate after changing your seating position. Preview can be shown for five seconds or pinned.

All model processing stays in your browser. Video is not sent to the server. Local camera files are served with the correct JavaScript/WebAssembly/model content types. Real webcam recognition, Safari permission behavior, and GPU rendering need physical-device playtesting; passing automated checks does not establish these.

## Delivery rules

Accept dispatch, match the parcel's three-symbol seal in the sorting room, cross the city, enter the portal, jump the storm rooftops, solve the protected circuit at the foundry, take the elevator, and deliver to Master Ashen in Room 808. The circuit connects the left side of the middle row to the right side of the top row.

First delivery wins, with no overall match timer. Other players may finish. Active couriers vote to return to the lobby; late arrivals don't block that vote. Shooting is disabled in safe/protected areas. Defeats cost three seconds and return you to your checkpoint with the parcel and brief protection. A storm fall always uses the portal checkpoint.

## Shared multiplayer

Everyone must connect to the **same running server address**. The one shared room does not connect independently running localhost servers over the internet. Test using two browser windows on the same Mac, or use the LAN instructions below. Capacity remains eight simultaneous couriers/queued players.

For Wi-Fi testing, stop the server and run `HOST=0.0.0.0 node server.mjs`. Find the host Mac's IP in System Settings → Wi-Fi → Details. Other players open `http://YOUR-MAC-IP:3002`, then Join shared multiplayer. Allow incoming Node connections if macOS requests it. Cameras generally require HTTPS or localhost; plain HTTP LAN clients can use keyboard controls.

Players in different homes need this server hosted behind HTTPS. Internet hosting is not configured by this local update. Refreshing returns to the title screen; inactive sessions time out. Rooms are stored in memory and disappear when the server stops.

## Scope and licenses

One playable episode. The original procedural 3D art, camera thresholds, combat tuning, and pacing are still a prototype. Body/hair customization, additional episodes, and authored voice acting remain future work.

Run `npm test` for server progression, circuit, collision/jump/respawn, shared lobby, client interaction, asset-serving, and scene-transform tests. Browser/GPU and real-camera tests were not available in the build environment.

Three.js 0.160.1 is bundled under its MIT license in public/vendor/THREE-LICENSE.txt. MediaPipe Tasks Vision 0.10.21 and the face landmarker model are bundled in public/vendor/vision; the upstream Apache 2.0 license is included. Model source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task. Runtime source: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/.
