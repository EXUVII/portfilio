# Press Start — portfolio

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
