/* =========================================================
   STUDIO HOURS — portfolio v2 (32-bit edition)
   Hand-rolled isometric renderer: textured faces, hue-shifted
   shading, soft shadows, outlined sprites. Scroll = time of day.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------------------------------------------------------
     CONTENT — placeholders (edit these)
     --------------------------------------------------------- */
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', layout: 'hero', desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Web', year: '2025', role: 'Design & Development', stack: 'Astro, GSAP', layout: 'grid', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: 'Game', year: '2025', role: 'Art Direction', stack: 'Aseprite, Godot', layout: 'game', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Brand', year: '2024', role: 'Visual Identity', stack: 'Illustrator, Figma', layout: 'brand', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Product', year: '2023', role: 'Product Designer', stack: 'Figma, Framer', layout: 'dash', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'Web', year: '2022', role: 'Frontend', stack: 'Three.js, WebGL', layout: 'grid', desc: 'One or two sentences about what this was and why it mattered.' },
  ];
  // Each subject is a coloured set of books on the shelf.
  const KNOWLEDGE = [
    { name: 'Product Design', color: '#b8433a', level: 'Expert', books: ['Design systems', 'UX research', 'Interaction', 'Typography', 'Accessibility'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
    { name: 'Frontend', color: '#2f67b3', level: 'Expert', books: ['JavaScript', 'TypeScript', 'React', 'CSS', 'Performance', 'WebGL'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
    { name: '3D & Motion', color: '#7a4fa0', level: 'Advanced', books: ['Blender', 'Three.js', 'After Effects', 'Animation'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
    { name: 'Product Strategy', color: '#3d8a5a', level: 'Advanced', books: ['Discovery', 'Roadmaps', 'Metrics', 'Workshops'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
    { name: 'Illustration', color: '#d69a2d', level: 'Intermediate', books: ['Pixel art', 'Sketching', 'Colour theory'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
    { name: 'Languages', color: '#cf6a4c', level: 'Fluent', books: ['English', 'Language two', 'Language three'], desc: 'A sentence about how deep you go in this subject and where you learned it.' },
  ];
  const JOB_COLORS = [['#2f67b3', '#9fd3ff'], ['#b8433a', '#ffd166'], ['#3d8a5a', '#d8f5a2'], ['#7a4fa0', '#f7b2d9']];
  const ART_PALS = [
    ['#f4efe6', '#1d2433', '#e2502a', '#2f6fed'], ['#101820', '#e8eef2', '#7fd1b9', '#f2b84b'], ['#8fd3ff', '#1b2a41', '#5fb36b', '#ffd166'],
    ['#ffd84d', '#1b1b22', '#e2502a', '#ffffff'], ['#e9e3f5', '#2a2140', '#8a5bff', '#ff7aa8'], ['#1b1f3a', '#f4f1ea', '#ff6a3d', '#46c2ff'],
  ];

  const CH_HOURS = [7.5, 10, 13, 15.75, 18.3, 22.5, 23.75];
  const BUBBLES = [
    'Morning. Coffee first, then pixels.',
    'Welcome to my desk. Poke around.',
    'Hover a project to put it on screen.',
    'Every colour on this shelf is a subject.',
    'Each frame up there is a job.',
    'Leave me a note on the board.',
  ];
  const IDLE_LINES = ['Hi! I’m Your Name.', 'The cat is the real boss here.', 'Try clicking the window.', 'The lamp works, by the way.', 'Water the plant a few times.', 'Check the clock on the wall.'];

  /* ---------------------------------------------------------
     WORLD, TARGETS, COLOUR
     --------------------------------------------------------- */
  const WW = 512, WH = 384, OX = 256, OY = 136, R = 192, WALL = 104, TH = 8, SLAB = 12;
  const P = (x, y, z) => [OX + x - y, OY + (x + y) / 2 - z];
  const mk = () => { const c = document.createElement('canvas'); c.width = WW; c.height = WH; return c; };
  const world = mk(), g0 = world.getContext('2d');
  const maskC = mk(), mg = maskC.getContext('2d');
  const baseC = mk(), furnC = mk();
  const idMap = new Uint8Array(WW * WH), baseIds = new Uint8Array(WW * WH), furnIds = new Uint8Array(WW * WH);
  let G = g0, IDS = idMap, curId = 0;
  const target = (ctx, ids) => { G = ctx; IDS = ids; };

  const rgbCache = new Map();
  function rgb(hex) {
    let v = rgbCache.get(hex);
    if (v) return v;
    let h = hex.replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, v);
    return v;
  }
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return toHex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)); };
  // hue-shifted ramp: shadows drift to cool violet, lights to warm cream (32-bit palette feel)
  const toneCache = new Map();
  function tone(hex, t) {
    t = Math.round(clamp(t, -1, 1) * 20) / 20;
    const key = hex + t;
    let v = toneCache.get(key);
    if (v) return v;
    v = t < 0 ? mix(hex, '#221c48', -t * 0.78) : t > 0 ? mix(hex, '#fff1cc', t * 0.62) : hex;
    toneCache.set(key, v);
    return v;
  }
  const hash = (x, y) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  /* ---------------------------------------------------------
     RASTERIZER
     --------------------------------------------------------- */
  function scan(pts, cb) {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const y0 = Math.max(0, Math.ceil(minY - 0.5)), y1 = Math.min(WH - 1, Math.ceil(maxY - 0.5) - 1);
    const n = pts.length;
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5; let xl = 1e9, xr = -1e9;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
          const x = a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
          if (x < xl) xl = x; if (x > xr) xr = x;
        }
      }
      const x0 = Math.max(0, Math.ceil(xl - 0.5)), x1 = Math.min(WW, Math.ceil(xr - 0.5));
      if (x1 > x0) cb(y, x0, x1);
    }
  }
  function fillPoly(pts, col) {
    G.fillStyle = col;
    scan(pts, (y, x0, x1) => { G.fillRect(x0, y, x1 - x0, 1); if (curId) IDS.fill(curId, y * WW + x0, y * WW + x1); });
  }
  // Textured quad on an axis plane. fn(u, v) -> colour string or null. Runs of equal colour are batched.
  function tex(axis, c, a0, a1, b0, b1, fn, { ids = true } = {}) {
    let pts;
    if (axis === 'z') pts = [P(a0, b0, c), P(a1, b0, c), P(a1, b1, c), P(a0, b1, c)];
    else if (axis === 'x') pts = [P(c, a0, b0), P(c, a1, b0), P(c, a1, b1), P(c, a0, b1)];
    else pts = [P(a0, c, b0), P(a1, c, b0), P(a1, c, b1), P(a0, c, b1)];
    const lo0 = Math.min(a0, a1), hi0 = Math.max(a0, a1), lo1 = Math.min(b0, b1), hi1 = Math.max(b0, b1);
    scan(pts, (y, x0, x1) => {
      let runC = null, runX = x0;
      const sy = y + 0.5 - OY;
      const flush = (x) => {
        if (runC) { G.fillStyle = runC; G.fillRect(runX, y, x - runX, 1); if (ids && curId) IDS.fill(curId, y * WW + runX, y * WW + x); }
      };
      for (let x = x0; x < x1; x++) {
        const sx = x + 0.5 - OX;
        let u, v;
        if (axis === 'z') { const s = 2 * (sy + c); u = (sx + s) / 2; v = (s - sx) / 2; }
        else if (axis === 'x') { u = c - sx; v = (c + u) / 2 - sy; }
        else { u = sx + c; v = (u + c) / 2 - sy; }
        u = clamp(u, lo0, hi0 - 0.001); v = clamp(v, lo1, hi1 - 0.001);
        const col = fn(u, v);
        if (col !== runC) { flush(x); runC = col; runX = x; }
      }
      flush(x1);
    });
  }
  const dot = (x, y, col) => {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= WW || y >= WH) return;
    G.fillStyle = col; G.fillRect(x, y, 1, 1);
    if (curId) IDS[y * WW + x] = curId;
  };
  // A shaded box with rim light on the top edges and soft ambient occlusion at the base.
  function box(x, y, z, w, d, h, base, o = {}) {
    const topT = o.top ?? 0.12, leftT = o.left ?? -0.22, rightT = o.right ?? -0.46, grain = o.grain || null;
    tex('y', y + d, x, x + w, z, z + h, (u, v) => {
      let t = leftT - 0.14 * (1 - (v - z) / Math.max(1, h)) * (o.ao === false ? 0 : 1);
      if (v > z + h - 1) t += 0.3;
      if (u < x + 1) t += 0.08;
      if (grain) t += grain(u, v, 'y');
      return tone(base, t);
    });
    tex('x', x + w, y, y + d, z, z + h, (u, v) => {
      let t = rightT - 0.12 * (1 - (v - z) / Math.max(1, h)) * (o.ao === false ? 0 : 1);
      if (v > z + h - 1) t += 0.22;
      if (grain) t += grain(u, v, 'x');
      return tone(base, t);
    });
    tex('z', z + h, x, x + w, y, y + d, (u, v) => {
      let t = topT;
      if (u > x + w - 1 || v > y + d - 1) t += 0.28;
      if (grain) t += grain(u, v, 'z');
      return tone(base, t);
    });
  }
  // Soft, dithered shadow rectangle on the floor
  function shadow(x0, x1, y0, y1, a = 0.28, soft = 6) {
    const save = curId; curId = 0;
    tex('z', 0.02, x0 - soft, x1 + soft, y0 - soft, y1 + soft, (u, v) => {
      const dx = Math.max(x0 - u, 0, u - x1), dy = Math.max(y0 - v, 0, v - y1);
      const k = 1 - Math.hypot(dx, dy) / soft;
      if (k <= 0) return null;
      const q = Math.round(k * 3) / 3;
      if (q < 0.5 && (Math.floor(u) + Math.floor(v)) % 2) return null;
      return `rgba(22,14,48,${(a * Math.max(q, 0.34)).toFixed(3)})`;
    }, { ids: false });
    curId = save;
  }
  function line3(a, b, col, steps = 0) {
    const [ax, ay] = P(...a), [bx, by] = P(...b);
    const n = steps || Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))) + 1;
    for (let i = 0; i <= n; i++) dot(lerp(ax, bx, i / n), lerp(ay, by, i / n), col);
  }

  /* ---------------------------------------------------------
     SPRITES (procedural, outlined)
     --------------------------------------------------------- */
  function spriteCanvas(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
    const x = c.getContext('2d');
    x.translate(1, 1);
    draw(x);
    // threshold alpha (keeps pixel edges crisp), then add a 1px outline
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data, W2 = c.width;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
    const out = new Uint8Array(W2 * c.height);
    for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < W2; xx++) {
      const i = yy * W2 + xx;
      if (d[i * 4 + 3]) continue;
      const n = (xx > 0 && d[(i - 1) * 4 + 3]) || (xx < W2 - 1 && d[(i + 1) * 4 + 3]) || (yy > 0 && d[(i - W2) * 4 + 3]) || (yy < c.height - 1 && d[(i + W2) * 4 + 3]);
      if (n) out[i] = 1;
    }
    for (let i = 0; i < out.length; i++) if (out[i]) { d[i * 4] = 28; d[i * 4 + 1] = 20; d[i * 4 + 2] = 38; d[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0);
    const mask = new Uint8Array(W2 * c.height);
    for (let i = 0; i < mask.length; i++) mask[i] = d[i * 4 + 3] ? 1 : 0;
    return { c, w: W2, h: c.height, mask };
  }
  function drawSpr(s, x, y, flip = false) {
    x = Math.round(x); y = Math.round(y);
    if (flip) { G.save(); G.translate(x + s.w, y); G.scale(-1, 1); G.drawImage(s.c, 0, 0); G.restore(); }
    else G.drawImage(s.c, x, y);
    if (!curId) return;
    for (let j = 0; j < s.h; j++) {
      const yy = y + j; if (yy < 0 || yy >= WH) continue;
      for (let i = 0; i < s.w; i++) {
        if (!s.mask[j * s.w + (flip ? s.w - 1 - i : i)]) continue;
        const xx = x + i; if (xx >= 0 && xx < WW) IDS[yy * WW + xx] = curId;
      }
    }
  }

  // The character: 24x54, drawn part by part with 3-4 tone ramps
  const SKIN = ['#ffdcbc', '#f2c29c', '#dc9c76', '#b3745a'];
  const HAIR = ['#7a5543', '#44302a', '#2a1b17'];
  const SHIRT = ['#ff8a5c', '#e2502a', '#b33a1c', '#7e2a1a'];
  const PANTS = ['#5a6ca3', '#3b4a82', '#29335f'];
  const SHOE = ['#56566a', '#2a2a34'];
  const figCache = new Map();
  function figure({ view = 'front', walk = 0, sit = false, typing = 0, wave = false }) {
    const key = `${view}${walk}${sit}${typing}${wave}`;
    if (figCache.has(key)) return figCache.get(key);
    const H = sit ? 38 : 54;
    const s = spriteCanvas(24, H, (x) => {
      const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
      const back = view === 'back';
      // legs + shoes
      if (!sit) {
        const lo = walk === 1 ? -2 : walk === 2 ? 1 : 0, ro = walk === 1 ? 1 : walk === 2 ? -2 : 0;
        [[7, lo], [13, ro]].forEach(([lx, off], k) => {
          r(lx, 35 + Math.min(0, off), 4, 14 - Math.min(0, off) + Math.max(0, off), PANTS[1]);
          r(lx + 3, 35, 1, 14 + Math.max(0, off), PANTS[2]);
          if (k === 0) r(lx, 36, 1, 10, PANTS[0]);
          r(lx - 1, 49 + off, 6, 3, SHOE[1]);
          r(lx - 1, 49 + off, 5, 1, SHOE[0]);
        });
      }
      // arms
      const armY = sit ? 0 : walk === 1 ? 1 : walk === 2 ? -1 : 0;
      const armL = (ax, ay) => {
        r(ax, ay + 21, 3, 7, SHIRT[1]); r(ax, ay + 21, 1, 7, SHIRT[0]);
        r(ax, ay + 28, 3, 5, SKIN[1]); r(ax + 2, ay + 28, 1, 5, SKIN[2]);
        r(ax, ay + 33, 3, 2, SKIN[2]);
      };
      if (!sit || !typing) armL(3, armY);
      if (wave) {
        r(19, 14, 3, 7, SHIRT[1]); r(21, 14, 1, 7, SHIRT[2]);
        r(19, 8, 3, 6, SKIN[1]); r(21, 8, 1, 6, SKIN[2]); r(19, 6, 3, 2, SKIN[0]);
      } else if (!sit || !typing) armL(18, -armY);
      else { r(3, 23, 3, 8, SHIRT[1]); r(18, 23, 3, 8, SHIRT[2]); }
      // torso
      r(6, 20, 13, 16, SHIRT[1]);
      r(6, 21, 2, 14, SHIRT[0]);
      r(15, 20, 4, 16, SHIRT[2]);
      r(6, 35, 13, 1, SHIRT[3]);
      x.clearRect(6, 20, 1, 1); x.clearRect(18, 20, 1, 1);
      if (!back) { r(10, 20, 5, 2, SKIN[1]); r(11, 22, 3, 1, SKIN[2]); r(14, 25, 2, 2, SHIRT[2]); }
      else r(10, 20, 5, 1, SHIRT[3]);
      // neck + head
      r(10, 17, 5, 3, SKIN[2]);
      x.fillStyle = SKIN[1]; x.beginPath(); x.ellipse(12.5, 10.5, 6.5, 7.5, 0, 0, Math.PI * 2); x.fill();
      r(16, 6, 3, 10, SKIN[2]); r(8, 16, 9, 2, SKIN[2]); r(7, 8, 2, 6, SKIN[0]);
      r(5, 9, 1, 4, SKIN[2]); r(19, 9, 1, 4, SKIN[3]);
      // hair
      x.fillStyle = HAIR[1];
      x.beginPath(); x.ellipse(12.5, 7, 7, 5.5, 0, Math.PI, 0); x.fill();
      r(5.5, 6, 14, 3, HAIR[1]);
      if (back) { x.beginPath(); x.ellipse(12.5, 10, 7, 7.5, 0, 0, Math.PI * 2); x.fill(); r(7, 15, 11, 2, HAIR[2]); r(15, 4, 4, 11, HAIR[2]); }
      else { [8, 11, 14, 17].forEach((fx, k) => r(fx - 1, 8, 2, k % 2 ? 1 : 2, HAIR[1])); r(5, 7, 2, 5, HAIR[1]); r(18, 7, 2, 4, HAIR[2]); }
      r(9, 2, 5, 1, HAIR[0]); r(8, 3, 3, 1, HAIR[0]);
      if (!back) {
        r(9, 10, 1, 2, '#1b1b22'); r(15, 10, 1, 2, '#1b1b22');
        r(9, 10, 1, 1, '#4a4a60');
        r(8, 13, 2, 1, '#f29a8a'); r(15, 13, 2, 1, '#f29a8a');
        r(12, 14, 2, 1, SKIN[3]);
      }
    });
    figCache.set(key, s);
    return s;
  }

  // Cat: 28x18 in a few poses
  const catCache = new Map();
  function catSprite(state, frame) {
    const key = state + frame;
    if (catCache.has(key)) return catCache.get(key);
    const C0 = '#6a6a82', C1 = '#4a4a5e', C2 = '#30303f', PINK = '#e58fa0';
    const s = spriteCanvas(28, 18, (x) => {
      const r = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
      if (state === 'sleep') {
        x.fillStyle = C1; x.beginPath(); x.ellipse(13, 12, 11, 5, 0, 0, 7); x.fill();
        r(4, 8, 16, 2, C0); r(4, 15, 18, 2, C2);
        x.fillStyle = C1; x.beginPath(); x.arc(21, 11, 4.5, 0, 7); x.fill();
        r(18, 6, 2, 2, C1); r(23, 6, 2, 2, C1); r(19, 9, 3, 1, C0);
        r(20, 12, 3, 1, C2); r(2, 13, 18, 2, C0);
        return;
      }
      const leg = [[7, 0], [10, 1], [16, 1], [19, 0]];
      leg.forEach(([lx, ph]) => r(lx, 14 + ((frame + ph) % 2), 2, 3 - ((frame + ph) % 2), C2));
      x.fillStyle = C1; x.beginPath(); x.ellipse(13, 11, 9, 4.5, 0, 0, 7); x.fill();
      r(6, 7, 13, 2, C0); r(6, 14, 14, 1, C2);
      x.fillStyle = C1; x.beginPath(); x.arc(22, 7, 4.5, 0, 7); x.fill();
      r(19, 3, 2, 3, C1); r(24, 3, 2, 3, C1); r(19, 4, 1, 1, PINK); r(25, 4, 1, 1, PINK);
      r(20, 5, 3, 1, C0);
      r(23, 7, 1, 1, '#ffd166'); r(26, 8, 1, 1, PINK);
      const t = state === 'sit' ? [[4, 12], [3, 11], [2, 10], [2, 9], [3, 8]] : [[4, 9], [3, 8], [2, 7], [2, 6], [3, 5]];
      t.forEach(([a, b]) => r(a, b, 2, 2, C1));
    });
    catCache.set(key, s);
    return s;
  }

  // Plant: soft leaves thresholded to pixels, 4 sway frames
  const plantCache = new Map();
  function plantSprite(frame, bloom) {
    const key = frame + '_' + bloom;
    if (plantCache.has(key)) return plantCache.get(key);
    const GR = ['#9fe08c', '#5fb36b', '#3f8f5a', '#2a6b48'];
    const s = spriteCanvas(40, 48, (x) => {
      const rnd = mulberry(12);
      const sway = [0, 0.05, 0, -0.05][frame];
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 2.4 + sway * (1 + i / 8);
        const len = 12 + rnd() * 16;
        const bx = 20, by = 46;
        const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
        x.strokeStyle = GR[3]; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (ex - bx) * 0.3, ey + 10, ex, ey); x.stroke();
        x.save(); x.translate(ex, ey); x.rotate(a + Math.PI / 2);
        x.fillStyle = GR[i % 3 === 0 ? 2 : 1]; x.beginPath(); x.ellipse(0, 0, 3.4, 7, 0, 0, 7); x.fill();
        x.fillStyle = GR[0]; x.beginPath(); x.ellipse(-1.2, -1, 1.2, 4.5, 0, 0, 7); x.fill();
        x.restore();
      }
      if (bloom) [[12, 10], [27, 8], [20, 3]].forEach(([fx, fy]) => {
        x.fillStyle = '#ff7aa8'; [[0, -2], [2, 0], [0, 2], [-2, 0]].forEach(([a, b]) => { x.beginPath(); x.arc(fx + a, fy + b, 1.8, 0, 7); x.fill(); });
        x.fillStyle = '#ffd166'; x.beginPath(); x.arc(fx, fy, 1.4, 0, 7); x.fill();
      });
    });
    plantCache.set(key, s);
    return s;
  }
  const HEART = spriteCanvas(7, 6, (x) => { x.fillStyle = '#ff6f91'; x.fillRect(1, 0, 2, 1); x.fillRect(4, 0, 2, 1); x.fillRect(0, 1, 7, 2); x.fillRect(1, 3, 5, 1); x.fillRect(2, 4, 3, 1); x.fillRect(3, 5, 1, 1); x.fillStyle = '#ffc2d1'; x.fillRect(1, 1, 1, 1); });

  /* ---------------------------------------------------------
     PALETTE + TIME OF DAY
     --------------------------------------------------------- */
  const C = {
    wall: '#b9ccb2', wallR: '#aec3a8', wains: '#7f9a7a', trim: '#efe7d6', cap: '#eee6d6',
    floor: ['#c98d5c', '#c08352', '#d19862', '#bb7d4d', '#c6895a'], gap: '#6f4630', slab: '#6e4a33',
    shelf: '#8a5a3b', shelfIn: '#3a2419', desk: '#d9a066', deskDark: '#8a5a3b', metal: '#2e3139', chair: '#d2461f',
    rugA: '#2f4a7a', rugB: '#e9c46a', rugC: '#c2553d', rugD: '#3c5d94', cork: '#c89b69', corkF: '#6e4c30', frame: '#f3efe6',
    pot: '#d7663f', lamp: '#2b2f36', mug: '#f4f1ea', curtain: '#e9d8bd',
  };
  const SKY = [
    { h: 5, top: '#1a1e4a', bot: '#4a3f7a', tint: '#8088c0', back: '#2a2e52' },
    { h: 6.5, top: '#3b3f7a', bot: '#f19a7a', tint: '#d8b8c8', back: '#d6b3be' },
    { h: 8.5, top: '#9cc8f0', bot: '#ffe0bd', tint: '#fff2e2', back: '#ecdccd' },
    { h: 12, top: '#5aa9f0', bot: '#c4e6ff', tint: '#ffffff', back: '#cfe0e6' },
    { h: 16, top: '#6aa6e0', bot: '#ffe6b8', tint: '#fff5e6', back: '#e6dcc9' },
    { h: 18.4, top: '#5b4f9a', bot: '#ff8a5c', tint: '#f2b99f', back: '#e0a48c' },
    { h: 20.3, top: '#1d2150', bot: '#5a4485', tint: '#8a88c2', back: '#2e3158' },
    { h: 23, top: '#070a1e', bot: '#1b2146', tint: '#5a64a0', back: '#121631' },
    { h: 25, top: '#070a1e', bot: '#1b2146', tint: '#5a64a0', back: '#121631' },
  ];
  const skyAt = (h) => {
    let i = 0; while (i < SKY.length - 2 && SKY[i + 1].h <= h) i++;
    const a = SKY[i], b = SKY[i + 1], k = clamp((h - a.h) / (b.h - a.h));
    return { top: mix(a.top, b.top, k), bot: mix(a.bot, b.bot, k), tint: mix(a.tint, b.tint, k), back: mix(a.back, b.back, k) };
  };
  const dayPart = (h) => h < 9 ? 'Morning' : h < 12 ? 'Late morning' : h < 15 ? 'Afternoon' : h < 17.5 ? 'Late afternoon' : h < 19.5 ? 'Golden hour' : h < 22 ? 'Evening' : 'Night';

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  const S = {
    hour: 7.5, ch: 0,
    raining: false, lampManual: null, lampI: 0, night: 0,
    screenProject: -1, hover: 0, forced: 0,
    catPull: KNOWLEDGE.map(() => 0), pullCat: -1, pullFromScene: false,
    water: 0, coffee: 3, pets: 0, userNote: null, t: 0,
  };
  const hero = { x: 134, y: 28, path: [], sit: false, typing: false, face: false, flip: false, anim: 0, wave: 0, moving: false };
  const cat = { x: 120, y: 120, tx: 120, ty: 120, state: 'walk', timer: 2, flip: false, anim: 0, purr: 0 };
  let parts = [];
  const motes = Array.from({ length: 36 }, () => ({ t: Math.random(), u: Math.random(), w: Math.random(), s: 0.02 + Math.random() * 0.04 }));

  /* ---------------------------------------------------------
     BOOKSHELF LAYOUT
     --------------------------------------------------------- */
  const SHELF = { x0: 12, x1: 92, d: 20, rows: [[6, 28], [30, 52], [54, 76], [78, 94]] };
  const books = [];
  (() => {
    const rnd = mulberry(21);
    const rowCats = { 2: [0, 1], 1: [2, 3, 4], 0: [5] };
    Object.entries(rowCats).forEach(([row, cats]) => {
      const [z0, z1] = SHELF.rows[row];
      let x = SHELF.x0 + 4;
      cats.forEach((ci) => {
        const K = KNOWLEDGE[ci];
        K.books.forEach((title, bi) => {
          const w = 4 + Math.floor(rnd() * 3), h = Math.min(z1 - z0 - 2, 13 + Math.floor(rnd() * 7));
          const hueShift = [-0.1, 0.12, 0, -0.18, 0.2, 0.05][bi % 6];
          books.push({ x, z: z0, w, h, top: z1, cat: ci, base: tone(K.color, hueShift), band: bi % 3 === 0 ? '#e9c46a' : bi % 3 === 1 ? tone(K.color, -0.5) : null, title: rnd() > 0.3 });
          x += w;
        });
        x += 3;
      });
    });
  })();

  /* ---------------------------------------------------------
     PROJECT ART (32 x 24) for the monitor + previews
     --------------------------------------------------------- */
  const ART = PROJECTS.map((p, i) => makeArt(p, i));
  function makeArt(p, i) {
    const W = 32, H = 24, px = new Array(W * H);
    const [bg, fg, a1, a2] = ART_PALS[i % ART_PALS.length];
    const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (k >= 0 && j >= 0 && k < W && j < H) px[j * W + k] = c; };
    const disc = (cx, cy, r, c) => { for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) if (k * k + j * j <= r * r) rect(cx + k, cy + j, 1, 1, c); };
    rect(0, 0, W, H, bg);
    rect(0, 0, W, 3, fg); rect(1, 1, 1, 1, a1); rect(3, 1, 1, 1, a2); rect(5, 1, 1, 1, bg);
    if (p.layout === 'hero') { disc(23, 13, 6, a1); disc(25, 11, 2, a2); rect(3, 7, 12, 2, fg); rect(3, 10, 9, 2, fg); rect(3, 14, 11, 1, fg); rect(3, 16, 8, 1, fg); rect(3, 19, 7, 3, a2); }
    else if (p.layout === 'grid') { for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const x = 2 + c * 10, y = 5 + r * 9; rect(x, y, 8, 7, fg); rect(x + 1, y + 1, 6, 3, (r + c) % 2 ? a1 : a2); rect(x + 1, y + 5, 4, 1, bg); } }
    else if (p.layout === 'game') { rect(0, 18, W, 6, a1); rect(9, 9, 4, 4, a2); rect(10, 10, 2, 2, fg); rect(19, 9, 4, 4, a2); rect(20, 10, 2, 2, fg); rect(4, 13, 3, 5, fg); rect(4, 12, 3, 1, '#f1c09a'); rect(22, 5, 6, 2, '#ffffff'); rect(15, 16, 2, 2, a2); }
    else if (p.layout === 'brand') { rect(10, 6, 12, 12, fg); rect(12, 8, 8, 8, bg); rect(14, 10, 4, 4, a1); rect(0, 21, W, 3, a1); rect(26, 5, 3, 3, fg); }
    else { rect(2, 5, 8, 17, fg); for (let j = 0; j < 5; j++) rect(3, 7 + j * 3, 6, 1, j === 1 ? a1 : bg); [6, 10, 7, 12, 9, 14].forEach((b, k) => rect(13 + k * 3, 21 - b, 2, b, k === 5 ? a1 : a2)); rect(12, 21, 19, 1, fg); }
    return px;
  }
  const paintArt = (canvas, i) => { const x = canvas.getContext('2d'), a = ART[i]; for (let j = 0; j < 24; j++) for (let k = 0; k < 32; k++) { x.fillStyle = a[j * 32 + k]; x.fillRect(k, j, 1, 1); } };

  /* ---------------------------------------------------------
     STATIC LAYERS (built once)
     --------------------------------------------------------- */
  function buildBase() {
    const ctx = baseC.getContext('2d');
    ctx.clearRect(0, 0, WW, WH); baseIds.fill(0);
    target(ctx, baseIds); curId = 0;

    // wall caps + ends
    tex('z', WALL, -TH, R, -TH, 0, (u, v) => tone(C.cap, v < -TH + 1 || u < -TH + 1 ? 0.3 : 0.05));
    tex('z', WALL, -TH, 0, 0, R, (u, v) => tone(C.cap, u < -TH + 1 ? 0.3 : 0.05));
    tex('y', R, -TH, 0, -SLAB, WALL, (u, v) => tone(C.cap, v < 0 ? -0.35 : -0.2));
    tex('x', R, -TH, 0, -SLAB, WALL, (u, v) => tone(C.cap, v < 0 ? -0.5 : -0.38));

    // walls: wallpaper above, wainscot below, AO in the corner and at the floor line
    const wallFn = (base, side) => (a, z) => {
      const corner = Math.exp(-a / 14) * 0.22;
      if (z < 5) return tone(C.trim, -0.12 - corner - (z < 1 ? 0.2 : 0));
      if (z < 34) {
        const board = Math.floor(a / 12);
        let t = -0.1 - corner - 0.12 * Math.exp(-(z - 5) / 6);
        if (a % 12 < 1) t -= 0.18; else if (a % 12 < 2) t += 0.12;
        if (z > 31) t += 0.1;
        return tone(C.wains, t + (board % 2 ? 0.02 : 0) + side);
      }
      if (z < 37) return tone(C.trim, z > 36 ? 0.2 : -0.05 - corner);
      let t = -corner + side;
      const px = a % 16, pz = (z - 37) % 16;
      if ((px === 8 && pz === 8) || (px === 0 && pz === 0)) t += 0.14;
      else if (Math.abs(px - 8) + Math.abs(pz - 8) === 3) t -= 0.05;
      t += (hash(a, z) - 0.5) * 0.04;
      t -= Math.max(0, (z - 90) / 14) * 0.08;
      return tone(base, t);
    };
    tex('x', 0, 0, R, 0, WALL, wallFn(C.wall, 0));
    tex('y', 0, 0, R, 0, WALL, wallFn(C.wallR, -0.05));

    // window recess + sill (glass is drawn every frame)
    curId = 3;
    tex('y', 0.01, 110, 166, 34, 86, (x, z) => {
      if (x > 114 && x < 162 && z > 38 && z < 82) return tone('#4c5566', -0.2);
      let t = 0.1; if (x < 111 || z > 85) t += 0.2; if (x > 165 || z < 35) t -= 0.25;
      return tone(C.frame, t);
    });
    box(108, 0, 30, 60, 6, 4, C.frame);

    // clock (hands every frame)
    curId = 12;
    tex('y', 0.02, 92, 108, 76, 92, (x, z) => {
      const d = Math.hypot(x - 100, z - 84);
      if (d > 7.6) return null;
      if (d > 6.4) return tone('#2b2f36', x < 100 ? 0.2 : -0.1);
      const a = Math.atan2(z - 84, x - 100), tick = Math.abs(((a / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.42 && d > 5;
      return tick ? '#2b2f36' : tone('#fbf6ea', (z - 84) / 20);
    });

    // job frames above the desk (left wall)
    for (let j = 0; j < 4; j++) {
      curId = 20 + j;
      const y0 = 32 + j * 22, y1 = y0 + 18, z0 = 66, z1 = 88;
      const [c1, c2] = JOB_COLORS[j];
      tex('x', 0.02, y0, y1, z0, z1, (y, z) => {
        const e = Math.min(y - y0, y1 - y, z - z0, z1 - z);
        if (e < 1.6) return tone('#6e4c30', (z - z0) / 40 + (y < y0 + 1 ? 0.25 : 0));
        if (e < 3) return tone(C.frame, -0.05);
        const u = (y - y0 - 3) / 12, v = (z - z0 - 3) / 16;
        const circle = Math.hypot(u - 0.5, v - 0.6) < 0.28;
        if (j === 0 && circle) return c2;
        if (j === 1 && Math.abs(u - 0.5) + Math.abs(v - 0.5) < 0.32) return c2;
        if (j === 2 && v < 0.2 + Math.sin(u * 7) * 0.12 + 0.2) return c2;
        if (j === 3 && ((Math.floor(u * 4) + Math.floor(v * 4)) % 2)) return c2;
        return tone(c1, v * 0.4 - 0.1);
      });
    }
    // corkboard + pinned notes
    curId = 4;
    tex('x', 0.02, 126, 178, 40, 76, (y, z) => {
      const e = Math.min(y - 126, 178 - y, z - 40, 76 - z);
      if (e < 2) return tone(C.corkF, (z - 40) / 60 + (e < 0.8 ? 0.2 : 0));
      const n = hash(y * 3, z * 3);
      return tone(C.cork, n < 0.12 ? -0.25 : n > 0.9 ? 0.18 : (z - 58) / 80);
    });
    [[130, 62, 10, 9, '#ffd84d'], [144, 64, 9, 8, '#8fd3ff'], [157, 58, 10, 10, '#f29bb0'], [134, 46, 11, 9, '#ffffff'], [150, 44, 12, 11, '#d8f5a2']].forEach(([y0, z0, w, h, col], k) => {
      tex('x', 0.04, y0, y0 + w, z0, z0 + h, (y, z) => {
        const lineZ = Math.floor(z0 + h - 3 - z);
        if (lineZ >= 0 && lineZ % 2 === 0 && y > y0 + 1.5 && y < y0 + w - 2 - ((lineZ * 3 + k) % 3)) return tone(col, -0.55);
        return tone(col, z > z0 + h - 1.5 ? 0.15 : -0.05);
      });
      const [px, py] = P(0.05, y0 + w / 2, z0 + h - 0.5); dot(px, py, '#d2461f'); dot(px, py - 1, '#ff8a5c');
    });

    // floor planks with grain and AO near the walls
    curId = 0;
    tex('z', 0, 0, R, 0, R, (x, y) => {
      const row = Math.floor(y / 12), off = (row * 37) % 48;
      const seg = Math.floor((x + off) / 48);
      const base = C.floor[(row * 3 + seg) % C.floor.length];
      let t = 0;
      if (y % 12 < 0.9) return C.gap;
      if ((x + off) % 48 < 0.8) return tone(C.gap, 0.1);
      const gr = hash(Math.floor(x / 5) + seg * 13, Math.floor(y * 2));
      if (gr > 0.93) t -= 0.14; else if (gr < 0.05) t += 0.1;
      t += Math.sin((x + row * 11) / 7) * 0.02;
      t -= Math.exp(-x / 16) * 0.28 + Math.exp(-y / 16) * 0.28;
      return tone(base, t);
    });
    tex('y', R, 0, R, -SLAB, 0, (x, z) => tone(C.slab, z > -1.5 ? 0.35 : (x % 48 < 1 ? -0.1 : 0.05)));
    tex('x', R, 0, R, -SLAB, 0, (y, z) => tone(C.slab, z > -1.5 ? 0.1 : -0.25));

    // rug with border, motif and fringe
    tex('z', 0.03, 66, 164, 76, 168, (x, y) => {
      const ex = Math.min(x - 70, 160 - x), ey = Math.min(y - 76, 168 - y);
      if (ex < 0) return (Math.floor(y) % 3 === 0) ? tone('#f3ead6', -0.1) : null;
      if (ey < 0) return null;
      const e = Math.min(ex, ey);
      if (e < 3) return tone(C.rugB, e < 1 ? -0.2 : 0);
      if (e < 5) return tone(C.rugC, 0);
      if (e < 7) return tone(C.rugB, -0.1);
      const cx = x - 115, cy = y - 122;
      const dia = Math.abs(cx) / 1.2 + Math.abs(cy);
      if (dia % 20 < 2.5) return tone(C.rugB, -0.05);
      if (dia < 10) return tone(C.rugC, 0.05);
      const ch = (Math.floor(x / 6) + Math.floor(y / 6)) % 2;
      return tone(ch ? C.rugA : C.rugD, -0.05 + (hash(x, y) - 0.5) * 0.06);
    });

    // furniture shadows (light comes through the window, so they fall toward the room)
    shadow(0, 36, 38, 112, 0.3, 7);
    shadow(12, 94, 0, 30, 0.34, 6);
    shadow(36, 58, 60, 82, 0.22, 5);
    shadow(170, 188, 6, 26, 0.26, 4);
  }

  function buildFurniture() {
    const ctx = furnC.getContext('2d');
    ctx.clearRect(0, 0, WW, WH); furnIds.fill(0);
    target(ctx, furnIds);
    const wood = (u, v, face) => (face === 'z' ? Math.sin(v * 1.3 + Math.sin(u * 0.4) * 2) * 0.04 : Math.sin(v * 1.6 + u * 0.2) * 0.03) + (hash(u * 2, v * 2) > 0.95 ? -0.1 : 0);

    // bookshelf body with dark cavities (books drawn every frame)
    curId = 2;
    const { x0, x1, d, rows } = SHELF;
    box(x0, 0, 0, x1 - x0, d, 98, C.shelf, { grain: wood });
    rows.forEach(([z0, z1]) => tex('y', d + 0.01, x0 + 3, x1 - 3, z0, z1, (x, z) => tone(C.shelfIn, -0.1 - (z1 - z) / 60 + (x < x0 + 4 ? -0.15 : 0))));
    rows.forEach(([, z1], k) => { if (k < 3) tex('y', d + 0.02, x0 + 2, x1 - 2, z1, z1 + 2, (x, z) => tone(C.shelf, z > z1 + 1.2 ? 0.25 : -0.05)); });
    // decor on the top row and in spare spaces
    box(18, 6, 78, 7, 7, 6, '#e9c46a');
    box(19.5, 7.5, 84, 4, 4, 5, '#e9c46a', { top: 0.3 });
    box(28, 5, 78, 16, 10, 2, '#2f67b3'); box(29, 5, 80, 14, 10, 2, '#b8433a'); box(28, 5, 82, 15, 10, 2, '#3d8a5a');
    box(52, 8, 78, 8, 8, 5, '#d7663f');
    box(66, 5, 78, 18, 12, 10, '#efe7d6');
    box(56, 6, 6, 32, 12, 14, '#b58a63', { grain: wood });
    box(57, 6, 20, 30, 12, 1, '#9b7350');

    // desk: drawers, legs, wooden top
    curId = 10;
    box(2, 80, 0, 26, 26, 24, tone(C.desk, -0.08), { grain: wood });
    [4, 12, 19].forEach((z) => {
      tex('y', 106.01, 4, 26, z, z + 6, (x, zz) => tone(C.desk, zz > z + 5 ? 0.15 : -0.12));
      tex('y', 106.02, 13, 17, z + 2.5, z + 3.5, () => '#e9c46a');
    });
    box(29, 40, 0, 3, 3, 24, C.deskDark);
    box(29, 104, 0, 3, 3, 24, C.deskDark);
    box(0, 38, 24, 34, 72, 4, C.desk, { grain: wood });
    // monitor
    curId = 1;
    box(4, 66, 28, 6, 8, 2, C.metal);
    box(6, 68, 30, 2, 4, 6, C.metal);
    box(2, 50, 34, 6, 40, 26, C.metal, { top: 0.2 });
    // keyboard, mouse, notebook
    curId = 10;
    box(14, 58, 28, 8, 24, 2, '#e6e2d8');
    tex('z', 30.02, 15, 21, 59, 81, (x, y) => ((Math.floor(x) + Math.floor(y / 2)) % 2 ? '#fbf8f0' : tone('#e6e2d8', -0.2)));
    box(16, 86, 28, 4, 5, 2, '#f4f1ea');
    box(12, 42, 28, 12, 12, 1, '#2f67b3');
    tex('z', 29.02, 12, 24, 42, 44, (x) => (Math.floor(x) % 2 ? '#dcdcdc' : '#8a8a8a'));
    box(22, 40, 29, 1.5, 12, 1, '#e9c46a');
    // mug body (coffee drawn every frame)
    curId = 8;
    box(18, 94, 28, 6, 6, 8, C.mug);
    tex('y', 100.02, 19, 23, 30, 34, (x, z) => (z > 31 && z < 33 ? tone('#d2461f', 0) : tone(C.mug, -0.2)));
    box(24, 95.5, 30, 1.5, 3, 4, C.mug);
    // lamp base + arm (shade drawn every frame)
    curId = 7;
    box(4, 96, 28, 7, 7, 2, C.lamp);
    for (let k = 0; k <= 20; k++) { const t = k / 20; const [sx, sy] = P(7.5 + t * 4, 99, 30 + t * 18); dot(sx, sy, tone(C.lamp, 0.2)); dot(sx + 1, sy, C.lamp); }
    // chair seat + base (the back is drawn in depth order)
    curId = 11;
    [[36, 66, 18, 3], [44, 58, 3, 18]].forEach(([x, y, w, dd]) => box(x, y, 1, w, dd, 2, C.metal));
    box(44.5, 66.5, 3, 2, 2, 11, C.metal);
    box(38, 60, 14, 16, 16, 3, C.chair);
    // plant pot
    curId = 9;
    box(172, 6, 0, 14, 14, 16, C.pot);
    tex('z', 16.02, 173, 185, 7, 19, (x, y) => tone('#5a3a22', (hash(x * 3, y * 3) - 0.5) * 0.4));
    tex('y', 20.01, 172, 186, 12, 14, () => tone(C.pot, 0.3));
    curId = 0;
  }

  /* ---------------------------------------------------------
     PER-FRAME DRAWING
     --------------------------------------------------------- */
  function drawWindow(sky) {
    curId = 3;
    const t = S.t, topC = sky.top, botC = sky.bot;
    const dayK = clamp((S.hour - 6) / 13);
    const sunX = 118 + dayK * 40, sunZ = 44 + Math.sin(dayK * Math.PI) * 32;
    const skyline = (x) => 38 + 5 + Math.floor(hash(Math.floor(x / 5), 3) * 9);
    tex('y', 0.03, 114, 162, 38, 82, (x, z) => {
      const k = (82 - z) / 44;
      let col = mix(topC, botC, k);
      if (!S.raining && S.hour < 19.3 && Math.hypot(x - sunX, z - sunZ) < 4.5) col = '#fff1b8';
      if (S.night > 0.2) {
        if (hash(Math.floor(x), Math.floor(z)) > 0.985 && Math.sin(t * 2 + x) > -0.3) col = '#e8e6ff';
        const mz = z - 72, mx = x - 150;
        if (Math.hypot(mx, mz) < 4 && Math.hypot(mx - 1.6, mz - 1) > 3) col = '#f3efd6';
      }
      if (!S.raining && S.night < 0.6) {
        for (let c = 0; c < 2; c++) {
          const cx = 110 + ((t * 1.5 + c * 30) % 70), cz = 72 - c * 10;
          const d1 = Math.hypot((x - cx) / 1.6, z - cz), d2 = Math.hypot((x - cx - 5) / 1.6, z - cz - 2);
          if (d1 < 3 || d2 < 3.4) { col = z > cz + 1 ? '#ffffff' : mix('#ffffff', botC, 0.3); break; }
        }
      }
      if (z < skyline(x)) {
        col = S.night > 0.5 ? '#161a33' : mix('#6c7a92', topC, 0.25);
        if (S.night > 0.4 && Math.floor(x) % 3 === 1 && Math.floor(z) % 3 === 0 && hash(Math.floor(x / 3), Math.floor(z / 3)) > 0.45) col = '#ffd98a';
      }
      if (S.raining && (Math.floor(x + z * 0.5 + t * 30) % 7 === 0) && hash(Math.floor(x), Math.floor(z + t * 40)) > 0.6) col = '#bcd3ff';
      const refl = x - 114 + (82 - z) * 0.7;
      if (refl > 20 && refl < 23) col = mix(col, '#ffffff', 0.35);
      return col;
    });
    // mullions
    tex('y', 0.04, 137, 139, 38, 82, (x) => tone(C.frame, x < 138 ? 0.15 : -0.1));
    tex('y', 0.04, 114, 162, 59, 61, (x, z) => tone(C.frame, z > 60 ? 0.2 : -0.1));
    // curtains + rod
    const sway = Math.sin(t * 0.8) * 0.6;
    const curtain = (a0, a1, dir) => tex('y', 0.2, a0, a1, 26, 90, (x, z) => {
      const edge = dir > 0 ? a1 - x : x - a0;
      const bulge = (z < 60 ? (60 - z) / 30 : 0) * 1.5 + sway * ((90 - z) / 64);
      if (edge < bulge) return null;
      const f = Math.sin((x - a0) * 1.4 + (90 - z) * 0.02) * 0.5 + 0.5;
      let tt = -0.2 + f * 0.3;
      if (z < 28) tt += 0.15;
      return tone(C.curtain, tt);
    });
    curtain(102, 116, 1); curtain(160, 174, -1);
    tex('y', 0.3, 100, 176, 90, 92, (x, z) => tone('#6e4c30', z > 91 ? 0.2 : -0.1));
  }

  function drawClockHands() {
    curId = 12;
    const h = S.hour % 12, m = (S.hour % 1) * 60;
    const ha = Math.PI / 2 - (h / 12) * Math.PI * 2, ma = Math.PI / 2 - (m / 60) * Math.PI * 2;
    line3([100, 0.05, 84], [100 + Math.cos(ha) * 3.6, 0.05, 84 + Math.sin(ha) * 3.6], '#1b1b22');
    line3([100, 0.05, 84], [100 + Math.cos(ma) * 5.4, 0.05, 84 + Math.sin(ma) * 5.4], '#d2461f');
  }

  const CODE_COLS = ['#7fd1b9', '#f2b84b', '#ff7a4d', '#9aa7ff', '#cfd6dd'];
  function drawScreen() {
    curId = 1;
    const on = S.screenProject >= 0 ? ART[S.screenProject] : null;
    const scroll = Math.floor(S.t * (hero.typing ? 3 : 0.6));
    tex('x', 8.02, 52, 88, 36, 58, (y, z) => {
      const u = (88 - y) / 36, v = (58 - z) / 22;
      let col;
      if (on) col = on[Math.floor(v * 24) * 32 + Math.floor(u * 32)];
      else {
        const ui = Math.floor(u * 36), vi = Math.floor(v * 22), line = vi + scroll;
        col = '#111a24';
        if (ui < 3) col = vi % 2 ? '#111a24' : '#2a3544';
        else if (vi % 2 === 0) {
          const indent = (line * 7) % 5, len = 5 + ((line * 13) % 16);
          if (ui >= 4 + indent && ui < 4 + indent + len) col = CODE_COLS[(line + (ui > indent + 9 ? 1 : 0)) % CODE_COLS.length];
          if (vi === 20 && ui === 4 + indent + len && Math.floor(S.t * 2) % 2) col = '#ffffff';
        }
      }
      if (Math.floor(z * 2) % 2 === 0) col = tone(col, -0.08);
      const gl = u * 30 + v * 10;
      if (gl > 20 && gl < 22) col = mix(col, '#ffffff', 0.18);
      return col;
    });
  }

  function drawBooks() {
    const d = SHELF.d;
    books.forEach((b) => {
      curId = 30 + b.cat;
      const pull = S.catPull[b.cat] * 5;
      const front = d + pull, x0 = b.x, x1 = b.x + b.w, z0 = b.z, z1 = b.z + b.h;
      const vis = Math.min(12, 2 * (b.top - z1) + pull);
      if (vis > 0.5) tex('z', z1, x0, x1, front - vis, front, (x) => tone(b.base, x > x1 - 1 ? -0.05 : 0.16));
      if (pull > 0.3) tex('x', x1, front - pull - 1, front, z0, z1, () => tone(b.base, -0.5));
      tex('y', front, x0, x1, z0, z1, (x, z) => {
        let t = 0;
        if (x < x0 + 1) t += 0.28; else if (x > x1 - 1) t -= 0.35;
        const fromTop = z1 - z;
        if (b.band && (Math.abs(fromTop - 3) < 0.7 || Math.abs(z - z0 - 3) < 0.7)) return b.band === '#e9c46a' ? tone(b.band, x < x0 + 1 ? 0.2 : 0) : b.band;
        if (b.title && fromTop > 5 && z - z0 > 5 && Math.abs(x - (x0 + x1) / 2) < 0.6 && Math.floor(z) % 2) return tone(b.base, 0.6);
        return tone(b.base, t);
      });
    });
    // bookend
    curId = 2;
    box(SHELF.x1 - 7, 8, 30, 3, 8, 12, '#2e3139');
  }

  function drawDeskDynamic() {
    // lamp shade glows when the lamp is on
    curId = 7;
    const shadeCol = S.lampI > 0.5 ? '#ffe39a' : '#f2b84b';
    box(8, 94, 48, 9, 9, 6, shadeCol, { top: S.lampI > 0.5 ? 0.4 : 0.12 });
    curId = 8;
    if (S.coffee > 0) tex('z', 35.5, 19, 23, 95, 99, (x, y) => tone('#5a3a22', (x + y) % 3 < 1 ? 0.2 : 0));
    // pinned user note
    if (S.userNote) {
      curId = 4;
      const n = S.userNote;
      tex('x', 0.06, n.y, n.y + 12, n.z, n.z + 11, (y, z) => {
        const lineZ = Math.floor(n.z + 8 - z);
        if (lineZ >= 0 && lineZ % 2 === 0 && lineZ < n.lines * 2 && y > n.y + 1.5 && y < n.y + 10 - ((lineZ * 5 + n.seed) % 4)) return '#2a2414';
        return tone('#ffd84d', z > n.z + 10 ? 0.2 : 0);
      });
      const [px, py] = P(0.07, n.y + 6, n.z + 10.5); dot(px, py, '#d2461f');
    }
  }

  function drawDynamic() {
    const list = [];
    list.push({ d: 128, f: () => { curId = 11; box(52, 60, 17, 4, 16, 22, C.chair, { top: 0.3 }); box(52.5, 61, 39, 3, 14, 1, tone(C.chair, 0.3)); } });
    list.push({ d: hero.x + hero.y + (hero.sit ? -2 : 0), f: drawHero });
    list.push({ d: cat.x + cat.y, f: drawCat });
    list.push({ d: 190, f: drawPlant });
    list.sort((a, b) => a.d - b.d).forEach((o) => o.f());
    curId = 0;
    parts.forEach((p) => {
      const [sx, sy] = P(p.x, p.y, p.z);
      if (p.kind === 'heart') drawSpr(HEART, sx - 4, sy - 4);
      else { dot(sx, sy, p.c); if (p.kind === 'steam') dot(sx + 1, sy, p.c); }
    });
  }
  function softShadow(x, y, rx, ry) {
    const [sx, sy] = P(x, y, 0);
    G.fillStyle = 'rgba(22,14,48,.22)';
    for (let j = -ry; j <= ry; j++) {
      const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01)));
      G.fillRect(Math.round(sx - w), Math.round(sy + j), w * 2, 1);
    }
  }
  function drawHero() {
    curId = 6;
    if (hero.sit) {
      const spr = figure({ view: 'back', sit: true, typing: hero.typing && Math.floor(S.t * 6) % 2 ? 1 : 0 });
      const [sx, sy] = P(hero.x, hero.y, 17);
      drawSpr(spr, sx - 13, sy - spr.h + 4);
      return;
    }
    softShadow(hero.x, hero.y, 8, 2);
    const walk = hero.moving ? 1 + (Math.floor(hero.anim) % 2) : 0;
    const spr = figure({ view: hero.face || hero.wave > 0 ? 'front' : 'back', walk, wave: hero.wave > 0 });
    const [sx, sy] = P(hero.x, hero.y, 0);
    drawSpr(spr, sx - 13, sy - spr.h + 2, hero.flip);
  }
  function drawCat() {
    curId = 5;
    softShadow(cat.x, cat.y, 9, 2);
    const spr = catSprite(cat.state === 'walk' ? 'walk' : cat.state, cat.state === 'walk' ? Math.floor(cat.anim) % 2 : 0);
    const [sx, sy] = P(cat.x, cat.y, 0);
    drawSpr(spr, sx - 15, sy - spr.h + 2, cat.flip);
  }
  function drawPlant() {
    curId = 9;
    const f = reduced ? 0 : Math.floor(S.t * 1.2) % 4;
    const spr = plantSprite(f, S.water >= 3);
    const [sx, sy] = P(179, 13, 16);
    drawSpr(spr, sx - 21, sy - spr.h + 4 - Math.min(S.water, 3) * 2);
  }

  /* lights: pre-rendered dithered pools */
  function makeGlow(cx, cy, rx, ry, col, strength = 1) {
    // five stepped bands, like hand-painted 32-bit light pools
    const c = mk(), x = c.getContext('2d');
    const [r, gg, b, a] = col.match(/[\d.]+/g).map(Number);
    for (let y = Math.max(0, Math.floor(cy - ry)); y < Math.min(WH, cy + ry); y++) {
      for (let xx = Math.max(0, Math.floor(cx - rx)); xx < Math.min(WW, cx + rx); xx++) {
        const I = clamp((1 - Math.hypot((xx - cx) / rx, (y - cy) / ry)) * strength);
        if (I <= 0) continue;
        const q = Math.ceil(I * 5) / 5;
        x.fillStyle = `rgba(${r},${gg},${b},${(a * q).toFixed(3)})`;
        x.fillRect(xx, y, 1, 1);
      }
    }
    return c;
  }
  let lampGlow, lampCore, screenGlow;
  function buildGlows() {
    const [lx, ly] = P(22, 96, 14); lampGlow = makeGlow(lx, ly, 84, 46, 'rgba(255,170,90,0.30)', 1);
    const [hx, hy] = P(12, 98, 46); lampCore = makeGlow(hx, hy, 20, 14, 'rgba(255,214,140,0.45)', 1);
    const [mx, my] = P(20, 70, 40); screenGlow = makeGlow(mx, my, 36, 22, 'rgba(120,180,255,0.22)', 1);
  }

  function render() {
    const sky = skyAt(S.hour);
    target(g0, idMap); curId = 0;
    g0.globalCompositeOperation = 'source-over'; g0.globalAlpha = 1;
    g0.clearRect(0, 0, WW, WH);
    g0.drawImage(baseC, 0, 0);
    idMap.set(baseIds);

    // sunbeam (moonbeam at night) on the floor, under the furniture
    const dayBeam = clamp((S.hour - 7) / 1.2) * clamp((18.6 - S.hour) / 1.4) * (S.raining ? 0.35 : 1);
    const beam = Math.max(dayBeam, S.night * 0.35 * (S.raining ? 0.3 : 1));
    if (beam > 0.02) {
      const tt = clamp((S.hour - 7) / 11.5);
      const m = S.night > 0.5 ? 0.3 : lerp(-1.1, 1.1, tt), kk = S.night > 0.5 ? 1.6 : lerp(2.4, 0.9, Math.sin(tt * Math.PI));
      S.beamGeo = { m, kk };
      let poly = [[114 + 38 * m, 38 * kk], [162 + 38 * m, 38 * kk], [162 + 82 * m, 82 * kk], [114 + 82 * m, 82 * kk]];
      poly = clipRect(poly, 0, 0, R, R);
      if (poly.length > 2) {
        g0.globalAlpha = 0.42 * beam;
        const col = S.night > 0.5 ? '#b8c8ff' : '#fff4c8';
        g0.fillStyle = col;
        scan(poly.map(([x, y]) => P(x, y, 0.05)), (y, x0, x1) => { for (let x = x0; x < x1; x++) if ((x + y) % 2 === 0) g0.fillRect(x, y, 1, 1); });
        g0.globalAlpha = 1;
      }
    } else S.beamGeo = null;

    g0.drawImage(furnC, 0, 0);
    for (let i = 0; i < furnIds.length; i++) if (furnIds[i]) idMap[i] = furnIds[i];

    drawWindow(sky);
    drawClockHands();
    drawScreen();
    drawBooks();
    drawDeskDynamic();
    drawDynamic();

    // dust motes floating in the sunbeam
    if (S.beamGeo && dayBeam > 0.2 && !reduced) {
      const { m, kk } = S.beamGeo;
      curId = 0;
      motes.forEach((p) => {
        p.t = (p.t + p.s * 0.016) % 1;
        const wx = 114 + p.u * 48, wz = 38 + p.w * 44;
        const x = wx + m * wz * p.t, y = wz * kk * p.t, z = wz * (1 - p.t) + Math.sin(S.t + p.u * 9) * 1.5;
        if (x > 0 && x < R && y > 0 && y < R) { const [sx, sy] = P(x, y, z); g0.globalAlpha = 0.55 * dayBeam; dot(sx, sy, '#fff6d8'); g0.globalAlpha = 1; }
      });
    }
    curId = 0;

    // tint (multiply), lights (add), then restore transparency with the mask
    mg.clearRect(0, 0, WW, WH); mg.drawImage(world, 0, 0);
    g0.globalCompositeOperation = 'multiply';
    g0.fillStyle = S.raining ? mix(sky.tint, '#9aa4b8', 0.35) : sky.tint;
    g0.fillRect(0, 0, WW, WH);
    g0.globalCompositeOperation = 'lighter';
    if (S.lampI > 0.01) { g0.globalAlpha = S.lampI; g0.drawImage(lampGlow, 0, 0); g0.drawImage(lampCore, 0, 0); }
    if (S.night > 0.05) { g0.globalAlpha = S.night * 0.9; g0.drawImage(screenGlow, 0, 0); }
    g0.globalAlpha = 1;
    g0.globalCompositeOperation = 'destination-in';
    g0.drawImage(maskC, 0, 0);
    g0.globalCompositeOperation = 'source-over';

    // outlines: hovered object (white) and object highlighted from the page (gold)
    const outline = (h, col) => {
      if (!h) return;
      g0.fillStyle = col;
      for (let y = 1; y < WH - 1; y++) {
        const row = y * WW;
        for (let x = 1; x < WW - 1; x++) {
          const i = row + x;
          if (idMap[i] === h) continue;
          if (idMap[i - 1] === h || idMap[i + 1] === h || idMap[i - WW] === h || idMap[i + WW] === h) g0.fillRect(x, y, 1, 1);
        }
      }
    };
    outline(S.forced && S.forced !== S.hover ? S.forced : 0, '#ffd166');
    outline(S.hover, '#ffffff');
    return sky;
  }

  /* ---------------------------------------------------------
     SIMULATION
     --------------------------------------------------------- */
  const SPOTS = [
    { x: 134, y: 28, sit: false, face: false },
    { x: 45, y: 68, sit: true },
    { x: 45, y: 68, sit: true, typing: true },
    { x: 52, y: 34, sit: false, face: false },
    { x: 46, y: 96, sit: false, face: false, flip: true },
    { x: 20, y: 152, sit: false, face: false, flip: true },
  ];
  function routeTo(ch) {
    const s = SPOTS[ch];
    const pts = [];
    if (hero.sit) pts.push({ x: 64, y: 84 });
    pts.push({ x: 100, y: 104 });
    if (s.sit) pts.push({ x: 64, y: 84 });
    pts.push({ x: s.x, y: s.y });
    hero.sit = false; hero.typing = false;
    hero.path = pts; hero.spot = s;
    if (reduced) { hero.path = []; arrive(s); }
  }
  function arrive(s) {
    hero.x = s.x; hero.y = s.y;
    hero.sit = !!s.sit; hero.typing = !!s.typing; hero.face = !!s.face; hero.flip = !!s.flip; hero.moving = false;
  }
  function updateHero(dt) {
    if (hero.wave > 0) hero.wave -= dt;
    const next = hero.path[0];
    if (!next) { hero.moving = false; return; }
    const dx = next.x - hero.x, dy = next.y - hero.y, dist = Math.hypot(dx, dy);
    const step = 56 * dt;
    hero.moving = true;
    hero.anim += dt * 7;
    hero.face = dx + dy > 0;
    if (Math.abs(dx - dy) > 0.1) hero.flip = dx - dy < 0;
    if (dist <= step) {
      hero.x = next.x; hero.y = next.y; hero.path.shift();
      if (!hero.path.length) arrive(hero.spot);
    } else { hero.x += dx / dist * step; hero.y += dy / dist * step; }
  }
  function updateCat(dt) {
    cat.purr = Math.max(0, cat.purr - dt);
    if (S.night > 0.7 && cat.state !== 'sleep' && cat.purr === 0) { cat.tx = 116; cat.ty = 128; cat.state = 'walk'; cat.goSleep = true; }
    if (cat.state === 'walk') {
      const dx = cat.tx - cat.x, dy = cat.ty - cat.y, d = Math.hypot(dx, dy);
      const step = 26 * dt;
      cat.anim += dt * 7;
      if (Math.abs(dx - dy) > 0.1) cat.flip = dx - dy < 0;
      if (d <= step) { cat.x = cat.tx; cat.y = cat.ty; cat.state = cat.goSleep ? 'sleep' : 'sit'; cat.timer = 2 + Math.random() * 4; }
      else { cat.x += dx / d * step; cat.y += dy / d * step; }
    } else if (cat.state === 'sit') {
      cat.timer -= dt;
      if (cat.timer <= 0) { cat.tx = 70 + Math.random() * 110; cat.ty = 50 + Math.random() * 130; cat.state = 'walk'; }
    } else if (cat.state === 'sleep') {
      if (S.night < 0.5) { cat.goSleep = false; cat.state = 'sit'; cat.timer = 1; }
      if (Math.random() < dt * 0.6) parts.push({ kind: 'z', x: cat.x, y: cat.y, z: 14, vz: 8, life: 1.4, c: '#e8e6ff' });
    }
  }
  function updateParts(dt) {
    if (S.coffee > 0 && Math.random() < dt * 4) parts.push({ kind: 'steam', x: 21 + Math.random(), y: 97, z: 38, vz: 12, life: 1.4, c: 'rgba(255,255,255,.7)' });
    parts = parts.filter((p) => {
      p.life -= dt; p.z += (p.vz || 0) * dt;
      if (p.vx) p.x += p.vx * dt;
      if (p.vy) p.y += p.vy * dt;
      if (p.g) p.vz -= p.g * dt;
      if (p.kind === 'steam') p.x += Math.sin(S.t * 3 + p.z) * dt * 3;
      return p.life > 0 && p.z > -1;
    });
    KNOWLEDGE.forEach((_, i) => {
      const want = i === S.pullCat ? 1 : 0;
      S.catPull[i] += (want - S.catPull[i]) * Math.min(1, dt * (reduced ? 60 : 9));
    });
  }

  /* ---------------------------------------------------------
     DISPLAY / CAMERA
     --------------------------------------------------------- */
  const sceneEl = $('#scene');
  const view = $('#view');
  const vctx = view.getContext('2d');
  let VW = 1, VH = 1, dpr = 1;
  const CAMS = [
    { x: 256, y: 186, z: 1 },
    { x: 214, y: 150, z: 2.1 },
    { x: 194, y: 130, z: 3.1 },
    { x: 298, y: 120, z: 2.3 },
    { x: 184, y: 104, z: 2.5 },
    { x: 176, y: 172, z: 1.6 },
    { x: 176, y: 172, z: 1.6 },
  ];
  const cam = { x: 256, y: 186, z: 1 };
  const mouse = { x: 0.5, y: 0.5, inside: false, px: 0, py: 0 };
  let fitScale = 1, drawX = 0, drawY = 0, scale = 1;
  const resize = () => {
    const r = sceneEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    VW = Math.max(1, Math.round(r.width * dpr)); VH = Math.max(1, Math.round(r.height * dpr));
    view.width = VW; view.height = VH;
    fitScale = Math.min(VW / 424, VH / 336);
  };
  new ResizeObserver(resize).observe(sceneEl);

  function present(sky) {
    vctx.imageSmoothingEnabled = false;
    vctx.fillStyle = sky.back;
    vctx.fillRect(0, 0, VW, VH);
    scale = fitScale * cam.z;
    drawX = VW / 2 - cam.x * scale;
    drawY = VH / 2 - cam.y * scale;
    const [fx, fy] = P(R / 2, R / 2, -SLAB);
    vctx.fillStyle = 'rgba(0,0,0,.10)';
    vctx.beginPath();
    vctx.ellipse(drawX + fx * scale, drawY + (fy + 16) * scale, 200 * scale, 58 * scale, 0, 0, Math.PI * 2);
    vctx.fill();
    vctx.drawImage(world, 0, 0, WW, WH, Math.round(drawX), Math.round(drawY), Math.round(WW * scale), Math.round(WH * scale));
  }
  const toScreen = (x, y, z) => { const [sx, sy] = P(x, y, z); return [(drawX + sx * scale) / dpr, (drawY + sy * scale) / dpr]; };

  /* ---------------------------------------------------------
     SCROLL -> TIME + CAMERA
     --------------------------------------------------------- */
  const chapters = $$('.ch');
  const navLinks = $$('.sched a');
  let camTarget = CAMS[0];
  function readScroll() {
    const mobile = innerWidth <= 900;
    const lineY = innerHeight * (mobile ? 0.72 : 0.5);
    const rects = chapters.map((c) => c.getBoundingClientRect());
    let i = 0;
    rects.forEach((r, k) => { if (r.top <= lineY) i = k; });
    const next = rects[i + 1] ? rects[i + 1].top : rects[i].bottom;
    const frac = clamp((lineY - rects[i].top) / Math.max(1, next - rects[i].top));
    S.hour = lerp(CH_HOURS[i], CH_HOURS[i + 1], frac);
    const kk = ease(clamp((frac - 0.55) / 0.45));
    const a = CAMS[i], b = CAMS[i + 1];
    camTarget = { x: lerp(a.x, b.x, kk), y: lerp(a.y, b.y, kk), z: lerp(a.z, b.z, kk) };
    if (i !== S.ch) { S.ch = i; onChapter(i); }
  }
  function onChapter(i) {
    navLinks.forEach((a) => a.classList.toggle('is-now', +a.dataset.ch === i));
    routeTo(i);
    say(BUBBLES[i], 3600, 900);
    if (i !== 2) S.screenProject = -1;
    else if (S.screenProject < 0) S.screenProject = 0;
  }

  /* ---------------------------------------------------------
     SPEECH BUBBLE + TOOLTIP
     --------------------------------------------------------- */
  const bubble = $('#bubble');
  let bubbleT = 0, bubbleTimer = null;
  function say(text, ms = 3000, delay = 0) {
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.textContent = text;
      bubble.hidden = false;
      bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '';
      bubbleT = ms / 1000;
    }, delay);
  }
  function placeBubble(dt) {
    if (bubble.hidden) return;
    bubbleT -= dt;
    if (bubbleT <= 0) { bubble.hidden = true; return; }
    const [x, y] = toScreen(hero.x, hero.y, hero.sit ? 50 : 54);
    bubble.style.left = `${x}px`; bubble.style.top = `${y}px`;
  }

  const tip = $('#tip'), tipName = $('#tip-name'), tipHint = $('#tip-hint');
  const jobRows = $$('.job');
  const OBJ = {
    1: { name: 'Monitor', hint: () => 'See the work', act: () => go('work') },
    2: { name: 'Bookshelf', hint: () => 'Open the library', act: () => go('knowledge') },
    3: { name: 'Window', hint: () => (S.raining ? 'Stop the rain' : 'Make it rain'), act: () => toggleRain() },
    4: { name: 'Corkboard', hint: () => 'Leave a note', act: () => go('contact') },
    5: { name: 'The cat', hint: () => 'Pet', act: () => petCat() },
    6: { name: 'Your Name', hint: () => 'Say hi', act: () => wave() },
    7: { name: 'Desk lamp', hint: () => (S.lampI > 0.5 ? 'Turn off' : 'Turn on'), act: () => toggleLamp() },
    8: { name: 'Coffee', hint: () => (S.coffee > 0 ? 'Take a sip' : 'Refill'), act: () => coffee() },
    9: { name: 'Plant', hint: () => 'Water it', act: () => water() },
    10: { name: 'Desk', hint: () => 'About me', act: () => go('about') },
    11: { name: 'Chair', hint: () => 'About me', act: () => go('about') },
    12: { name: 'Wall clock', hint: () => `It’s ${fmtTime(S.hour)}`, act: () => say(`It’s ${fmtTime(S.hour)}. Keep scrolling to pass the time.`, 2600) },
  };
  jobRows.forEach((row, j) => {
    OBJ[20 + j] = { name: `${$('.job-role', row).textContent} · ${$('.job-date', row).textContent}`, hint: () => 'Read this chapter', act: () => { go('log'); openJob(j, true); } };
  });
  KNOWLEDGE.forEach((k, i) => {
    OBJ[30 + i] = { name: k.name, hint: () => `${k.books.length} books · ${k.level}`, act: () => { go('knowledge'); openCat(i, true); } };
  });
  const pick = () => {
    if (!mouse.inside) return 0;
    const wx = Math.floor((mouse.px * dpr - drawX) / scale), wy = Math.floor((mouse.py * dpr - drawY) / scale);
    if (wx < 0 || wy < 0 || wx >= WW || wy >= WH) return 0;
    return idMap[wy * WW + wx];
  };
  sceneEl.addEventListener('pointermove', (e) => {
    const r = sceneEl.getBoundingClientRect();
    mouse.px = e.clientX - r.left; mouse.py = e.clientY - r.top;
    mouse.x = mouse.px / r.width; mouse.y = mouse.py / r.height; mouse.inside = true;
  });
  sceneEl.addEventListener('pointerleave', () => {
    mouse.inside = false; S.hover = 0; tip.hidden = true; sceneEl.classList.remove('is-hot');
    if (S.pullFromScene) { S.pullCat = -1; S.pullFromScene = false; }
  });
  view.addEventListener('click', () => { const id = pick(); if (OBJ[id]) OBJ[id].act(); });

  function updateHover() {
    const id = pick();
    if (id !== S.hover) {
      S.hover = id;
      sceneEl.classList.toggle('is-hot', !!OBJ[id]);
      if (id >= 30 && id < 30 + KNOWLEDGE.length) { S.pullCat = id - 30; S.pullFromScene = true; }
      else if (S.pullFromScene) { S.pullCat = -1; S.pullFromScene = false; }
    }
    if (OBJ[id] && fine) {
      tip.hidden = false;
      tipName.textContent = OBJ[id].name;
      tipHint.textContent = OBJ[id].hint();
      const maxX = sceneEl.clientWidth - tip.offsetWidth - 20;
      tip.style.left = `${Math.min(mouse.px, maxX)}px`;
      tip.style.top = `${mouse.py}px`;
    } else tip.hidden = true;
  }

  /* ---------------------------------------------------------
     ACTIONS
     --------------------------------------------------------- */
  const fmtTime = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  const go = (id) => document.getElementById(id).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const btnLamp = $('#act-lamp'), btnRain = $('#act-rain');
  function toggleRain() { S.raining = !S.raining; btnRain.setAttribute('aria-pressed', String(S.raining)); if (S.raining) say('Rainy day. Perfect for focus.', 2400); }
  function toggleLamp() { const on = S.lampI > 0.5; S.lampManual = !on; btnLamp.setAttribute('aria-pressed', String(!on)); }
  function petCat() {
    S.pets++;
    cat.purr = 2.2;
    if (cat.state === 'walk') { cat.state = 'sit'; cat.timer = 2.5; }
    for (let i = 0; i < 3; i++) parts.push({ kind: 'heart', x: cat.x + (Math.random() - 0.5) * 8, y: cat.y, z: 16 + i * 5, vz: 18, life: 1 + i * 0.2 });
    if (S.pets === 5) say('You have made a friend for life.', 2600);
  }
  function wave() { hero.wave = 1.1; say(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)], 2600); }
  function coffee() {
    if (S.coffee > 0) { S.coffee--; say(S.coffee ? 'Mm. Still warm.' : 'Out of coffee. Click again to refill.', 2200); }
    else { S.coffee = 3; for (let i = 0; i < 8; i++) parts.push({ kind: 'steam', x: 21, y: 97, z: 38, vz: 16 + i * 2, life: 1.2, c: 'rgba(255,255,255,.8)' }); }
  }
  function water() {
    S.water++;
    for (let i = 0; i < 10; i++) parts.push({ kind: 'drop', x: 179 + (Math.random() - 0.5) * 12, y: 13 + (Math.random() - 0.5) * 12, z: 56 + Math.random() * 8, vz: 0, g: 120, life: 0.8, c: '#8fd3ff' });
    if (S.water === 3) say('It bloomed!', 2200);
  }
  btnLamp.addEventListener('click', toggleLamp);
  btnRain.addEventListener('click', toggleRain);
  $('#act-cat').addEventListener('click', petCat);
  $('#act-plant').addEventListener('click', water);

  /* ---------------------------------------------------------
     STORY UI
     --------------------------------------------------------- */
  const themeBtn = $('#theme');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const savedTheme = store.get('sh-theme');
  if (savedTheme && !root.dataset.theme) root.dataset.theme = savedTheme;
  const syncTheme = () => themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  syncTheme();
  themeBtn.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; store.set('sh-theme', root.dataset.theme); syncTheme(); });

  // works
  const worksEl = $('#works');
  worksEl.innerHTML = PROJECTS.map((p, i) => `
    <li class="work">
      <button class="work-row" data-i="${i}" aria-expanded="false" aria-controls="w${i}">
        <span class="work-year">${p.year}</span>
        <span class="work-title">${p.title}</span>
        <span class="work-type">${p.type}</span>
        <span class="work-arrow" aria-hidden="true"></span>
      </button>
      <div class="work-body" id="w${i}"><div class="work-inner"><div class="work-grid">
        <canvas class="work-thumb" width="32" height="24" data-i="${i}" aria-hidden="true"></canvas>
        <div>
          <p class="work-desc">${p.desc}</p>
          <dl class="work-meta"><div><dt>Role</dt><dd>${p.role}</dd></div><div><dt>Stack</dt><dd>${p.stack}</dd></div></dl>
          <a class="link" href="#" data-placeholder>Read the case study</a>
        </div>
      </div></div></div>
    </li>`).join('');
  $$('.work-thumb').forEach((c) => paintArt(c, +c.dataset.i));
  const peek = $('#peek'), peekCanvas = $('#peek-canvas'), peekLabel = $('#peek-label');
  $$('.work').forEach((li) => {
    const btn = $('.work-row', li), i = +btn.dataset.i;
    btn.addEventListener('mouseenter', () => {
      S.screenProject = i; S.forced = 1;
      if (!fine || reduced) return;
      paintArt(peekCanvas, i);
      peekLabel.textContent = `${PROJECTS[i].type} · ${PROJECTS[i].year} · now on the monitor`;
      peek.classList.add('is-on');
    });
    btn.addEventListener('mousemove', (e) => { peek.style.left = `${e.clientX + 150}px`; peek.style.top = `${e.clientY}px`; });
    btn.addEventListener('mouseleave', () => { peek.classList.remove('is-on'); S.forced = 0; });
    btn.addEventListener('focus', () => { S.screenProject = i; });
    btn.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      S.screenProject = i;
      peek.classList.remove('is-on');
    });
  });

  // library (knowledge)
  const libEl = $('#library');
  libEl.innerHTML = KNOWLEDGE.map((k, i) => `
    <li class="kcat${i === 0 ? ' is-open' : ''}" style="--c:${k.color}">
      <button class="kcat-row" aria-expanded="${i === 0}" aria-controls="k${i}">
        <span class="spines" aria-hidden="true">${k.books.map((_, b) => `<i style="height:${60 + ((b * 37) % 40)}%"></i>`).join('')}</span>
        <span class="kcat-main"><span class="kcat-name">${k.name}</span><span class="kcat-count">${k.books.length} books</span></span>
        <span class="kcat-level">${k.level}</span>
        <span class="job-sign" aria-hidden="true"></span>
      </button>
      <div class="kcat-body" id="k${i}"><div class="kcat-inner">
        <p>${k.desc}</p>
        <ul class="books">${k.books.map((b) => `<li>${b}</li>`).join('')}</ul>
      </div></div>
    </li>`).join('');
  const cats = $$('.kcat');
  function openCat(i, only = false) {
    cats.forEach((row, k) => {
      const open = only ? k === i : (k === i ? !row.classList.contains('is-open') : row.classList.contains('is-open'));
      row.classList.toggle('is-open', open);
      $('.kcat-row', row).setAttribute('aria-expanded', String(open));
    });
    if (only) { const r = cats[i]; r.classList.remove('is-flash'); void r.offsetWidth; r.classList.add('is-flash'); }
    S.pullCat = i; S.pullFromScene = false;
  }
  cats.forEach((row, i) => {
    const btn = $('.kcat-row', row);
    btn.addEventListener('click', () => openCat(i));
    row.addEventListener('mouseenter', () => { S.pullCat = i; S.pullFromScene = false; S.forced = 30 + i; });
    row.addEventListener('mouseleave', () => { S.forced = 0; });
    btn.addEventListener('focus', () => { S.pullCat = i; });
  });

  // logbook (framed jobs)
  function openJob(j, only = false) {
    jobRows.forEach((row, k) => {
      const open = only ? k === j : (k === j ? !row.classList.contains('is-open') : row.classList.contains('is-open'));
      row.classList.toggle('is-open', open);
      $('.job-row', row).setAttribute('aria-expanded', String(open));
    });
  }
  jobRows.forEach((row, j) => {
    const btn = $('.job-row', row);
    btn.addEventListener('click', () => openJob(j));
    row.addEventListener('mouseenter', () => { S.forced = 20 + j; });
    row.addEventListener('mouseleave', () => { S.forced = 0; });
  });

  $$('[data-placeholder]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); say('That link is a placeholder for now.', 2200); }));
  $('#copy').addEventListener('click', async () => {
    const email = $('#email').textContent, b = $('#copy');
    try { await navigator.clipboard.writeText(email); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents($('#email')); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1800);
  });
  const nName = $('#n-name'), nMsg = $('#n-msg'), noteText = $('#note-text'), noteSig = $('#note-sig'), notePrev = $('#note-preview');
  const syncNote = () => {
    noteText.textContent = nMsg.value.trim() || 'Your note shows up here…';
    noteSig.textContent = `— ${nName.value.trim() || 'you'}`;
    notePrev.classList.remove('is-pinned');
  };
  nName.addEventListener('input', syncNote);
  nMsg.addEventListener('input', syncNote);
  $('#note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = nMsg.value.trim();
    if (!msg) return;
    S.userNote = { y: 160, z: 44, lines: Math.min(4, 1 + Math.floor(msg.length / 25)), seed: msg.length };
    notePrev.classList.add('is-pinned');
    $('#note-status').textContent = 'Pinned to the board in the room. This form is a demo, so nothing was sent yet.';
    say('Thanks for the note!', 2600);
  });
  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     LOOP
     --------------------------------------------------------- */
  const clockEl = $('#clock'), clockLabel = $('#clock-label'), dayDot = $('#daydot'), dayFill = $('#dayfill');
  let last = 0, lastLabel = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    S.t += dt;
    readScroll();
    S.night = clamp((S.hour - 19) / 1.5);
    const lampAuto = S.hour >= 18 ? 1 : 0;
    const lampTarget = S.lampManual === null ? lampAuto : (S.lampManual ? 1 : 0);
    if (S.lampManual !== null && lampTarget === lampAuto) S.lampManual = null;
    S.lampI += (lampTarget - S.lampI) * Math.min(1, dt * 6);
    btnLamp.setAttribute('aria-pressed', String(lampTarget === 1));

    updateHero(dt); updateCat(dt); updateParts(dt);
    const k = reduced ? 1 : Math.min(1, dt * 5);
    const px = mouse.inside && fine ? (mouse.x - 0.5) * 20 / cam.z : 0;
    const py = mouse.inside && fine ? (mouse.y - 0.5) * 12 / cam.z : 0;
    cam.x += (camTarget.x + px - cam.x) * k;
    cam.y += (camTarget.y + py - cam.y) * k;
    cam.z += (camTarget.z - cam.z) * k;

    const sky = render();
    present(sky);
    updateHover();
    placeBubble(dt);

    clockEl.textContent = fmtTime(S.hour);
    const label = `${dayPart(S.hour)} · ${S.raining ? 'Rain' : S.night > 0.5 ? 'Clear night' : 'Clear'}`;
    if (label !== lastLabel) { clockLabel.textContent = label; lastLabel = label; }
    const dp = clamp((S.hour - 6) / 18) * 100;
    dayDot.style.left = `${dp}%`; dayFill.style.width = `${dp}%`;
    sceneEl.style.background = sky.back;
    requestAnimationFrame(frame);
  }

  function clipRect(poly, x0, y0, x1, y1) {
    const clip = (pts, inside, inter) => {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const ia = inside(a), ib = inside(b);
        if (ia) out.push(a);
        if (ia !== ib) out.push(inter(a, b));
      }
      return out;
    };
    const ix = (x) => (a, b) => { const t2 = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + (b[1] - a[1]) * t2]; };
    const iy = (y) => (a, b) => { const t2 = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t2, y]; };
    poly = clip(poly, (p) => p[0] >= x0, ix(x0));
    poly = clip(poly, (p) => p[0] <= x1, ix(x1));
    poly = clip(poly, (p) => p[1] >= y0, iy(y0));
    poly = clip(poly, (p) => p[1] <= y1, iy(y1));
    return poly;
  }
  function mulberry(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t2 = Math.imul(a ^ (a >>> 15), 1 | a); t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2; return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296; };
  }

  // boot
  buildBase();
  buildFurniture();
  buildGlows();
  target(g0, idMap);
  resize();
  readScroll();
  arrive(SPOTS[S.ch]);
  navLinks.forEach((a) => a.classList.toggle('is-now', +a.dataset.ch === S.ch));
  cam.x = camTarget.x; cam.y = camTarget.y; cam.z = camTarget.z;
  say(BUBBLES[S.ch], 3600, 1200);
  requestAnimationFrame(frame);
})();
