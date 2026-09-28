/* =========================================================
   TEXT ME — portfolio v6
   A portfolio you chat with. Everything below the CONTENT
   block is the chat engine; edit the content first.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  };

  /* ---------------------------------------------------------
     CONTENT — placeholders (edit these)
     --------------------------------------------------------- */
  const EMAIL = 'hello@yourname.com';
  const PROJECTS = [
    { title: 'Project One', type: 'Product', year: '2026', role: 'Lead Designer', stack: 'Figma, React', a: '#2b2170', b: '#7c6fff', c: '#ff8fb1', desc: 'Short summary of the project: the problem, your role, and the outcome.' },
    { title: 'Project Two', type: 'Website', year: '2025', role: 'Design & Dev', stack: 'Next.js, GSAP', a: '#0f3d3a', b: '#3fd0a6', c: '#d8ff8a', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Three', type: 'Mobile app', year: '2025', role: 'UI Designer', stack: 'SwiftUI, Figma', a: '#4a1d0f', b: '#ff7a45', c: '#ffd166', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Four', type: 'Brand', year: '2024', role: 'Art Direction', stack: 'Illustrator', a: '#101828', b: '#3a86ff', c: '#9bf6ff', desc: 'One or two sentences about what this was and why it mattered.' },
    { title: 'Project Five', type: 'Dashboard', year: '2023', role: 'Product Designer', stack: 'Figma, D3', a: '#2d0f3a', b: '#c77dff', c: '#ffafcc', desc: 'One or two sentences about what this was and why it mattered.' },
  ];
  const JOBS = [
    { role: 'Job Title', co: 'Company Name', when: '2024 – Now' },
    { role: 'Job Title', co: 'Company Name', when: '2021 – 2024' },
    { role: 'Job Title', co: 'Company Name', when: '2019 – 2021' },
    { role: 'Degree or first role', co: 'School or Company', when: '2015 – 2019' },
  ];
  const SKILLS = [['Product & UI design', 92], ['Frontend development', 85], ['Motion & prototyping', 78], ['Design systems', 74]];
  const TOOLS = ['Figma', 'React', 'TypeScript', 'Framer', 'After Effects', 'Notion'];
  const FUN_FACTS = [
    'Fun fact placeholder: something surprising about you, like a hobby or a side project.',
    'Another fun fact: the best coffee you ever had, or a skill nobody expects.',
    'One more: a place you want to visit, or a record you hold.',
  ];

  const TOPICS = [
    { id: 'about', label: 'Who are you?' },
    { id: 'work', label: 'Show me your work' },
    { id: 'exp', label: 'Where have you worked?' },
    { id: 'skills', label: 'What are you good at?' },
    { id: 'contact', label: 'Let’s work together' },
    { id: 'fun', label: 'Tell me something fun' },
  ];
  const KEYWORDS = [
    ['work', /work|project|portfolio|case|made|built|design(s)?\b/],
    ['exp', /experience|job|career|cv|resume|résumé|worked|company|history/],
    ['skills', /skill|good at|tool|stack|tech|know|strength/],
    ['contact', /contact|hire|email|reach|talk|work together|available|freelance|call/],
    ['fun', /fun|game|joke|fact|play|hobby/],
    ['about', /who|about|you|hello|hi\b|hey|yourself|intro/],
  ];

  /* ---------------------------------------------------------
     ANSWERS
     --------------------------------------------------------- */
  const ANSWERS = {
    about: [
      'Hey! I’m <b>Your Name</b>, a Role title based in City, Country.',
      'A short intro goes here: what you do, who you do it for, and what you care about most.',
      'Right now I’m Job Title at Company Name, and I’m open to new projects from Month 2026.',
    ],
    work: [
      'Here are a few things I’ve made. Tap one for the details:',
      { type: 'projects' },
    ],
    exp: [
      'Here’s the short version:',
      { type: 'timeline' },
      'The full résumé is linked in my profile if you want every detail.',
    ],
    skills: [
      'What I’m best at:',
      { type: 'skills' },
      'And the tools I use every day:',
      { type: 'tags' },
    ],
    contact: [
      'I’d love to hear about your project.',
      { type: 'contact' },
    ],
    fun: () => [
      FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)],
      'Want a quick game of rock, paper, scissors while you’re here?',
      { type: 'game' },
    ],
  };

  /* ---------------------------------------------------------
     CHAT ENGINE
     --------------------------------------------------------- */
  const msgs = $('#messages'), chipsEl = $('#chips'), input = $('#input'), form = $('#input-form'), sub = $('#chat-sub');
  const done = new Set();
  let busy = false;
  let flow = null; // conversational contact form state
  let lastSender = null;

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scrollDown = () => requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });

  function addRow(who, html, { wide = false } = {}) {
    // only the last bubble in a run shows the avatar
    const prev = msgs.lastElementChild;
    if (prev && prev.classList.contains('row') && prev.classList.contains(who)) prev.classList.remove('last');
    const row = document.createElement('div');
    row.className = `row ${who} last`;
    row.innerHTML = `${who === 'bot' ? '<div class="avatar" aria-hidden="true"><span>YN</span><i class="online"></i></div>' : ''}<div class="bubble${wide ? ' wide' : ''}">${html}</div>`;
    msgs.appendChild(row);
    if (who === 'bot' && !wide) addReactions(row.querySelector('.bubble'));
    lastSender = who;
    scrollDown();
    return row;
  }
  function addTime(who) {
    const t = document.createElement('p');
    t.className = `time${who === 'me' ? ' me' : ''}`;
    t.textContent = who === 'me' ? `${now()} · Read` : now();
    msgs.appendChild(t);
    scrollDown();
  }
  function addReactions(bubble) {
    const bar = document.createElement('div');
    bar.className = 'react-bar';
    bar.innerHTML = ['❤️', '👍', '😂', '🔥'].map((e) => `<button aria-label="React ${e}">${e}</button>`).join('');
    bubble.appendChild(bar);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      let r = bubble.querySelector('.react');
      if (!r) { r = document.createElement('span'); r.className = 'react'; bubble.appendChild(r); }
      r.textContent = b.textContent;
    });
  }
  function typing(on) {
    const t = $('.row.typing', msgs);
    sub.textContent = on ? 'Typing…' : 'Online · replies instantly';
    sub.classList.toggle('is-typing', on);
    if (!on) { t?.remove(); return; }
    if (t) return;
    const prev = msgs.lastElementChild;
    if (prev && prev.classList.contains('row') && prev.classList.contains('bot')) prev.classList.remove('last');
    const row = document.createElement('div');
    row.className = 'row bot typing last';
    row.innerHTML = '<div class="avatar" aria-hidden="true"><span>YN</span></div><div class="bubble" aria-label="Typing"><i></i><i></i><i></i></div>';
    msgs.appendChild(row);
    scrollDown();
  }

  async function say(parts, { instant = false } = {}) {
    busy = true; renderChips();
    for (const p of parts) {
      if (!instant) {
        typing(true);
        const len = typeof p === 'string' ? p.replace(/<[^>]+>/g, '').length : 60;
        await wait(Math.min(1400, 450 + len * 12));
        typing(false);
      }
      if (typeof p === 'string') addRow('bot', `<p>${p}</p>`);
      else renderRich(p);
      if (!instant) await wait(180);
    }
    addTime('bot');
    busy = false; renderChips();
  }
  function userSays(text) {
    addRow('me', `<p>${esc(text)}</p>`);
    addTime('me');
  }

  async function ask(id, label) {
    if (busy) return;
    const t = TOPICS.find((x) => x.id === id);
    userSays(label || t.label);
    done.add(id);
    syncTopics();
    await wait(350);
    const a = ANSWERS[id];
    await say(typeof a === 'function' ? a() : a);
  }

  /* ---------- rich messages ---------- */
  function renderRich(p) {
    if (p.type === 'projects') {
      const row = addRow('bot', `<div class="carousel">${PROJECTS.map((x, i) => `
        <button class="pcard" data-i="${i}">
          <div class="art" style="--a:${x.a};--b:${x.b};--c:${x.c}"><span>${x.type}</span></div>
          <div class="pcard-body"><span class="pcard-title">${x.title}</span><span class="pcard-meta">${x.role} · ${x.year}</span></div>
        </button>`).join('')}</div>`, { wide: true });
      $$('.pcard', row).forEach((c) => c.addEventListener('click', () => openSheet(+c.dataset.i)));
    } else if (p.type === 'timeline') {
      addRow('bot', `<ul class="tl">${JOBS.map((j) => `<li><div><small>${j.when}</small><b>${j.role}</b><span>${j.co}</span></div></li>`).join('')}</ul>`, { wide: true });
    } else if (p.type === 'skills') {
      addRow('bot', `<div class="skills">${SKILLS.map(([s, v]) => `<div class="skill">${s}<i style="--v:${v}%"></i></div>`).join('')}</div>`, { wide: true });
    } else if (p.type === 'tags') {
      addRow('bot', `<div class="tags">${TOOLS.map((t) => `<span>${t}</span>`).join('')}</div>`, { wide: true });
    } else if (p.type === 'contact') {
      const row = addRow('bot', `
        <div class="contact-card">
          <div class="email-line"><span>${EMAIL}</span><button class="btn btn--small" data-copy>Copy</button></div>
          <div class="inline-actions">
            <button class="btn" data-start-form>Send me a message here</button>
            <a class="btn btn--ghost" href="#" data-placeholder>LinkedIn</a>
          </div>
        </div>`, { wide: true });
      $('[data-copy]', row).addEventListener('click', (e) => copyEmail(e.currentTarget));
      $('[data-start-form]', row).addEventListener('click', startFlow);
      bindPlaceholders(row);
    } else if (p.type === 'game') {
      const row = addRow('bot', `<div class="game"><div class="game-row"><button data-m="rock">Rock</button><button data-m="paper">Paper</button><button data-m="scissors">Scissors</button></div></div>`, { wide: true });
      $$('button', row).forEach((b) => b.addEventListener('click', () => playRps(b.dataset.m, row)));
    }
  }

  async function playRps(mine, row) {
    if (busy) return;
    $$('button', row).forEach((b) => { b.disabled = true; });
    const moves = ['rock', 'paper', 'scissors'];
    const theirs = moves[Math.floor(Math.random() * 3)];
    userSays(mine[0].toUpperCase() + mine.slice(1));
    const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const result = mine === theirs ? 'A draw! Great minds.' : beats[mine] === theirs ? 'You win! I’ll allow it.' : 'I win! Better luck next time.';
    await say([`I picked <b>${theirs}</b>.`, result]);
  }

  /* ---------- chips + topics ---------- */
  function renderChips() {
    let list;
    if (flow) list = [{ id: '__cancel', label: 'Cancel message' }];
    else {
      const open = TOPICS.filter((t) => !done.has(t.id));
      list = open.length ? open.concat(TOPICS.filter((t) => done.has(t.id))) : TOPICS;
    }
    chipsEl.scrollLeft = 0;
    chipsEl.innerHTML = list.map((t) => `<button class="chip${done.has(t.id) ? ' is-done' : ''}" data-id="${t.id}"${busy ? ' disabled' : ''}>${t.label}</button>`).join('');
    $$('.chip', chipsEl).forEach((c) => c.addEventListener('click', () => {
      if (c.dataset.id === '__cancel') { cancelFlow(); return; }
      ask(c.dataset.id);
    }));
  }
  const topicList = $('#topic-list');
  function syncTopics() {
    topicList.innerHTML = TOPICS.map((t) => `<button class="topic${done.has(t.id) ? ' is-done' : ''}" data-id="${t.id}">${t.label}</button>`).join('');
    $$('.topic', topicList).forEach((b) => b.addEventListener('click', () => ask(b.dataset.id)));
  }

  /* ---------- free text ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    if (flow) { await flowStep(text); return; }
    const lower = text.toLowerCase();
    const hit = KEYWORDS.find(([, re]) => re.test(lower));
    if (hit) { await ask(hit[0], text); return; }
    userSays(text);
    await wait(300);
    await say(['Good question! I’m a simple chat, so I only know a few topics for now.', 'Try one of the suggestions below.']);
  });

  /* ---------- conversational contact form ---------- */
  async function startFlow() {
    if (busy || flow) return;
    flow = { step: 'name', data: {} };
    userSays('I’d like to send you a message');
    input.placeholder = 'Your name…';
    await say(['Great! First, what’s your name?']);
    input.focus({ preventScroll: true });
  }
  async function flowStep(text) {
    userSays(flow.step === 'email' ? text : text);
    if (flow.step === 'name') {
      flow.data.name = text; flow.step = 'email';
      input.placeholder = 'you@example.com'; input.type = 'email';
      await say([`Nice to meet you, ${esc(text.split(' ')[0])}. What’s the best email to reach you?`]);
    } else if (flow.step === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) { await say(['That doesn’t look like an email address. Could you check it?']); return; }
      flow.data.email = text; flow.step = 'msg';
      input.placeholder = 'Your message…'; input.type = 'text';
      await say(['Got it. And what would you like to tell me?']);
    } else {
      flow.data.msg = text;
      const name = flow.data.name.split(' ')[0];
      flow = null;
      input.placeholder = 'Ask me anything…';
      await say([`Thanks, ${esc(name)}! Your message is ready to go.`, 'Heads up: this chat is a demo for now, so nothing was actually sent. Email me directly and I’ll reply soon.']);
    }
    input.focus({ preventScroll: true });
  }
  async function cancelFlow() {
    if (busy) return;
    flow = null; input.placeholder = 'Ask me anything…'; input.type = 'text';
    userSays('Never mind');
    await say(['No problem. What else would you like to know?']);
  }

  /* ---------- project sheet ---------- */
  const sheet = $('#sheet');
  let sheetIndex = -1;
  function openSheet(i) {
    const p = PROJECTS[i];
    sheetIndex = i;
    const art = $('#s-art');
    art.style.setProperty('--a', p.a); art.style.setProperty('--b', p.b); art.style.setProperty('--c', p.c);
    $('#s-meta').textContent = `${p.type} · ${p.year}`;
    $('#s-title').textContent = p.title;
    $('#s-desc').textContent = `${p.desc} This is where a longer case-study summary goes: context, process, and results.`;
    $('#s-facts').innerHTML = `<div><dt>Role</dt><dd>${p.role}</dd></div><div><dt>Stack</dt><dd>${p.stack}</dd></div><div><dt>Year</dt><dd>${p.year}</dd></div>`;
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
  }
  $('#s-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
  $('#s-ask').addEventListener('click', async () => {
    const p = PROJECTS[sheetIndex];
    sheet.close();
    if (busy) return;
    userSays(`Tell me more about ${p.title}`);
    await wait(300);
    await say([`${p.title} was a ${p.type.toLowerCase()} project from ${p.year}. I worked on it as ${p.role}.`, 'A couple of sentences about the challenge, what you did, and the result would go here.']);
  });

  /* ---------- misc ---------- */
  const toastEl = $('#toast'); let toastT;
  const toast = (m) => { toastEl.textContent = m; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2200); };
  async function copyEmail(btn) {
    try { await navigator.clipboard.writeText(EMAIL); toast(`Copied ${EMAIL}`); if (btn) btn.textContent = 'Copied'; }
    catch { toast(`Email: ${EMAIL}`); }
    if (btn) setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  }
  $('#p-email').addEventListener('click', () => copyEmail());
  function bindPlaceholders(scope = document) { $$('[data-placeholder]', scope).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast('That link is a placeholder for now'); })); }
  bindPlaceholders();

  const themeBtn = $('#theme');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const saved = store.get('tm-theme'); if (saved && !root.dataset.theme) root.dataset.theme = saved;
  const syncTheme = () => themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  syncTheme();
  themeBtn.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; store.set('tm-theme', root.dataset.theme); syncTheme(); });

  const lt = $('#localtime');
  const tickTime = () => { lt.textContent = now(); };
  tickTime(); setInterval(tickTime, 30000);

  /* ---------- start / restart ---------- */
  function greet() {
    msgs.innerHTML = '<p class="day">Today</p>';
    done.clear(); flow = null; busy = false;
    input.placeholder = 'Ask me anything…'; input.type = 'text';
    say([
      'Hey there! I’m <b>Your Name</b>. 👋',
      'This portfolio is a chat. Pick a question below or type your own.',
    ], { instant: true });
    syncTopics();
  }
  $('#restart').addEventListener('click', () => { if (!busy) greet(); });
  greet();
})();
