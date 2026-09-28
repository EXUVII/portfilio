# Portfolio designs

Six interactive portfolio directions:

| Design | Folder | Idea |
| --- | --- | --- |
| **1 · Press Start** | `/` (root) | A game HUD: playable platformer hero, coins, achievements, quest log, inventory. |
| **2 · Studio Hours** | `/v2/` | **Adil Asselman's portfolio (real content).** A detailed 32-bit isometric studio beside an editorial column. Scrolling moves the clock from morning to night; books on the shelf are knowledge, frames on the wall are jobs. |
| **3 · Pocket Planet** | `/v3/` | 64-bit era (N64 / PS1) low-poly 3D. One screen: a tiny planet you spin, with a house, gallery, tower and mailbox as the sections. |
| **4 · Riso Press** | `/v4/` | No pixels: a two-ink risograph zine with physics type, halftones, generative posters and swappable ink sets. |
| **5 · Nav Console** | `/v5/` | Calm sci-fi one-pager: a slowly rotating 3D galaxy behind the intro, then clean About, Work, Experience and Contact sections. |
| **6 · Text Me** | `/v6/` | The portfolio is a chat: visitors tap questions and you answer with messages, project cards and a timeline. |

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

A detailed 32-bit style isometric studio beside an editorial column. Scrolling moves the clock from morning to night.

This is the chosen design and holds real content: résumé details (1337, Cagrex, Lysi Consulting, Upwork), the Flockfall game on Google Play, and the 1337 systems projects. Still placeholders: the LinkedIn and GitHub links in Contact.

- **Scroll = time of day.** 07:30 intro → 08:30 training → 10:00 about → 13:00 work → 15:45 library → 18:15 logbook → 22:30 contact. The sky, sunbeam (with floating dust), lighting, lamp, window and wall clock all follow.
- **32-bit rendering.** A custom isometric rasterizer at 512×384 with textured surfaces (wood grain floor, wallpaper and wainscoting, rug, cork, curtains), hue-shifted shading ramps, rim light, ambient occlusion, soft shadows and outlined procedural sprites for the character, cat and plant.
- **The library.** Every colour on the bookshelf is a subject (edit `KNOWLEDGE` in `main.js`; book widths fit each shelf row automatically). Hover a subject in the page or click its books in the room: the books slide out and the matching card opens.
- **Training corner.** A workout mat in the morning sun with dumbbells, a kettlebell, a water bottle and a streak chart on the wall. In the Training chapter the character does push-ups; "Do a set with me" (or clicking the mat) runs a counted set of 10, and the page keeps a push-up counter. The streak grid shows every day trained.
- **The character.** Light skin, curly hair, thin dark rectangular screen glasses (clear lenses with a blue screen glare), an oversized washed-black tee with a small orange print, baggy stone pants and chunky white sneakers, with walk, wave, idle-breathing, sitting, typing and push-up animations. Colours are at the top of the character section in `main.js` (`SKIN`, `HAIR`, `TEE`, `PANTS`, `SNEAK`).
- **Framed jobs.** Each frame above the desk is a role in the logbook; hovering a role lights up its frame.
- **Everything in the room is clickable:** monitor (work), shelf and books (library), frames (jobs), window (rain), wall clock, lamp, coffee, plant (water it three times), cat, and the character.
- **Work list.** Hovering a project shows its pixel art on the in-room monitor and in a floating preview. Each project can set its own `pal`ette, `layout` art (`flock`, `dash`, `grid`, `net`, `term`, `mem`, `threads`, `ray`, `stack`, …) and an optional `url` + `link` label.
- **Contact.** The note form previews a sticky note and pins it to the corkboard. It is a demo, so nothing is sent.

Edit the page text in `v2/index.html`; projects, knowledge subjects and job frame colours live at the top of `v2/main.js`.

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

---

## Design 4 — Riso Press (`v4/`)

Open `v4/index.html` (or `http://localhost:8000/v4/`). Uses Matter.js 0.19 from cdnjs for physics.

- **Printed in two inks.** Everything is drawn in one bright ink and one dark ink on off-white paper, with multiply overprinting, paper grain, misregistered layers, crop marks, registration targets and a colour bar.
- **Physics cover.** The name is made of heavy letters you can grab and throw. Click the paper to knock them over; Shake and Reset buttons are included. On touch screens, tap to knock (the page still scrolls).
- **Halftone portrait.** A duotone dot portrait (placeholder silhouette) swells under the cursor. Set `PORTRAIT_SRC` in `main.js` to halftone a real photo.
- **Prints strip.** Generative two-ink posters, one per project, in a drag-to-scroll strip. Hovering pulls the two ink layers apart; clicking opens a detail view.
- **Tools tray.** Skill tags piled in a physics tray you can drag, tap and shake.
- **Print log.** Experience as a spec-sheet table with expandable rows.
- **Order form.** Contact form that stamps "Received" on submit. It is a demo, so nothing is sent.
- **Ink switcher.** Reprints the whole site in Pink + Blue, Orange + Green, Yellow + Purple, or Red + Black, and remembers your choice.

Edit content in `v4/index.html`; the name, projects and tools are at the top of `v4/main.js`.

---

## Design 5 — Nav Console (`v5/`)

Open `v5/index.html` (or `http://localhost:8000/v5/`). Uses Three.js r128 from cdnjs.

A calm, sci-fi styled one-page site: dark space, ice-cyan accents, thin lines.

- **Hero.** A slowly rotating 3D spiral galaxy behind your name, drifting gently with the mouse.
- **About.** Intro text, plus a panel with stats, skill bars and tools.
- **Work.** Six project cards with animated line-art previews on hover. Click a card for details.
- **Experience.** A simple vertical timeline.
- **Contact.** Email with a copy button, social links and a form. The form is a demo, so nothing is sent.
- Normal page scroll and a sticky nav; phones get a Menu button.

Edit content in `v5/index.html`; projects live in the `PROJECTS` array at the top of `v5/main.js`.

---

## Design 6 — Text Me (`v6/`)

Open `v6/index.html` (or `http://localhost:8000/v6/`). No libraries.

- **A chat instead of pages.** Visitors tap suggested questions (or type their own) and "you" reply with typing indicators and chat bubbles.
- **Rich answers.** Project cards in a swipeable row (tap for a details sheet), an experience timeline, skill bars and tool tags, and a contact card with copy-email.
- **Contact as a conversation.** "Send me a message here" asks for name, email and message one step at a time, with email validation. It is a demo, so nothing is sent.
- **Small delights.** Emoji reactions on messages, a rock-paper-scissors game, "Ask about this project" from the details sheet, read receipts and a restart button.
- **Profile panel** with name, role, local time, quick links and a topic list (hidden on phones to keep the chat full-screen). Light and dark mode.

Edit everything in the `CONTENT` block at the top of `v6/main.js` (answers, projects, jobs, skills, email).
