/* =========================================================
   POCKET PLANET — portfolio v3
   Three.js r128 with a 64-bit-era pipeline:
   low internal resolution, vertex snapping, 15-bit dither,
   Gouraud lighting, fog, blurry low-res textures.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (k) => k * k * (3 - 2 * k);

  /* ---------------------------------------------------------
     CONTENT — placeholder projects (edit these)
     --------------------------------------------------------- */
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', art: 'sunset',
      desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Web', year: '2025', role: 'Design & Development', stack: 'Astro, GSAP', art: 'ui',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: '3D', year: '2025', role: 'Art Direction', stack: 'Blender, Three.js', art: 'orb',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Brand', year: '2024', role: 'Visual Identity', stack: 'Illustrator, Figma', art: 'type',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Motion', year: '2023', role: 'Motion Designer', stack: 'After Effects, Rive', art: 'waves',
      desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'Game', year: '2022', role: 'Game Artist', stack: 'Godot, Aseprite', art: 'city',
      desc: 'One or two sentences about what this was and why it mattered.' },
  ];

  /* Project cover art (64 x 48). Drawn smooth; the 3D view blurs it
     further with bilinear filtering, like a 64-bit texture. */
  function makeArt(p) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 48;
    const x = c.getContext('2d');
    const grad = (stops, x0 = 0, y0 = 0, x1 = 0, y1 = 48) => { const gr = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
    switch (p.art) {
      case 'sunset':
        x.fillStyle = grad([[0, '#2b1c63'], [0.55, '#ff6f91'], [1, '#ffd23f']]); x.fillRect(0, 0, 64, 48);
        x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(40, 30, 9, 0, 7); x.fill();
        x.fillStyle = '#3b2270'; x.beginPath(); x.moveTo(0, 48); x.lineTo(0, 34); x.lineTo(14, 24); x.lineTo(26, 34); x.lineTo(38, 28); x.lineTo(64, 40); x.lineTo(64, 48); x.fill();
        x.fillStyle = '#1f1447'; x.fillRect(0, 42, 64, 6);
        break;
      case 'ui':
        x.fillStyle = '#eef1ff'; x.fillRect(0, 0, 64, 48);
        x.fillStyle = '#2b1c63'; x.fillRect(0, 0, 64, 7);
        ['#ff6f91', '#ffd23f', '#8be28b'].forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(5 + i * 5, 3.5, 1.6, 0, 7); x.fill(); });
        for (let i = 0; i < 3; i++) { x.fillStyle = '#ffffff'; x.fillRect(4 + i * 20, 12, 16, 30); x.fillStyle = ['#7fd6ff', '#ff6f91', '#ffd23f'][i]; x.fillRect(4 + i * 20, 12, 16, 12); x.fillStyle = '#c9c4e6'; x.fillRect(6 + i * 20, 28, 11, 2); x.fillRect(6 + i * 20, 32, 8, 2); }
        break;
      case 'orb': {
        x.fillStyle = '#0f0c29'; x.fillRect(0, 0, 64, 48);
        const r = x.createRadialGradient(26, 18, 2, 32, 24, 18); r.addColorStop(0, '#ffffff'); r.addColorStop(0.3, '#7fd6ff'); r.addColorStop(1, '#3b2270');
        x.fillStyle = r; x.beginPath(); x.arc(32, 24, 15, 0, 7); x.fill();
        x.strokeStyle = '#ffd23f'; x.lineWidth = 2; x.beginPath(); x.ellipse(32, 25, 26, 6, -0.25, 0, 7); x.stroke();
        break;
      }
      case 'type':
        x.fillStyle = '#ffd23f'; x.fillRect(0, 0, 64, 48);
        x.fillStyle = '#2b1c63'; x.font = '900 34px "Arial Black", sans-serif'; x.textBaseline = 'middle'; x.fillText('Aa', 8, 26);
        x.fillStyle = '#ff6f91'; x.fillRect(0, 42, 64, 6);
        break;
      case 'waves':
        x.fillStyle = '#1b1745'; x.fillRect(0, 0, 64, 48);
        ['#ff6f91', '#ffd23f', '#7fd6ff', '#8be28b'].forEach((col, i) => {
          x.strokeStyle = col; x.lineWidth = 3; x.beginPath();
          for (let k = 0; k <= 64; k += 2) x.lineTo(k, 12 + i * 8 + Math.sin(k / 6 + i) * 4);
          x.stroke();
        });
        break;
      default:
        x.fillStyle = grad([[0, '#0c0a2a'], [1, '#3b2270']]); x.fillRect(0, 0, 64, 48);
        for (let i = 0; i < 9; i++) {
          const h = 12 + ((i * 37) % 22), w = 6;
          x.fillStyle = '#181442'; x.fillRect(i * 7, 48 - h, w, h);
          x.fillStyle = '#ffd23f';
          for (let j = 0; j < h - 4; j += 4) if ((i + j) % 3) x.fillRect(i * 7 + 2, 48 - h + 2 + j, 2, 2);
        }
        x.fillStyle = '#f3efd6'; x.beginPath(); x.arc(50, 10, 5, 0, 7); x.fill();
    }
    return c;
  }
  const ARTS = PROJECTS.map(makeArt);
  const copyArt = (target, i) => { const x = target.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(ARTS[i], 0, 0, target.width, target.height); };

  /* ---------------------------------------------------------
     DOM UI (works with or without WebGL)
     --------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg; toastEl.hidden = false;
    toastEl.style.animation = 'none'; void toastEl.offsetWidth; toastEl.style.animation = '';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  };

  const panels = Object.fromEntries($$('.panel').map((p) => [p.dataset.key, p]));
  const menuItems = $$('.menu-item');
  let openKey = null;
  let GL = null; // 3D hooks, set if WebGL starts

  function openPanel(key) {
    if (openKey === key) return;
    Object.values(panels).forEach((p) => { p.hidden = p.dataset.key !== key; });
    menuItems.forEach((m) => m.setAttribute('aria-current', String(m.dataset.key === key)));
    openKey = key;
    document.body.classList.add('is-focused');
    if (key !== 'work') showWorkIndex();
    GL?.focus(key);
  }
  function closePanel() {
    if (!openKey) return;
    const last = openKey;
    Object.values(panels).forEach((p) => { p.hidden = true; });
    menuItems.forEach((m) => m.setAttribute('aria-current', 'false'));
    openKey = null;
    document.body.classList.remove('is-focused');
    GL?.focus(null);
    GL?.highlightFloor(-1);
    GL?.showPainting(-1);
    const m = menuItems.find((mi) => mi.dataset.key === last);
    m?.focus({ preventScroll: true });
  }
  menuItems.forEach((m) => {
    m.addEventListener('click', () => openPanel(m.dataset.key));
    m.addEventListener('mouseenter', () => GL?.hoverKey(m.dataset.key));
    m.addEventListener('mouseleave', () => GL?.hoverKey(null));
  });
  $$('.panel .close').forEach((b) => b.addEventListener('click', closePanel));
  $('#home').addEventListener('click', (e) => { e.preventDefault(); closePanel(); });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!settings.hidden) { toggleSettings(false); return; }
    closePanel();
  });

  // work
  const worksEl = $('#works');
  worksEl.innerHTML = PROJECTS.map((p, i) => `
    <li><button class="work-card" data-i="${i}">
      <canvas width="64" height="48" data-i="${i}" aria-hidden="true"></canvas>
      <span class="work-name">${p.title}</span>
      <span class="work-meta">${p.type} &middot; ${p.year}</span>
    </button></li>`).join('');
  $$('canvas', worksEl).forEach((c) => copyArt(c, +c.dataset.i));
  const workIndex = $('#work-index'), workDetail = $('#work-detail');
  function showProject(i) {
    const p = PROJECTS[i];
    copyArt($('#detail-art'), i);
    $('#detail-meta').textContent = `${p.type} · ${p.year}`;
    $('#detail-title').textContent = p.title;
    $('#detail-desc').textContent = `${p.desc} This is where a longer case-study summary goes: context, process, and results.`;
    $('#detail-facts').innerHTML = `<div><dt class="dot">Role</dt><dd>${p.role}</dd></div><div><dt class="dot">Stack</dt><dd>${p.stack}</dd></div>`;
    workIndex.hidden = true; workDetail.hidden = false;
    panels.work.querySelector('.panel-body').scrollTop = 0;
    GL?.showPainting(i);
  }
  function showWorkIndex() { workIndex.hidden = false; workDetail.hidden = true; GL?.showPainting(-1); }
  $$('.work-card').forEach((b) => {
    b.addEventListener('click', () => showProject(+b.dataset.i));
    b.addEventListener('mouseenter', () => GL?.ripple(+b.dataset.i));
  });
  $('#work-back').addEventListener('click', showWorkIndex);

  // jobs (DOM order is newest first; tower floor 0 is the oldest)
  const jobs = $$('.job');
  jobs.forEach((job, i) => {
    const btn = $('.job-row', job);
    const floor = jobs.length - 1 - i;
    btn.addEventListener('click', () => {
      const open = !job.classList.contains('is-open');
      job.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      GL?.highlightFloor(floor);
    });
    job.addEventListener('mouseenter', () => GL?.highlightFloor(floor));
    btn.addEventListener('focus', () => GL?.highlightFloor(floor));
  });
  $('#jobs').addEventListener('mouseleave', () => GL?.highlightFloor(-1));

  // contact
  $('#copy').addEventListener('click', async () => {
    const email = $('#email').textContent;
    try { await navigator.clipboard.writeText(email); toast(`Copied ${email}`); }
    catch { const r = document.createRange(); r.selectNodeContents($('#email')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Email selected. Press Ctrl+C or Cmd+C to copy.'); }
  });
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('#f-msg').value.trim()) return;
    GL?.sendPlane();
    $('#form-status').textContent = 'Your paper plane took off. This form is a demo, so nothing was actually sent.';
    toast('Paper plane launched!');
  });
  $$('[data-placeholder]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast('That link is a placeholder for now.'); }));

  // settings
  const settings = $('#settings'), settingsBtn = $('#settings-btn');
  const SET = { res: 240, dither: 1, wobble: 1, fog: 1, spin: reduced ? 0 : 1 };
  function toggleSettings(show = settings.hidden) {
    settings.hidden = !show;
    settingsBtn.setAttribute('aria-expanded', String(show));
  }
  settingsBtn.addEventListener('click', () => toggleSettings());
  $('#settings-close').addEventListener('click', () => toggleSettings(false));
  $$('.seg').forEach((seg) => {
    const key = seg.dataset.set;
    const sync = () => $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === SET[key])));
    sync();
    $$('button', seg).forEach((b) => b.addEventListener('click', () => { SET[key] = +b.dataset.v; sync(); GL?.applySettings(); }));
  });

  // extruded title follows the pointer a little
  const title = $('#title');
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      title.style.setProperty('--ty', `${-10 + nx * 12}deg`);
      title.style.setProperty('--tx', `${8 - ny * 10}deg`);
    });
  }

  /* ---------------------------------------------------------
     3D
     --------------------------------------------------------- */
  try {
    if (!window.THREE) throw new Error('three missing');
    GL = initGL();
  } catch (err) {
    console.warn('3D view disabled:', err);
    document.body.classList.add('no-gl');
    GL = null;
  }

  function initGL() {
    const T = THREE;
    const canvas = $('#gl');
    const stage = $('#stage');
    const renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x120f2e, 1);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 500);
    const FOG_COL = new T.Color('#b88ab6');
    const fog = new T.Fog(FOG_COL, 26, 58);
    scene.fog = fog;

    /* ---- 64-bit look: vertex snapping for every material ---- */
    const U = { uSnap: { value: new T.Vector2(160, 120) }, uWobble: { value: 1 } };
    const SNAP_GLSL = `
      if (uWobble > 0.5) {
        vec4 sp = gl_Position; sp.xyz /= sp.w;
        sp.xy = floor(sp.xy * uSnap + 0.5) / uSnap;
        sp.xyz *= sp.w; gl_Position = sp;
      }`;
    const snapify = (mat) => {
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uSnap = U.uSnap; sh.uniforms.uWobble = U.uWobble;
        sh.vertexShader = 'uniform vec2 uSnap;\nuniform float uWobble;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + SNAP_GLSL);
      };
      return mat;
    };
    const matCache = new Map();
    const lam = (color, extra = {}) => {
      const { unique, ...rest } = extra;
      const key = color + JSON.stringify(rest);
      if (!unique && matCache.has(key)) return matCache.get(key);
      const m = snapify(new T.MeshLambertMaterial({ color, ...rest }));
      if (!unique) matCache.set(key, m);
      return m;
    };
    const basic = (color, extra = {}) => snapify(new T.MeshBasicMaterial({ color, ...extra }));

    /* ---- low-res render target + dither post pass ---- */
    let lowW = 320, lowH = 240;
    const rt = new T.WebGLRenderTarget(lowW, lowH, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
    const post = new T.ShaderMaterial({
      uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new T.Vector2(lowW, lowH) }, uDither: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uDither; varying vec2 vUv;
        float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
        float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
        void main(){
          vec2 px = floor(vUv * uRes);
          vec3 c = texture2D(tDiffuse, (px + 0.5) / uRes).rgb;
          if (uDither > 0.5) { c += (b4(px) - 0.5) / 31.0; c = floor(c * 31.0 + 0.5) / 31.0; }
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const postScene = new T.Scene();
    const postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));

    /* ---- lights ---- */
    scene.add(new T.HemisphereLight(0xffe2c4, 0x3b2a78, 0.75));
    const sun = new T.DirectionalLight(0xffd0a0, 0.85); sun.position.set(-18, 14, 20); scene.add(sun);
    scene.add(new T.AmbientLight(0x6a5aa8, 0.25));

    /* ---- sky ---- */
    {
      const g = new T.SphereGeometry(220, 24, 16);
      const pos = g.attributes.position, cols = [];
      const stops = [[-1, '#241a4a'], [-0.08, '#3a2766'], [0.0, '#ffb08a'], [0.1, '#ff8fa0'], [0.3, '#8a63c8'], [0.65, '#3b2f8a'], [1, '#17153f']].map(([s, c]) => [s, new T.Color(c)]);
      const tmp = new T.Color();
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 220;
        let k = 0; while (k < stops.length - 2 && stops[k + 1][0] <= y) k++;
        const [a, ca] = stops[k], [b, cb] = stops[k + 1];
        tmp.copy(ca).lerp(cb, clamp((y - a) / (b - a)));
        cols.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      scene.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
      const sunDisc = new T.Mesh(new T.CircleGeometry(12, 10), new T.MeshBasicMaterial({ color: 0xffe6b0, fog: false }));
      sunDisc.position.set(-70, 4, -170); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);
      const sp = [];
      for (let i = 0; i < 260; i++) {
        const th = Math.random() * Math.PI * 2, y = 0.25 + Math.random() * 0.75, r = Math.sqrt(1 - y * y);
        sp.push(Math.cos(th) * r * 200, y * 200, Math.sin(th) * r * 200);
      }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
      scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false, fog: false })));
      const moon = new T.Mesh(new T.IcosahedronGeometry(2.4, 1), lam('#d9d2f0', { fog: false }));
      moon.position.set(34, 22, -60); scene.add(moon);
    }

    /* ---- planet ---- */
    const world = new T.Group();
    scene.add(world);
    const pickables = [];
    const occluders = [];
    const V = (x, y, z) => new T.Vector3(x, y, z).normalize();
    const LM = {
      about: { dir: V(0.3, 0.72, 0.62), place: 'House', label: 'About', lift: 0.9, dist: 9.5 },
      work: { dir: V(-0.78, 0.32, 0.54), place: 'Gallery', label: 'Work', lift: 3.0, dist: 10.5 },
      exp: { dir: V(0.8, 0.2, -0.56), place: 'Tower', label: 'Experience', lift: 1.8, dist: 12 },
      contact: { dir: V(-0.28, 0.56, -0.78), place: 'Mailbox', label: 'Contact', lift: 0.6, dist: 8.5 },
    };
    const LMS = Object.values(LM);

    // value noise
    const hash = (x, y, z) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
    const vnoise = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
      const c = (a, b, d) => hash(xi + a, yi + b, zi + d);
      const x00 = lerp(c(0, 0, 0), c(1, 0, 0), xf), x10 = lerp(c(0, 1, 0), c(1, 1, 0), xf);
      const x01 = lerp(c(0, 0, 1), c(1, 0, 1), xf), x11 = lerp(c(0, 1, 1), c(1, 1, 1), xf);
      return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
    };
    const fbm = (d) => { const p = d.clone().multiplyScalar(1.7).addScalar(7); return vnoise(p.x, p.y, p.z) * 0.6 + vnoise(p.x * 2.1, p.y * 2.1, p.z * 2.1) * 0.28 + vnoise(p.x * 4.3, p.y * 4.3, p.z * 4.3) * 0.12; };
    const heightAt = (d) => {
      let h = (fbm(d) - 0.47) * 2.0;
      for (const L of LMS) {
        const a = d.angleTo(L.dir);
        if (a < 0.42) h = lerp(h, 0.34, smooth(clamp((0.42 - a) / 0.2)));
      }
      return h;
    };
    const R0 = 10;
    const radiusAt = (d) => R0 + heightAt(d);

    {
      const g = new T.IcosahedronGeometry(R0, 14);
      const pos = g.attributes.position;
      const d = new T.Vector3();
      const hs = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        d.fromBufferAttribute(pos, i).normalize();
        const h = heightAt(d); hs[i] = h;
        d.multiplyScalar(R0 + h);
        pos.setXYZ(i, d.x, d.y, d.z);
      }
      g.computeVertexNormals();
      const cols = [], c = new T.Color();
      const pal = { sand: '#ecd59c', grass1: '#71c257', grass2: '#5fae4c', grass3: '#4a9a48', dark: '#3b7f45', rock: '#9c8e86', snow: '#f5f1ff' };
      for (let f = 0; f < pos.count; f += 3) {
        const h = (hs[f] + hs[f + 1] + hs[f + 2]) / 3;
        const n = hash(f, 7, 3);
        let col;
        if (h < 0.1) col = pal.sand;
        else if (h < 0.5) col = n < 0.33 ? pal.grass1 : n < 0.66 ? pal.grass2 : pal.grass3;
        else if (h < 0.68) col = pal.dark;
        else if (h < 0.82) col = pal.rock;
        else col = pal.snow;
        c.set(col);
        for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      const terrain = new T.Mesh(g, snapify(new T.MeshLambertMaterial({ vertexColors: true })));
      world.add(terrain);
      occluders.push(terrain);
      const water = new T.Mesh(new T.IcosahedronGeometry(R0 + 0.02, 6), snapify(new T.MeshLambertMaterial({ color: 0x3ba6dc, transparent: true, opacity: 0.9 })));
      world.add(water);
    }

    const UP = new T.Vector3(0, 1, 0);
    const placeOn = (obj, dir, yaw = 0, sink = 0.05) => {
      obj.position.copy(dir).multiplyScalar(radiusAt(dir) - sink);
      obj.quaternion.setFromUnitVectors(UP, dir);
      obj.rotateY(yaw);
      world.add(obj);
      return obj;
    };
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };
    const tagAll = (obj, key, extra = {}) => obj.traverse((o) => { if (o.isMesh) { o.userData.key = key; Object.assign(o.userData, extra); pickables.push(o); } });


    /* ---- landmarks ---- */
    const groups = {};
    // House
    {
      const g = new T.Group();
      g.add(mesh(new T.BoxGeometry(1.4, 0.95, 1.15), lam('#f2e2c2'), 0, 0.47, 0));
      const roof = mesh(new T.ConeGeometry(1.15, 0.8, 4), lam('#e0556a'), 0, 1.33, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(mesh(new T.BoxGeometry(0.3, 0.5, 0.06), lam('#7a4b2a'), 0.2, 0.25, 0.58));
      g.add(mesh(new T.BoxGeometry(0.28, 0.24, 0.06), basic('#ffe08a'), -0.35, 0.55, 0.58));
      g.add(mesh(new T.BoxGeometry(0.06, 0.24, 0.28), basic('#ffe08a'), 0.71, 0.55, 0));
      g.add(mesh(new T.BoxGeometry(0.22, 0.5, 0.22), lam('#b0413e'), -0.38, 1.5, -0.2));
      g.add(mesh(new T.BoxGeometry(1.6, 0.08, 1.35), lam('#c9b48a'), 0, 0.02, 0));
      groups.about = placeOn(g, LM.about.dir, 0.4);
      groups.about.userData.top = 2.1;
    }
    // Gallery + painting ring
    const paintings = [];
    let ring;
    {
      const g = new T.Group();
      const stone = lam('#ece6f7'), stone2 = lam('#cfc6e6');
      g.add(mesh(new T.BoxGeometry(2.4, 0.22, 1.7), stone2, 0, 0.11, 0));
      g.add(mesh(new T.BoxGeometry(2.1, 0.12, 1.45), stone, 0, 0.28, 0));
      g.add(mesh(new T.BoxGeometry(1.9, 1.05, 0.25), stone, 0, 0.86, -0.55));
      const col = new T.CylinderGeometry(0.09, 0.1, 1.05, 6);
      for (let i = 0; i < 5; i++) g.add(mesh(col, stone, -0.8 + i * 0.4, 0.86, 0.5));
      g.add(mesh(new T.BoxGeometry(2.2, 0.14, 1.5), stone2, 0, 1.45, 0));
      const pediGeo = new T.CylinderGeometry(0.55, 0.55, 2.2, 3);
      pediGeo.rotateZ(Math.PI / 2); pediGeo.rotateX(-Math.PI / 2);
      const pedi = mesh(pediGeo, lam('#f7f3ff'), 0, 1.79, 0);
      pedi.scale.set(1, 0.8, 1.45);
      g.add(pedi);
      groups.work = placeOn(g, LM.work.dir, -0.3);
      groups.work.userData.top = 2.6;

      ring = new T.Group(); ring.position.y = 3.0; g.add(ring);
      const frameMat = lam('#e8b44a');
      PROJECTS.forEach((p, i) => {
        const tex = new T.CanvasTexture(ARTS[i]);
        tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
        const mat = new T.ShaderMaterial({
          uniforms: { map: { value: tex }, uTime: { value: 0 }, uAmp: { value: 0 }, uHi: { value: 0 }, uSnap: U.uSnap, uWobble: U.uWobble },
          vertexShader: `
            uniform float uTime; uniform float uAmp; uniform vec2 uSnap; uniform float uWobble;
            varying vec3 vA;
            void main(){
              vec3 p = position;
              float d = length(uv - vec2(0.5));
              p.z += uAmp * sin(d * 26.0 - uTime * 9.0) * (1.0 - d) * 0.12;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
              ${SNAP_GLSL}
              vA = vec3(uv * gl_Position.w, gl_Position.w); // affine texture warp, 90s style
            }`,
          fragmentShader: `
            uniform sampler2D map; uniform float uHi; varying vec3 vA;
            void main(){ vec3 c = texture2D(map, vA.xy / vA.z).rgb; gl_FragColor = vec4(c * (0.92 + 0.25 * uHi), 1.0); }`,
          side: T.DoubleSide,
        });
        const holder = new T.Group();
        const a = (i / PROJECTS.length) * Math.PI * 2;
        holder.position.set(Math.sin(a) * 2.7, Math.sin(i * 1.7) * 0.25, Math.cos(a) * 2.7);
        holder.rotation.y = a;
        holder.add(mesh(new T.BoxGeometry(1.34, 1.04, 0.08), frameMat, 0, 0, -0.05));
        const plane = mesh(new T.PlaneGeometry(1.18, 0.88, 14, 10), mat, 0, 0, 0.001);
        holder.add(plane);
        holder.userData = { angle: a, base: holder.position.y };
        ring.add(holder);
        paintings.push({ holder, mat, amp: 0, targetAmp: 0 });
        tagAll(holder, 'painting', { index: i });
      });
    }
    // Tower (one floor per job, oldest at the bottom)
    const floors = [];
    {
      const g = new T.Group();
      const cols = ['#8be28b', '#7fd6ff', '#ffd23f', '#ff6f91'];
      let y = 0;
      cols.forEach((c, i) => {
        const r = 0.82 - i * 0.08, h = 0.72;
        const m = mesh(new T.CylinderGeometry(r - 0.04, r, h, 8), lam(c, { unique: true }), 0, y + h / 2, 0);
        g.add(m);
        for (let w = 0; w < 4; w++) {
          const a = w * Math.PI / 2 + i * 0.4;
          const win = mesh(new T.BoxGeometry(0.16, 0.22, 0.05), basic('#fff3c4'), Math.sin(a) * (r - 0.02), y + h / 2, Math.cos(a) * (r - 0.02));
          win.rotation.y = a; g.add(win);
        }
        g.add(mesh(new T.CylinderGeometry(r + 0.05, r + 0.05, 0.07, 8), lam('#efe9ff'), 0, y + h, 0));
        floors.push({ mesh: m, base: new T.Color(c) });
        y += h + 0.07;
      });
      g.add(mesh(new T.ConeGeometry(0.62, 0.8, 8), lam('#2b1c63'), 0, y + 0.4, 0));
      g.add(mesh(new T.CylinderGeometry(0.03, 0.03, 0.8, 4), lam('#efe9ff'), 0, y + 1.1, 0));
      const flag = mesh(new T.BoxGeometry(0.45, 0.26, 0.03), lam('#ff6f91'), 0.24, y + 1.35, 0);
      g.add(flag);
      g.userData.flag = flag;
      groups.exp = placeOn(g, LM.exp.dir, 0.2);
      groups.exp.userData.top = y + 1.7;
    }
    // Mailbox
    let mailFlag;
    {
      const g = new T.Group();
      g.add(mesh(new T.BoxGeometry(0.12, 0.75, 0.12), lam('#7a4b2a'), 0, 0.37, 0));
      g.add(mesh(new T.BoxGeometry(0.4, 0.28, 0.6), lam('#3b6fd8'), 0, 0.88, 0));
      const topGeo = new T.CylinderGeometry(0.2, 0.2, 0.6, 8, 1, false, 0, Math.PI);
      topGeo.rotateX(Math.PI / 2); topGeo.rotateZ(Math.PI / 2);
      g.add(mesh(topGeo, lam('#3b6fd8'), 0, 1.02, 0));
      g.add(mesh(new T.BoxGeometry(0.34, 0.3, 0.04), lam('#23489e'), 0, 0.92, 0.31));
      const pivot = new T.Group(); pivot.position.set(0.22, 0.85, -0.1);
      pivot.add(mesh(new T.BoxGeometry(0.04, 0.36, 0.05), lam('#e0556a'), 0, 0.18, 0));
      pivot.add(mesh(new T.BoxGeometry(0.04, 0.12, 0.18), lam('#e0556a'), 0, 0.3, -0.09));
      pivot.rotation.x = Math.PI * 0.55;
      g.add(pivot); mailFlag = pivot;
      g.add(mesh(new T.CylinderGeometry(0.5, 0.55, 0.06, 8), lam('#c9b48a'), 0, 0.02, 0));
      groups.contact = placeOn(g, LM.contact.dir, 0.9);
      groups.contact.userData.top = 1.5;
    }
    Object.entries(groups).forEach(([k, g]) => { tagAll(g, k); g.userData.scale = 1; });
    Object.entries(groups).forEach(([k, g]) => { g.userData.key = k; });

    /* ---- scatter: trees + rocks ---- */
    {
      const trunk = new T.CylinderGeometry(0.07, 0.09, 0.35, 5);
      const leafMats = [lam('#3f9a4a'), lam('#56b156'), lam('#2f8a52')];
      const rock = new T.DodecahedronGeometry(0.22, 0);
      let placed = 0, tries = 0;
      const rnd = (() => { let s = 17; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
      while (placed < 46 && tries < 3000) {
        tries++;
        const d = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
        const h = heightAt(d);
        if (h < 0.14 || h > 0.66) continue;
        if (LMS.some((L) => d.angleTo(L.dir) < 0.34)) continue;
        const t = new T.Group();
        if (rnd() < 0.18) { const r = mesh(rock, lam('#8f86a6'), 0, 0.1, 0); r.rotation.set(rnd() * 3, rnd() * 3, 0); t.add(r); }
        else {
          const s = 0.7 + rnd() * 0.6;
          t.add(mesh(trunk, lam('#7a4b2a'), 0, 0.17 * s, 0));
          const leaf = mesh(new T.ConeGeometry(0.38 * s, 0.95 * s, 6), leafMats[placed % 3], 0, 0.35 * s + 0.45 * s, 0);
          t.add(leaf);
          if (rnd() < 0.4) t.add(mesh(new T.ConeGeometry(0.28 * s, 0.6 * s, 6), leafMats[(placed + 1) % 3], 0, 0.35 * s + 0.95 * s, 0));
        }
        placeOn(t, d, rnd() * 6);
        placed++;
      }
    }

    /* ---- clouds ---- */
    const clouds = new T.Group();
    world.add(clouds);
    {
      const puff = new T.IcosahedronGeometry(0.6, 0);
      const cm = lam('#fff6fb');
      for (let i = 0; i < 9; i++) {
        const c = new T.Group();
        const n = 3 + (i % 3);
        for (let k = 0; k < n; k++) { const m = mesh(puff, cm, (k - n / 2) * 0.55, Math.sin(k * 2) * 0.15, (k % 2) * 0.3); m.scale.setScalar(0.8 + ((k * 7) % 5) * 0.12); c.add(m); }
        const d = V(Math.sin(i * 2.4), Math.cos(i * 1.7) * 0.8, Math.cos(i * 2.4));
        c.position.copy(d).multiplyScalar(13.2 + (i % 3) * 0.6);
        c.quaternion.setFromUnitVectors(UP, d);
        clouds.add(c);
      }
    }

    /* ---- the character: walks a great circle ---- */
    const hero = new T.Group();
    const heroParts = {};
    {
      const skin = lam('#f1c09a'), shirt = lam('#ff6f91'), pants = lam('#2b3a78'), hair = lam('#2d1f1c');
      heroParts.legL = mesh(new T.BoxGeometry(0.1, 0.26, 0.1), pants, -0.07, 0.13, 0);
      heroParts.legR = mesh(new T.BoxGeometry(0.1, 0.26, 0.1), pants, 0.07, 0.13, 0);
      heroParts.legL.geometry.translate(0, -0.13, 0); heroParts.legR.geometry.translate(0, -0.13, 0);
      heroParts.legL.position.y = 0.26; heroParts.legR.position.y = 0.26;
      hero.add(heroParts.legL, heroParts.legR);
      hero.add(mesh(new T.BoxGeometry(0.28, 0.3, 0.16), shirt, 0, 0.41, 0));
      hero.add(mesh(new T.BoxGeometry(0.22, 0.22, 0.2), skin, 0, 0.67, 0));
      hero.add(mesh(new T.BoxGeometry(0.24, 0.08, 0.22), hair, 0, 0.8, -0.01));
      hero.add(mesh(new T.BoxGeometry(0.04, 0.04, 0.02), basic('#1b1b22'), -0.05, 0.69, 0.1));
      hero.add(mesh(new T.BoxGeometry(0.04, 0.04, 0.02), basic('#1b1b22'), 0.05, 0.69, 0.1));
      hero.scale.setScalar(1.6);
      world.add(hero);
      tagAll(hero, 'hero');
    }
    const heroPath = { axis: V(0.35, 0.2, 0.9), a: 0, jump: 0 };
    heroPath.d0 = new T.Vector3(1, 0, 0).projectOnPlane(heroPath.axis).normalize();
    heroPath.d1 = new T.Vector3().crossVectors(heroPath.axis, heroPath.d0);

    /* ---- collectible star ---- */
    const starPivot = new T.Group(); world.add(starPivot);
    let star;
    {
      const shape = new T.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.28 : 0.62, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const geo = new T.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
      geo.center();
      star = mesh(geo, lam('#ffd23f', { emissive: new T.Color('#6b4a00') }));
      star.position.set(0, 0, 13.4);
      starPivot.add(star);
      starPivot.rotation.set(0.5, 0, 0.3);
      tagAll(star, 'star');
    }
    let starState = { collected: false, t: 0, count: 0 };

    /* ---- paper plane ---- */
    const plane = mesh(new T.ConeGeometry(0.16, 0.5, 3), lam('#ffffff'));
    plane.visible = false; world.add(plane);
    const planeState = { t: -1, from: new T.Vector3(), dir: new T.Vector3() };

    /* ---- particles (smoke + sparkles) ---- */
    const smoke = [];
    const smokeGeo = new T.IcosahedronGeometry(0.12, 0), smokeMat = lam('#efe9ff');
    for (let i = 0; i < 5; i++) { const s = mesh(smokeGeo, smokeMat); groups.about.add(s); smoke.push({ m: s, t: i / 5 }); }
    const sparks = [];

    /* ---------------------------------------------------------
       CAMERA + INTERACTION
       --------------------------------------------------------- */
    const state = {
      focus: null, hover: null, hoverMenu: null, floor: -1, painting: -1,
      vel: new T.Vector2(0, 0), dragging: false, moved: 0, last: new T.Vector2(), idle: 0,
      camPos: new T.Vector3(0, 3, 34), camLook: new T.Vector3(),
    };
    camera.position.copy(state.camPos);
    const worldTarget = new T.Quaternion();
    let hasWorldTarget = false;
    const FOCUS_DIR = V(0, 0.94, 0.34);

    function layoutOffsets() {
      const mobile = innerWidth <= 820;
      return mobile
        ? { orbitLook: new T.Vector3(0, -6, 0), orbitDist: 64, focusShift: new T.Vector3(0, -2.4, 0) }
        : { orbitLook: new T.Vector3(-4.6, 0.6, 0), orbitDist: 39, focusShift: new T.Vector3(3.2, 0, 0) };
    }

    function focus(key) {
      state.focus = key;
      if (!key) { hasWorldTarget = false; return; }
      const L = LM[key];
      const cur = L.dir.clone().applyQuaternion(world.quaternion);
      const q = new T.Quaternion().setFromUnitVectors(cur, FOCUS_DIR);
      worldTarget.copy(q).multiply(world.quaternion);
      // spin around the landmark's up axis so its front faces the camera (3/4 view)
      const gq = worldTarget.clone().multiply(groups[key].quaternion);
      const front = new T.Vector3(0, 0, 1).applyQuaternion(gq).projectOnPlane(FOCUS_DIR).normalize();
      const want = new T.Vector3(0.35, 0, 1).projectOnPlane(FOCUS_DIR).normalize();
      if (front.dot(want) < -0.999) front.applyAxisAngle(FOCUS_DIR, 0.01);
      worldTarget.premultiply(new T.Quaternion().setFromUnitVectors(front, want));
      hasWorldTarget = true;
      state.vel.set(0, 0);
      if (reduced) world.quaternion.copy(worldTarget);
    }

    const ray = new T.Raycaster();
    const ndc = new T.Vector2();
    const pick = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables.concat(occluders), false)[0];
      return hit && hit.object.userData.key ? hit.object.userData : null;
    };

    const hoverLabel = $('#hover-label'), hlPlace = $('#hl-place'), hlLabel = $('#hl-label');
    const NAMES = { about: ['House', 'About'], work: ['Gallery', 'Work'], exp: ['Tower', 'Experience'], contact: ['Mailbox', 'Contact'], hero: ['Your Name', 'Say hi'], star: ['Star', 'Grab it'] };

    canvas.addEventListener('pointerdown', (e) => {
      state.dragging = true; state.moved = 0; state.last.set(e.clientX, e.clientY);
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (state.dragging) {
        const dx = e.clientX - state.last.x, dy = e.clientY - state.last.y;
        state.moved += Math.abs(dx) + Math.abs(dy);
        state.last.set(e.clientX, e.clientY);
        if (state.moved > 4 && !state.focus) {
          rotateWorld(dx * 0.006, dy * 0.006);
          state.vel.set(dx * 0.006, dy * 0.006);
          state.idle = 0;
        }
        return;
      }
      const u = pick(e.clientX, e.clientY);
      state.hover = u;
      stage.classList.toggle('is-hot', !!u);
      state.pointer = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerleave', () => { state.hover = null; stage.classList.remove('is-hot'); });
    canvas.addEventListener('pointerup', (e) => {
      state.dragging = false;
      if (state.moved > 6) return;
      const u = pick(e.clientX, e.clientY);
      if (!u) { if (openKey) closePanel(); return; }
      if (u.key === 'painting') { openPanel('work'); showProject(u.index); return; }
      if (u.key === 'hero') { heroPath.jump = 0.001; toast('Hi! I’m Your Name. Welcome to my planet.'); return; }
      if (u.key === 'star') { collectStar(); return; }
      openPanel(u.key);
    });

    const qa = new T.Quaternion(), qb = new T.Quaternion(), AX = new T.Vector3(1, 0, 0);
    function rotateWorld(yaw, pitch) {
      qa.setFromAxisAngle(UP, yaw); qb.setFromAxisAngle(AX, pitch);
      world.quaternion.premultiply(qa).premultiply(qb);
    }

    function collectStar() {
      if (starState.collected) return;
      starState.collected = true; starState.t = 0; starState.count++;
      toast(starState.count === 1 ? 'You found a star! It will be back soon.' : `Star collected ×${starState.count}`);
      const wp = star.getWorldPosition(new T.Vector3());
      for (let i = 0; i < 18; i++) {
        const m = mesh(smokeGeo, lam('#ffd23f')); m.position.copy(wp); scene.add(m);
        sparks.push({ m, v: new T.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.2) * 6, (Math.random() - 0.5) * 6), life: 0.9 });
      }
    }

    /* ---------------------------------------------------------
       SETTINGS + RESIZE
       --------------------------------------------------------- */
    function applySettings() {
      post.uniforms.uDither.value = SET.dither;
      U.uWobble.value = SET.wobble;
      scene.fog = SET.fog ? fog : null;
      resize();
    }
    function resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      lowH = SET.res || h;
      lowW = Math.round(lowH * (w / h));
      rt.setSize(lowW, lowH);
      post.uniforms.uRes.value.set(lowW, lowH);
      U.uSnap.value.set(lowW * 0.3, lowH * 0.3);
    }
    addEventListener('resize', resize);
    resize();

    /* ---------------------------------------------------------
       LOOP
       --------------------------------------------------------- */
    const clock = new T.Clock();
    const tmpV = new T.Vector3(), tmpV2 = new T.Vector3();
    let time = 0;

    function tick() {
      const dt = Math.min(0.05, clock.getDelta());
      time += dt;

      // planet rotation
      if (hasWorldTarget) {
        world.quaternion.slerp(worldTarget, 1 - Math.exp(-dt * 3.2));
      } else if (!state.dragging) {
        state.idle += dt;
        state.vel.multiplyScalar(Math.exp(-dt * 2.2));
        let yaw = state.vel.x, pitch = state.vel.y;
        if (SET.spin && state.idle > 2.5) yaw += dt * 0.12 * clamp((state.idle - 2.5) / 2);
        rotateWorld(yaw, pitch);
      }

      // camera
      const off = layoutOffsets();
      let wantPos, wantLook;
      if (state.focus) {
        const L = LM[state.focus];
        const surf = FOCUS_DIR.clone().multiplyScalar(radiusAt(L.dir) + L.lift);
        wantLook = surf.clone().add(off.focusShift);
        wantPos = surf.clone().add(new T.Vector3(0, L.dist * 0.3, L.dist)).add(off.focusShift);
      } else {
        wantLook = off.orbitLook.clone();
        wantPos = new T.Vector3(0, 4, off.orbitDist).add(new T.Vector3(off.orbitLook.x, off.orbitLook.y, 0));
      }
      const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
      state.camPos.lerp(wantPos, k); state.camLook.lerp(wantLook, k);
      camera.position.copy(state.camPos); camera.lookAt(state.camLook);
      const cd = camera.position.length();
      fog.near = cd - 6; fog.far = cd + 24;

      // landmark hover bob
      const hk = state.hover?.key && groups[state.hover.key] ? state.hover.key : state.hoverMenu;
      Object.entries(groups).forEach(([key, g]) => {
        const target = key === hk || key === state.focus ? 1.12 : 1;
        g.userData.scale += (target - g.userData.scale) * Math.min(1, dt * 10);
        g.scale.setScalar(g.userData.scale);
      });
      groups.exp.userData.flag.rotation.y = Math.sin(time * 3) * 0.4;

      // tower floors
      floors.forEach((f, i) => {
        const on = i === state.floor;
        f.mesh.material.emissive.setRGB(on ? 0.35 + Math.sin(time * 6) * 0.1 : 0, on ? 0.3 : 0, on ? 0.2 : 0);
      });

      // painting ring + ripples
      if (ring) {
        if (state.painting >= 0) {
          ring.updateMatrixWorld();
          const local = ring.parent.worldToLocal(camera.position.clone()).sub(ring.position);
          const camA = Math.atan2(local.x, local.z);
          const want = camA - paintings[state.painting].holder.userData.angle;
          let diff = ((want - ring.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          ring.rotation.y += diff * Math.min(1, dt * 4);
        } else if (!reduced) ring.rotation.y += dt * 0.18;
        paintings.forEach((p, i) => {
          const hot = (state.hover?.key === 'painting' && state.hover.index === i) || i === state.painting;
          if (hot) p.targetAmp = 1;
          p.amp += (p.targetAmp - p.amp) * Math.min(1, dt * 5);
          p.targetAmp *= Math.exp(-dt * 1.2);
          p.mat.uniforms.uTime.value = time;
          p.mat.uniforms.uAmp.value = p.amp;
          p.mat.uniforms.uHi.value = hot ? 1 : 0;
          p.holder.position.y = p.holder.userData.base + Math.sin(time * 1.4 + i) * 0.08;
        });
      }

      // smoke
      smoke.forEach((s) => {
        s.t = (s.t + dt * 0.35) % 1;
        s.m.position.set(-0.38 + Math.sin(s.t * 6) * 0.08, 1.8 + s.t * 1.4, -0.2);
        s.m.scale.setScalar(0.6 + s.t * 1.6);
        s.m.visible = s.t < 0.92;
      });

      // clouds
      if (!reduced) clouds.rotation.y += dt * 0.03;

      // hero walking
      if (!reduced) heroPath.a += dt * 0.07;
      const a = heroPath.a;
      const dir = tmpV.copy(heroPath.d0).multiplyScalar(Math.cos(a)).addScaledVector(heroPath.d1, Math.sin(a)).normalize();
      const fwd = tmpV2.copy(heroPath.d0).multiplyScalar(-Math.sin(a)).addScaledVector(heroPath.d1, Math.cos(a)).normalize();
      let jumpY = 0;
      if (heroPath.jump > 0) { heroPath.jump += dt; const jt = heroPath.jump / 0.6; jumpY = Math.sin(Math.min(1, jt) * Math.PI) * 0.9; if (jt >= 1) heroPath.jump = 0; }
      const hr = Math.max(radiusAt(dir), R0 + 0.02) - 0.02 + jumpY;
      hero.position.copy(dir).multiplyScalar(hr);
      const right = new T.Vector3().crossVectors(fwd, dir).normalize();
      const m4 = new T.Matrix4().makeBasis(right.negate(), dir, fwd);
      hero.quaternion.setFromRotationMatrix(m4);
      const swing = Math.sin(time * 9) * 0.6;
      heroParts.legL.rotation.x = swing; heroParts.legR.rotation.x = -swing;

      // star
      if (!reduced) starPivot.rotation.y += dt * 0.25;
      star.rotation.y += dt * 2.2;
      if (starState.collected) {
        starState.t += dt;
        star.scale.setScalar(Math.max(0.001, 1 - starState.t * 3));
        if (starState.t > 12) { starState.collected = false; star.scale.setScalar(1); starPivot.rotation.x = Math.random() * 1.2 - 0.6; }
      }
      sparks.forEach((s) => { s.life -= dt; s.m.position.addScaledVector(s.v, dt); s.v.multiplyScalar(0.94); s.m.scale.setScalar(Math.max(0.01, s.life)); });
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) { scene.remove(sparks[i].m); sparks.splice(i, 1); }

      // paper plane
      if (planeState.t >= 0) {
        planeState.t += dt;
        const pt = planeState.t;
        const p = planeState.from.clone().addScaledVector(planeState.dir, pt * 2.2 + pt * pt * 2.5);
        p.addScaledVector(planeState.up, Math.sin(pt * 3) * 0.4 + pt * 1.4);
        plane.position.copy(p);
        plane.lookAt(world.localToWorld(p.clone().add(planeState.dir)));
        plane.rotateX(Math.PI / 2);
        plane.scale.setScalar(Math.max(0.01, 1 - pt / 4));
        if (pt > 4) { planeState.t = -1; plane.visible = false; }
      }
      mailFlag.rotation.x += ((planeState.raised ? 0 : Math.PI * 0.55) - mailFlag.rotation.x) * Math.min(1, dt * 6);

      // hover label
      updateLabel();

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
      requestAnimationFrame(tick);
    }

    function updateLabel() {
      const u = state.hover;
      let key = u?.key;
      let obj = null, top = 0;
      if (key && groups[key]) { obj = groups[key]; top = obj.userData.top; }
      else if (key === 'hero') { obj = hero; top = 1.5; }
      else if (key === 'star') { obj = star; top = 0.8; }
      else if (key === 'painting') { obj = paintings[u.index].holder; top = 0.7; }
      if (!obj || !matchMedia('(pointer: fine)').matches) { hoverLabel.hidden = true; return; }
      const p = obj.localToWorld(new T.Vector3(0, top, 0)).project(camera);
      hoverLabel.hidden = false;
      if (key === 'painting') { hlPlace.textContent = PROJECTS[u.index].type; hlLabel.textContent = PROJECTS[u.index].title; }
      else { hlPlace.textContent = NAMES[key][0]; hlLabel.textContent = NAMES[key][1]; }
      hoverLabel.style.left = `${(p.x * 0.5 + 0.5) * innerWidth}px`;
      hoverLabel.style.top = `${(-p.y * 0.5 + 0.5) * innerHeight}px`;
    }

    requestAnimationFrame(tick);

    return {
      focus,
      hoverKey(key) { state.hoverMenu = key; },
      highlightFloor(i) { state.floor = i; },
      showPainting(i) { state.painting = i; if (i >= 0) paintings[i].targetAmp = 1; },
      ripple(i) { paintings[i].targetAmp = 1; },
      sendPlane() {
        const g = groups.contact;
        planeState.from = world.worldToLocal(g.localToWorld(new T.Vector3(0, 1.1, 0.3)));
        planeState.up = LM.contact.dir.clone();
        planeState.dir = new T.Vector3(1, 0.2, 0.4).projectOnPlane(planeState.up).normalize();
        planeState.t = 0; planeState.raised = true;
        plane.visible = true;
      },
      applySettings,
    };
  }
})();
