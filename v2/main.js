/* =========================================================
   STUDIO HOURS — portfolio v2
   Hand-rolled isometric pixel renderer. Scroll = time of day.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------------------------------------------------------
     CONTENT — placeholder projects (edit these)
     --------------------------------------------------------- */
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', layout: 'hero',
      desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Web', year: '2025', role: 'Design & Development', stack: 'Astro, GSAP', layout: 'grid',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: 'Game', year: '2025', role: 'Art Direction', stack: 'Aseprite, Godot', layout: 'game',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Brand', year: '2024', role: 'Visual Identity', stack: 'Illustrator, Figma', layout: 'brand',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Product', year: '2023', role: 'Product Designer', stack: 'Figma, Framer', layout: 'dash',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'Web', year: '2022', role: 'Frontend', stack: 'Three.js, WebGL', layout: 'grid',
      desc: 'One or two sentences about what this was and why it mattered.' },
  ];
  const ART_PALS = [
    ['#f4efe6', '#1d2433', '#e2502a', '#2f6fed'],
    ['#101820', '#e8eef2', '#7fd1b9', '#f2b84b'],
    ['#8fd3ff', '#1b2a41', '#5fb36b', '#ffd166'],
    ['#ffd84d', '#1b1b22', '#e2502a', '#ffffff'],
    ['#e9e3f5', '#2a2140', '#8a5bff', '#ff7aa8'],
    ['#1b1f3a', '#f4f1ea', '#ff6a3d', '#46c2ff'],
  ];

  const CH_HOURS = [7.5, 10, 13.5, 18.25, 22.5, 23.75];
  const BUBBLES = [
    'Morning. Coffee first, then pixels.',
    'Welcome to my desk. Poke around.',
    'Hover a project to put it on screen.',
    'Each book on this shelf is a job.',
    'Leave me a note on the board.',
  ];
  const IDLE_LINES = ['Hi! I’m Your Name.', 'The cat is the real boss here.', 'Try clicking the window.', 'The lamp works, by the way.', 'Water the plant a few times.'];

  /* ---------------------------------------------------------
     WORLD + RASTERIZER
     --------------------------------------------------------- */
  const WW = 256, WH = 184, OX = 128, OY = 66, R = 96, WALL = 50;
  const world = document.createElement('canvas'); world.width = WW; world.height = WH;
  const g = world.getContext('2d');
  const maskC = document.createElement('canvas'); maskC.width = WW; maskC.height = WH;
  const mg = maskC.getContext('2d');
  const idMap = new Uint8Array(WW * WH);
  let curId = 0;

  const P = (x, y, z) => [OX + x - y, OY + (x + y) / 2 - z];

  function fillPoly(pts, col) {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const y0 = Math.max(0, Math.ceil(minY - 0.5)), y1 = Math.min(WH - 1, Math.ceil(maxY - 0.5) - 1);
    g.fillStyle = col;
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
      if (xr < xl) continue;
      const x0 = Math.max(0, Math.ceil(xl - 0.5)), x1 = Math.min(WW, Math.ceil(xr - 0.5));
      if (x1 <= x0) continue;
      g.fillRect(x0, y, x1 - x0, 1);
      if (curId) idMap.fill(curId, y * WW + x0, y * WW + x1);
    }
  }
  // same, but only lights every other pixel (checker dither)
  function ditherPoly(pts, col, phase = 0) {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const y0 = Math.max(0, Math.ceil(minY - 0.5)), y1 = Math.min(WH - 1, Math.ceil(maxY - 0.5) - 1);
    g.fillStyle = col;
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
      for (let x = x0; x < x1; x++) if ((x + y + phase) % 2 === 0) g.fillRect(x, y, 1, 1);
    }
  }

  const faceZ = (z, x0, x1, y0, y1, c) => fillPoly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], c);
  const faceX = (x, y0, y1, z0, z1, c) => fillPoly([P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1)], c);
  const faceY = (y, x0, x1, z0, z1, c) => fillPoly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], c);
  function box(x, y, z, w, d, h, c) {
    faceY(y + d, x, x + w, z, z + h, shade(c, -0.14));
    faceX(x + w, y, y + d, z, z + h, shade(c, -0.3));
    faceZ(z + h, x, x + w, y, y + d, c);
  }
  const dot = (x, y, c) => {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= WW || y >= WH) return;
    g.fillStyle = c; g.fillRect(x, y, 1, 1);
    if (curId) idMap[y * WW + x] = curId;
  };

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
  const shadeCache = new Map();
  function shade(hex, f) {
    const k = hex + f;
    let v = shadeCache.get(k);
    if (v) return v;
    const [r, gg, b] = rgb(hex), m = 1 + f;
    v = `rgb(${clamp(Math.round(r * m), 0, 255)},${clamp(Math.round(gg * m), 0, 255)},${clamp(Math.round(b * m), 0, 255)})`;
    shadeCache.set(k, v);
    return v;
  }
  const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map((i) => Math.round(lerp(A[i], B[i], k)).toString(16).padStart(2, '0')).join(''); };

  /* ---------------------------------------------------------
     SPRITES
     --------------------------------------------------------- */
  function sprite(rows, pal) {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    rows = rows.map((r) => r.padEnd(w, '.'));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    rows.forEach((r, j) => { for (let i = 0; i < w; i++) { const ch = r[i]; if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } } });
    return { c, w, h, rows };
  }
  function drawSprite(s, x, y, flip = false) {
    x = Math.round(x); y = Math.round(y);
    if (flip) { g.save(); g.translate(x + s.w, y); g.scale(-1, 1); g.drawImage(s.c, 0, 0); g.restore(); }
    else g.drawImage(s.c, x, y);
    if (!curId) return;
    for (let j = 0; j < s.h; j++) {
      const yy = y + j; if (yy < 0 || yy >= WH) continue;
      const row = s.rows[j];
      for (let i = 0; i < s.w; i++) {
        if (row[flip ? s.w - 1 - i : i] === '.') continue;
        const xx = x + i; if (xx >= 0 && xx < WW) idMap[yy * WW + xx] = curId;
      }
    }
  }

  const HERO_PAL = { h: '#2d1f1c', s: '#f1c09a', e: '#1b1b22', r: '#e98a7a', t: '#d2461f', p: '#283347', k: '#15171c', w: '#f4f1ea' };
  const top8 = ['...hhh...', '..hhhhh..', '.hhhhhhh.', '.hsssssh.', '.ssesess.', '.sssssss.', '..ssrss..', '...sss...'];
  const back8 = ['...hhh...', '..hhhhh..', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '..hhhhh..', '...sss...'];
  const torso = ['..ttttt..', '.ttttttt.', 'ttttttttt', 't.ttttt.t', 't.ttttt.t', 's.ttttt.s'];
  const legsStand = ['..ppppp..', '..ppppp..', '..pp.pp..', '..pp.pp..', '..pp.pp..', '..pp.pp..', '..kk.kk..', '.kkk.kkk.'];
  const legsA = ['..ppppp..', '..ppppp..', '..pp.pp..', '.pp...pp.', '.pp...pp.', '.pp...pp.', '.kk...kk.', 'kkk...kkk'];
  const legsB = ['..ppppp..', '..ppppp..', '...ppp...', '...ppp...', '...ppp...', '...ppp...', '...kkk...', '..kkkk...'];
  const waveTorso = ['..ttttt.s', '.tttttttt', 'tttttttt.', 't.ttttt..', 't.ttttt..', 's.ttttt..'];
  const SPR = {};
  const buildSprites = () => {
    SPR.front = sprite([...top8, ...torso, ...legsStand], HERO_PAL);
    SPR.frontA = sprite([...top8, ...torso, ...legsA], HERO_PAL);
    SPR.frontB = sprite([...top8, ...torso, ...legsB], HERO_PAL);
    SPR.back = sprite([...back8, ...torso, ...legsStand], HERO_PAL);
    SPR.backA = sprite([...back8, ...torso, ...legsA], HERO_PAL);
    SPR.backB = sprite([...back8, ...torso, ...legsB], HERO_PAL);
    SPR.wave = sprite([...top8, ...waveTorso, ...legsStand], HERO_PAL);
    SPR.sit = sprite([...back8, ...torso, '..ppppp..'], HERO_PAL);
    SPR.sitType = sprite([...back8, ...torso.slice(0, 5), '.st.t.ts.', '..ppppp..'], HERO_PAL);
    const CAT = { k: '#3a3a48', y: '#ffd166', p: '#f29bb0' };
    SPR.cat = sprite(['......k.k.', 'k.....kkk.', 'k.....kykk', '.kkkkkkkk.', '.kkkkkkkk.', '.k.k..k.k.'], CAT);
    SPR.cat2 = sprite(['......k.k.', '.k....kkk.', '.k....kykk', '.kkkkkkkk.', '.kkkkkkkk.', '..k.kk.k..'], CAT);
    SPR.catSleep = sprite(['..........', '..........', '...kkkkk..', '.kkkkkkkkk', 'kkkkkkkkkk', '.kkkkkkkk.'], CAT);
    SPR.heart = sprite(['.p.p.', 'ppppp', '.ppp.', '..p..'], CAT);
    SPR.plant = sprite([
      '....l......', '...lgl..l..', '..lggl.lgl.', '...lgglggl.', '.l..lggggl.', 'lgl..lggl..',
      'lggl.lgl.l.', '.lggllgllgl', '..lgggggggl', '...lgggggl.', '....lgggl..', '.....ggg...', '.....ggg...',
    ], { g: '#3f8f5a', l: '#6cc07a' });
    SPR.flower = sprite(['.f.', 'fcf', '.f.', '.g.'], { f: '#ff7aa8', c: '#ffd166', g: '#3f8f5a' });
  };

  /* ---------------------------------------------------------
     PALETTE + TIME OF DAY
     --------------------------------------------------------- */
  const C = {
    floor: '#c68a5a', plank: '#a8704a', slab: '#6e4a33', wallL: '#a9bfa4', wallR: '#9db59a', stripe: '#98ae94',
    cap: '#ece6d8', base: '#efe9dc', shelf: '#8a5a3b', shelfIn: '#3e281b', desk: '#d9a066', deskLeg: '#7a5335',
    mon: '#2a2d34', chair: '#d2461f', rug: '#34507e', rugB: '#e9c46a', cork: '#c79a67', corkF: '#6e4c30',
    frame: '#f3efe6', pot: '#d7663f', lamp: '#2b2f36', shadeC: '#f2b84b', mug: '#f4f1ea',
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
    hour: 7.5, ch: 0, prevCh: -1,
    raining: false, lampManual: null, lampI: 0, night: 0,
    screenProject: -1, pulledBook: -1, hover: 0,
    posterArt: 0, water: 0, coffee: 3, pets: 0,
    notes: [
      { y: 64, z: 28, w: 6, h: 6, c: '#ffd84d' },
      { y: 72, z: 30, w: 6, h: 5, c: '#8fd3ff' },
      { y: 79, z: 24, w: 5, h: 6, c: '#f29bb0' },
      { y: 66, z: 22, w: 7, h: 4, c: '#ffffff' },
    ],
    userNote: null,
    t: 0,
  };
  const hero = { x: 66, y: 14, path: [], sit: false, typing: false, face: false, flip: false, anim: 0, wave: 0, moving: false };
  const cat = { x: 60, y: 60, tx: 60, ty: 60, state: 'walk', timer: 2, flip: false, anim: 0, purr: 0 };
  let parts = [];

  // shelf books (seeded, stable)
  const BOOK_COLS = ['#c0392b', '#2e6fba', '#e9b949', '#3f8f5a', '#7a4fa0', '#e07a5f', '#264653', '#f4f1ea', '#d2461f'];
  const JOB_COLS = ['#d2461f', '#2e6fba', '#e9b949', '#3f8f5a'];
  const books = [];
  (() => {
    const rnd = mulberry(9);
    const rows = [2, 13, 25];
    rows.forEach((z, r) => {
      let x = 10;
      if (r === 1) { for (let j = 0; j < 4; j++) { books.push({ x, z, w: 3, h: 10, c: JOB_COLS[j], job: j }); x += 3; } x += 1; }
      while (x < 37) {
        const w = 2 + Math.floor(rnd() * 2), h = 7 + Math.floor(rnd() * 3);
        if (x + w > 38) break;
        if (rnd() < 0.12) { x += 2; continue; }
        books.push({ x, z, w, h, c: BOOK_COLS[Math.floor(rnd() * BOOK_COLS.length)], job: -1 });
        x += w;
      }
    });
  })();
  const stars = Array.from({ length: 30 }, (_, i) => { const r = mulberry(i + 3); return { u: Math.floor(r() * 26), v: Math.floor(r() * 13), p: r() * 6 }; });
  const skyline = Array.from({ length: 26 }, (_, u) => 3 + Math.floor(mulberry(u + 40)() * 6));

  /* ---------------------------------------------------------
     PROJECT ART (32 x 24), used on the monitor + previews
     --------------------------------------------------------- */
  const ART = PROJECTS.map((p, i) => makeArt(p, i));
  function makeArt(p, i) {
    const W = 32, H = 24, px = new Array(W * H);
    const [bg, fg, a1, a2] = ART_PALS[i % ART_PALS.length];
    const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (k >= 0 && j >= 0 && k < W && j < H) px[j * W + k] = c; };
    const disc = (cx, cy, r, c) => { for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) if (k * k + j * j <= r * r) rect(cx + k, cy + j, 1, 1, c); };
    rect(0, 0, W, H, bg);
    rect(0, 0, W, 3, shade(fg, 0)); rect(1, 1, 1, 1, a1); rect(3, 1, 1, 1, a2); rect(5, 1, 1, 1, bg);
    if (p.layout === 'hero') {
      disc(23, 13, 6, a1); disc(25, 11, 2, a2);
      rect(3, 7, 12, 2, fg); rect(3, 10, 9, 2, fg); rect(3, 14, 11, 1, shade(fg, 0) + ''); rect(3, 16, 8, 1, fg);
      rect(3, 19, 7, 3, a2);
    } else if (p.layout === 'grid') {
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const x = 2 + c * 10, y = 5 + r * 9;
        rect(x, y, 8, 7, fg); rect(x + 1, y + 1, 6, 3, (r + c) % 2 ? a1 : a2); rect(x + 1, y + 5, 4, 1, bg);
      }
    } else if (p.layout === 'game') {
      rect(0, 18, W, 6, a1); rect(0, 18, W, 1, shade(a1, 0.3));
      rect(9, 9, 4, 4, a2); rect(10, 10, 2, 2, fg); rect(19, 9, 4, 4, a2); rect(20, 10, 2, 2, fg);
      rect(4, 13, 3, 5, fg); rect(4, 12, 3, 1, '#f1c09a');
      rect(22, 5, 6, 2, '#ffffff'); rect(23, 4, 3, 1, '#ffffff');
      rect(15, 16, 2, 2, a2);
    } else if (p.layout === 'brand') {
      rect(10, 6, 12, 12, fg); rect(12, 8, 8, 8, bg); rect(14, 10, 4, 4, a1);
      rect(0, 21, W, 3, a1); rect(26, 5, 3, 3, fg);
    } else {
      rect(2, 5, 8, 17, fg); for (let j = 0; j < 5; j++) rect(3, 7 + j * 3, 6, 1, j === 1 ? a1 : bg);
      const bars = [6, 10, 7, 12, 9, 14];
      bars.forEach((b, k) => rect(13 + k * 3, 21 - b, 2, b, k === 5 ? a1 : a2));
      rect(12, 21, 19, 1, fg);
    }
    return px;
  }
  const paintArt = (canvas, i) => {
    const x = canvas.getContext('2d'), a = ART[i];
    for (let j = 0; j < 24; j++) for (let k = 0; k < 32; k++) { x.fillStyle = a[j * 32 + k]; x.fillRect(k, j, 1, 1); }
  };

  /* ---------------------------------------------------------
     DRAW THE ROOM
     --------------------------------------------------------- */
  function drawRoom(sky) {
    const t = S.t;
    // walls
    curId = 0;
    faceZ(WALL, -4, R, -4, 0, C.cap);
    faceZ(WALL, -4, 0, 0, R, C.cap);
    faceX(0, 0, R, 0, WALL, C.wallL);
    faceY(0, 0, R, 0, WALL, C.wallR);
    for (let y = 4; y < R; y += 6) faceX(0, y, y + 1, 3, WALL, C.stripe);
    for (let x = 4; x < R; x += 6) { if (x > 50 && x < 82) continue; faceY(0, x, x + 1, 3, WALL, shade(C.stripe, -0.05)); }
    faceX(0, 0, R, 0, 3, C.base);
    faceY(0, 0, R, 0, 3, shade(C.base, -0.05));
    faceY(R, -4, 0, -6, WALL, shade(C.cap, -0.2));
    faceX(R, -4, 0, -6, WALL, shade(C.cap, -0.32));

    // window (right wall)
    curId = 3;
    faceY(0, 51, 81, 17, 41, C.frame);
    const wx0 = 53, wz1 = 39, GW = 26, GH = 20;
    const topC = rgb(sky.top), botC = rgb(sky.bot);
    for (let u = 0; u < GW; u++) {
      for (let v = 0; v < GH; v++) {
        const k = v / (GH - 1);
        let col = `rgb(${Math.round(lerp(topC[0], botC[0], k))},${Math.round(lerp(topC[1], botC[1], k))},${Math.round(lerp(topC[2], botC[2], k))})`;
        // skyline
        if (GH - v <= skyline[u]) {
          col = S.night > 0.5 ? '#161a33' : '#6c7a92';
          if (S.night > 0.5 && (u * 7 + v * 3) % 5 === 0 && (GH - v) < skyline[u]) col = '#ffd98a';
        }
        const [sx, sy] = P(wx0 + u + 0.5, 0, wz1 - v - 0.5);
        dot(sx, sy, col);
      }
    }
    // sun / moon
    const dayK = clamp((S.hour - 6) / 13);
    if (S.hour < 19.2) {
      const su = 3 + dayK * 20, sv = 15 - Math.sin(dayK * Math.PI) * 12;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b <= 5) {
        const u = Math.round(su + a), v = Math.round(sv + b);
        if (u >= 0 && u < GW && v >= 0 && v < GH - skyline[u]) { const [sx, sy] = P(wx0 + u + 0.5, 0, wz1 - v - 0.5); dot(sx, sy, '#fff1b8'); }
      }
    }
    if (S.night > 0.2) {
      stars.forEach((s) => { if (Math.sin(t * 2 + s.p) > -0.2 && s.v < GH - skyline[s.u] - 1) { const [sx, sy] = P(wx0 + s.u + 0.5, 0, wz1 - s.v - 0.5); dot(sx, sy, '#e8e6ff'); } });
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b <= 4 && !((a - 1) * (a - 1) + b * b <= 3)) {
        const [sx, sy] = P(wx0 + 19 + a + 0.5, 0, wz1 - 4 - b - 0.5); dot(sx, sy, '#f3efd6');
      }
    }
    // clouds
    if (!S.raining && S.night < 0.6) {
      for (let c = 0; c < 2; c++) {
        const cu = ((t * 1.2 + c * 14) % (GW + 10)) - 6, cv = 3 + c * 4;
        for (let a = 0; a < 7; a++) for (let b = 0; b < 2; b++) {
          const u = Math.floor(cu + a), v = cv + b - (a > 1 && a < 5 && b === 0 ? 1 : 0);
          if (u >= 0 && u < GW) { const [sx, sy] = P(wx0 + u + 0.5, 0, wz1 - v - 0.5); dot(sx, sy, '#ffffff'); }
        }
      }
    }
    // rain
    if (S.raining) {
      for (let r = 0; r < 26; r++) {
        const u0 = (r * 5 + Math.floor(t * 18)) % GW, v0 = (r * 7 + Math.floor(t * 40)) % GH;
        for (let l = 0; l < 2; l++) { const u = (u0 + l) % GW, v = (v0 + l) % GH; const [sx, sy] = P(wx0 + u + 0.5, 0, wz1 - v - 0.5); dot(sx, sy, '#bcd3ff'); }
      }
    }
    // mullions + sill
    faceY(0, 66, 67, 19, 39, C.frame);
    faceY(0, 53, 79, 29, 30, C.frame);
    box(50, 0, 15, 32, 4, 2, C.frame);

    // poster (left wall, above desk)
    curId = 12;
    faceX(0, 26, 44, 31, 45, C.frame);
    const posterPal = [['#f2b84b', '#d2461f', '#34507e'], ['#7fd1b9', '#2e6fba', '#1b2a41'], ['#ff7aa8', '#8a5bff', '#2a2140']][S.posterArt % 3];
    for (let u = 0; u < 16; u++) for (let v = 0; v < 12; v++) {
      const y = 43 - u - 0.5, z = 44 - v - 0.5;
      let col = posterPal[0];
      if (v > 11 - Math.max(0, 6 - Math.abs(u - 6)) || v > 11 - Math.max(0, 4 - Math.abs(u - 12))) col = posterPal[1];
      if (v > 9) col = posterPal[2];
      if ((u - 11) ** 2 + (v - 3) ** 2 <= 3) col = '#fffaf0';
      const [sx, sy] = P(0, y, z); dot(sx, sy, col);
    }

    // corkboard (left wall, front)
    curId = 4;
    faceX(0, 61, 88, 19, 37, C.corkF);
    faceX(0, 62, 87, 20, 36, C.cork);
    S.notes.forEach((n) => faceX(0, n.y, n.y + n.w, n.z, n.z + n.h, n.c));
    if (S.userNote) {
      const n = S.userNote;
      faceX(0, n.y, n.y + n.w, n.z, n.z + n.h, '#ffd84d');
      for (let l = 0; l < n.lines; l++) {
        const len = Math.min(n.w - 2, 3 + ((l * 5 + n.seed) % (n.w - 3)));
        for (let u = 0; u < len; u++) { const [sx, sy] = P(0, n.y + n.w - 1.5 - u, n.z + n.h - 2.5 - l * 2); dot(sx, sy, '#2a2414'); }
      }
      const [px, py] = P(0, n.y + n.w / 2, n.z + n.h); dot(px, py, '#d2461f');
    }

    // floor
    curId = 0;
    faceZ(0, 0, R, 0, R, C.floor);
    for (let x = 12; x < R; x += 12) for (let y = 0; y < R; y++) { const [sx, sy] = P(x, y + 0.5, 0); dot(sx, sy, C.plank); }
    for (let x = 0; x < R; x += 12) { const y = ((x * 7) % 48) + 20; const [sx, sy] = P(x + 6, y + 0.5, 0); dot(sx, sy, C.plank); }
    faceY(R, 0, R, -6, 0, shade(C.slab, 0.1));
    faceX(R, 0, R, -6, 0, C.slab);

    // sunbeam on the floor
    const beamK = clamp((S.hour - 7) / 1.2) * clamp((18.6 - S.hour) / 1.4) * (S.raining ? 0.35 : 1);
    if (beamK > 0.02) {
      const tt = clamp((S.hour - 7) / 11.5);
      const m = lerp(-1.1, 1.1, tt), kk = lerp(2.4, 0.9, Math.sin(tt * Math.PI));
      const corner = (x, z) => [x + z * m, z * kk];
      let poly = [corner(53, 19), corner(79, 19), corner(79, 39), corner(53, 39)];
      poly = clipRect(poly, 0, 0, R, R);
      if (poly.length > 2) {
        g.globalAlpha = 0.45 * beamK;
        ditherPoly(poly.map(([x, y]) => P(x, y, 0.01)), '#fff4c8');
        g.globalAlpha = 1;
      }
    }

    // rug
    faceZ(0.01, 36, 80, 40, 84, C.rugB);
    faceZ(0.01, 38, 78, 42, 82, C.rug);
    for (let i = 0; i < 40; i += 4) { const [sx, sy] = P(38 + i + 2, 62, 0.01); dot(sx, sy, C.rugB); }

    // bookshelf (right wall)
    curId = 2;
    box(8, 0, 0, 32, 8, 36, C.shelf);
    [[2, 12], [13, 24], [25, 35]].forEach(([z0, z1]) => faceY(8, 9, 39, z0, z1, C.shelfIn));
    books.forEach((b) => {
      const out = b.job >= 0 && b.job === S.pulledBook;
      curId = b.job >= 0 ? 20 + b.job : 2;
      if (out) {
        faceY(12, b.x, b.x + b.w, b.z, b.z + b.h, shade(b.c, 0.1));
        faceX(b.x + b.w, 3, 12, b.z, b.z + b.h, shade(b.c, -0.3));
        faceZ(b.z + b.h, b.x, b.x + b.w, 3, 12, shade(b.c, 0.25));
        const [sx, sy] = P(b.x + b.w / 2, 12, b.z + b.h - 3); dot(sx, sy, '#fffaf0');
      } else {
        faceZ(b.z + b.h, b.x, b.x + b.w, 3, 8, shade(b.c, 0.15));
        faceY(8, b.x, b.x + b.w, b.z, b.z + b.h, b.c);
        if (b.job >= 0) { const [sx, sy] = P(b.x + b.w / 2, 8, b.z + b.h - 3); dot(sx, sy, '#fffaf0'); }
      }
    });
    curId = 2;
    [12, 24].forEach((z) => faceY(8, 8, 40, z, z + 1, shade(C.shelf, 0.08)));
    faceY(8, 8, 9, 0, 36, shade(C.shelf, -0.05));
    faceY(8, 39, 40, 0, 36, shade(C.shelf, -0.05));
    faceY(8, 8, 40, 0, 2, shade(C.shelf, -0.1));
    // trinket on top
    box(30, 2, 36, 4, 4, 4, '#7fd1b9');

    // plant (right corner)
    curId = 9;
    box(84, 4, 0, 7, 7, 7, C.pot);
    faceZ(7, 85, 90, 5, 10, '#5a3a22');
    {
      const [sx, sy] = P(87.5, 7.5, 7);
      const sway = Math.round(Math.sin(t * 1.3) * 0.6);
      drawSprite(SPR.plant, sx - 5 + sway, sy - 13 - Math.min(S.water, 3));
      if (S.water >= 3) drawSprite(SPR.flower, sx - 1 + sway, sy - 18 - 3);
    }

    // desk
    curId = 10;
    box(13, 21, 0, 2, 2, 11, C.deskLeg);
    box(1, 38, 0, 12, 12, 11, shade(C.desk, -0.05));
    faceY(50, 3, 11, 6, 7, C.deskLeg);
    faceY(50, 3, 11, 2, 3, C.deskLeg);
    box(13, 50, 0, 2, 2, 11, C.deskLeg);
    box(0, 20, 11, 16, 33, 2, C.desk);
    // monitor
    curId = 1;
    box(2, 33, 13, 2, 4, 3, C.mon);
    box(1, 25, 16, 3, 20, 13, C.mon);
    drawScreen();
    // keyboard
    curId = 10;
    box(7, 29, 13, 4, 11, 1, '#e8e4da');
    // mug
    curId = 8;
    box(9, 46, 13, 3, 3, 4, C.mug);
    if (S.coffee > 0) faceZ(17, 9.5, 11.5, 46.5, 48.5, '#5a3a22');
    // lamp
    curId = 7;
    box(2, 47, 13, 3, 3, 1, C.lamp);
    for (let z = 14; z < 23; z++) { const [sx, sy] = P(3.5, 48.5, z); dot(sx, sy, C.lamp); }
    box(2, 44, 22, 4, 4, 3, S.lampI > 0.5 ? '#ffe39a' : C.shadeC);
  }

  function drawScreen() {
    const SW = 18, SH = 11;
    const on = S.screenProject >= 0 ? ART[S.screenProject] : null;
    for (let u = 0; u < SW; u++) for (let v = 0; v < SH; v++) {
      let col;
      if (on) col = on[Math.floor(v * 24 / SH) * 32 + Math.floor(u * 32 / SW)];
      else col = codeTexel(u, v);
      const [sx, sy] = P(4, 43.5 - u, 28 - v - 0.5);
      dot(sx, sy, col);
    }
  }
  const CODE_COLS = ['#7fd1b9', '#f2b84b', '#ff7a4d', '#9aa7ff', '#cfd6dd'];
  function codeTexel(u, v) {
    const scroll = Math.floor(S.t * (hero.typing ? 3 : 0.6));
    const line = v + scroll;
    if (v % 2 === 1) return '#111a24';
    const indent = (line * 7) % 4, len = 4 + ((line * 13) % 10);
    if (u >= 1 + indent && u < 1 + indent + len) return CODE_COLS[(line + (u > indent + 4 ? 1 : 0)) % CODE_COLS.length];
    if (v === 10 && u === 1 + indent + len && Math.floor(S.t * 2) % 2) return '#ffffff';
    return '#111a24';
  }

  /* dynamic, depth-sorted things */
  function drawDynamic() {
    const list = [];
    list.push({ d: 58, f: () => { curId = 11; box(20, 32, 7, 8, 8, 1, C.chair); box(23, 35, 0, 2, 2, 7, '#3a3a44'); } });
    list.push({ d: 66, f: () => { curId = 11; box(27, 32, 8, 2, 8, 10, C.chair); } });
    list.push({ d: hero.x + hero.y + (hero.sit ? 1 : 0), f: drawHero });
    list.push({ d: cat.x + cat.y, f: drawCat });
    list.sort((a, b) => a.d - b.d).forEach((o) => o.f());
    curId = 0;
    parts.forEach((p) => {
      const [sx, sy] = P(p.x, p.y, p.z);
      if (p.kind === 'heart') drawSprite(SPR.heart, sx - 2, sy - 4);
      else dot(sx, sy, p.c);
    });
  }

  function drawHero() {
    curId = 6;
    if (hero.sit) {
      const [sx, sy] = P(hero.x, hero.y, 8);
      const spr = hero.typing && Math.floor(S.t * 6) % 2 ? SPR.sitType : SPR.sit;
      drawSprite(spr, sx - 4, sy - spr.h + 1);
      return;
    }
    const [sx, sy] = P(hero.x, hero.y, 0);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(Math.round(sx - 3), Math.round(sy), 7, 1);
    let spr;
    if (hero.wave > 0) spr = SPR.wave;
    else if (hero.moving) { const f = Math.floor(hero.anim) % 2; spr = hero.face ? (f ? SPR.frontA : SPR.frontB) : (f ? SPR.backA : SPR.backB); }
    else spr = hero.face ? SPR.front : SPR.back;
    drawSprite(spr, sx - 4, sy - spr.h + 1, hero.flip);
  }

  function drawCat() {
    curId = 5;
    const [sx, sy] = P(cat.x, cat.y, 0);
    let spr = SPR.cat;
    if (cat.state === 'sleep') spr = SPR.catSleep;
    else if (cat.state === 'walk') spr = Math.floor(cat.anim) % 2 ? SPR.cat : SPR.cat2;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(Math.round(sx - 4), Math.round(sy), 8, 1);
    drawSprite(spr, sx - 5, sy - spr.h + 1, cat.flip);
  }

  /* lights: pre-rendered dithered pools */
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  function makeGlow(cx, cy, rx, ry, col, strength = 1) {
    const c = document.createElement('canvas'); c.width = WW; c.height = WH;
    const x = c.getContext('2d'); x.fillStyle = col;
    for (let y = Math.max(0, Math.floor(cy - ry)); y < Math.min(WH, cy + ry); y++) {
      for (let xx = Math.max(0, Math.floor(cx - rx)); xx < Math.min(WW, cx + rx); xx++) {
        const d = Math.hypot((xx - cx) / rx, (y - cy) / ry);
        const I = (1 - d) * strength;
        if (I > bayer[(y % 4) * 4 + (xx % 4)]) x.fillRect(xx, y, 1, 1);
      }
    }
    return c;
  }
  let lampGlow, lampCore, screenGlow;
  function buildGlows() {
    const [lx, ly] = P(8, 44, 8);
    lampGlow = makeGlow(lx, ly, 38, 21, 'rgba(255,176,96,0.20)', 0.95);
    const [hx, hy] = P(4, 46, 21);
    lampCore = makeGlow(hx, hy, 12, 9, 'rgba(255,214,140,0.55)', 1.3);
    const [mx, my] = P(10, 35, 18);
    screenGlow = makeGlow(mx, my, 18, 10, 'rgba(120,180,255,0.22)', 0.9);
  }

  function render() {
    const sky = skyAt(S.hour);
    idMap.fill(0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, WW, WH);
    drawRoom(sky);
    drawDynamic();
    curId = 0;

    // tint pass (multiply), then restore transparency with the mask
    mg.clearRect(0, 0, WW, WH); mg.drawImage(world, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = S.raining ? mix(sky.tint, '#9aa4b8', 0.35) : sky.tint;
    g.fillRect(0, 0, WW, WH);
    g.globalCompositeOperation = 'lighter';
    if (S.lampI > 0.01) { g.globalAlpha = S.lampI; g.drawImage(lampGlow, 0, 0); g.drawImage(lampCore, 0, 0); }
    if (S.night > 0.05) { g.globalAlpha = S.night * 0.9; g.drawImage(screenGlow, 0, 0); }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(maskC, 0, 0);
    g.globalCompositeOperation = 'source-over';

    // hover outline
    const h = S.hover;
    if (h) {
      g.fillStyle = '#ffffff';
      for (let y = 1; y < WH - 1; y++) {
        const row = y * WW;
        for (let x = 1; x < WW - 1; x++) {
          const i = row + x;
          if (idMap[i] === h) continue;
          if (idMap[i - 1] === h || idMap[i + 1] === h || idMap[i - WW] === h || idMap[i + WW] === h) g.fillRect(x, y, 1, 1);
        }
      }
    }
    return sky;
  }

  /* ---------------------------------------------------------
     SIMULATION
     --------------------------------------------------------- */
  const SPOTS = [
    { x: 66, y: 13, sit: false, face: false },
    { x: 23, y: 36, sit: true },
    { x: 23, y: 36, sit: true, typing: true },
    { x: 24, y: 15, sit: false, face: false },
    { x: 13, y: 74, sit: false, face: false, flip: true },
  ];
  function routeTo(ch) {
    const s = SPOTS[ch];
    const pts = [];
    if (hero.sit) pts.push({ x: 34, y: 44 });
    pts.push({ x: 50, y: 48 });
    if (s.sit) pts.push({ x: 34, y: 44 });
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
    const step = 30 * dt;
    hero.moving = true;
    hero.anim += dt * 8;
    hero.face = dx + dy > 0;
    const sdx = dx - dy;
    if (Math.abs(sdx) > 0.1) hero.flip = sdx < 0;
    if (dist <= step) {
      hero.x = next.x; hero.y = next.y; hero.path.shift();
      if (!hero.path.length) arrive(hero.spot);
    } else { hero.x += dx / dist * step; hero.y += dy / dist * step; }
  }
  function updateCat(dt) {
    cat.purr = Math.max(0, cat.purr - dt);
    if (S.night > 0.7 && cat.state !== 'sleep' && cat.purr === 0) { cat.tx = 58; cat.ty = 64; cat.state = 'walk'; cat.goSleep = true; }
    if (cat.state === 'walk') {
      const dx = cat.tx - cat.x, dy = cat.ty - cat.y, d = Math.hypot(dx, dy);
      const step = 14 * dt;
      cat.anim += dt * 7;
      if (Math.abs(dx - dy) > 0.1) cat.flip = (dx - dy) < 0;
      if (d <= step) { cat.x = cat.tx; cat.y = cat.ty; cat.state = cat.goSleep ? 'sleep' : 'sit'; cat.timer = 2 + Math.random() * 4; }
      else { cat.x += dx / d * step; cat.y += dy / d * step; }
    } else if (cat.state === 'sit') {
      cat.timer -= dt;
      if (cat.timer <= 0) { cat.tx = 32 + Math.random() * 56; cat.ty = 22 + Math.random() * 66; cat.state = 'walk'; }
    } else if (cat.state === 'sleep') {
      if (S.night < 0.5) { cat.goSleep = false; cat.state = 'sit'; cat.timer = 1; }
      if (Math.random() < dt * 0.6) parts.push({ kind: 'z', x: cat.x, y: cat.y, z: 8, vz: 6, life: 1.4, c: '#e8e6ff' });
    }
  }
  function updateParts(dt) {
    if (S.coffee > 0 && Math.random() < dt * 3) parts.push({ kind: 'steam', x: 10.5 + Math.random(), y: 47.5, z: 18, vz: 7, life: 1.4, c: 'rgba(255,255,255,.7)' });
    parts = parts.filter((p) => {
      p.life -= dt; p.z += (p.vz || 0) * dt;
      if (p.vx) p.x += p.vx * dt;
      if (p.vy) p.y += p.vy * dt;
      if (p.g) p.vz -= p.g * dt;
      if (p.kind === 'steam') p.x += Math.sin(S.t * 3 + p.z) * dt * 1.5;
      return p.life > 0 && p.z > -1;
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
    { x: 128, y: 94, z: 1 },
    { x: 104, y: 76, z: 2.1 },
    { x: 96, y: 66, z: 3.3 },
    { x: 146, y: 64, z: 2.3 },
    { x: 92, y: 84, z: 1.55 },
    { x: 92, y: 84, z: 1.55 },
  ];
  const cam = { x: 128, y: 94, z: 1 };
  const mouse = { x: 0.5, y: 0.5, inside: false, px: 0, py: 0 };
  let fitScale = 1, drawX = 0, drawY = 0, scale = 1;

  const resize = () => {
    const r = sceneEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    VW = Math.max(1, Math.round(r.width * dpr)); VH = Math.max(1, Math.round(r.height * dpr));
    view.width = VW; view.height = VH;
    fitScale = Math.min(VW / 214, VH / 168);
  };
  new ResizeObserver(resize).observe(sceneEl);

  function present(sky) {
    vctx.imageSmoothingEnabled = false;
    vctx.fillStyle = sky.back;
    vctx.fillRect(0, 0, VW, VH);
    scale = fitScale * cam.z;
    drawX = VW / 2 - cam.x * scale;
    drawY = VH / 2 - cam.y * scale;
    // soft floor shadow under the diorama
    const [fx, fy] = P(R / 2, R / 2, -6);
    vctx.fillStyle = 'rgba(0,0,0,.10)';
    vctx.beginPath();
    vctx.ellipse(drawX + fx * scale, drawY + (fy + 8) * scale, 100 * scale, 30 * scale, 0, 0, Math.PI * 2);
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
    const line = innerHeight * (mobile ? 0.72 : 0.5);
    const rects = chapters.map((c) => c.getBoundingClientRect());
    let i = 0;
    rects.forEach((r, k) => { if (r.top <= line) i = k; });
    const next = rects[i + 1] ? rects[i + 1].top : rects[i].bottom;
    const frac = clamp((line - rects[i].top) / Math.max(1, next - rects[i].top));
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
    const [x, y] = toScreen(hero.x, hero.y, hero.sit ? 23 : 23);
    bubble.style.left = `${x}px`; bubble.style.top = `${y}px`;
  }

  const tip = $('#tip'), tipName = $('#tip-name'), tipHint = $('#tip-hint');
  const OBJ = {
    1: { name: 'Monitor', hint: () => 'See the work', act: () => go('work') },
    2: { name: 'Bookshelf', hint: () => 'Open the logbook', act: () => go('log') },
    3: { name: 'Window', hint: () => S.raining ? 'Stop the rain' : 'Make it rain', act: () => toggleRain() },
    4: { name: 'Corkboard', hint: () => 'Leave a note', act: () => go('contact') },
    5: { name: 'The cat', hint: () => 'Pet', act: () => petCat() },
    6: { name: 'Your Name', hint: () => 'Say hi', act: () => wave() },
    7: { name: 'Desk lamp', hint: () => S.lampI > 0.5 ? 'Turn off' : 'Turn on', act: () => toggleLamp() },
    8: { name: 'Coffee', hint: () => S.coffee > 0 ? 'Take a sip' : 'Refill', act: () => coffee() },
    9: { name: 'Plant', hint: () => 'Water it', act: () => water() },
    10: { name: 'Desk', hint: () => 'About me', act: () => go('about') },
    11: { name: 'Chair', hint: () => 'About me', act: () => go('about') },
    12: { name: 'Poster', hint: () => 'Swap the art', act: () => { S.posterArt++; } },
  };
  const jobRows = $$('.job');
  for (let j = 0; j < 4; j++) {
    OBJ[20 + j] = {
      name: jobRows[j] ? $('.job-role', jobRows[j]).textContent + ' · ' + $('.job-date', jobRows[j]).textContent : 'Book',
      hint: () => 'Read this chapter',
      act: () => { go('log'); openJob(j, true); },
    };
  }
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
  sceneEl.addEventListener('pointerleave', () => { mouse.inside = false; S.hover = 0; tip.hidden = true; sceneEl.classList.remove('is-hot'); if (S.pulledBookFromScene) { S.pulledBook = -1; S.pulledBookFromScene = false; } });
  view.addEventListener('click', () => { const id = pick(); if (OBJ[id]) OBJ[id].act(); });

  function updateHover() {
    const id = pick();
    if (id !== S.hover) {
      S.hover = id;
      sceneEl.classList.toggle('is-hot', !!OBJ[id]);
      if (id >= 20 && id < 24) { S.pulledBook = id - 20; S.pulledBookFromScene = true; }
      else if (S.pulledBookFromScene) { S.pulledBook = -1; S.pulledBookFromScene = false; }
    }
    if (OBJ[id] && matchMedia('(pointer: fine)').matches) {
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
  const go = (id) => document.getElementById(id).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const btnLamp = $('#act-lamp'), btnRain = $('#act-rain');
  function toggleRain() { S.raining = !S.raining; btnRain.setAttribute('aria-pressed', String(S.raining)); if (S.raining) say('Rainy day. Perfect for focus.', 2400); }
  function toggleLamp() { const on = S.lampI > 0.5; S.lampManual = !on; btnLamp.setAttribute('aria-pressed', String(!on)); }
  function petCat() {
    S.pets++;
    cat.purr = 2.2;
    if (cat.state === 'walk') { cat.state = 'sit'; cat.timer = 2.5; }
    for (let i = 0; i < 3; i++) parts.push({ kind: 'heart', x: cat.x + (Math.random() - 0.5) * 4, y: cat.y, z: 8 + i * 3, vz: 10, life: 1 + i * 0.2 });
    if (S.pets === 5) say('You have made a friend for life.', 2600);
  }
  function wave() { hero.wave = 1.1; say(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)], 2600); }
  function coffee() {
    if (S.coffee > 0) { S.coffee--; say(S.coffee ? 'Mm. Still warm.' : 'Out of coffee. Click again to refill.', 2200); }
    else { S.coffee = 3; for (let i = 0; i < 8; i++) parts.push({ kind: 'steam', x: 10.5, y: 47.5, z: 18, vz: 10 + i, life: 1.2, c: 'rgba(255,255,255,.8)' }); }
  }
  function water() {
    S.water++;
    for (let i = 0; i < 8; i++) parts.push({ kind: 'drop', x: 87.5 + (Math.random() - 0.5) * 6, y: 7.5 + (Math.random() - 0.5) * 6, z: 26 + Math.random() * 4, vz: 0, g: 60, life: 0.8, c: '#8fd3ff' });
    if (S.water === 3) say('It bloomed!', 2200);
  }
  btnLamp.addEventListener('click', toggleLamp);
  btnRain.addEventListener('click', toggleRain);
  $('#act-cat').addEventListener('click', petCat);
  $('#act-plant').addEventListener('click', water);

  /* ---------------------------------------------------------
     STORY UI
     --------------------------------------------------------- */
  // theme
  const themeBtn = $('#theme');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
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
  const fine = matchMedia('(pointer: fine)').matches;
  $$('.work').forEach((li) => {
    const btn = $('.work-row', li), i = +btn.dataset.i;
    btn.addEventListener('mouseenter', () => {
      S.screenProject = i;
      if (!fine || reduced) return;
      paintArt(peekCanvas, i);
      peekLabel.textContent = `${PROJECTS[i].type} · ${PROJECTS[i].year} · now on the monitor`;
      peek.classList.add('is-on');
    });
    btn.addEventListener('mousemove', (e) => { peek.style.left = `${e.clientX + 150}px`; peek.style.top = `${e.clientY}px`; });
    btn.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
    btn.addEventListener('focus', () => { S.screenProject = i; });
    btn.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      S.screenProject = i;
      peek.classList.remove('is-on');
    });
  });

  // logbook
  function openJob(j, only = false) {
    jobRows.forEach((row, k) => {
      const open = only ? k === j : (k === j ? !row.classList.contains('is-open') : row.classList.contains('is-open'));
      row.classList.toggle('is-open', open);
      $('.job-row', row).setAttribute('aria-expanded', String(open));
    });
    S.pulledBook = j;
  }
  jobRows.forEach((row, j) => {
    const btn = $('.job-row', row);
    btn.addEventListener('click', () => openJob(j));
    btn.addEventListener('mouseenter', () => { S.pulledBook = j; S.pulledBookFromScene = false; });
    btn.addEventListener('focus', () => { S.pulledBook = j; });
  });

  // placeholder links
  $$('[data-placeholder]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); say('That link is a placeholder for now.', 2200); }));

  // email copy
  $('#copy').addEventListener('click', async () => {
    const email = $('#email').textContent, b = $('#copy');
    try { await navigator.clipboard.writeText(email); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents($('#email')); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1800);
  });

  // note form: live preview + pin to the board in the room
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
    S.userNote = { y: 74, z: 21, w: 9, h: 9, lines: Math.min(3, 1 + Math.floor(msg.length / 30)), seed: msg.length };
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
    const px = mouse.inside && fine ? (mouse.x - 0.5) * 10 / cam.z : 0;
    const py = mouse.inside && fine ? (mouse.y - 0.5) * 6 / cam.z : 0;
    cam.x += (camTarget.x + px - cam.x) * k;
    cam.y += (camTarget.y + py - cam.y) * k;
    cam.z += (camTarget.z - cam.z) * k;

    const sky = render();
    present(sky);
    updateHover();
    placeBubble(dt);

    // HUD
    const hh = Math.floor(S.hour) % 24, mm = Math.floor((S.hour % 1) * 60);
    clockEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
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
  buildSprites();
  buildGlows();
  resize();
  readScroll();
  const s0 = SPOTS[S.ch]; arrive(s0);
  S.prevCh = S.ch;
  navLinks.forEach((a) => a.classList.toggle('is-now', +a.dataset.ch === S.ch));
  cam.x = camTarget.x; cam.y = camTarget.y; cam.z = camTarget.z;
  say(BUBBLES[S.ch], 3600, 1200);
  requestAnimationFrame(frame);
})();
