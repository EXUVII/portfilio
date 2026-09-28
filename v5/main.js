/* =========================================================
   NAV CONSOLE — portfolio v5
   Three.js star map + HUD. Systems are sections, planets are
   projects and jobs. Drag, zoom, click, or use the command line.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  /* ---------------------------------------------------------
     CONTENT — placeholders (edit these)
     --------------------------------------------------------- */
  const SYSTEMS = [
    { key: 'about', code: 'SYS-01', name: 'About', pos: [-26, 5, 12] },
    { key: 'work', code: 'SYS-02', name: 'Work', pos: [23, 9, -10] },
    { key: 'exp', code: 'SYS-03', name: 'Experience', pos: [-7, -1, -30] },
    { key: 'contact', code: 'SYS-04', name: 'Contact', pos: [14, 3, 27], warm: true },
  ];
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Web', year: '2025', role: 'Design & Development', stack: 'Next.js, GSAP', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: '3D / WebGL', year: '2025', role: 'Creative Developer', stack: 'Three.js, GLSL', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Data', year: '2024', role: 'Product Designer', stack: 'D3, Svelte', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Brand', year: '2023', role: 'Art Direction', stack: 'Figma, After Effects', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'App', year: '2022', role: 'UI Designer', stack: 'SwiftUI, Figma', desc: 'One or two sentences about what this was and why it mattered.' },
  ];
  const JOBS = ['Job Title · 2024–Now', 'Job Title · 2021–2024', 'Job Title · 2019–2021', 'First role · 2015–2019'];

  /* ---------------------------------------------------------
     SOUND — quiet UI tones, off by default
     --------------------------------------------------------- */
  const Sfx = (() => {
    let ctx = null, on = false;
    const tone = (f, d = 0.05, type = 'sine', v = 0.03, delay = 0, slide = 0) => {
      if (!on || !ctx) return;
      const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(f + slide, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
    };
    return {
      get on() { return on; },
      set(v) { on = v; if (on && !ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { on = false; } } if (ctx?.state === 'suspended') ctx.resume(); return on; },
      tick() { tone(2400, 0.025, 'sine', 0.012); },
      lock() { tone(880, 0.06, 'sine', 0.025); tone(1320, 0.08, 'sine', 0.02, 0.05); },
      open() { tone(440, 0.12, 'triangle', 0.03, 0, 440); tone(1760, 0.05, 'sine', 0.015, 0.1); },
      close() { tone(660, 0.12, 'triangle', 0.025, 0, -330); },
      key() { tone(1600 + Math.random() * 400, 0.015, 'square', 0.006); },
      tx() { tone(300, 1.6, 'sine', 0.02, 0, 900); tone(1200, 0.08, 'sine', 0.02, 1.7); tone(1800, 0.12, 'sine', 0.02, 1.8); },
    };
  })();
  const soundBtn = $('#btn-sound');
  const setSound = (v) => { const on = Sfx.set(v); soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.textContent = on ? 'SFX On' : 'SFX Off'; if (on) Sfx.lock(); return on; };
  soundBtn.addEventListener('click', () => setSound(!Sfx.on));

  /* ---------------------------------------------------------
     EVENT LOG
     --------------------------------------------------------- */
  const logEl = $('#log');
  const stamp = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  function log(msg, warm = false) {
    const p = document.createElement('p');
    if (warm) p.className = 'warm';
    p.innerHTML = `[${stamp()}] <b>›</b> ${msg}`;
    logEl.appendChild(p);
    while (logEl.children.length > 6) logEl.firstChild.remove();
  }

  /* ---------------------------------------------------------
     CLOCK + COORDS + SIGNAL
     --------------------------------------------------------- */
  const utc = $('#utc'), coords = $('#coords'), bars = $$('#ro-signal i');
  setInterval(() => {
    const d = new Date();
    utc.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    const lvl = 3 + Math.round(Math.random() * 2);
    bars.forEach((b, i) => b.classList.toggle('on', i < lvl));
  }, 1000);
  let coordT = 0;
  setInterval(() => { coordT += 0.01; coords.textContent = `${(12.345 + Math.sin(coordT) * 0.002).toFixed(3)}°N ${(45.678 + Math.cos(coordT) * 0.002).toFixed(3)}°E`; }, 400);

  /* ---------------------------------------------------------
     DOSSIER
     --------------------------------------------------------- */
  const dossier = $('#dossier'), dBody = $('#dossier-body'), dCode = $('#dossier-code');
  const navBtns = $$('.sys, .msys');
  let openKey = null;
  let GL = null;

  function openSystem(key, { quiet = false } = {}) {
    const sys = SYSTEMS.find((s) => s.key === key);
    if (!sys) return;
    openKey = key;
    document.body.classList.add('is-focused');
    dossier.hidden = false;
    dossier.classList.toggle('warm', !!sys.warm);
    dossier.style.animation = 'none'; void dossier.offsetWidth; dossier.style.animation = '';
    dCode.textContent = `${sys.code} // ${sys.name}`;
    dBody.replaceChildren($(`#tpl-${key}`).content.cloneNode(true));
    dBody.scrollTop = 0;
    navBtns.forEach((b) => b.setAttribute('aria-current', String(b.dataset.key === key)));
    ({ about: initAbout, work: initWork, exp: initExp, contact: initContact })[key]?.();
    GL?.focus(key);
    if (!quiet) { Sfx.open(); log(`Nav lock acquired: <b>${sys.code} ${sys.name.toUpperCase()}</b>`, sys.warm); }
  }
  function closeSystem() {
    if (!openKey) return;
    openKey = null;
    document.body.classList.remove('is-focused');
    dossier.hidden = true;
    navBtns.forEach((b) => b.setAttribute('aria-current', 'false'));
    GL?.focus(null);
    Sfx.close();
    log('Returned to core overview');
  }
  navBtns.forEach((b) => {
    b.addEventListener('click', () => openSystem(b.dataset.key));
    b.addEventListener('mouseenter', () => { GL?.hoverSystem(b.dataset.key); Sfx.tick(); });
    b.addEventListener('mouseleave', () => GL?.hoverSystem(null));
  });
  $('#dossier-close').addEventListener('click', closeSystem);
  $('#home').addEventListener('click', (e) => { e.preventDefault(); closeSystem(); });
  $('#begin').addEventListener('click', () => openSystem('about'));
  $('#btn-contact').addEventListener('click', () => openSystem('contact'));

  function initAbout() {
    $$('.count', dBody).forEach((el) => {
      const to = +el.dataset.to, suf = el.dataset.suffix || '';
      if (reduced) { el.textContent = pad(to) + suf; return; }
      const t0 = performance.now();
      const step = (now) => { const k = clamp((now - t0) / 1100); el.textContent = pad(Math.round(to * (1 - Math.pow(1 - k, 3)))) + suf; if (k < 1 && el.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  function initWork() {
    const list = $('#plist', dBody);
    list.innerHTML = PROJECTS.map((p, i) => `
      <li><button class="prow" data-i="${i}">
        <span class="mono">P-${pad(i + 1)}</span>
        <span><span class="prow-title">${p.title}</span><span class="prow-type">${p.type}</span></span>
        <span class="mono prow-year">${p.year}</span>
      </button></li>`).join('');
    $$('.prow', list).forEach((b) => {
      const i = +b.dataset.i;
      b.addEventListener('click', () => openProject(i));
      b.addEventListener('mouseenter', () => { GL?.hoverSat('work', i); Sfx.tick(); });
      b.addEventListener('mouseleave', () => GL?.hoverSat(null));
    });
  }

  function openProject(i) {
    if (!PROJECTS[i]) return;
    if (openKey !== 'work') openSystem('work', { quiet: true });
    const p = PROJECTS[i];
    dCode.textContent = `SYS-02 // P-${pad(i + 1)}`;
    dBody.innerHTML = `
      <button class="back mono" id="back">&larr; All projects</button>
      <canvas class="holo" id="holo" width="640" height="400" aria-hidden="true"></canvas>
      <p class="d-kicker mono">P-${pad(i + 1)} · ${p.type} · ${p.year}</p>
      <h2 class="d-title">${p.title}</h2>
      <p class="d-lead">${p.desc}</p>
      <p>This is where a longer case-study summary goes: context, process, and results. Keep it to three or four sentences.</p>
      <dl class="specs mono"><div><dt>Role</dt><dd>${p.role}</dd></div><div><dt>Stack</dt><dd>${p.stack}</dd></div><div><dt>Year</dt><dd>${p.year}</dd></div></dl>
      <button class="cta" data-placeholder>Open case study <span aria-hidden="true">&rarr;</span></button>`;
    dBody.scrollTop = 0;
    $('#back', dBody).addEventListener('click', () => { openSystem('work', { quiet: true }); GL?.focusSat(null); });
    $('[data-placeholder]', dBody).addEventListener('click', () => log('Case study link is a placeholder for now'));
    runHolo($('#holo', dBody), i);
    GL?.focusSat('work', i);
    Sfx.lock();
    log(`Scanning <b>P-${pad(i + 1)} ${p.title.toUpperCase()}</b>`);
  }

  function initExp() {
    $$('.flog > li', dBody).forEach((li) => {
      const i = +li.dataset.i, btn = $('.flog-row', li);
      btn.addEventListener('click', () => {
        const open = !li.classList.contains('is-open');
        li.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        GL?.focusSat(open ? 'exp' : null, i);
      });
      li.addEventListener('mouseenter', () => GL?.hoverSat('exp', i));
      li.addEventListener('mouseleave', () => GL?.hoverSat(null));
    });
  }

  function initContact() {
    $('#copy', dBody).addEventListener('click', async () => {
      const email = $('#email', dBody).textContent, b = $('#copy', dBody);
      try { await navigator.clipboard.writeText(email); b.textContent = 'Copied'; log(`Frequency copied: <b>${email}</b>`, true); }
      catch { const r = document.createRange(); r.selectNodeContents($('#email', dBody)); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1800);
    });
    $$('[data-placeholder]', dBody).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); log('That link is a placeholder for now'); }));
    const scope = $('#scope', dBody);
    const st = { amp: 0.25, prog: -1 };
    runScope(scope, st);
    $('#tx', dBody).addEventListener('submit', (e) => {
      e.preventDefault();
      if (st.prog >= 0) return;
      const status = $('#tx-status', dBody);
      st.prog = 0; Sfx.tx();
      log('Transmission started', true);
      const t0 = performance.now();
      const step = (now) => {
        st.prog = clamp((now - t0) / 2400);
        status.textContent = `Transmitting… ${Math.round(st.prog * 100)}%`;
        if (st.prog < 1 && scope.isConnected) requestAnimationFrame(step);
        else {
          status.textContent = 'Transmission complete. This form is a demo, so nothing was actually sent.';
          log('Transmission complete <b>(demo)</b>', true);
          GL?.pulseContact();
          setTimeout(() => { st.prog = -1; }, 600);
        }
      };
      requestAnimationFrame(step);
    });
  }

  /* holographic project preview, animated while on screen */
  function runHolo(c, i) {
    const x = c.getContext('2d'), W = c.width, H = c.height;
    const cyan = '#6fe7ff', amber = '#ffb547';
    const t0 = performance.now();
    const draw = (now) => {
      if (!c.isConnected) return;
      const t = (now - t0) / 1000;
      x.clearRect(0, 0, W, H);
      x.lineWidth = 1.2;
      const v = i % 6;
      if (v === 0) { // terrain
        for (let r = 0; r < 22; r++) {
          const z = r / 22, y0 = H * 0.35 + Math.pow(z, 1.6) * H * 0.62;
          x.strokeStyle = `rgba(111,231,255,${0.15 + z * 0.6})`; x.beginPath();
          for (let k = 0; k <= 60; k++) {
            const u = k / 60, px = W / 2 + (u - 0.5) * W * (0.3 + z * 1.2);
            const h = Math.sin(u * 9 + r * 0.6 - t) * Math.cos(u * 4 + r * 0.3) * 38 * (1 - z * 0.5);
            k ? x.lineTo(px, y0 - h) : x.moveTo(px, y0 - h);
          }
          x.stroke();
        }
      } else if (v === 1) { // globe
        const cx = W / 2, cy = H / 2, R = H * 0.38;
        x.strokeStyle = 'rgba(111,231,255,.55)';
        for (let lat = -75; lat <= 75; lat += 15) { const yy = cy - Math.sin(lat * Math.PI / 180) * R, rr = Math.cos(lat * Math.PI / 180) * R; x.beginPath(); x.ellipse(cx, yy, rr, rr * 0.18, 0, 0, 7); x.stroke(); }
        for (let lo = 0; lo < 180; lo += 20) { const a = (lo * Math.PI / 180) + t * 0.4; x.beginPath(); x.ellipse(cx, cy, Math.abs(Math.cos(a)) * R, R, 0, 0, 7); x.stroke(); }
        x.fillStyle = amber; const a = t * 0.8; x.beginPath(); x.arc(cx + Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 0.3, 4, 0, 7); x.fill();
      } else if (v === 2) { // city
        for (let k = 0; k < 26; k++) {
          const h = (Math.sin(k * 1.7) * 0.5 + 0.6) * H * 0.55 * (0.8 + 0.2 * Math.sin(t * 2 + k));
          const bx = 30 + k * ((W - 60) / 26);
          x.strokeStyle = k === 11 ? amber : cyan; x.globalAlpha = k === 11 ? 1 : 0.55;
          x.strokeRect(bx, H - 30 - h, (W - 60) / 26 - 6, h);
        }
        x.globalAlpha = 1;
      } else if (v === 3) { // chart
        x.strokeStyle = 'rgba(111,231,255,.18)';
        for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(30, k * H / 6); x.lineTo(W - 30, k * H / 6); x.stroke(); }
        [cyan, amber].forEach((col, s) => {
          x.strokeStyle = col; x.lineWidth = 2; x.beginPath();
          for (let k = 0; k <= 80; k++) { const px = 30 + k * (W - 60) / 80, py = H * 0.55 - Math.sin(k / 9 + t + s) * 60 - Math.sin(k / 3 + s * 2) * 14 - k * (s ? 0.6 : 1.2); k ? x.lineTo(px, py) : x.moveTo(px, py); }
          x.stroke();
        });
        x.lineWidth = 1.2;
      } else if (v === 4) { // orbits
        const cx = W / 2, cy = H / 2;
        for (let k = 1; k <= 5; k++) {
          x.strokeStyle = `rgba(111,231,255,${0.2 + k * 0.08})`; x.beginPath(); x.ellipse(cx, cy, k * 50, k * 18, -0.3, 0, 7); x.stroke();
          const a = t * (1.2 - k * 0.15) + k;
          x.fillStyle = k === 3 ? amber : cyan; x.beginPath(); x.arc(cx + Math.cos(a) * k * 50 * Math.cos(-0.3) - Math.sin(a) * k * 18 * Math.sin(-0.3), cy + Math.cos(a) * k * 50 * Math.sin(-0.3) + Math.sin(a) * k * 18 * Math.cos(-0.3), 3.5, 0, 7); x.fill();
        }
      } else { // interface
        x.strokeStyle = 'rgba(111,231,255,.6)';
        x.strokeRect(60, 50, W - 120, H - 100); x.strokeRect(60, 50, W - 120, 30);
        for (let k = 0; k < 3; k++) { x.strokeRect(80 + k * 170, 100, 150, 110); x.fillStyle = k === 1 ? 'rgba(255,181,71,.35)' : 'rgba(111,231,255,.12)'; x.fillRect(80 + k * 170, 100, 150, 60); }
        x.fillStyle = 'rgba(111,231,255,.25)'; for (let k = 0; k < 4; k++) x.fillRect(80, 230 + k * 22, 200 + ((k * 90) % 260) + Math.sin(t * 2 + k) * 20, 8);
      }
      // scanline + frame labels
      const sy = (t * 90) % H;
      const g = x.createLinearGradient(0, sy - 30, 0, sy); g.addColorStop(0, 'rgba(111,231,255,0)'); g.addColorStop(1, 'rgba(111,231,255,.18)');
      x.fillStyle = g; x.fillRect(0, sy - 30, W, 30);
      x.fillStyle = cyan; x.font = '500 13px "JetBrains Mono", monospace';
      x.fillText(`P-${pad(i + 1)} // HOLO SCAN`, 16, 24);
      x.textAlign = 'right'; x.fillText(`${(t % 60).toFixed(1).padStart(4, '0')}s`, W - 16, 24); x.textAlign = 'left';
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* oscilloscope on the contact form */
  function runScope(c, st) {
    const x = c.getContext('2d');
    const draw = (now) => {
      if (!c.isConnected) return;
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      const W = c.width, H = c.height, t = now / 1000;
      x.clearRect(0, 0, W, H);
      const amp = st.prog >= 0 ? 0.35 + 0.5 * Math.sin(st.prog * Math.PI) : 0.18;
      x.strokeStyle = 'rgba(255,181,71,.2)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
      x.strokeStyle = '#ffb547'; x.lineWidth = 1.5 * dpr; x.beginPath();
      for (let k = 0; k <= W; k += 2) {
        const u = k / W;
        const y = H / 2 + (Math.sin(u * 30 + t * 6) * 0.6 + Math.sin(u * 71 - t * 9) * 0.3 + Math.sin(u * 7 + t) * 0.4) * H * 0.42 * amp * Math.sin(u * Math.PI);
        k ? x.lineTo(k, y) : x.moveTo(k, y);
      }
      x.stroke();
      if (st.prog >= 0) { x.fillStyle = 'rgba(255,181,71,.15)'; x.fillRect(0, 0, W * st.prog, H); }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     COMMAND LINE
     --------------------------------------------------------- */
  const cmdForm = $('#cmd'), cmdIn = $('#cmd-input');
  const history = []; let hIdx = -1;
  const COMMANDS = {
    help: () => log('Commands: <b>about</b> · <b>work</b> · <b>exp</b> · <b>contact</b> · <b>open 1-6</b> · <b>home</b> · <b>sound on|off</b> · <b>fx on|off</b> · <b>whoami</b> · <b>clear</b>'),
    about: () => openSystem('about'), work: () => openSystem('work'), projects: () => openSystem('work'),
    exp: () => openSystem('exp'), experience: () => openSystem('exp'), cv: () => openSystem('exp'),
    contact: () => openSystem('contact'), hire: () => openSystem('contact'), email: () => openSystem('contact'),
    open: (a) => { const n = parseInt(a, 10); if (n >= 1 && n <= PROJECTS.length) openProject(n - 1); else log(`Usage: <b>open 1-${PROJECTS.length}</b>`); },
    home: () => closeSystem(), back: () => closeSystem(), exit: () => closeSystem(), close: () => closeSystem(),
    sound: (a) => log(`Sound <b>${setSound(a !== 'off') ? 'on' : 'off'}</b>`),
    fx: (a) => { setFx(a !== 'off'); log(`Visual effects <b>${a !== 'off' ? 'on' : 'off'}</b>`); },
    whoami: () => log('<b>Your Name</b> · Role title · City, Country'),
    ls: () => log(SYSTEMS.map((s) => `<b>${s.code}</b> ${s.name}`).join(' · ')),
    date: () => log(new Date().toString().slice(0, 24)),
    clear: () => { logEl.replaceChildren(); },
    sudo: () => log('Permission denied. Nice try, pilot.', true),
  };
  cmdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = cmdIn.value.trim();
    if (!raw) return;
    history.unshift(raw); hIdx = -1;
    cmdIn.value = '';
    const [c, ...rest] = raw.toLowerCase().split(/\s+/);
    const arg = rest.join(' ');
    const fn = COMMANDS[c] || (/^\d$/.test(c) ? () => COMMANDS.open(c) : null);
    log(`<span style="color:var(--text)">${raw.replace(/[<>&]/g, '')}</span>`);
    if (fn) fn(arg); else log(`Unknown command: ${c.replace(/[<>&]/g, '')}. Type <b>help</b>.`, true);
  });
  cmdIn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { hIdx = Math.min(history.length - 1, hIdx + 1); cmdIn.value = history[hIdx]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { hIdx = Math.max(-1, hIdx - 1); cmdIn.value = hIdx >= 0 ? history[hIdx] : ''; e.preventDefault(); }
    else if (e.key === 'Escape') cmdIn.blur();
    else if (e.key.length === 1) Sfx.key();
  });
  addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); cmdIn.focus(); return; }
    if (e.key === 'Escape') { closeSystem(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= SYSTEMS.length && !e.metaKey && !e.ctrlKey) openSystem(SYSTEMS[n - 1].key);
  });

  /* FX toggle */
  const fxBtn = $('#btn-fx');
  let fxOn = true;
  function setFx(v) { fxOn = v; fxBtn.setAttribute('aria-pressed', String(v)); fxBtn.textContent = v ? 'FX On' : 'FX Off'; GL?.setFx(v); }
  fxBtn.addEventListener('click', () => setFx(!fxOn));

  /* ---------------------------------------------------------
     3D STAR MAP
     --------------------------------------------------------- */
  try {
    if (!window.THREE) throw new Error('three.js missing');
    GL = initGL();
  } catch (err) {
    console.warn('Star map disabled:', err);
    $('#space').style.background = 'radial-gradient(ellipse at 60% 50%, #0d2233, #03050a 70%)';
  }

  function initGL() {
    const T = THREE;
    const canvas = $('#gl'), space = $('#space');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x03050a, 1);
    const scene = new T.Scene();
    scene.fog = new T.FogExp2(0x03050a, 0.0065);
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 3000);

    const CYAN = new T.Color('#6fe7ff'), AMBER = new T.Color('#ffb547'), WARM = new T.Color('#ffd49a');
    const GRID_Y = -8;

    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,.45)'); g.addColorStop(0.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    })();

    /* ---- galaxy ---- */
    const starMat = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 26 * renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uTime; uniform float uSize;
        attribute float aScale; attribute vec3 aColor; varying vec3 vColor;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.75 + 0.25 * sin(uTime * 1.7 + position.x * 3.1 + position.z * 1.9);
          gl_PointSize = uSize * aScale * tw / -mv.z;
          vColor = aColor;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = pow(smoothstep(0.5, 0.0, d), 1.8); gl_FragColor = vec4(vColor * a, a); }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    function galaxy(count, R) {
      const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), sc = new Float32Array(count);
      const c = new T.Color();
      for (let i = 0; i < count; i++) {
        const r = Math.pow(Math.random(), 1.45) * R;
        const branch = ((i % 3) / 3) * Math.PI * 2;
        const spin = r * 0.075;
        const rr = () => Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * (0.9 + r * 0.24);
        pos[i * 3] = Math.cos(branch + spin) * r + rr();
        pos[i * 3 + 1] = rr() * 0.28 * (1 - r / R * 0.6);
        pos[i * 3 + 2] = Math.sin(branch + spin) * r + rr();
        c.copy(WARM).lerp(CYAN, clamp(r / (R * 0.7)));
        if (Math.random() < 0.08) c.setRGB(0.9, 0.95, 1);
        const b = 0.55 + Math.random() * 0.45;
        col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
        sc[i] = 0.35 + Math.pow(Math.random(), 4) * 2.2;
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3));
      g.setAttribute('aColor', new T.BufferAttribute(col, 3));
      g.setAttribute('aScale', new T.BufferAttribute(sc, 1));
      return new T.Points(g, starMat);
    }
    const galaxyObj = galaxy(16000, 72);
    scene.add(galaxyObj);
    const core = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: WARM, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
    core.scale.setScalar(34); scene.add(core);

    // distant stars
    {
      const n = 2200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sc = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 700 + Math.random() * 400, s = Math.sqrt(1 - u * u);
        pos[i * 3] = Math.cos(th) * s * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = Math.sin(th) * s * r;
        const b = 0.4 + Math.random() * 0.6; col[i * 3] = 0.75 * b; col[i * 3 + 1] = 0.85 * b; col[i * 3 + 2] = b;
        sc[i] = 12 + Math.random() * 30;
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aColor', new T.BufferAttribute(col, 3)); g.setAttribute('aScale', new T.BufferAttribute(sc, 1));
      const m = starMat.clone(); m.fog = false;
      scene.add(new T.Points(g, m));
    }

    /* ---- tactical grid + radar sweep ---- */
    const grid = new T.Group(); grid.position.y = GRID_Y; scene.add(grid);
    const gridMat = new T.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.075, depthWrite: false });
    const circlePts = (r, n = 128) => Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI * 2; return new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); });
    for (let r = 10; r <= 90; r += 10) grid.add(new T.Line(new T.BufferGeometry().setFromPoints(circlePts(r)), r % 30 === 0 ? new T.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.14, depthWrite: false }) : gridMat));
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; grid.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(Math.cos(a) * 10, 0, Math.sin(a) * 10), new T.Vector3(Math.cos(a) * 90, 0, Math.sin(a) * 90)]), gridMat)); }
    const sweep = new T.Mesh(new T.CircleGeometry(90, 64, 0, Math.PI / 4), new T.ShaderMaterial({
      uniforms: { uColor: { value: CYAN } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uColor; varying vec3 vP;
        void main(){ float a = atan(vP.y, vP.x) / 0.785398; float r = length(vP.xy) / 90.0; float al = pow(clamp(a,0.,1.), 3.0) * 0.16 * (1.0 - r * 0.7); gl_FragColor = vec4(uColor * al, al); }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    }));
    sweep.rotation.x = -Math.PI / 2;
    const sweepPivot = new T.Group(); sweepPivot.add(sweep); grid.add(sweepPivot);

    /* ---- hyperlanes (flowing dashes) ---- */
    const laneMat = (color) => new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: color } },
      vertexShader: 'attribute float aDist; varying float vD; void main(){ vD = aDist; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uTime; uniform vec3 uColor; varying float vD; void main(){ float d = fract((vD - uTime * 5.0) / 4.0); float a = 0.05 + step(d, 0.25) * 0.4; gl_FragColor = vec4(uColor * a, a); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    const lanes = [];
    const V = (a) => new T.Vector3(...a);
    SYSTEMS.forEach((s, i) => {
      const n = SYSTEMS[(i + 1) % SYSTEMS.length];
      const a = V(s.pos), b = V(n.pos), mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 7;
      const pts = new T.QuadraticBezierCurve3(a, mid, b).getPoints(80);
      const g = new T.BufferGeometry().setFromPoints(pts);
      const d = new Float32Array(pts.length); for (let k = 1; k < pts.length; k++) d[k] = d[k - 1] + pts[k].distanceTo(pts[k - 1]);
      g.setAttribute('aDist', new T.BufferAttribute(d, 1));
      const m = laneMat(n.warm || s.warm ? AMBER : CYAN);
      scene.add(new T.Line(g, m)); lanes.push(m);
    });

    /* ---- systems ---- */
    const nodes = {};
    const pickers = [];
    const labelsEl = $('#labels');
    const makeLabel = (code, name, warm, sat = false) => {
      const el = document.createElement('div');
      el.className = `nlabel${warm ? ' warm' : ''}${sat ? ' sat is-hidden' : ''}`;
      el.innerHTML = `<small>${code}</small><b>${name}</b>${sat ? '' : '<small class="nl-dist">--</small>'}`;
      labelsEl.appendChild(el);
      return el;
    };
    const ringLine = (r, color, opacity) => new T.LineLoop(new T.BufferGeometry().setFromPoints(circlePts(r, 96).slice(0, -1)), new T.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending }));

    SYSTEMS.forEach((s) => {
      const color = s.warm ? AMBER : CYAN;
      const g = new T.Group(); g.position.set(...s.pos); scene.add(g);
      g.add(new T.Mesh(new T.SphereGeometry(0.55, 24, 16), new T.MeshBasicMaterial({ color: color.clone().lerp(new T.Color('#ffffff'), 0.25) })));
      const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
      halo.scale.setScalar(8); g.add(halo);
      const shell = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(2.3, 1)), new T.LineBasicMaterial({ color, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
      g.add(shell);
      const r1 = ringLine(3.6, color, 0.5); r1.rotation.x = 1.2; g.add(r1);
      const r2 = ringLine(4.4, color, 0.22); r2.rotation.set(0.4, 0, 0.7); g.add(r2);
      // stalk down to the grid + base marker
      const stalk = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1, 0), new T.Vector3(0, GRID_Y - s.pos[1], 0)]), new T.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.4, transparent: true, opacity: 0.45 }));
      stalk.computeLineDistances(); g.add(stalk);
      const base = ringLine(1.4, color, 0.6); base.position.y = GRID_Y - s.pos[1]; g.add(base);
      const picker = new T.Mesh(new T.SphereGeometry(4.5, 12, 8), new T.MeshBasicMaterial({ visible: false }));
      picker.userData = { kind: 'sys', key: s.key }; g.add(picker); pickers.push(picker);
      nodes[s.key] = { s, g, halo, shell, r1, r2, color, label: makeLabel(s.code, s.name, s.warm), sats: [], hover: 0 };
    });

    // satellites: projects around Work, jobs around Experience
    const addSats = (key, items, prefix, baseR, stepR) => {
      const n = nodes[key];
      items.forEach((name, i) => {
        const r = baseR + i * stepR;
        const orbit = ringLine(r, n.color, 0.12); orbit.rotation.x = Math.PI / 2 - 0.25; orbit.rotation.z = i * 0.3;
        n.g.add(orbit);
        const pivot = new T.Group(); pivot.rotation.x = -0.25; pivot.rotation.z = i * 0.3; n.g.add(pivot);
        const holder = new T.Group(); pivot.add(holder);
        const planet = new T.Mesh(new T.SphereGeometry(0.22 + (i % 3) * 0.05, 16, 12), new T.MeshBasicMaterial({ color: n.color.clone().multiplyScalar(0.75) }));
        holder.add(planet);
        const wire = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(0.75, 0)), new T.LineBasicMaterial({ color: n.color, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false }));
        holder.add(wire);
        const pk = new T.Mesh(new T.SphereGeometry(1.1, 8, 6), new T.MeshBasicMaterial({ visible: false }));
        pk.userData = { kind: 'sat', key, index: i }; holder.add(pk); pickers.push(pk);
        n.sats.push({ holder, planet, wire, r, speed: 0.35 / (1 + i * 0.35), phase: i * 1.9, label: makeLabel(`${prefix}-${pad(i + 1)}`, name, n.s.warm, true) });
      });
    };
    addSats('work', PROJECTS.map((p) => p.title), 'P', 5.6, 1.05);
    addSats('exp', JOBS, 'L', 5.4, 1.4);

    // contact: outgoing transmission rings
    const pulses = [0, 1, 2].map((k) => { const r = ringLine(1, AMBER, 0.6); r.rotation.x = Math.PI / 2; nodes.contact.g.add(r); return { r, t: k / 3 }; });
    let pulseBoost = 0;
    // about: a small moon
    const moon = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), new T.MeshBasicMaterial({ color: '#cfeeff' }));
    nodes.about.g.add(moon);

    /* ---- bloom ---- */
    let composer = null, bloom = null;
    if (T.EffectComposer && T.UnrealBloomPass) {
      composer = new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      bloom = new T.UnrealBloomPass(new T.Vector2(512, 512), 0.95, 0.55, 0.14);
      composer.addPass(bloom);
    }
    let useFx = true;

    /* ---- camera (custom orbit) ---- */
    const orbit = { theta: 0.7, phi: 1.08, radius: 100, target: new T.Vector3(0, 0, 0), ox: 0, oy: 0 };
    const want = { theta: 0.7, phi: 1.08, radius: 100, target: new T.Vector3(0, 0, 0) };
    if (!reduced) { orbit.radius = 190; orbit.phi = 0.6; } // intro fly-in
    const state = { focus: null, sat: null, hoverSys: null, hoverSat: null, pointerHit: null, dragging: false, moved: 0, last: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, idle: 0, px: -1, py: -1 };
    let W = 1, H = 1;

    function resize() {
      W = innerWidth; H = innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      composer?.setSize(W, H);
      starMat.uniforms.uSize.value = 26 * renderer.getPixelRatio();
    }
    addEventListener('resize', resize); resize();

    const viewShift = () => {
      const mobile = W <= 900;
      if (mobile) return state.focus ? { x: 0, y: H * 0.28 } : { x: 0, y: H * 0.1 };
      const left = W > 1280 ? 290 : 260, right = W > 1280 ? 470 : 420;
      return state.focus ? { x: (right - left) / 2, y: 0 } : { x: -left / 2, y: 0 };
    };

    function focus(key) {
      state.focus = key; state.sat = null;
      if (!key) { want.target.set(0, 0, 0); want.radius = 100; want.phi = 1.08; return; }
      want.target.copy(nodes[key].g.position);
      want.radius = key === 'work' || key === 'exp' ? 30 : 22;
      want.phi = 1.12;
      state.idle = 0;
    }
    function focusSat(key, i) {
      state.sat = key ? { key, i } : null;
      if (!key) { if (state.focus) { want.target.copy(nodes[state.focus].g.position); want.radius = state.focus === 'work' || state.focus === 'exp' ? 30 : 22; } return; }
      want.radius = 14;
    }

    /* ---- input ---- */
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const pick = (x, y) => {
      ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(pickers, false).filter((h) => h.object.userData.kind === 'sys' || state.focus === h.object.userData.key);
      hits.sort((a, b) => (a.object.userData.kind === 'sat' ? -1 : 0) - (b.object.userData.kind === 'sat' ? -1 : 0) || a.distance - b.distance);
      return hits[0]?.object.userData || null;
    };
    canvas.addEventListener('pointerdown', (e) => { state.dragging = true; state.moved = 0; state.last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-drag'); });
    canvas.addEventListener('pointermove', (e) => {
      state.px = e.clientX; state.py = e.clientY;
      if (!state.dragging) return;
      const dx = e.clientX - state.last.x, dy = e.clientY - state.last.y;
      state.moved += Math.abs(dx) + Math.abs(dy);
      state.last = { x: e.clientX, y: e.clientY };
      want.theta -= dx * 0.005; want.phi = clamp(want.phi - dy * 0.004, 0.2, 1.48);
      state.vel = { x: -dx * 0.005, y: -dy * 0.004 }; state.idle = 0;
    });
    const up = (e) => {
      canvas.classList.remove('is-drag');
      if (state.dragging && state.moved < 6 && e.type === 'pointerup') {
        const hit = pick(e.clientX, e.clientY);
        if (hit?.kind === 'sys') openSystem(hit.key);
        else if (hit?.kind === 'sat' && hit.key === 'work') openProject(hit.index);
        else if (hit?.kind === 'sat' && hit.key === 'exp') { focusSat('exp', hit.index); openExpRow(hit.index); }
      }
      state.dragging = false;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { state.px = -1; });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); want.radius = clamp(want.radius * (1 + e.deltaY * 0.0012), 12, 170); state.idle = 0; }, { passive: false });

    function openExpRow(i) {
      const li = $(`.flog > li[data-i="${i}"]`, dBody);
      if (!li) return;
      $$('.flog > li', dBody).forEach((x) => { const o = x === li; x.classList.toggle('is-open', o); $('.flog-row', x).setAttribute('aria-expanded', String(o)); });
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ---- HUD hooks ---- */
    const reticle = $('#reticle'), reticleTxt = $('#reticle-txt');
    const roHeading = $('#ro-heading'), roRange = $('#ro-range'), roSector = $('#ro-sector');
    const distEls = Object.fromEntries($$('[data-dist]').map((el) => [el.dataset.dist, el]));
    const radar = $('#radar'), rctx = radar.getContext('2d');
    let lastLock = null;

    const tmp = new T.Vector3(), tmp2 = new T.Vector3();
    const toScreen = (v) => { tmp.copy(v).project(camera); return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, behind: tmp.z > 1 }; };

    function drawRadar(t) {
      const S = radar.width, c = S / 2, R = S / 2 - 8;
      rctx.clearRect(0, 0, S, S);
      rctx.strokeStyle = 'rgba(111,231,255,.18)'; rctx.lineWidth = 1;
      [1, 0.66, 0.33].forEach((k) => { rctx.beginPath(); rctx.arc(c, c, R * k, 0, 7); rctx.stroke(); });
      rctx.beginPath(); rctx.moveTo(c - R, c); rctx.lineTo(c + R, c); rctx.moveTo(c, c - R); rctx.lineTo(c, c + R); rctx.stroke();
      // sweep
      const a = (t * 1.2) % (Math.PI * 2);
      const gr = rctx.createConicGradient ? rctx.createConicGradient(a - 0.9, c, c) : null;
      if (gr) { gr.addColorStop(0, 'rgba(111,231,255,0)'); gr.addColorStop(0.14, 'rgba(111,231,255,.22)'); gr.addColorStop(0.1401, 'rgba(111,231,255,0)'); gr.addColorStop(1, 'rgba(111,231,255,0)'); rctx.fillStyle = gr; rctx.beginPath(); rctx.arc(c, c, R, 0, 7); rctx.fill(); }
      // camera cone
      rctx.fillStyle = 'rgba(111,231,255,.08)'; rctx.beginPath(); rctx.moveTo(c, c); rctx.arc(c, c, R, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45); rctx.closePath(); rctx.fill();
      // blips (relative to target, rotated to camera heading)
      const scale = R / 60;
      const cosT = Math.cos(orbit.theta), sinT = Math.sin(orbit.theta);
      SYSTEMS.forEach((s) => {
        const dx = s.pos[0] - orbit.target.x, dz = s.pos[2] - orbit.target.z;
        const rx = dx * cosT - dz * sinT, rz = dx * sinT + dz * cosT;
        let bx = c + rx * scale, by = c + rz * scale;
        const d = Math.hypot(bx - c, by - c); if (d > R - 4) { bx = c + (bx - c) / d * (R - 4); by = c + (by - c) / d * (R - 4); }
        rctx.fillStyle = s.warm ? '#ffb547' : '#6fe7ff';
        rctx.beginPath(); rctx.arc(bx, by, s.key === state.focus ? 4.5 : 3, 0, 7); rctx.fill();
        if (s.key === state.focus) { rctx.strokeStyle = rctx.fillStyle; rctx.beginPath(); rctx.arc(bx, by, 8, 0, 7); rctx.stroke(); }
      });
      rctx.fillStyle = '#dde8f2'; rctx.beginPath(); rctx.moveTo(c, c - 6); rctx.lineTo(c + 4, c + 4); rctx.lineTo(c - 4, c + 4); rctx.closePath(); rctx.fill();
    }

    /* ---- loop ---- */
    const clock = new T.Clock();
    let time = 0;
    function tick() {
      const dt = Math.min(0.05, clock.getDelta());
      time += dt;

      // camera
      if (!state.dragging) {
        want.theta += state.vel.x * 0.9; want.phi = clamp(want.phi + state.vel.y * 0.9, 0.2, 1.48);
        state.vel.x *= 0.9; state.vel.y *= 0.9;
        state.idle += dt;
        if (!state.focus && !reduced && state.idle > 3) want.theta += dt * 0.035;
      }
      if (state.sat) {
        const n = nodes[state.sat.key], s = n.sats[state.sat.i];
        s.holder.getWorldPosition(tmp2);
        want.target.copy(tmp2);
      }
      const k = reduced ? 1 : 1 - Math.exp(-dt * 2.6);
      orbit.theta = lerp(orbit.theta, want.theta, k);
      orbit.phi = lerp(orbit.phi, want.phi, k);
      orbit.radius = lerp(orbit.radius, want.radius, k);
      orbit.target.lerp(want.target, k);
      const sh = viewShift();
      orbit.ox = lerp(orbit.ox, sh.x, k); orbit.oy = lerp(orbit.oy, sh.y, k);
      camera.position.set(
        orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        orbit.target.y + orbit.radius * Math.cos(orbit.phi),
        orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
      );
      camera.lookAt(orbit.target);
      camera.setViewOffset(W, H, orbit.ox, orbit.oy, W, H);

      // world animation
      starMat.uniforms.uTime.value = time;
      if (!reduced) { galaxyObj.rotation.y += dt * 0.008; sweepPivot.rotation.y -= dt * 0.9; }
      lanes.forEach((m) => { m.uniforms.uTime.value = time; });

      // hover target
      const hit = state.px >= 0 && !state.dragging ? pick(state.px, state.py) : null;
      space.classList.toggle('is-hot', !!hit);
      const hSys = hit?.kind === 'sys' ? hit.key : state.hoverSys;
      const hSat = hit?.kind === 'sat' ? hit : state.hoverSat;

      Object.values(nodes).forEach((n) => {
        const on = n.s.key === hSys || n.s.key === state.focus;
        n.hover = lerp(n.hover, on ? 1 : 0, 1 - Math.exp(-dt * 8));
        const near = clamp(camera.position.distanceTo(n.g.position) / 45, 0.4, 1);
        n.halo.scale.setScalar((8 + n.hover * 3 + Math.sin(time * 2 + n.g.position.x) * 0.4) * near);
        n.shell.rotation.y += dt * (0.2 + n.hover * 0.8); n.shell.rotation.x += dt * 0.07;
        n.shell.material.opacity = 0.3 + n.hover * 0.45;
        n.r1.rotation.z += dt * 0.3; n.r2.rotation.y += dt * 0.2;
        // satellites
        n.sats.forEach((s, i) => {
          const a = s.phase + time * s.speed * (reduced ? 0 : 1);
          s.holder.position.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r);
          const hot = (hSat && hSat.key === n.s.key && hSat.index === i) || (state.sat && state.sat.key === n.s.key && state.sat.i === i);
          s.wire.material.opacity = lerp(s.wire.material.opacity, hot ? 0.9 : 0, 0.2);
          s.wire.rotation.y += dt * 1.5;
          s.planet.scale.setScalar(hot ? 1.5 : 1);
        });
      });
      moon.position.set(Math.cos(time * 0.6) * 3.2, Math.sin(time * 0.6) * 0.8, Math.sin(time * 0.6) * 3.2);
      pulseBoost = Math.max(0, pulseBoost - dt * 0.4);
      pulses.forEach((p) => {
        p.t = (p.t + dt * (0.35 + pulseBoost)) % 1;
        p.r.scale.setScalar(1 + p.t * (7 + pulseBoost * 10));
        p.r.material.opacity = (1 - p.t) * (0.55 + pulseBoost * 0.4);
      });

      // calmer glow up close
      if (bloom) bloom.strength = lerp(bloom.strength, state.focus ? 0.55 : 0.95, 1 - Math.exp(-dt * 3));
      core.material.opacity = lerp(core.material.opacity, state.focus ? 0.16 : 0.55, 1 - Math.exp(-dt * 3));

      // render
      if (composer && useFx) composer.render(); else renderer.render(scene, camera);

      // labels + reticle + readouts
      let lock = null;
      Object.values(nodes).forEach((n) => {
        const p = toScreen(n.g.position);
        const dist = camera.position.distanceTo(n.g.position);
        const el = n.label;
        el.style.transform = `translate(${p.x + 16}px, ${p.y}px) translateY(-50%)`;
        el.classList.toggle('is-hidden', p.behind || p.y < 76);
        el.classList.toggle('is-dim', !!state.focus && state.focus !== n.s.key);
        el.lastChild.textContent = `${dist.toFixed(1)} ly`;
        if (distEls[n.s.key]) distEls[n.s.key].textContent = `${dist.toFixed(1)}`;
        if (n.s.key === hSys && !hSat) lock = { p, r: Math.max(36, 700 / dist * 6), txt: `Lock · ${n.s.code} ${n.s.name} · ${dist.toFixed(1)} ly`, warm: n.s.warm, id: n.s.key };
        n.sats.forEach((s, i) => {
          s.holder.getWorldPosition(tmp2);
          const sp = toScreen(tmp2);
          const show = state.focus === n.s.key && !sp.behind && sp.y > 76;
          s.label.classList.toggle('is-hidden', !show);
          if (show) s.label.style.transform = `translate(${sp.x + 12}px, ${sp.y}px) translateY(-50%)`;
          if (hSat && hSat.key === n.s.key && hSat.index === i) lock = { p: sp, r: 30, txt: n.s.key === 'work' ? `P-${pad(i + 1)} · ${PROJECTS[i].title} · click to scan` : JOBS[i], warm: false, id: `${n.s.key}${i}` };
        });
      });
      if (lock && !lock.p.behind) {
        reticle.hidden = false;
        reticle.classList.toggle('warm', !!lock.warm);
        reticle.style.left = `${lock.p.x}px`; reticle.style.top = `${lock.p.y}px`;
        reticle.style.width = reticle.style.height = `${lock.r}px`;
        reticleTxt.textContent = lock.txt;
        if (lastLock !== lock.id) { lastLock = lock.id; reticle.style.animation = 'none'; void reticle.offsetWidth; reticle.style.animation = ''; Sfx.lock(); }
      } else { reticle.hidden = true; lastLock = null; }

      roHeading.textContent = `${pad(Math.round(((orbit.theta * 180 / Math.PI) % 360 + 360) % 360), 3)}°`;
      roRange.textContent = `${orbit.radius.toFixed(1)} ly`;
      roSector.textContent = state.focus ? nodes[state.focus].s.name : 'Core';
      if (radar.offsetParent) drawRadar(time);

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return {
      focus,
      focusSat,
      hoverSystem(key) { state.hoverSys = key; },
      hoverSat(key, i) { state.hoverSat = key ? { key, index: i, kind: 'sat' } : null; },
      pulseContact() { pulseBoost = 1.2; },
      setFx(v) { useFx = v; document.querySelector('.vignette').style.display = v ? '' : 'none'; },
    };
  }

  /* ---------------------------------------------------------
     BOOT LOG
     --------------------------------------------------------- */
  const bootLines = [
    'Portfolio OS <b>v5.0</b> online',
    `Star map rendered: <b>16,000</b> stars, <b>${SYSTEMS.length}</b> systems in range`,
    'Drag to orbit · scroll to zoom · click a system',
    'Type <b>help</b> or press <b>/</b> for commands',
  ];
  bootLines.forEach((l, i) => setTimeout(() => log(l), reduced ? 0 : 300 + i * 380));
})();
