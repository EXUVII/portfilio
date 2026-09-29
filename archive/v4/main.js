/* =========================================================
   RISO PRESS — portfolio v4
   Two-ink risograph zine: physics type, halftones,
   generative posters, swappable ink sets.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  };

  /* ---------------------------------------------------------
     CONTENT — placeholders (edit these)
     --------------------------------------------------------- */
  const NAME = 'YOUR NAME';
  const PORTRAIT_SRC = ''; // set to an image path to halftone your real photo
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', style: 'sun',
      desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Web', year: '2025', role: 'Design & Development', stack: 'Astro, GSAP', style: 'stripes',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: 'Brand', year: '2025', role: 'Visual Identity', stack: 'Illustrator, Figma', style: 'type',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Motion', year: '2024', role: 'Motion Designer', stack: 'After Effects, Rive', style: 'waves',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Product', year: '2023', role: 'Product Designer', stack: 'Figma, Framer', style: 'dots',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'Editorial', year: '2022', role: 'Art Direction', stack: 'InDesign, Riso', style: 'arch',
      desc: 'One or two sentences about what this was and why it mattered.' },
  ];
  const TOOLS = ['Figma', 'React', 'TypeScript', 'Three.js', 'WebGL', 'Blender', 'After Effects', 'Framer', 'Design systems', 'Prototyping', 'Typography', 'Art direction', 'Motion', 'Risograph'];

  const INKS = [
    { name: 'Fluorescent Pink + Medium Blue', a: '#ff48b0', b: '#3255a4' },
    { name: 'Orange + Hunter Green', a: '#ff6c2f', b: '#407060' },
    { name: 'Yellow + Purple', a: '#ffe800', b: '#765ba7' },
    { name: 'Bright Red + Black', a: '#f15060', b: '#1d1d1d' },
  ];
  const PAPER = '#eeede8';
  let ink = INKS[0];

  /* ---------------------------------------------------------
     PAPER GRAIN
     --------------------------------------------------------- */
  (() => {
    const c = document.createElement('canvas'); c.width = c.height = 220;
    const x = c.getContext('2d'), img = x.createImageData(220, 220);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = Math.random();
      const v = 255 - Math.pow(n, 3) * 70;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v - 2; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    root.style.setProperty('--grain', `url(${c.toDataURL()})`);
  })();

  /* ---------------------------------------------------------
     HALFTONE HELPERS
     --------------------------------------------------------- */
  // Fill dots on a rotated grid; fn(x, y) returns coverage 0..1
  function halftone(ctx, fn, spacing, angleDeg, x0, y0, w, h, color) {
    const a = angleDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + spacing;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let u = -R; u <= R; u += spacing) {
      for (let v = -R; v <= R; v += spacing) {
        const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
        if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) continue;
        const val = fn(x, y);
        if (val <= 0.03) continue;
        const r = spacing * 0.62 * Math.sqrt(clamp(val));
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
  const dotPatterns = new Map();
  function dotPattern(ctx, color, size = 7) {
    const key = color + size;
    if (!dotPatterns.has(key)) {
      const c = document.createElement('canvas'); c.width = c.height = size * 2;
      const x = c.getContext('2d'); x.fillStyle = color;
      x.beginPath(); x.arc(size * 0.5, size * 0.5, size * 0.28, 0, 7); x.arc(size * 1.5, size * 1.5, size * 0.28, 0, 7); x.fill();
      dotPatterns.set(key, c);
    }
    return ctx.createPattern(dotPatterns.get(key), 'repeat');
  }
  const archivo = (ctx, weight, px, stretch = 'expanded') => {
    ctx.font = `${weight} ${px}px Archivo, "Arial Black", Arial, sans-serif`;
    if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  };
  const mono = (ctx, px) => { ctx.font = `500 ${px}px "IBM Plex Mono", ui-monospace, monospace`; if ('fontStretch' in ctx) ctx.fontStretch = 'normal'; };
  function regMark(ctx, x, y, r, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.moveTo(x - r * 1.5, y); ctx.lineTo(x + r * 1.5, y); ctx.moveTo(x, y - r * 1.5); ctx.lineTo(x, y + r * 1.5); ctx.stroke();
  }

  /* ---------------------------------------------------------
     PHYSICS BOX (shared by the cover type and the tools tray)
     --------------------------------------------------------- */
  const hasMatter = !!window.Matter;
  if (!hasMatter) {
    document.body.classList.add('no-physics');
    $('#tool-list').classList.remove('sr-only');
  }

  function PhysicsBox(canvas, { create, draw, settle = 0 }) {
    const M = Matter;
    const engine = M.Engine.create();
    engine.gravity.y = 1;
    const ctx = canvas.getContext('2d');
    const st = { W: 1, H: 1, dpr: 1, bodies: [], rings: [], drag: null, visible: true, lastW: 0 };

    function build() {
      const r = canvas.getBoundingClientRect();
      st.W = Math.max(1, r.width); st.H = Math.max(1, r.height);
      st.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(st.W * st.dpr); canvas.height = Math.round(st.H * st.dpr);
      M.Composite.clear(engine.world, false);
      const { W, H } = st, t = 200;
      const walls = [
        M.Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
        M.Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
        M.Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
        M.Bodies.rectangle(W / 2, -H * 1.6, W * 3, t, { isStatic: true }),
      ];
      st.bodies = create(W, H, ctx);
      M.Composite.add(engine.world, [...walls, ...st.bodies]);
      for (let i = 0; i < settle; i++) M.Engine.update(engine, 1000 / 60);
      st.lastW = W;
    }

    const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    let down = null;
    canvas.addEventListener('pointerdown', (e) => {
      const p = local(e);
      down = { x: p.x, y: p.y, moved: 0 };
      if (e.pointerType === 'touch') return; // touch: keep the page scrollable, tap to knock
      const hit = M.Query.point(st.bodies, p)[0];
      if (!hit) return;
      const c = M.Constraint.create({ pointA: p, bodyB: hit, pointB: { x: p.x - hit.position.x, y: p.y - hit.position.y }, stiffness: 0.06, damping: 0.08, length: 0 });
      M.Composite.add(engine.world, c);
      st.drag = c;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('is-grabbing');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!down) return;
      const p = local(e);
      down.moved += Math.abs(p.x - down.x) + Math.abs(p.y - down.y);
      if (st.drag) st.drag.pointA = p;
    });
    const end = (e) => {
      if (st.drag) { M.Composite.remove(engine.world, st.drag); st.drag = null; canvas.classList.remove('is-grabbing'); }
      else if (down && down.moved < 10 && e.type === 'pointerup') knock(local(e));
      down = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    function knock(p, power = 1) {
      st.rings.push({ x: p.x, y: p.y, t: 0 });
      st.bodies.forEach((b) => {
        const dx = b.position.x - p.x, dy = b.position.y - p.y, d = Math.hypot(dx, dy) || 1;
        const R = Math.max(260, st.W * 0.3);
        if (d > R) return;
        const s = (1 - d / R) * 16 * power;
        M.Body.setVelocity(b, { x: b.velocity.x + (dx / d) * s, y: b.velocity.y + (dy / d) * s - 5 * (1 - d / R) });
        M.Body.setAngularVelocity(b, b.angularVelocity + (Math.random() - 0.5) * 0.25);
      });
    }
    function shake() {
      st.bodies.forEach((b) => {
        M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 16, y: -8 - Math.random() * 12 });
        M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
      });
    }

    new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    let rz;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (Math.abs(canvas.getBoundingClientRect().width - st.lastW) > 2) build(); }, 180);
    });

    function frame() {
      if (st.visible) {
        M.Engine.update(engine, 1000 / 60);
        ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
        ctx.clearRect(0, 0, st.W, st.H);
        draw(ctx, st);
        // knock ripples
        st.rings = st.rings.filter((r) => {
          r.t += 1 / 60;
          ctx.globalCompositeOperation = 'multiply';
          ctx.strokeStyle = ink.a; ctx.lineWidth = 3 * (1 - r.t / 0.6);
          ctx.beginPath(); ctx.arc(r.x, r.y, 10 + r.t * 260, 0, 7); ctx.stroke();
          return r.t < 0.6;
        });
        ctx.globalCompositeOperation = 'source-over';
      }
      requestAnimationFrame(frame);
    }
    build();
    requestAnimationFrame(frame);
    return { build, knock, shake, st };
  }

  /* ---------------------------------------------------------
     COVER — the name as physical type
     --------------------------------------------------------- */
  let press = null;
  function initPress() {
    const canvas = $('#press-canvas');
    press = PhysicsBox(canvas, {
      settle: 90,
      create(W, H, ctx) {
        const M = Matter;
        archivo(ctx, 900, 100);
        const capH100 = ctx.measureText('H').actualBoundingBoxAscent || 72;
        const words = NAME.split(' ');
        const widthOf = (s) => { archivo(ctx, 900, 100); return ctx.measureText(s).width; };
        const total = widthOf(NAME);
        let lines = [NAME];
        let fs = Math.min(H * 0.56 / (capH100 / 100), (W * 0.92) / (total / 100));
        if (words.length > 1 && fs * capH100 / 100 < H * 0.3) {
          lines = words;
          const maxW = Math.max(...words.map(widthOf));
          fs = Math.min((H * 0.36) / (capH100 / 100), (W * 0.92) / (maxW / 100));
        }
        const capH = capH100 * fs / 100;
        const bodies = [];
        lines.slice().reverse().forEach((line, li) => {
          const lw = widthOf(line) * fs / 100;
          let x = (W - lw) / 2;
          const y = H - capH / 2 - li * (capH + 2) - 1;
          [...line].forEach((ch) => {
            const adv = widthOf(ch) * fs / 100;
            if (ch !== ' ') {
              const b = M.Bodies.rectangle(x + adv / 2, y, adv * 0.9, capH, { chamfer: { radius: fs * 0.03 }, restitution: 0.2, friction: 0.7, density: 0.002 });
              b.kind = 'letter'; b.ch = ch; b.fs = fs; b.capH = capH;
              bodies.push(b);
            }
            x += adv;
          });
        });
        // decorative riso shapes
        const r = Math.max(28, fs * 0.36);
        const circle = M.Bodies.circle(W * 0.78, H - capH * lines.length - r - 20, r, { restitution: 0.4, friction: 0.3, density: 0.001 });
        circle.kind = 'circle'; circle.r = r;
        const tri = M.Bodies.polygon(W * 0.2, H - capH * lines.length - r - 20, 3, r * 1.05, { restitution: 0.2, friction: 0.8, density: 0.001 });
        tri.kind = 'tri';
        const ph = Math.max(34, fs * 0.32);
        archivo(ctx, 800, Math.round(ph * 0.4), 'semi-expanded');
        const pw = ctx.measureText('AVAILABLE 2026').width + ph * 1.2;
        const pill = M.Bodies.rectangle(W * 0.5, H - capH * lines.length - ph - 30, pw, ph, { chamfer: { radius: ph / 2 }, restitution: 0.3, friction: 0.5, density: 0.001 });
        pill.kind = 'pill'; pill.w = pw; pill.h = ph;
        M.Body.setAngle(pill, -0.12);
        bodies.push(circle, tri, pill);
        return bodies;
      },
      draw(ctx, st) {
        const bs = st.bodies;
        ctx.globalCompositeOperation = 'multiply';
        // ink 1 pass: shapes + the misregistered copy of every letter
        bs.forEach((b) => {
          ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
          if (b.kind === 'circle') { ctx.fillStyle = ink.a; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.fill(); }
          else if (b.kind === 'tri') {
            ctx.restore(); ctx.save();
            ctx.fillStyle = dotPattern(ctx, ink.a, 8);
            ctx.beginPath(); b.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = ink.a; ctx.lineWidth = 3; ctx.stroke();
          } else if (b.kind === 'pill') {
            ctx.fillStyle = ink.a; roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2); ctx.fill();
          } else if (b.kind === 'letter') {
            archivo(ctx, 900, b.fs); ctx.textAlign = 'center'; ctx.fillStyle = ink.a;
            ctx.fillText(b.ch, b.fs * 0.028, b.capH / 2 + b.fs * 0.02);
          }
          ctx.restore();
        });
        // ink 2 pass: the letters
        bs.forEach((b) => {
          if (b.kind !== 'letter' && b.kind !== 'pill') return;
          ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
          if (b.kind === 'letter') { archivo(ctx, 900, b.fs); ctx.textAlign = 'center'; ctx.fillStyle = ink.b; ctx.fillText(b.ch, 0, b.capH / 2); }
          else { archivo(ctx, 800, Math.round(b.h * 0.4), 'semi-expanded'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink.b; ctx.fillText('AVAILABLE 2026', 0, 1); ctx.textBaseline = 'alphabetic'; }
          ctx.restore();
        });
      },
    });
    $('#shake').addEventListener('click', () => press.shake());
    $('#reset').addEventListener('click', () => press.build());
    if (!fine) $('#press-hint').textContent = 'Tap the paper to knock the letters over.';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------------------------------------------------------
     TOOLS TRAY
     --------------------------------------------------------- */
  let tray = null;
  $('#tool-list').innerHTML = TOOLS.map((t) => `<li>${t}</li>`).join('');
  function initTray() {
    tray = PhysicsBox($('#tray-canvas'), {
      settle: 420,
      create(W, H, ctx) {
        const M = Matter;
        const fs = W < 600 ? 15 : 18;
        archivo(ctx, 700, fs, 'semi-expanded');
        return TOOLS.map((t, i) => {
          const w = ctx.measureText(t).width + fs * 2.2, h = fs * 2.5;
          const b = M.Bodies.rectangle(40 + Math.random() * (W - 80), -Math.random() * H * 1.2, w, h, { chamfer: { radius: h / 2 }, restitution: 0.3, friction: 0.4, density: 0.0015, angle: (Math.random() - 0.5) * 0.6 });
          b.kind = 'pill'; b.label = t; b.w = w; b.h = h; b.fs = fs; b.variant = i % 3;
          return b;
        });
      },
      draw(ctx, st) {
        ctx.globalCompositeOperation = 'multiply';
        st.bodies.forEach((b) => {
          ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
          roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2);
          if (b.variant === 0) { ctx.fillStyle = ink.b; ctx.fill(); }
          else if (b.variant === 1) { ctx.fillStyle = ink.a; ctx.fill(); }
          else { ctx.fillStyle = dotPattern(ctx, ink.a, 6); ctx.fill(); ctx.strokeStyle = ink.b; ctx.lineWidth = 2; ctx.stroke(); }
          archivo(ctx, 700, b.fs, 'semi-expanded'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (b.variant === 0) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = PAPER; ctx.fillText(b.label, 0, 1); ctx.globalCompositeOperation = 'multiply'; }
          else { ctx.fillStyle = ink.b; ctx.fillText(b.label, 0, 1); }
          ctx.restore();
        });
      },
    });
    $('#tray-shake').addEventListener('click', () => tray.shake());
  }

  /* ---------------------------------------------------------
     PORTRAIT — duotone halftone that swells under the cursor
     --------------------------------------------------------- */
  const portrait = $('#portrait');
  const pctx = portrait.getContext('2d');
  const pState = { W: 1, H: 1, dpr: 1, mx: -999, my: -999, amt: 0, target: 0, img: null, raf: 0 };
  function silhouette(u, v) {
    let d = 0;
    const hx = (u - 0.5) / 0.2, hy = (v - 0.36) / 0.24, head = hx * hx + hy * hy;
    if (head < 1) d = 0.5 + 0.45 * u;
    if (Math.abs(u - 0.5) < 0.075 && v > 0.55 && v < 0.72) d = Math.max(d, 0.78);
    const sx = (u - 0.5) / 0.44, sy = (v - 1.04) / 0.36;
    if (sx * sx + sy * sy < 1) d = Math.max(d, 0.7 + 0.25 * u);
    if (head < 1.08 && v < 0.27 + 0.03 * Math.sin(u * 30)) d = 0.97;
    return d;
  }
  let imgData = null;
  if (PORTRAIT_SRC) {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 250;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 200, 250);
      try { imgData = x.getImageData(0, 0, 200, 250); drawPortrait(); } catch { imgData = null; }
    };
    im.src = PORTRAIT_SRC;
  }
  const lum = (u, v) => {
    const i = (Math.floor(clamp(v, 0, 0.999) * 250) * 200 + Math.floor(clamp(u, 0, 0.999) * 200)) * 4;
    const d = imgData.data;
    return (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
  };
  function sizePortrait() {
    const r = portrait.getBoundingClientRect();
    pState.W = r.width; pState.H = r.height; pState.dpr = Math.min(2, devicePixelRatio || 1);
    portrait.width = Math.round(r.width * pState.dpr); portrait.height = Math.round(r.height * pState.dpr);
  }
  function drawPortrait() {
    const { W, H, dpr, mx, my, amt } = pState;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.clearRect(0, 0, W, H);
    pctx.globalCompositeOperation = 'multiply';
    const sp = Math.max(7, W / 44);
    const bulge = (x, y) => 1 + amt * 1.1 * Math.exp(-((x - mx) ** 2 + (y - my) ** 2) / (2 * 60 * 60));
    const dark = (x, y) => imgData ? 1 - lum(x / W, y / H) : silhouette(x / W, y / H);
    // ink 1: background gradient + warm fill inside the figure, at 15 degrees
    halftone(pctx, (x, y) => {
      const d = dark(x, y);
      const bg = 0.12 + 0.6 * (x / W) * (1 - y / H);
      return (d > 0.3 ? 0.28 : bg) * bulge(x, y);
    }, sp, 15, 0, 0, W, H, ink.a);
    // ink 2: the figure, at 45 degrees
    halftone(pctx, (x, y) => dark(x, y) * 0.95 * bulge(x, y), sp, 45, 0, 0, W, H, ink.b);
    pctx.globalCompositeOperation = 'source-over';
  }
  function animatePortrait() {
    pState.amt += (pState.target - pState.amt) * (reduced ? 1 : 0.18);
    drawPortrait();
    if (Math.abs(pState.target - pState.amt) > 0.01 || pState.moving) { pState.moving = false; pState.raf = requestAnimationFrame(animatePortrait); }
    else pState.raf = 0;
  }
  const kickPortrait = () => { if (!pState.raf) pState.raf = requestAnimationFrame(animatePortrait); };
  portrait.addEventListener('pointermove', (e) => {
    const r = portrait.getBoundingClientRect();
    pState.mx = e.clientX - r.left; pState.my = e.clientY - r.top; pState.target = 1; pState.moving = true;
    kickPortrait();
  });
  portrait.addEventListener('pointerleave', () => { pState.target = 0; kickPortrait(); });
  new ResizeObserver(() => { sizePortrait(); drawPortrait(); }).observe(portrait);

  /* ---------------------------------------------------------
     POSTERS — generative two-ink prints
     --------------------------------------------------------- */
  const PW = 660, PH = 880;
  function drawPoster(ca, cb, p, i) {
    const A = ca.getContext('2d'), B = cb.getContext('2d');
    [A, B].forEach((c) => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, PW, PH); });
    const m = 40;
    const ia = ink.a, ib = ink.b;
    switch (p.style) {
      case 'sun': {
        A.fillStyle = ia; A.beginPath(); A.arc(PW / 2, 330, 210, 0, 7); A.fill();
        halftone(B, (x, y) => (y - 380) / 300, 12, 45, 0, 380, PW, 330, ib);
        B.fillStyle = ib; B.fillRect(m, 470, PW - m * 2, 4);
        break;
      }
      case 'stripes': {
        B.save(); B.beginPath(); B.rect(m, 90, PW - m * 2, 520); B.clip();
        B.strokeStyle = ib; B.lineWidth = 16;
        for (let k = -PH; k < PW + PH; k += 40) { B.beginPath(); B.moveTo(k, 90); B.lineTo(k + 520, 610); B.stroke(); }
        B.restore();
        halftone(A, (x, y) => 1 - Math.hypot(x - PW * 0.62, y - 330) / 250, 11, 15, 0, 0, PW, PH, ia);
        break;
      }
      case 'type': {
        archivo(A, 900, 560); A.fillStyle = ia; A.textAlign = 'center'; A.fillText(String(i + 1).padStart(2, '0'), PW / 2, 560);
        B.strokeStyle = ib; B.lineWidth = 1.5;
        for (let x = m; x <= PW - m; x += 44) { B.beginPath(); B.moveTo(x, 90); B.lineTo(x, 620); B.stroke(); }
        for (let y = 90; y <= 620; y += 44) { B.beginPath(); B.moveTo(m, y); B.lineTo(PW - m, y); B.stroke(); }
        break;
      }
      case 'waves': {
        halftone(A, (x, y) => 0.15 + 0.85 * (1 - y / 640), 12, 15, 0, 0, PW, 640, ia);
        B.strokeStyle = ib; B.lineWidth = 7;
        for (let k = 0; k < 8; k++) {
          B.beginPath();
          for (let x = m; x <= PW - m; x += 6) B.lineTo(x, 170 + k * 52 + Math.sin(x / 48 + k * 0.8) * 20);
          B.stroke();
        }
        break;
      }
      case 'dots': {
        for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
          const x = m + 70 + c * 150, y = 150 + r * 104, rad = 46;
          const ctx = (r + c) % 2 ? A : B;
          ctx.fillStyle = (r + c) % 2 ? ia : ib;
          ctx.beginPath();
          if ((r * 3 + c) % 5 === 0) ctx.arc(x, y, rad, Math.PI, 0); else ctx.arc(x, y, rad, 0, 7);
          ctx.fill();
        }
        break;
      }
      default: { // arch
        A.fillStyle = ia; A.beginPath(); A.arc(PW * 0.64, 280, 170, 0, 7); A.fill();
        B.fillStyle = ib;
        [[m + 30, 180], [PW / 2 - 40, 240], [PW - m - 190, 300]].forEach(([x, h], k) => {
          const w = 150, base = 620;
          B.beginPath(); B.moveTo(x, base); B.lineTo(x, base - h); B.arc(x + w / 2, base - h, w / 2, Math.PI, 0); B.lineTo(x + w, base); B.closePath();
          if (k === 1) { B.fillStyle = dotPattern(B, ib, 10); B.fill(); B.fillStyle = ib; } else B.fill();
        });
      }
    }
    // typography (ink 2) + registration (both inks)
    mono(B, 20); B.fillStyle = ib; B.textAlign = 'left'; B.fillText(`No. ${String(i + 1).padStart(2, '0')}`, m, 56);
    B.textAlign = 'right'; B.fillText(p.year, PW - m, 56);
    archivo(B, 900, 70); B.textAlign = 'left';
    const words = p.title.toUpperCase().split(' ');
    let line = '', y = 712; const lines = [];
    words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (B.measureText(t).width > PW - m * 2 && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    lines.slice(-2).forEach((l, k) => B.fillText(l, m, y + k * 66 - (lines.length > 1 ? 40 : 0)));
    mono(B, 18); B.fillText(`${p.type} — ${p.role}`.toUpperCase(), m, PH - m);
    regMark(A, PW - m - 14, PH - m - 6, 10, ia); regMark(B, PW - m - 14, PH - m - 6, 10, ib);
  }

  const strip = $('#strip');
  strip.innerHTML = PROJECTS.map((p, i) => `
    <li class="print">
      <button class="print-btn" data-i="${i}" data-cursor="View" aria-label="View ${p.title}">
        <span class="print-art"><canvas class="layer-a" width="${PW}" height="${PH}" aria-hidden="true"></canvas><canvas class="layer-b" width="${PW}" height="${PH}" aria-hidden="true"></canvas></span>
        <span class="print-cap"><span class="print-title">${p.title}</span><span class="mono print-meta">${p.type} &middot; ${p.year}</span></span>
      </button>
    </li>`).join('');
  const prints = $$('.print-btn');
  const paintPosters = () => prints.forEach((b) => drawPoster($('.layer-a', b), $('.layer-b', b), PROJECTS[+b.dataset.i], +b.dataset.i));

  // drag-to-scroll strip + arrows + counter
  (() => {
    let sx = 0, sl = 0, active = false, dragged = false;
    strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; active = true; dragged = false; sx = e.clientX; sl = strip.scrollLeft; });
    addEventListener('pointermove', (e) => {
      if (!active) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { dragged = true; strip.classList.add('is-dragging'); }
      if (dragged) strip.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { active = false; strip.classList.remove('is-dragging'); setTimeout(() => { dragged = false; }, 0); });
    strip.addEventListener('click', (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
    const step = () => (strip.querySelector('.print')?.getBoundingClientRect().width || 300) + 28;
    $('#strip-prev').addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    $('#strip-next').addEventListener('click', () => strip.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
    const count = $('#strip-count');
    strip.addEventListener('scroll', () => {
      const i = clamp(Math.round(strip.scrollLeft / step()), 0, PROJECTS.length - 1);
      count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
    }, { passive: true });
  })();

  // viewer
  const viewer = $('#viewer');
  let viewerIndex = -1;
  function openViewer(i) {
    const p = PROJECTS[i];
    viewerIndex = i;
    const art = $('#viewer-art');
    art.innerHTML = `<canvas width="${PW}" height="${PH}"></canvas><canvas width="${PW}" height="${PH}"></canvas>`;
    const [a, b] = $$('canvas', art);
    drawPoster(a, b, p, i);
    $('#v-meta').textContent = `No. ${String(i + 1).padStart(2, '0')} · ${p.type} · ${p.year}`;
    $('#v-title').textContent = p.title;
    $('#v-desc').textContent = `${p.desc} This is where a longer case-study summary goes: context, process, and results.`;
    $('#v-facts').innerHTML = `<div><dt>Role</dt><dd>${p.role}</dd></div><div><dt>Stack</dt><dd>${p.stack}</dd></div><div><dt>Year</dt><dd>${p.year}</dd></div>`;
    if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
  }
  prints.forEach((b) => b.addEventListener('click', () => openViewer(+b.dataset.i)));
  $('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { viewerIndex = -1; });

  /* ---------------------------------------------------------
     LOG, CONTACT, NAV
     --------------------------------------------------------- */
  $$('.run').forEach((run) => {
    const btn = $('.run-row', run);
    btn.addEventListener('click', () => {
      const open = !run.classList.contains('is-open');
      run.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  $('#copy').addEventListener('click', async () => {
    const email = $('#email').textContent, b = $('#copy');
    try { await navigator.clipboard.writeText(email); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents($('#email')); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected, press Ctrl+C'; }
    setTimeout(() => { b.textContent = 'Copy email'; }, 2000);
  });
  $('#order').addEventListener('submit', (e) => {
    e.preventDefault();
    const stamp = $('#stamp');
    $('#stamp-date').textContent = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    stamp.hidden = true; void stamp.offsetWidth; stamp.hidden = false;
    $('#order-note').textContent = 'Stamped. This form is a demo, so nothing was sent yet.';
  });
  $$('[data-placeholder]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); a.blur(); }));
  $('#year').textContent = new Date().getFullYear();

  const navLinks = $$('.nav a');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-now', a.getAttribute('href') === `#${e.target.id}`)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'work', 'log', 'contact'].forEach((id) => secObs.observe(document.getElementById(id)));

  /* ---------------------------------------------------------
     INK SWITCHER — reprint the whole zine in another ink pair
     --------------------------------------------------------- */
  const inkOptions = $('#ink-options'), inkToggle = $('#ink-toggle');
  inkOptions.innerHTML = INKS.map((k, i) => `<button class="ink-opt" data-i="${i}" aria-pressed="false" style="--a:${k.a};--b:${k.b}"><span class="ink-dots" aria-hidden="true"><i></i><i></i></span>${k.name}</button>`).join('');
  function applyInk(i, animate) {
    ink = INKS[i];
    root.style.setProperty('--ink1', ink.a);
    root.style.setProperty('--ink2', ink.b);
    $('#ink-name').textContent = ink.name;
    $$('.ink-opt').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    paintPosters();
    drawPortrait();
    if (viewerIndex >= 0) { const [a, b] = $$('#viewer-art canvas'); drawPoster(a, b, PROJECTS[viewerIndex], viewerIndex); }
    store.set('riso-ink', String(i));
    if (animate && !reduced) { const r = $('#roller'); r.classList.remove('run'); void r.offsetWidth; r.classList.add('run'); }
  }
  inkToggle.addEventListener('click', () => {
    const show = inkOptions.hidden;
    inkOptions.hidden = !show; inkToggle.setAttribute('aria-expanded', String(show));
  });
  $$('.ink-opt').forEach((b) => b.addEventListener('click', () => { applyInk(+b.dataset.i, true); inkOptions.hidden = true; inkToggle.setAttribute('aria-expanded', 'false'); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !inkOptions.hidden) { inkOptions.hidden = true; inkToggle.setAttribute('aria-expanded', 'false'); } });

  /* ---------------------------------------------------------
     CURSOR — an ink dot that grows over things you can use
     --------------------------------------------------------- */
  if (fine && !reduced) {
    const cur = $('#cursor'), label = $('#cursor-label');
    let x = -100, y = -100, cx = -100, cy = -100;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest?.('[data-cursor], #press-canvas, #tray-canvas, .strip');
      let text = '';
      if (t) text = t.dataset?.cursor || (t.id === 'press-canvas' || t.id === 'tray-canvas' ? 'Drag' : 'Drag');
      cur.classList.toggle('is-big', !!t);
      label.textContent = text;
    });
    const loop = () => { cx += (x - cx) * 0.25; cy += (y - cy) * 0.25; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  const saved = +store.get('riso-ink');
  const startInk = Number.isInteger(saved) && INKS[saved] ? saved : 0;
  const boot = () => {
    applyInk(startInk, false);
    if (hasMatter) { initPress(); initTray(); }
  };
  const fontsReady = document.fonts ? Promise.race([document.fonts.load('900 100px Archivo'), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(boot, boot);
})();
