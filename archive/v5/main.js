/* =========================================================
   NAV CONSOLE (simplified) — portfolio v5
   A slow 3D galaxy behind the intro, and a plain one-page site.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------------------------------------------------
     CONTENT — placeholder projects (edit these)
     --------------------------------------------------------- */
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React, TypeScript', desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Website', year: '2025', role: 'Design & Development', stack: 'Next.js, GSAP', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: '3D / WebGL', year: '2025', role: 'Creative Developer', stack: 'Three.js, GLSL', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Data', year: '2024', role: 'Product Designer', stack: 'D3, Svelte', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Brand', year: '2023', role: 'Art Direction', stack: 'Figma, After Effects', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Six', type: 'App', year: '2022', role: 'UI Designer', stack: 'SwiftUI, Figma', desc: 'One or two sentences about what this was and why it mattered.' },
  ];

  /* ---------------------------------------------------------
     NAV
     --------------------------------------------------------- */
  const nav = $('.nav'), links = $('#links'), menuBtn = $('#menu-btn');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menuBtn.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    links.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  });
  $$('a', links).forEach((a) => a.addEventListener('click', () => { links.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; }));
  const navLinks = $$('a:not(.btn)', links);
  const obs = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-now', a.getAttribute('href') === `#${e.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'work', 'experience', 'contact'].forEach((id) => obs.observe(document.getElementById(id)));

  /* ---------------------------------------------------------
     PROJECT PREVIEWS — simple animated line drawings
     --------------------------------------------------------- */
  function drawPreview(c, i, t) {
    const x = c.getContext('2d'), W = c.width, H = c.height;
    const cyan = '#6fe7ff';
    x.clearRect(0, 0, W, H);
    x.lineWidth = 1.2;
    switch (i % 6) {
      case 0: // terrain
        for (let r = 0; r < 16; r++) {
          const z = r / 16, y0 = H * 0.3 + Math.pow(z, 1.5) * H * 0.62;
          x.strokeStyle = `rgba(111,231,255,${0.12 + z * 0.6})`; x.beginPath();
          for (let k = 0; k <= 48; k++) {
            const u = k / 48, px = W / 2 + (u - 0.5) * W * (0.35 + z * 1.1);
            const h = Math.sin(u * 8 + r * 0.6 - t) * Math.cos(u * 4 + r * 0.3) * H * 0.09;
            k ? x.lineTo(px, y0 - h) : x.moveTo(px, y0 - h);
          }
          x.stroke();
        }
        break;
      case 1: { // globe
        const cx = W / 2, cy = H / 2, R = H * 0.36;
        x.strokeStyle = 'rgba(111,231,255,.5)';
        for (let lat = -60; lat <= 60; lat += 20) { const yy = cy - Math.sin(lat * Math.PI / 180) * R, rr = Math.cos(lat * Math.PI / 180) * R; x.beginPath(); x.ellipse(cx, yy, rr, rr * 0.18, 0, 0, 7); x.stroke(); }
        for (let lo = 0; lo < 180; lo += 30) { const a = lo * Math.PI / 180 + t * 0.4; x.beginPath(); x.ellipse(cx, cy, Math.abs(Math.cos(a)) * R, R, 0, 0, 7); x.stroke(); }
        break;
      }
      case 2: // skyline
        for (let k = 0; k < 18; k++) {
          const h = (Math.sin(k * 1.7) * 0.5 + 0.6) * H * 0.5 * (0.85 + 0.15 * Math.sin(t * 2 + k));
          const bw = (W - 40) / 18;
          x.strokeStyle = cyan; x.globalAlpha = 0.35 + (k % 4) * 0.15;
          x.strokeRect(20 + k * bw, H - 20 - h, bw - 5, h);
        }
        x.globalAlpha = 1;
        break;
      case 3: // chart
        x.strokeStyle = 'rgba(111,231,255,.15)';
        for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(20, k * H / 5); x.lineTo(W - 20, k * H / 5); x.stroke(); }
        x.strokeStyle = cyan; x.lineWidth = 2; x.beginPath();
        for (let k = 0; k <= 60; k++) { const px = 20 + k * (W - 40) / 60, py = H * 0.62 - Math.sin(k / 7 + t) * H * 0.12 - k * H * 0.005; k ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
        break;
      case 4: { // orbits
        const cx = W / 2, cy = H / 2;
        for (let k = 1; k <= 4; k++) {
          x.strokeStyle = `rgba(111,231,255,${0.18 + k * 0.1})`; x.beginPath(); x.ellipse(cx, cy, k * W * 0.1, k * H * 0.08, 0, 0, 7); x.stroke();
          const a = t * (1.1 - k * 0.18) + k;
          x.fillStyle = cyan; x.beginPath(); x.arc(cx + Math.cos(a) * k * W * 0.1, cy + Math.sin(a) * k * H * 0.08, 3, 0, 7); x.fill();
        }
        break;
      }
      default: // interface
        x.strokeStyle = 'rgba(111,231,255,.55)';
        x.strokeRect(W * 0.12, H * 0.14, W * 0.76, H * 0.72); x.strokeRect(W * 0.12, H * 0.14, W * 0.76, H * 0.1);
        for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(111,231,255,.12)'; x.fillRect(W * (0.16 + k * 0.24), H * 0.32, W * 0.2, H * 0.24); }
        x.fillStyle = 'rgba(111,231,255,.25)';
        for (let k = 0; k < 3; k++) x.fillRect(W * 0.16, H * (0.62 + k * 0.07), W * (0.3 + ((k * 0.17) % 0.3)) + Math.sin(t * 2 + k) * 8, 5);
    }
  }

  const grid = $('#grid');
  grid.innerHTML = PROJECTS.map((p, i) => `
    <li><button class="card" data-i="${i}">
      <canvas width="480" height="300" aria-hidden="true"></canvas>
      <span class="card-body">
        <span class="card-meta mono">${p.type} &middot; ${p.year}</span>
        <span class="card-title">${p.title}</span>
        <span class="card-desc">${p.desc}</span>
      </span>
    </button></li>`).join('');

  // animate a preview only while hovered; draw one still frame otherwise
  $$('.card').forEach((card) => {
    const c = $('canvas', card), i = +card.dataset.i;
    drawPreview(c, i, i);
    let raf = 0, t0 = 0;
    const loop = (now) => { drawPreview(c, i, i + (now - t0) / 1000); raf = requestAnimationFrame(loop); };
    const start = () => { if (raf || reduced) return; t0 = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
    card.addEventListener('focus', start); card.addEventListener('blur', stop);
    card.addEventListener('click', () => openProject(i));
  });

  /* ---------------------------------------------------------
     PROJECT MODAL
     --------------------------------------------------------- */
  const modal = $('#modal'), mHolo = $('#m-holo');
  let modalRaf = 0;
  function openProject(i) {
    const p = PROJECTS[i];
    $('#m-meta').textContent = `${pad(i + 1)} · ${p.type} · ${p.year}`;
    $('#m-title').textContent = p.title;
    $('#m-desc').textContent = `${p.desc} This is where a longer case-study summary goes: context, process, and results.`;
    $('#m-specs').innerHTML = `<div><dt>Role</dt><dd>${p.role}</dd></div><div><dt>Stack</dt><dd>${p.stack}</dd></div>`;
    const t0 = performance.now();
    const loop = (now) => { drawPreview(mHolo, i, i + (now - t0) / 1000); modalRaf = requestAnimationFrame(loop); };
    cancelAnimationFrame(modalRaf);
    if (reduced) drawPreview(mHolo, i, i); else modalRaf = requestAnimationFrame(loop);
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }
  $('#m-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', () => cancelAnimationFrame(modalRaf));

  /* ---------------------------------------------------------
     CONTACT
     --------------------------------------------------------- */
  $('#copy').addEventListener('click', async () => {
    const email = $('#email').textContent, b = $('#copy');
    try { await navigator.clipboard.writeText(email); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents($('#email')); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Selected'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1800);
  });
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#form-note').textContent = 'Thanks! This form is a demo for now, so nothing was sent.';
  });
  $$('[data-placeholder]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     HERO GALAXY
     --------------------------------------------------------- */
  if (!window.THREE) return;
  try { initGalaxy(); } catch (err) { console.warn('Galaxy disabled:', err); }

  function initGalaxy() {
    const T = THREE;
    const canvas = $('#galaxy'), hero = $('.hero');
    const renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x04070d, 1);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(55, 1, 0.1, 500);

    const mat = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 42 * renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uTime; uniform float uSize;
        attribute float aScale; attribute vec3 aColor; varying vec3 vColor;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * aScale * (0.8 + 0.2 * sin(uTime * 1.5 + position.x * 2.0)) / -mv.z;
          vColor = aColor;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = pow(smoothstep(0.5, 0.0, d), 1.6); gl_FragColor = vec4(vColor * a, a); }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });

    const N = 14000, R = 40;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sc = new Float32Array(N);
    const inner = new T.Color('#ffd9a8'), outer = new T.Color('#6fe7ff'), c = new T.Color();
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 1.5) * R;
      const arm = ((i % 3) / 3) * Math.PI * 2 + r * 0.09;
      const j = () => Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * (0.6 + r * 0.2);
      pos[i * 3] = Math.cos(arm) * r + j();
      pos[i * 3 + 1] = j() * 0.25;
      pos[i * 3 + 2] = Math.sin(arm) * r + j();
      c.copy(inner).lerp(outer, Math.min(1, r / (R * 0.6)));
      const b = 0.5 + Math.random() * 0.5;
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
      sc[i] = 0.3 + Math.pow(Math.random(), 4) * 2;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new T.BufferAttribute(col, 3));
    g.setAttribute('aScale', new T.BufferAttribute(sc, 1));
    const galaxy = new T.Points(g, mat);
    galaxy.rotation.x = 0.5; galaxy.rotation.z = -0.25;
    scene.add(galaxy);

    // faint background stars
    {
      const n = 1500, p = new Float32Array(n * 3), cc = new Float32Array(n * 3), s = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        p[i * 3] = (Math.random() - 0.5) * 300; p[i * 3 + 1] = (Math.random() - 0.5) * 200; p[i * 3 + 2] = -60 - Math.random() * 120;
        const b = 0.3 + Math.random() * 0.5; cc[i * 3] = 0.8 * b; cc[i * 3 + 1] = 0.9 * b; cc[i * 3 + 2] = b;
        s[i] = 2 + Math.random() * 4;
      }
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.BufferAttribute(p, 3)); bg.setAttribute('aColor', new T.BufferAttribute(cc, 3)); bg.setAttribute('aScale', new T.BufferAttribute(s, 1));
      scene.add(new T.Points(bg, mat));
    }

    let W = 1, H = 1, visible = true;
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    function resize() {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(hero); resize();
    addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

    const clock = new T.Clock();
    let time = 0;
    function tick() {
      const dt = Math.min(0.05, clock.getDelta());
      if (visible) {
        time += dt;
        mat.uniforms.uTime.value = time;
        if (!reduced) galaxy.rotation.y += dt * 0.03;
        mouse.sx += (mouse.x - mouse.sx) * 0.04; mouse.sy += (mouse.y - mouse.sy) * 0.04;
        const mobile = W < 760;
        camera.position.set(mouse.sx * 6, 10 - mouse.sy * 4, mobile ? 68 : 42);
        camera.lookAt(0, 0, 0);
        camera.setViewOffset(W, H, mobile ? 0 : -W * 0.14, mobile ? H * 0.12 : 0, W, H);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
