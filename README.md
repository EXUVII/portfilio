# portfilio

## Skyline Sprint

A 3D endless runner that runs in the browser: [`runner/index.html`](runner/index.html).

Everything is generated in code: no image, model or audio files.

- **Graphics**: Three.js (bundled locally in `runner/vendor/`) with custom shaders. That covers a dusk sky with a low sun, clouds and stars, a procedurally lit city, bloom, GPU particles, a ribbon trail and soft shadows.
- **Runner**: a character built from primitives (helmet with a wraparound visor, ear pods, shoulder and knee pads, gloves, sneakers with glowing soles, a backpack with thrusters) and animated procedurally. A scarf streams behind in the wind, ripples, and swirls round during flips. Every pose change is driven by springs, so moves flow into each other without snapping. It has a run cycle with footsteps, a jump with alternating lead leg, a front flip on double jump, a barrel roll when changing lanes in the air, a baseball slide, a ground slam with a shockwave, squash and stretch, landing crouch, stumble and a ragdoll-style wipeout.
- **Sound**: synthesized live with the Web Audio API. Every effect is layered from oscillators, filtered noise, envelopes, stereo panning and a generated reverb. The coin chime rises in pitch along a combo, and a synthwave soundtrack plays from a small built-in sequencer. It gains layers as you get further, and its filter closes when you crash.
- **Obstacles**: colour-coded by what you do. Red and white barriers are for jumping and have a glowing red top bar; yellow and black gates are for sliding under and have a glowing yellow bar underneath. Each has matching arrows painted on the road in front. Freight pods keep clear of those colours and have lit roof and nose edges. The asphalt and pods have relief maps for surface detail.
- **Game feel**: input buffering, coyote time, hit-stop, slow motion on a crash, camera shake, a speed-scaled field of view, a combo multiplier and trick bonuses (Perfect, Limbo, Close Call, Rooftop, Slam, Flip). It also has magnet, shield and double-score power-ups, distance signs, and a "Your best" sign on the highway at your record distance.

### Places and abilities

Every run passes through three places in order, then loops with the speed still climbing:

1. **Highway 9** (0 m): the dusk highway, with the odd crack in the deck to jump.
2. **Downtown Canyon** (900 m): night, with neon building walls on both sides and collapsed stretches of road that are too long to jump.
3. **Broken Skyway** (2,000 m): a collapsed overpass under repair, with construction panels to run on and long collapses that need wall jumps.

The world curves down over a crest just ahead, so distant pieces stay hidden and rise into view as you approach, and the road winds from side to side. Reaching a place for the first time saves it and unlocks an ability: **wall run** in the canyon and **wall jump** on the skyway. The first time you need each one, time slows down and a hint shows the move. Progress is saved in your browser, and the menu lists what you've found. Once you've unlocked wall run, wall sections can also turn up on the highway.

### Performance

The city is merged into a few meshes, the runner's parts are merged per limb, coins are drawn in one instanced call, and obstacles are pre-merged, so a typical frame takes about 140 draw calls. The glow is computed at reduced resolution and tone mapping shares the final full-screen pass. Every shader is compiled during loading, so nothing freezes mid-run. If a device can't hold about 55 fps, the render resolution steps down (at most twice per run, never below 70%) and recovers between runs, so it never flip-flops mid-run.

Weaker graphics chips (older Intel HD/UHD, phones) start with anti-aliasing off, a smaller shadow map and 85% resolution. On a machine that still can't reach about 40 fps at 70%, the game turns the glow off, then drops to 55% resolution, and remembers that for the next visit. If the browser is drawing without the graphics card (hardware acceleration off), the menu says so and explains how to turn it on. Press **F** during a run to see fps, frame time, render size, draw calls and the graphics chip in use.

### Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Switch lane | ← → or A D | Swipe left / right |
| Jump, and flip in the air | ↑, W or Space | Swipe up or tap |
| Slide, or slam from the air | ↓ or S | Swipe down |
| Wall run (once unlocked) | ← or → toward a wall from an outside lane | Swipe toward the wall |
| Wall jump (once unlocked) | ↑ while wall running | Swipe up while wall running |
| Pause / mute | P / M | Buttons, top right |
| Performance readout | F | — |

### Run it locally

Open `runner/index.html` in a browser. It has no network dependencies apart from Google Fonts, which fall back to system fonts when offline. It also works as-is on GitHub Pages.

`runner/vendor/three.bundle.min.js` is Three.js r170 plus the post-processing add-ons, bundled into one classic script. To rebuild it, see the command in `runner/vendor/entry.js`.
