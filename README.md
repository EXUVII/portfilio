# portfilio

## Skyline Sprint

A 3D endless runner that runs in the browser: [`runner/index.html`](runner/index.html).

Everything is generated in code: no image, model or audio files.

- **Graphics**: Three.js (bundled locally in `runner/vendor/`) with custom shaders. That covers a dusk sky with a low sun, clouds and stars, a procedurally lit city, bloom, chromatic aberration, GPU particles, a ribbon trail and soft shadows.
- **Runner**: a character built from primitives and animated procedurally. It has a run cycle with footsteps, a jump with alternating lead leg, a front flip on double jump, a barrel roll when changing lanes in the air, a baseball slide, a ground slam with a shockwave, squash and stretch, landing crouch, stumble and a ragdoll-style wipeout.
- **Sound**: synthesized live with the Web Audio API. Every effect is layered from oscillators, filtered noise, envelopes, stereo panning and a generated reverb. The coin chime rises in pitch along a combo, and a synthwave soundtrack plays from a small built-in sequencer. It gains layers as you get further, and its filter closes when you crash.
- **Game feel**: input buffering, coyote time, hit-stop, slow motion on a crash, camera shake, a speed-scaled field of view, speed lines, a combo multiplier and trick bonuses (Perfect, Limbo, Close Call, Rooftop, Slam, Flip). It also has magnet, shield and double-score power-ups, distance signs, and a "Your best" sign on the highway at your record distance.

### Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Switch lane | ← → or A D | Swipe left / right |
| Jump, and flip in the air | ↑, W or Space | Swipe up or tap |
| Slide, or slam from the air | ↓ or S | Swipe down |
| Pause / mute | P / M | Buttons, top right |

### Run it locally

Open `runner/index.html` in a browser. It has no network dependencies apart from Google Fonts, which fall back to system fonts when offline. It also works as-is on GitHub Pages.

`runner/vendor/three.bundle.min.js` is Three.js r170 plus the post-processing add-ons, bundled into one classic script. To rebuild it, see the command in `runner/vendor/entry.js`.
