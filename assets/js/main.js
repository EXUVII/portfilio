/* =========================================================
   PRESS START — portfolio interactions
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ---------------------------------------------------------
     PROJECTS — placeholder data, swap for real work later
     --------------------------------------------------------- */
  const PROJECTS = [
    { title: 'Project Name One', cat: 'product', rarity: 'Legendary', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', wide: true, seed: 11,
      desc: 'Short summary of the project: the problem, your role, and the outcome. Replace this with a one-line hook.' },
    { title: 'Project Name Two', cat: 'web', rarity: 'Epic', year: '2025', role: 'Design & Development', stack: 'Astro, GSAP', seed: 27,
      desc: 'One sentence about what this was and why it mattered.' },
    { title: 'Project Name Three', cat: 'game', rarity: 'Epic', year: '2025', role: 'Art Direction', stack: 'Aseprite, Unity', seed: 5,
      desc: 'One sentence about what this was and why it mattered.' },
    { title: 'Project Name Four', cat: 'brand', rarity: 'Rare', year: '2024', role: 'Visual Identity', stack: 'Illustrator, Figma', wide: true, seed: 42,
      desc: 'One sentence about what this was and why it mattered.' },
    { title: 'Project Name Five', cat: 'product', rarity: 'Rare', year: '2023', role: 'Product Designer', stack: 'Figma, Framer', seed: 73,
      desc: 'One sentence about what this was and why it mattered.' },
    { title: 'Project Name Six', cat: 'web', rarity: 'Common', year: '2022', role: 'Frontend', stack: 'Three.js, WebGL', seed: 90,
      desc: 'One sentence about what this was and why it mattered.' },
    { title: 'Project Name Seven', cat: 'game', rarity: 'Common', year: '2021', role: 'Pixel Artist', stack: 'Aseprite, Godot', seed: 64,
      desc: 'One sentence about what this was and why it mattered.' },
  ];
  const RARITY = { Legendary: '--gold', Epic: '--pink', Rare: '--accent', Common: '--ink-3' };

  /* ---------------------------------------------------------
     SOUND — tiny 8-bit synth, off by default
     --------------------------------------------------------- */
  const Sfx = (() => {
    let ctx = null, on = false;
    const tone = (freq, dur = 0.08, type = 'square', slide = 0, vol = 0.05, delay = 0) => {
      if (!on || !ctx) return;
      const t = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    };
    return {
      get on() { return on; },
      toggle() {
        on = !on;
        if (on && !ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { on = false; } }
        if (ctx && ctx.state === 'suspended') ctx.resume();
        return on;
      },
      coin() { tone(988, 0.06); tone(1319, 0.18, 'square', 0, 0.05, 0.06); },
      jump() { tone(300, 0.14, 'square', 500, 0.035); },
      bump() { tone(140, 0.1, 'triangle', -60, 0.08); },
      blip() { tone(660, 0.04, 'square', 0, 0.025); },
      open() { tone(523, 0.07); tone(659, 0.07, 'square', 0, 0.05, 0.07); tone(784, 0.12, 'square', 0, 0.05, 0.14); },
      power() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.09, 'square', 0, 0.045, i * 0.07)); },
      type() { tone(1200 + Math.random() * 300, 0.02, 'square', 0, 0.012); },
    };
  })();

  const soundBtn = $('#sound-toggle');
  soundBtn.addEventListener('click', () => {
    const on = Sfx.toggle();
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    $('[data-label]', soundBtn).textContent = on ? 'SFX ON' : 'SFX OFF';
    if (on) Sfx.open();
  });

  /* ---------------------------------------------------------
     TOASTS + ACHIEVEMENTS
     --------------------------------------------------------- */
  const toastBox = $('#toasts');
  const toast = (title, msg, icon = '★') => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span><div><p class="toast-t">${title}</p><p class="toast-m">${msg}</p></div>`;
    toastBox.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2800);
  };
  const unlocked = new Set();
  const achieve = (id, msg) => {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    toast('Achievement unlocked', msg);
    Sfx.power();
  };

  /* ---------------------------------------------------------
     COINS
     --------------------------------------------------------- */
  let coins = 0;
  const coinEl = $('#coin-count');
  const coinWrap = $('.hud-coins');
  const addCoin = (n = 1) => {
    coins += n;
    coinEl.textContent = String(coins).padStart(2, '0');
    coinWrap.classList.remove('bump'); void coinWrap.offsetWidth; coinWrap.classList.add('bump');
    Sfx.coin();
    if (coins === 1) achieve('first-coin', 'First coin. Keep exploring, there are more hidden on the page.');
    if (coins === 25) achieve('rich', 'Collected 25 coins. You clearly have time to hire me.');
  };
  let hiddenFound = 0;
  const hiddenTotal = $$('.hidden-coin').length;
  $$('.hidden-coin').forEach((b) => b.addEventListener('click', () => {
    b.classList.add('got'); addCoin(5); hiddenFound++;
    if (hiddenFound === hiddenTotal) achieve('secrets', `Found all ${hiddenTotal} hidden coins.`);
  }, { once: true }));

  /* ---------------------------------------------------------
     THEME — day / night
     --------------------------------------------------------- */
  const themeBtn = $('#theme-toggle');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = store.get('ps-theme');
  if (saved && !root.dataset.theme) root.dataset.theme = saved;
  const syncThemeBtn = () => themeBtn.setAttribute('aria-label', isDark() ? 'Switch to day mode' : 'Switch to night mode');
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    store.set('ps-theme', root.dataset.theme);
    syncThemeBtn();
    Stage.repaint();
    paintStatic();
    Sfx.blip();
    if (root.dataset.theme === 'dark') achieve('night', 'Night owl. The stars came out on stage.');
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { syncThemeBtn(); Stage.repaint(); paintStatic(); });

  /* ---------------------------------------------------------
     PIXEL CURSOR (fine pointers only)
     --------------------------------------------------------- */
  if (matchMedia('(pointer: fine)').matches) {
    const bmp = [
      '1..........',
      '11.........',
      '121........',
      '1221.......',
      '12221......',
      '122221.....',
      '1222221....',
      '12222221...',
      '122222221..',
      '1222222221.',
      '12222211111',
      '1221221....',
      '121.1221...',
      '11..1221...',
      '1....1221..',
      '.....111...',
    ];
    const svg = (fill) => {
      let r = '';
      bmp.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        r += `<rect x='${x * 2}' y='${y * 2}' width='2' height='2' fill='${c === '1' ? '#17152b' : fill}'/>`;
      }));
      return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='32' shape-rendering='crispEdges'>${r}</svg>`)}") 0 0`;
    };
    root.style.setProperty('--cur', `${svg('#ffffff')}, auto`);
    root.style.setProperty('--cur-hand', `${svg('#ff4f9a')}, pointer`);
  }

  /* ---------------------------------------------------------
     HUD — XP bar + active section + clock
     --------------------------------------------------------- */
  const xpFill = $('#xp-fill'), xpNum = $('#xp-num');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    xpFill.style.transform = `scaleX(${p})`;
    xpNum.textContent = String(Math.round(p * 999)).padStart(3, '0');
    if (p > 0.985) achieve('explorer', 'Explorer. You reached the end of the level.');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.hud-nav a');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'quests', 'inventory', 'save'].forEach((id) => secObs.observe(document.getElementById(id)));

  const clock = $('#clock');
  const tickClock = () => {
    const d = new Date();
    clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tickClock(); setInterval(tickClock, 20000);
  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     HEADLINE — split into bumpable letters
     --------------------------------------------------------- */
  const title = $('[data-split]');
  const text = title.textContent;
  title.setAttribute('aria-label', text);
  title.innerHTML = [...text].map((c, i) =>
    c === ' ' ? '<span class="ch sp" aria-hidden="true"> </span>'
      : `<span class="ch" aria-hidden="true" style="--i:${i}">${c}</span>`).join('');
  const letters = $$('.ch:not(.sp)', title);
  letters.forEach((l) => l.addEventListener('mouseenter', () => Sfx.blip()));

  /* ---------------------------------------------------------
     SPRITES
     --------------------------------------------------------- */
  const HERO = {
    idle: [
      '...kkkkk...',
      '..kpppppk..',
      '.kpppwpppk.',
      '.kppkkkkkkk',
      '.ksssksskk.',
      '.ksssksssk.',
      '..kssssssk.',
      '...kkkkkk..',
      '..kbbbbbbk.',
      '.kbbybbbbbk',
      '.ksbbbbbbsk',
      '..kbbbbbbk.',
      '..kbkkkkbk.',
      '..kkk..kkk.',
    ],
  };
  const legs = {
    run1: ['..kbbbbbbk.', '..kbk..kbk.', '.kkk....kk.'],
    run2: ['..kbbbbbbk.', '...kbkkbk..', '...kkkkkk..'],
    jump: ['.kbbbbbbbk.', '.kbk...kbk.', 'kkk.....kkk'],
  };
  HERO.run1 = HERO.idle.slice(0, 11).concat(legs.run1);
  HERO.run2 = HERO.idle.slice(0, 11).concat(legs.run2);
  HERO.jump = ['.kk.kkkkk.kk'.slice(0, 11), ...HERO.idle.slice(1, 9), '.kbbybbbbbk', 'kssbbbbbbssk'.slice(0, 11), ...legs.jump];
  HERO.blink = HERO.idle.slice();
  HERO.blink[4] = '.kssssssskk';
  HERO.blink[5] = '.kssskkssk.';

  const spriteCache = new Map();
  const heroPalette = () => ({ k: '#17152b', p: css('--pink'), w: '#ffffff', s: '#ffcf9e', b: css('--accent'), y: css('--gold') });
  const makeSprite = (rows, pal) => {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.' || !pal[ch]) return;
      x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1);
    }));
    return c;
  };
  const buildHeroSprites = () => {
    const pal = heroPalette();
    Object.entries(HERO).forEach(([k, rows]) => spriteCache.set(k, makeSprite(rows, pal)));
  };

  /* ---------------------------------------------------------
     STAGE — playable hero scene
     --------------------------------------------------------- */
  const Stage = (() => {
    const wrap = $('#stage');
    const cvs = $('#stage-canvas');
    const ctx = cvs.getContext('2d');
    const labelsEl = $('#stage-labels');
    const hint = $('#stage-hint');
    const TARGETS = [
      { id: 'about', label: 'Player' },
      { id: 'quests', label: 'Quests' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'save', label: 'Save point' },
    ];

    let W = 320, H = 120, S = 3, groundY = 100;
    let pal = {};
    let stars = [], clouds = [], coinsArr = [], parts = [];
    let mouseX = 0.5;
    let visible = true, attract = true, t = 0, last = 0;
    const keys = { left: false, right: false, jump: false };
    const P = { x: 20, y: 0, vx: 0, vy: 0, w: 9, h: 14, face: 1, ground: false, anim: 0, blinkT: 2 };
    const AI = { target: 100, jumpT: 1.5 };

    const blocks = TARGETS.map((tg, i) => ({ ...tg, i, x: 0, y: 0, bump: 0, hitAt: 0 }));
    const labelBtns = blocks.map((b) => {
      const el = document.createElement('button');
      el.className = 'stage-label';
      el.innerHTML = `<span class="px-n">1-${b.i + 1}</span>${b.label}`;
      el.addEventListener('click', () => { hitBlock(b, true); });
      labelsEl.appendChild(el);
      return el;
    });

    const readPalette = () => {
      pal = {
        sky1: css('--sky-1'), sky2: css('--sky-2'), hill1: css('--hill-1'), hill2: css('--hill-2'),
        grass: css('--grass'), dirt: css('--dirt'), dirt2: css('--dirt-2'), cloud: css('--cloud'),
        gold: css('--gold'), gold2: css('--gold-2'), ink: '#17152b', pink: css('--pink'),
        night: css('--is-night') === '1',
      };
      buildHeroSprites();
    };

    const layout = () => {
      const r = wrap.getBoundingClientRect();
      S = Math.max(2, Math.round(r.height / 110));
      W = Math.ceil(r.width / S); H = Math.ceil(r.height / S);
      cvs.width = W; cvs.height = H;
      cvs.style.width = `${W * S}px`; cvs.style.height = `${H * S}px`;
      groundY = H - 16;
      const n = blocks.length;
      blocks.forEach((b, i) => {
        b.x = Math.round((W * (i + 1)) / (n + 1)) - 8;
        b.y = groundY - 44;
        labelBtns[i].style.left = `${(b.x + 8) * S}px`;
        labelBtns[i].style.top = `${(b.y - 6) * S}px`;
      });
      // scenery
      const rnd = mulberry(7);
      stars = Array.from({ length: Math.round(W * H / 220) }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * (groundY - 30)), p: rnd() * 6 }));
      clouds = Array.from({ length: Math.max(3, Math.round(W / 90)) }, (_, i) => ({ x: rnd() * W, y: 6 + rnd() * (groundY * 0.35), s: 0.6 + rnd() * 0.8, v: 2 + rnd() * 3, k: i % 2 }));
      coinsArr = [];
      for (let i = 0; i < n + 1; i++) {
        const cx = Math.round((W * (i + 0.5)) / (n + 1));
        coinsArr.push({ x: cx - 3, y: groundY - 22, taken: false, respawn: 0 });
      }
      P.y = Math.min(P.y, groundY - P.h);
      if (P.x > W - P.w) P.x = W - P.w;
      if (P.y === 0) P.y = groundY - P.h;
      AI.target = W * 0.3;
    };

    const hitBlock = (b, fromClick = false) => {
      b.bump = 1;
      Sfx.bump();
      parts.push({ kind: 'coin', x: b.x + 5, y: b.y - 4, vy: -120, life: 0.6 });
      labelBtns[b.i].classList.add('flash');
      setTimeout(() => labelBtns[b.i].classList.remove('flash'), 400);
      if (attract && !fromClick) return;
      addCoin();
      achieve('block', 'Block buster. You found out the blocks are the menu.');
      const target = document.getElementById(b.id);
      setTimeout(() => target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), fromClick ? 150 : 450);
      // bounce the headline letter matching the block index for fun
      const l = letters[b.i % letters.length];
      if (l) { l.classList.add('hit'); setTimeout(() => l.classList.remove('hit'), 300); }
    };

    const startPlay = () => {
      if (!attract) return;
      attract = false;
      hint.textContent = 'Playing · hit a block to travel';
      hint.classList.add('is-playing');
      P.vx = 0;
    };

    const update = (dt) => {
      t += dt;
      // input
      let dir = 0;
      if (attract) {
        if (Math.abs(AI.target - P.x) < 4) AI.target = 10 + Math.random() * (W - 30);
        dir = Math.sign(AI.target - P.x);
        AI.jumpT -= dt;
      } else {
        dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      }
      const maxV = attract ? 55 : 95;
      if (dir) { P.vx += dir * 700 * dt; P.face = dir; }
      else { const f = Math.min(Math.abs(P.vx), 800 * dt); P.vx -= Math.sign(P.vx) * f; }
      P.vx = Math.max(-maxV, Math.min(maxV, P.vx));

      const wantJump = attract ? AI.jumpT <= 0 : keys.jump;
      if (wantJump && P.ground) {
        P.vy = -250; P.ground = false; Sfx.jump();
        if (attract) AI.jumpT = 1.2 + Math.random() * 2.4;
      }
      if (!attract && !keys.jump && P.vy < -90) P.vy = -90; // variable jump height

      P.vy += 900 * dt;
      const prevTop = P.y;
      P.x += P.vx * dt; P.y += P.vy * dt;

      // head bump on blocks
      if (P.vy < 0) {
        for (const b of blocks) {
          const bx = b.x, bottom = b.y + 16;
          if (P.x + P.w > bx + 1 && P.x < bx + 15 && P.y < bottom && prevTop >= bottom - 0.5) {
            P.y = bottom; P.vy = 60;
            if (performance.now() - b.hitAt > 300) { b.hitAt = performance.now(); hitBlock(b); }
          }
        }
      }
      // ground + walls
      if (P.y + P.h >= groundY) { P.y = groundY - P.h; P.vy = 0; P.ground = true; }
      if (P.x < 0) { P.x = 0; P.vx = 0; }
      if (P.x > W - P.w) { P.x = W - P.w; P.vx = 0; }

      // coins
      for (const c of coinsArr) {
        if (c.taken) { c.respawn -= dt; if (c.respawn <= 0) c.taken = false; continue; }
        if (P.x < c.x + 6 && P.x + P.w > c.x && P.y < c.y + 8 && P.y + P.h > c.y) {
          c.taken = true; c.respawn = 9;
          if (!attract) addCoin();
          for (let i = 0; i < 6; i++) parts.push({ kind: 'spark', x: c.x + 3, y: c.y + 4, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 90, life: 0.4 });
        }
      }
      // blocks settle
      blocks.forEach((b) => { b.bump = Math.max(0, b.bump - dt * 5); });
      // particles
      parts = parts.filter((p) => {
        p.life -= dt;
        if (p.kind === 'coin') { p.y += p.vy * dt; p.vy += 320 * dt; }
        else { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
        return p.life > 0;
      });
      // clouds
      clouds.forEach((c) => { c.x += c.v * dt; if (c.x > W + 30) c.x = -40; });
      // animation
      P.anim += Math.abs(P.vx) * dt * 0.12;
      P.blinkT -= dt; if (P.blinkT < -0.12) P.blinkT = 2 + Math.random() * 3;
    };

    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

    const drawSky = () => {
      const bands = 7;
      const top = hexToRgb(pal.sky1), bot = hexToRgb(pal.sky2);
      const bh = Math.ceil(groundY / bands);
      for (let i = 0; i < bands; i++) {
        const k = i / (bands - 1);
        ctx.fillStyle = `rgb(${lerp(top[0], bot[0], k)},${lerp(top[1], bot[1], k)},${lerp(top[2], bot[2], k)})`;
        ctx.fillRect(0, i * bh, W, bh + 1);
        // dither seam
        if (i < bands - 1) {
          const k2 = (i + 1) / (bands - 1);
          ctx.fillStyle = `rgb(${lerp(top[0], bot[0], k2)},${lerp(top[1], bot[1], k2)},${lerp(top[2], bot[2], k2)})`;
          for (let x = (i % 2); x < W; x += 2) ctx.fillRect(x, (i + 1) * bh - 1, 1, 1);
        }
      }
    };

    const drawDisc = (cx, cy, r, color, cut) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        if (cut && (x - cut) * (x - cut) + (y + 2) * (y + 2) <= r * r) continue;
        px(cx + x, cy + y, 1, 1, color);
      }
    };

    const drawCloud = (c) => {
      const s = c.s, x = c.x, y = c.y;
      const w = Math.round(22 * s), h = Math.round(6 * s);
      px(x, y + h * 0.5, w, h, pal.cloud);
      px(x + w * 0.2, y, w * 0.45, h * 0.6, pal.cloud);
      px(x + w * 0.5, y - h * 0.4, w * 0.3, h, pal.cloud);
    };

    const hill = (color, base, amp, freq, phase, shift, step) => {
      ctx.fillStyle = color;
      for (let x = 0; x < W; x += step) {
        const wx = x + shift;
        const h = base + Math.sin(wx * freq + phase) * amp + Math.sin(wx * freq * 2.7 + phase * 2) * amp * 0.35;
        const top = Math.round(groundY - h);
        ctx.fillRect(x, top, step, groundY - top);
      }
    };

    const drawGround = () => {
      px(0, groundY, W, H - groundY, pal.dirt);
      px(0, groundY, W, 3, pal.grass);
      ctx.fillStyle = pal.dirt2;
      for (let x = 0; x < W; x += 8) {
        ctx.fillRect(x, groundY + 3, 1, H - groundY);
        const off = (x / 8) % 2 ? 7 : 11;
        ctx.fillRect(x + 3, groundY + off, 2, 1);
      }
      ctx.fillStyle = pal.grass;
      for (let x = 2; x < W; x += 5) ctx.fillRect(x, groundY - 1, 1, 1);
    };

    const QMARK = ['.kkk.', 'k...k', '....k', '..kk.', '..k..', '.....', '..k..'];
    const drawBlock = (b) => {
      const oy = -Math.round(Math.sin(b.bump * Math.PI) * 4);
      const x = b.x, y = b.y + oy;
      px(x, y, 16, 16, pal.ink);
      px(x + 1, y + 1, 14, 14, pal.gold);
      px(x + 1, y + 13, 14, 2, pal.gold2);
      px(x + 13, y + 1, 2, 14, pal.gold2);
      px(x + 2, y + 2, 1, 1, pal.ink); px(x + 13, y + 2, 1, 1, pal.ink);
      px(x + 2, y + 13, 1, 1, pal.ink); px(x + 13, y + 13, 1, 1, pal.ink);
      const glint = Math.floor(t * 2 + b.i) % 4 === 0;
      QMARK.forEach((row, j) => [...row].forEach((c, i) => {
        if (c === 'k') px(x + 5 + i, y + 4 + j, 1, 1, glint ? '#ffffff' : pal.ink);
      }));
    };

    const drawCoin = (x, y, phase) => {
      const w = [6, 4, 2, 4][Math.floor(phase) % 4];
      const ox = (6 - w) / 2;
      px(x + ox, y, w, 8, pal.ink);
      if (w > 2) px(x + ox + 1, y + 1, w - 2, 6, pal.gold);
      if (w === 6) px(x + 3, y + 2, 1, 4, pal.gold2);
    };

    const drawPlayer = () => {
      let key = 'idle';
      if (!P.ground) key = 'jump';
      else if (Math.abs(P.vx) > 8) key = Math.floor(P.anim) % 2 ? 'run1' : 'run2';
      else if (P.blinkT < 0) key = 'blink';
      const spr = spriteCache.get(key);
      if (!spr) return;
      const x = Math.round(P.x) - 1, y = Math.round(P.y);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      const sh = Math.max(3, 9 - Math.round((groundY - (P.y + P.h)) / 6));
      ctx.fillRect(Math.round(P.x + P.w / 2 - sh / 2), groundY, sh, 1);
      if (P.face < 0) {
        ctx.save(); ctx.translate(x + spr.width, y); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0); ctx.restore();
      } else ctx.drawImage(spr, x, y);
    };

    const render = () => {
      ctx.imageSmoothingEnabled = false;
      drawSky();
      // sun / moon
      const par = (mouseX - 0.5);
      if (pal.night) {
        stars.forEach((s) => {
          const on = Math.sin(t * 2 + s.p) > -0.3;
          if (on) px(s.x - par * 2, s.y, 1, 1, s.p > 5 ? pal.gold : '#d9d6ff');
        });
        drawDisc(Math.round(W * 0.82 - par * 3), 18, 7, '#f3efd6', 4);
      } else {
        drawDisc(Math.round(W * 0.82 - par * 3), 18, 8, pal.gold);
      }
      clouds.forEach(drawCloud);
      hill(pal.hill1, 34, 8, 0.03, 1, -par * 10, 2);
      hill(pal.hill2, 18, 6, 0.05, 3, -par * 22, 2);
      drawGround();
      coinsArr.forEach((c, i) => { if (!c.taken) drawCoin(c.x, c.y + Math.round(Math.sin(t * 3 + i) * 1.5), t * 8 + i); });
      blocks.forEach(drawBlock);
      parts.forEach((p) => {
        if (p.kind === 'coin') drawCoin(p.x, p.y, t * 16);
        else px(p.x, p.y, 1, 1, pal.gold);
      });
      drawPlayer();
    };

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0);
      last = now;
      if (visible) { update(dt); render(); }
      requestAnimationFrame(loop);
    };

    // input
    const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' };
    const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || $('#inspect').open;
    addEventListener('keydown', (e) => {
      const k = KEYMAP[e.code];
      if (!k || !visible || typing()) return;
      if (e.code === 'Space' && document.activeElement && document.activeElement !== document.body && document.activeElement !== wrap) return;
      e.preventDefault();
      startPlay();
      keys[k] = true;
    });
    addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
    $$('.pad-btn').forEach((b) => {
      const k = b.dataset.key;
      const down = (e) => { e.preventDefault(); startPlay(); keys[k] = true; b.classList.add('is-down'); };
      const up = () => { keys[k] = false; b.classList.remove('is-down'); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
    });
    wrap.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.stage-label')) return;
      wrap.focus({ preventScroll: true });
    });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.15 }).observe(wrap);
    new ResizeObserver(() => { if (!pal.sky1) return; layout(); render(); }).observe(wrap);

    return {
      init() { readPalette(); layout(); render(); if (!reduced) requestAnimationFrame(loop); else { attract = false; hint.textContent = 'Press ← → to play'; requestAnimationFrame(loop); } },
      repaint() { readPalette(); render(); },
    };
  })();

  /* ---------------------------------------------------------
     STATIC PIXEL ART — avatar, NPC, project covers
     --------------------------------------------------------- */
  const avatar = $('#avatar');
  const npc = $('#npc');
  let avatarBlink = false;
  const drawAvatar = () => {
    const x = avatar.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 24, 24);
    const spr = spriteCache.get(avatarBlink ? 'blink' : 'idle');
    if (spr) x.drawImage(spr, 6, 5);
  };
  const drawNpc = () => {
    const x = npc.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 16, 16);
    const face = [
      '...kkkkkk...',
      '..kppppppk..',
      '.kppppwpppk.',
      '.kppkkkkkkkk',
      '.kssssssssk.',
      '.ksskssskk..',
      '.ksskssskk..',
      '.kssssssssk.',
      '.ksspppsssk.',
      '..kssssssk..',
      '...kkkkkk...',
      '..kbbbbbbk..',
      '.kbbbybbbbk.',
    ];
    x.drawImage(makeSprite(face, heroPalette()), 2, 2);
  };

  function paintStatic() {
    buildHeroSprites();
    drawAvatar(); drawNpc();
    $$('.inv-cover canvas').forEach((c) => drawCover(c, PROJECTS[+c.dataset.i], 0));
  }

  // Procedural "item" art per project, seeded so it's stable
  const drawCover = (c, p, frame) => {
    const x = c.getContext('2d');
    const W = c.width, H = c.height;
    const rnd = mulberry(p.seed);
    const hues = [css('--accent'), css('--pink'), css('--gold'), css('--mint')];
    const main = hues[p.seed % 4], alt = hues[(p.seed + 1) % 4];
    const bgA = '#17152b', bgB = '#221f3f';
    x.imageSmoothingEnabled = false;
    // background with dither
    x.fillStyle = bgA; x.fillRect(0, 0, W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const d = j / H;
      if ((i + j) % 2 === 0 && rnd() < d * 0.9) { x.fillStyle = bgB; x.fillRect(i, j, 1, 1); }
    }
    // stars
    for (let s = 0; s < 18; s++) { x.fillStyle = rnd() > 0.8 ? alt : '#5b5790'; x.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.6), 1, 1); }
    // horizon planet
    const pr = Math.round(H * 0.9);
    x.fillStyle = main;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const dx = i - W / 2, dy = j - (H + pr * 0.55);
      const d2 = dx * dx + dy * dy;
      if (d2 < pr * pr) {
        x.globalAlpha = (i + j) % 2 && d2 > (pr - 2) * (pr - 2) ? 0.5 : 0.22;
        x.fillRect(i, j, 1, 1);
      }
    }
    x.globalAlpha = 1;
    // mirrored creature sprite
    const hw = 6, hh = 8, grid = [];
    for (let j = 0; j < hh; j++) {
      grid[j] = [];
      for (let i = 0; i < hw; i++) grid[j][i] = rnd() < 0.5 - Math.abs(i - hw) * 0.02 ? 1 : 0;
    }
    if (frame) { // alternate legs
      for (let i = 0; i < hw; i++) { const t0 = grid[hh - 1][i]; grid[hh - 1][i] = grid[hh - 2][i]; grid[hh - 2][i] = t0; }
    }
    const sw = hw * 2, ox = Math.floor(W / 2 - sw / 2), oy = Math.floor(H / 2 - hh / 2) - 2 + (frame ? -1 : 0);
    const full = grid.map((r) => r.concat([...r].reverse()));
    const on = (i, j) => full[j] && full[j][i];
    // outline
    x.fillStyle = '#0a0914';
    for (let j = -1; j <= hh; j++) for (let i = -1; i <= sw; i++) {
      if (on(i, j)) continue;
      if (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1)) x.fillRect(ox + i, oy + j, 1, 1);
    }
    for (let j = 0; j < hh; j++) for (let i = 0; i < sw; i++) {
      if (!on(i, j)) continue;
      x.fillStyle = j < 2 ? '#ffffff' : (j > hh - 3 ? alt : main);
      x.fillRect(ox + i, oy + j, 1, 1);
    }
    // eyes
    x.fillStyle = '#0a0914';
    x.fillRect(ox + 3, oy + 3, 2, 2); x.fillRect(ox + sw - 5, oy + 3, 2, 2);
    // ground shadow
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(ox + 1, oy + hh + 3, sw - 2, 1);
  };

  /* ---------------------------------------------------------
     INVENTORY
     --------------------------------------------------------- */
  const inv = $('#inv');
  inv.innerHTML = PROJECTS.map((p, i) => `
    <li class="inv-item${p.wide ? ' is-wide' : ''}" data-cat="${p.cat}">
      <button class="inv-card" data-i="${i}" aria-label="Inspect ${p.title}">
        <span class="inv-cover">
          <canvas width="${p.wide ? 64 : 40}" height="${p.wide ? 36 : 30}" data-i="${i}" aria-hidden="true"></canvas>
          <span class="inv-rarity px" style="--r: var(${RARITY[p.rarity]})">${p.rarity}</span>
          <span class="inv-cta px">Inspect ▸</span>
        </span>
        <span class="inv-meta">
          <span class="inv-title">${p.title}</span>
          <span class="inv-cat px">${p.cat} · ${p.year}</span>
        </span>
        <span class="inv-desc">${p.desc}</span>
      </button>
    </li>`).join('');

  // cover animation on hover (2-frame idle like an arcade sprite)
  $$('.inv-card').forEach((card) => {
    const c = $('canvas', card), p = PROJECTS[+card.dataset.i];
    let timer = null, f = 0;
    const start = () => { if (timer || reduced) return; timer = setInterval(() => { f ^= 1; drawCover(c, p, f); }, 260); Sfx.blip(); };
    const stop = () => { clearInterval(timer); timer = null; f = 0; drawCover(c, p, 0); };
    card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
    card.addEventListener('focus', start); card.addEventListener('blur', stop);
    card.addEventListener('click', () => openInspect(p));
  });

  // filters
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    $$('.filter').forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    const f = btn.dataset.filter;
    $$('.inv-item').forEach((it) => it.classList.toggle('is-out', f !== 'all' && it.dataset.cat !== f));
    Sfx.blip();
  }));

  // inspect modal
  const dlg = $('#inspect');
  const openInspect = (p) => {
    $('#inspect-title').textContent = p.title;
    const r = $('#inspect-rarity');
    r.textContent = p.rarity;
    r.style.setProperty('--r', `var(${RARITY[p.rarity]})`);
    $('#inspect-desc').textContent = `${p.desc} This panel is where a longer case-study summary goes: context, process, and results.`;
    $('#inspect-stats').innerHTML = [['Type', p.cat], ['Year', p.year], ['Role', p.role], ['Stack', p.stack]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const cover = $('#inspect-cover');
    drawCover(cover, p, 0);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    Sfx.open();
    achieve('inspect', 'Item inspected. Every project has a story.');
  };
  $('#inspect-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#inspect-link').addEventListener('click', (e) => e.preventDefault());

  /* ---------------------------------------------------------
     QUEST LOG accordion
     --------------------------------------------------------- */
  $$('.quest-head').forEach((h) => h.addEventListener('click', () => {
    const q = h.closest('.quest');
    const open = !q.classList.contains('is-open');
    q.classList.toggle('is-open', open);
    h.setAttribute('aria-expanded', String(open));
    open ? Sfx.open() : Sfx.blip();
  }));

  /* ---------------------------------------------------------
     CHARACTER CARD tilt + stat bars
     --------------------------------------------------------- */
  const card = $('#char-card');
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px2 = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', `${px2 * 10}deg`);
      card.style.setProperty('--rx', `${-py * 10}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
  }
  const stats = $('#stats');
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { stats.classList.add('play'); o.disconnect(); }
  }, { threshold: 0.5 }).observe(stats);
  setInterval(() => { avatarBlink = true; drawAvatar(); setTimeout(() => { avatarBlink = false; drawAvatar(); }, 140); }, 3200);

  /* ---------------------------------------------------------
     SAVE POINT — typewriter dialogue + choices
     --------------------------------------------------------- */
  const dText = $('#dialog-text');
  const fullText = dText.textContent;
  let typingTimer = null;
  const typeOut = (str) => {
    clearInterval(typingTimer);
    if (reduced) { dText.textContent = str; return; }
    let i = 0;
    dText.innerHTML = '<span class="cursor"></span>';
    typingTimer = setInterval(() => {
      i++;
      dText.innerHTML = `${escapeHtml(str.slice(0, i))}<span class="cursor"></span>`;
      if (i % 2) Sfx.type();
      if (i >= str.length) { clearInterval(typingTimer); dText.textContent = str; }
    }, 24);
  };
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { typeOut(fullText); o.disconnect(); } }, { threshold: 0.6 }).observe($('#dialog-box'));

  const choices = $('#choices'), form = $('#msg-form');
  $$('.choice').forEach((c) => {
    c.addEventListener('mouseenter', () => { Sfx.blip(); c.focus({ preventScroll: true }); });
    c.addEventListener('click', async (e) => {
      const act = c.dataset.act;
      if (act === 'link') { e.preventDefault(); typeOut('That link is a placeholder for now. Real links are coming soon.'); return; }
      if (act === 'copy') {
        const email = $('#email-val').textContent;
        try { await navigator.clipboard.writeText(email); typeOut(`Copied ${email} to your clipboard. Talk soon!`); }
        catch { const r = document.createRange(); r.selectNodeContents($('#email-val')); getSelection().removeAllRanges(); getSelection().addRange(r); typeOut('Email selected. Press Ctrl+C or Cmd+C to copy it.'); }
        Sfx.coin();
      }
      if (act === 'form') {
        choices.hidden = true; form.hidden = false; $('#f-name').focus();
        typeOut('Great, tell me a bit about your project.');
      }
    });
  });
  // arrow keys move between choices, like an RPG menu
  choices.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const list = $$('.choice', choices);
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
    Sfx.blip();
  });
  $('#form-back').addEventListener('click', () => { form.hidden = true; choices.hidden = false; typeOut(fullText); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#form-note').textContent = 'Placeholder form: your message was not sent. Connect a form service to make this live.';
    typeOut('Progress saved! (This form is a demo for now.)');
    Sfx.power();
  });

  /* ---------------------------------------------------------
     KONAMI CODE → CRT mode
     --------------------------------------------------------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = key === KONAMI[kIdx] ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      document.body.classList.toggle('crt');
      addCoin(30);
      achieve('konami', 'Cheat code accepted. CRT mode toggled, 30 coins added.');
    }
  });

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */
  function mulberry(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t2 = Math.imul(a ^ (a >>> 15), 1 | a); t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2; return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296; };
  }
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lerp(a, b, k) { return Math.round(a + (b - a) * k); }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  const boot = () => { Stage.init(); paintStatic(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
})();
