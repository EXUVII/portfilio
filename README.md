# Portfolio designs

Three interactive portfolio directions, all retro-game art × studio design:

| Design | Folder | Idea |
| --- | --- | --- |
| **1 · Press Start** | `/` (root) | A game HUD: playable platformer hero, coins, achievements, quest log, inventory. |
| **2 · Studio Hours** | `/v2/` | A live isometric pixel room beside an editorial column. Scrolling moves the clock from morning to night, and the camera and character follow each section. |
| **3 · Pocket Planet** | `/v3/` | 64-bit era (N64 / PS1) low-poly 3D. One screen: a tiny planet you spin, with a house, gallery, tower and mailbox as the sections. |

---

## Design 1 — Press Start

An interactive portfolio that mixes pixel-art game UI with a clean, editorial studio layout. Plain HTML, CSS and JavaScript: no build step.

> All names, roles, companies and projects are **placeholders** for now.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

It also deploys as-is to GitHub Pages, Netlify or Vercel.

## What's interactive

- **Playable hero stage.** Move with ← → / A D, jump with Space / ↑ / W. Hit a `?` block to travel to that section (clicking the labels works too). Until you press a key, the character plays a demo run. Touch devices get on-screen buttons.
- **HUD.** The XP bar tracks scroll progress, plus a coin counter, 8-bit sound toggle (off by default) and a day/night theme switch that also changes the stage sky.
- **Player card.** Pixel avatar with blink, 3D tilt on hover, and animated stat bars.
- **Quest log.** Experience as an expandable timeline.
- **Inventory.** Projects with procedurally generated pixel covers, rarity tags, filters, and an "item inspect" modal.
- **Save point.** RPG dialogue box with typewriter text, keyboard-navigable choices, copy-email, and a demo contact form.
- **Secrets.** Hidden coins in each section, achievements, and the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) toggles CRT mode.

Respects `prefers-reduced-motion` and `prefers-color-scheme`.

## Where to edit content

| What | Where |
| --- | --- |
| Name, intro, about text, loadout, experience, contact | `index.html` |
| Projects (title, category, rarity, year, role, stack, description) | `PROJECTS` array at the top of `assets/js/main.js` |
| Colors, fonts, spacing | tokens at the top of `assets/css/style.css` |

## Structure

```
index.html
assets/css/style.css
assets/js/main.js
```

---

## Design 2 — Studio Hours (`v2/`)

Open `v2/index.html` (or `http://localhost:8000/v2/` when serving the folder).

- **Scroll = time of day.** 07:30 intro → 10:00 about → 13:30 work → 18:15 logbook → 22:30 contact. The sky, sunbeam, lighting, lamp and window change continuously.
- **Camera + character.** The camera moves to the desk, monitor, bookshelf and corkboard for each section, and the character walks there.
- **Everything in the room is clickable:** monitor, bookshelf (each highlighted book is a job), window (toggles rain), lamp, coffee, plant (water it three times), poster, cat (pet it), and the character.
- **Work list.** Hovering a project shows its pixel screen on the in-room monitor and in a floating preview.
- **Contact.** The note form shows a live sticky-note preview and pins it to the corkboard in the room. It is a demo, so nothing is sent.
- The room is drawn by a small custom isometric rasterizer on `<canvas>` (no libraries), with an ID buffer for hover and click picking.

Edit content in `v2/index.html`; projects live in the `PROJECTS` array at the top of `v2/main.js`.

---

## Design 3 — Pocket Planet (`v3/`)

Open `v3/index.html` (or `http://localhost:8000/v3/`). Uses Three.js r128 from cdnjs.

- **64-bit rendering pipeline.** The scene renders at 240p into a low-res target, then a post pass upscales with nearest-neighbour and applies 15-bit color with ordered dithering. Vertices snap to the low-res grid (the classic wobble), lighting is per-vertex Gouraud, there is distance haze, textures are tiny and bilinear-blurred, and painting textures use affine (non-perspective) mapping.
- **A planet as the menu.** Drag to spin it, with inertia and auto-spin when idle. Click the house (About), the gallery (Work), the tower (Experience) or the mailbox (Contact). The planet turns the place upright, the camera flies in, and a panel opens.
- **Gallery.** Each floating painting is a project. Hovering ripples it, clicking opens it, and the ring turns the selected painting toward the camera.
- **Tower.** One floor per job. Hovering a job in the panel lights up its floor.
- **Mailbox.** The form launches a paper plane and raises the flag. It is a demo, so nothing is sent.
- **Extras.** A little character walks around the planet (click to make them jump), a collectible star orbits, and the chimney smokes. The **Video settings** menu switches resolution (240p / 360p / 480p / HD), dithering, vertex wobble, haze and auto-spin.
- Falls back to a menu-only page if WebGL is unavailable.

Edit content in `v3/index.html`; projects live in the `PROJECTS` array at the top of `v3/main.js`.
