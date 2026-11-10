/* EASY FLY — publicité motion design 45 s (1080×1920, 30 i/s)
   Toute l'animation vit dans une timeline GSAP unique, pilotable image par image
   via window.seek(t) (utilisé par scripts/render.mjs). */
(() => {
const W = 1080, H = 1920, DUR = 45;
const RENDER = new URLSearchParams(location.search).has('render');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

/* ───────── Données ───────── */
const HOME = { code: 'FBM', city: 'Lubumbashi', lat: -11.66, lon: 27.48 };
const DESTS = [
  { name: 'Afrique du Sud', city: 'Johannesburg',        code: 'JNB', lat: -26.20, lon: 28.05, lab: [14, 30, 'start'] },
  { name: 'Kenya',          city: 'Nairobi',             code: 'NBO', lat: -1.29,  lon: 36.82, lab: [-14, -12, 'end'] },
  { name: 'Tanzanie',       city: 'Zanzibar',            code: 'ZNZ', lat: -6.16,  lon: 39.20, lab: [16, 8, 'start'] },
  { name: 'Maldives',       city: 'Malé',                code: 'MLE', lat: 4.17,   lon: 73.51, lab: [0, -20, 'middle'] },
  { name: 'Seychelles',     city: 'Mahé',                code: 'SEZ', lat: -4.67,  lon: 55.52, lab: [0, 36, 'middle'] },
  { name: 'Zambie',         city: 'Chutes Victoria',     code: 'LVI', lat: -17.85, lon: 25.85, lab: [-14, 8, 'end'] },
  { name: 'Namibie',        city: 'Windhoek',            code: 'WDH', lat: -22.56, lon: 17.08, lab: [-14, 8, 'end'] },
  { name: 'Qatar',          city: 'Doha',                code: 'DOH', lat: 25.29,  lon: 51.53, lab: [0, -20, 'middle'] },
  { name: 'Singapour',      city: 'Singapour',           code: 'SIN', lat: 1.35,   lon: 103.82, lab: [0, -20, 'middle'] },
];
const SERVICES = [
  { t: 'Billets d’avion',        d: 'Vols régionaux & internationaux', ico: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.500z"/>' },
  { t: 'Assistance visas',       d: 'Dossiers & démarches simplifiés', ico: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/>' },
  { t: 'Réservations d’hôtels',  d: 'Du boutique-hôtel au palace',     ico: '<path d="M3 20V6M3 14h18v6M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="10.500" r="1.800"/>' },
  { t: 'Jets privés',            d: 'Charter sur mesure',              ico: '<path d="M2 16.500 22 12 2 7.500l3 4.500z"/><path d="M9 9.100 12 4h2l-.800 6.200M9 14.900 12 20h2l-.800-6.200"/>' },
  { t: 'Accueil VIP',            d: 'Prise en charge à l’aéroport',    ico: '<path d="m12 3 2.700 5.600 6.100.900-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.900z"/>' },
  { t: 'Orientation études',     d: 'Étudier à l’étranger, sereinement', ico: '<path d="M2 9.500 12 5l10 4.500L12 14z"/><path d="M6 11.500V16c1.700 1.500 3.700 2.200 6 2.200s4.300-.700 6-2.200v-4.500M22 9.500V15"/>' },
];

/* ───────── Découpe typographique (masques) ───────── */
const wrap = (text) => {
  const m = document.createElement('span'); m.className = 'm';
  const i = document.createElement('span'); i.className = 'i';
  if (typeof text === 'string') i.textContent = text;
  m.appendChild(i); return [m, i];
};
$$('.rv').forEach(el => { const [m, i] = wrap(); while (el.firstChild) i.appendChild(el.firstChild); el.appendChild(m); });
$$('.rvw').forEach(el => { const words = el.textContent.split(' '); el.textContent = '';
  words.forEach((w, k) => { el.appendChild(wrap(w)[0]); if (k < words.length - 1) el.appendChild(document.createTextNode(' ')); }); });
$$('.rvc').forEach(el => { const chars = [...el.textContent]; el.textContent = ''; chars.forEach(c => el.appendChild(wrap(c)[0])); });
const inn = (sel) => $$(`${sel} .i`);

/* ───────── Carte ───────── */
const { LON0, LAT0, K, dots } = window.MAP;
const proj = (lon, lat) => [(lon - LON0) * K, (LAT0 - lat) * K];
const R = 1.7;
$('#dots').setAttribute('d', dots.map(([x, y]) => `M${x - R},${y}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0`).join(''));

const MAPC = { x: 540, y: 700 };                 // centre écran de la carte
const cam = { x: 0, y: 0, s: 1 };
const [hx, hy] = proj(HOME.lon, HOME.lat);
const invEls = [];                                // éléments à taille écran constante
const routes = [];                                // tracés animés
const mkPin = (x, y, label, lab, home) => {
  const g = svg('g', { transform: `translate(${x},${y})` }, $('#pins'));
  const inv = svg('g', {}, g); invEls.push(inv);
  const pop = svg('g', { class: 'pop' }, inv);
  const ring = svg('circle', { r: home ? 14 : 10, fill: 'none', stroke: '#F0D592', 'stroke-width': 2, class: 'ring' }, pop);
  svg('circle', { r: home ? 9 : 6.5, fill: home ? '#F0D592' : '#F3E9D2' }, pop);
  if (home) svg('circle', { r: 3.5, fill: '#0A1B2B' }, pop);
  const tx = svg('text', { x: lab[0], y: lab[1], 'text-anchor': lab[2], class: 'pin-label' + (home ? ' home' : '') }, pop);
  tx.textContent = label;
  return { g, pop, ring, tx };
};
const homePin = mkPin(hx, hy, 'LUBUMBASHI', [20, 9, 'start'], true);

DESTS.forEach((d, i) => {
  const [x, y] = proj(d.lon, d.lat);
  const dx = x - hx, dy = y - hy, dist = Math.hypot(dx, dy);
  // arc : point de contrôle décalé perpendiculairement (toujours « vers le haut »)
  let nx = -dy / dist, ny = dx / dist; if (ny > 0) { nx = -nx; ny = -ny; }
  const cx = hx + dx / 2 + nx * dist * 0.24, cy = hy + dy / 2 + ny * dist * 0.24;
  const path = svg('path', { d: `M${hx},${hy} Q${cx},${cy} ${x},${y}`, class: 'route-solid' }, $('#routes'));
  const plane = svg('g', {}, $('#routes'));
  const pinv = svg('use', { href: '#plane', width: 34, height: 34, x: -17, y: -17, fill: '#F3E9D2' }, plane);
  const L = path.getTotalLength();
  path.style.strokeDasharray = L;
  const st = { p: 0, o: 1 };
  routes.push({ path, plane, pinv, L, st });
  d.x = x; d.y = y; d.dist = dist;
  d.pin = mkPin(x, y, d.code, d.lab, false);
  // cadrage caméra : origine + destination dans le champ
  d.cam = { x: hx + dx * 0.5, y: hy + dy * 0.5 - 4, s: gsap.utils.clamp(1.3, 2.9, 560 / dist) };

  // bloc texte
  const el = document.createElement('div'); el.className = 'dest';
  el.innerHTML = `<div class="num"><span class="m"><span class="i"><b>${String(i + 1).padStart(2, '0')}</b> / ${String(DESTS.length).padStart(2, '0')}</span></span><span class="code">${d.code}</span></div>
    <div class="name"><span class="m"><span class="i">${d.name}</span></span></div>
    <div class="sub"><span class="m"><span class="i">${d.city}</span></span></div>`;
  $('#dests').appendChild(el); d.el = el;
  const tick = document.createElement('i'); tick.innerHTML = '<b></b>'; $('#ticks').appendChild(tick); d.tick = tick.firstChild;
});

/* ───────── Cartes de services ───────── */
SERVICES.forEach((s, i) => {
  const c = document.createElement('div'); c.className = 'card';
  c.innerHTML = `<div class="fill"></div><div class="ico"><svg viewBox="0 0 24 24">${s.ico.replace(/(\d)00\b/g, '$1')}</svg></div>
    <div><div class="t">${s.t}</div><div class="d">${s.d}</div></div><div class="n">${String(i + 1).padStart(2, '0')}</div>`;
  $('#cards').appendChild(c);
});

/* ───────── Avions sur trajectoire (scènes 2 et 5) ───────── */
const flyers = [];
const mkFlyer = (pathSel, planeSel) => {
  const path = $(pathSel), plane = $(planeSel), L = path.getTotalLength();
  path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
  const st = { p: 0 }; flyers.push({ path, plane, L, st }); return st;
};
const f2 = mkFlyer('#s2-arc', '#s2-plane');
const f5a = mkFlyer('#s5-arc1', '#s5-plane1');
const f5b = mkFlyer('#s5-arc2', '#s5-plane2');

const along = (path, L, p) => {
  const a = path.getPointAtLength(Math.max(0, p * L - 2)), b = path.getPointAtLength(Math.min(L, p * L + 2));
  return { x: b.x, y: b.y, r: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
};

/* Appliqué à chaque image : caméra, tailles constantes, tracés, avions */
function apply() {
  const s = cam.s;
  $('#cam').setAttribute('transform', `translate(${MAPC.x},${MAPC.y}) scale(${s}) translate(${-cam.x},${-cam.y})`);
  invEls.forEach(e => e.setAttribute('transform', `scale(${1 / s})`));
  routes.forEach(({ path, plane, pinv, L, st }) => {
    path.style.strokeDashoffset = L * (1 - st.p);
    path.style.strokeWidth = 2.6 / s;
    path.style.opacity = st.p > 0 ? st.o : 0;
    const on = st.p > 0.001 && st.p < 0.999;
    plane.style.opacity = on ? 1 : 0;
    if (on) { const q = along(path, L, st.p); plane.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${q.r}) scale(${1 / s})`); }
  });
  flyers.forEach(({ path, plane, L, st }) => {
    path.style.strokeDashoffset = L * (1 - st.p);
    const on = st.p > 0.001 && st.p < 0.999;
    plane.style.opacity = on ? 1 : 0;
    if (on) { const q = along(path, L, st.p); plane.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${q.r})`); }
  });
}

/* ═════════════════════ TIMELINE ═════════════════════ */
function build() {
  // ajustement des noms de destination à la largeur utile
  DESTS.forEach(d => { const n = $('.name', d.el), w = $('.i', n).getBoundingClientRect().width / stageScale;
    if (w > 880) n.style.fontSize = Math.floor(176 * 880 / w) + 'px'; });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onUpdate: apply });
  const E_IN = 'expo.out', E_OUT = 'power3.in';
  const show = (sel, a, b) => { tl.set(sel, { autoAlpha: 1 }, a); if (b != null) tl.set(sel, { autoAlpha: 0 }, b); };
  const up = (t, at, o = {}) => tl.from(t, { yPercent: 118, duration: 1, ease: E_IN, stagger: 0.09, ...o }, at);
  const out = (t, at, o = {}) => tl.to(t, { yPercent: -118, duration: 0.5, ease: E_OUT, stagger: 0.045, ...o }, at);

  /* Fond : la lueur ambrée respire et se déplace selon les scènes */
  gsap.set('#glow', { opacity: 0.25, y: 260 });
  gsap.set('#glow2', { opacity: 0.5 });
  tl.to('#glow', { opacity: 0.8, y: 0, duration: 4.5, ease: 'sine.out' }, 0)
    .to('#glow', { x: 260, y: 120, opacity: 0.6, duration: 5, ease: 'sine.inOut' }, 4.8)
    .to('#glow', { x: -80, y: 320, opacity: 0.32, duration: 2, ease: 'sine.inOut' }, 9.8)
    .to('#glow', { x: 320, y: 60, opacity: 0.62, duration: 3, ease: 'sine.inOut' }, 26)
    .to('#glow', { x: 0, y: -160, opacity: 0.95, duration: 3, ease: 'sine.inOut' }, 34.2)
    .to('#glow', { x: 0, y: 80, opacity: 0.7, duration: 4, ease: 'sine.inOut' }, 39)
    .to('#glow2', { x: -420, duration: DUR, ease: 'none' }, 0);

  /* Cadre doré */
  const fr = $('#frame rect'), FL = fr.getTotalLength();
  gsap.set(fr, { strokeDasharray: FL, strokeDashoffset: FL, opacity: 0.75 });
  tl.to(fr, { strokeDashoffset: 0, duration: 2.6, ease: 'power3.inOut' }, 0.1);

  /* ── SCÈNE 1 · 0 → 4.9 s · Révélation du logo ── */
  tl.from('#logo-wing .stripe', { x: -150, opacity: 0, duration: 1.3, stagger: 0.13 }, 0.35)
    .from('#logo-wing', { rotation: -7, transformOrigin: '70% 60%', duration: 1.7 }, 0.35);
  up(inn('.wm-easy'), 0.95, { stagger: 0.07, duration: 1.1 });
  up(inn('.wm-fly'), 1.25, { stagger: 0.08, duration: 1.1 });
  tl.from('#s1-rule', { scaleX: 0, duration: 1.1, ease: 'power3.inOut' }, 1.9);
  up(inn('#s1-tag'), 2.15, { stagger: 0.07, duration: 0.95 });
  tl.fromTo('#logo', { scale: 0.965 }, { scale: 1.03, duration: 4.9, ease: 'none', transformOrigin: '50% 45%' }, 0);
  out(inn('#s1-tag'), 4.05, { stagger: 0.02 });
  tl.to('#s1-rule', { scaleX: 0, duration: 0.4, ease: E_OUT }, 4.1);
  out([...inn('.wm-easy'), ...inn('.wm-fly')], 4.15, { stagger: 0.03 });
  tl.to('#logo-wing .stripe', { x: 190, opacity: 0, duration: 0.5, ease: E_OUT, stagger: 0.05 }, 4.2);
  tl.set('#s1', { autoAlpha: 0 }, 4.95);

  /* Signature permanente */
  show('#bug', 4.9, 39.1);
  tl.from('#bug', { y: -40, opacity: 0, duration: 0.9 }, 4.9)
    .to('#bug', { y: -40, opacity: 0, duration: 0.45, ease: E_OUT }, 38.6);

  /* ── SCÈNE 2 · 4.9 → 9.9 s · Typographie cinétique ── */
  show('#s2', 4.9, 9.95);
  gsap.set('#globe', { x: 900, y: 1560, rotation: -18 });
  tl.to('#globe', { opacity: 0.2, duration: 1.2, ease: 'sine.out' }, 5)
    .fromTo('#globe', { scale: 0.86 }, { scale: 1.06, rotation: 10, duration: 5, ease: 'none', transformOrigin: '50% 50%' }, 4.9)
    .to('#globe', { opacity: 0, duration: 0.5, ease: 'sine.in' }, 9.35);
  tl.to(f2, { p: 1, duration: 2.4, ease: 'power2.inOut' }, 5.0)
    .to('#s2-arc', { opacity: 0, duration: 0.6, ease: 'sine.in' }, 7.2);
  show('#s2a', 4.95, 7.95);
  up(inn('#s2a'), 5.0, { stagger: 0.2, duration: 1.05 });
  tl.fromTo('#s2a', { x: 0 }, { x: -22, duration: 2.9, ease: 'none' }, 5.0);
  out(inn('#s2a'), 7.35, { stagger: 0.06 });
  show('#s2b', 7.85, 9.95);
  up(inn('#s2b'), 7.9, { stagger: 0.12, duration: 0.95 });
  tl.fromTo('#s2b', { x: 0 }, { x: -18, duration: 2, ease: 'none' }, 7.9);
  out(inn('#s2b'), 9.35, { stagger: 0.04 });

  /* ── SCÈNE 3 · 9.8 → 26.4 s · Destinations sur la carte ── */
  const T3 = 9.8, STEP = 1.32, TD = 12.3;      // TD : première destination
  show('#s3', T3, 26.45);
  Object.assign(cam, { x: hx + 20, y: hy - 60, s: 1.25 });
  tl.fromTo('#map', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'sine.out' }, T3)
    .to(cam, { x: hx, y: hy - 10, s: 2.5, duration: 2.5, ease: 'power3.inOut' }, T3);
  // point de départ
  tl.from(homePin.pop, { scale: 0, duration: 0.8, ease: 'back.out(2.2)' }, T3 + 1.3);
  [T3 + 1.5, T3 + 2.9, T3 + 5.5, T3 + 8.1, T3 + 10.7, T3 + 13.3, 24.4].forEach(t =>
    tl.fromTo(homePin.ring, { scale: 1, opacity: 0.9 }, { scale: 4.2, opacity: 0, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 50%' }, t));
  show('#chip', T3 + 1.2, 24.2);
  tl.from('#chip', { y: -30, opacity: 0, duration: 0.8 }, T3 + 1.2)
    .to('#chip', { y: -30, opacity: 0, duration: 0.4, ease: E_OUT }, 23.8);
  show('#ticks', TD - 0.1, 24.4);
  tl.from('#ticks i', { scaleX: 0, opacity: 0, transformOrigin: '0 50%', duration: 0.6, stagger: 0.04 }, TD - 0.1)
    .to('#ticks', { opacity: 0, duration: 0.3 }, 24.1);

  DESTS.forEach((d, i) => {
    const t = TD + i * STEP, r = routes[i];
    tl.to(cam, { ...d.cam, duration: 1.05, ease: 'power3.inOut' }, t - 0.25);
    tl.to(r.st, { p: 1, duration: 0.85, ease: 'power2.inOut' }, t + 0.05);
    tl.to(r.st, { o: 0.45, duration: 0.6, ease: 'sine.out' }, t + STEP);
    tl.from(d.pin.pop, { scale: 0, duration: 0.6, ease: 'back.out(2.6)' }, t + 0.72);
    tl.fromTo(d.pin.ring, { scale: 1, opacity: 0.9 }, { scale: 3.6, opacity: 0, duration: 1.0, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.78);
    tl.to(d.tick, { scaleX: 1, duration: STEP, ease: 'none' }, t);
    // texte
    const I = $$('.i', d.el), code = $('.code', d.el);
    show(d.el, t, t + STEP + 0.4);
    tl.from(I[0], { yPercent: 118, duration: 0.6 }, t + 0.02)
      .from(code, { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, t + 0.12)
      .from(I[1], { yPercent: 112, duration: 0.75 }, t + 0.06)
      .from(I[2], { yPercent: 118, duration: 0.7 }, t + 0.2);
    const o = t + STEP - 0.22;
    tl.to(I, { yPercent: -118, duration: 0.3, ease: 'power2.in', stagger: 0.025 }, o)
      .to(code, { opacity: 0, duration: 0.2 }, o);
  });

  // plan large : tout le réseau
  const TM = TD + DESTS.length * STEP;          // ≈ 24.2
  tl.to(cam, { x: proj(54, 0)[0], y: proj(0, -4)[1], s: 1.08, duration: 1.7, ease: 'power3.inOut' }, TM - 0.2);
  routes.forEach((r, i) => tl.to(r.st, { o: 1, duration: 0.5, ease: 'sine.out' }, TM + 0.5 + i * 0.05));
  show('#more', TM, 26.45);
  up(inn('#more'), TM + 0.1, { stagger: 0.1, duration: 0.9 });
  out(inn('#more'), 25.85, { stagger: 0.04 });
  tl.to('#map', { opacity: 0, scale: 1.08, transformOrigin: '50% 36%', duration: 0.6, ease: 'power2.in' }, 25.85);

  /* ── SCÈNE 4 · 26.3 → 34.6 s · Services (cartes en perspective) ── */
  show('#s4', 26.3, 34.65);
  show('#s4-head', 26.3);
  up(inn('#s4-head'), 26.4, { stagger: 0.1, duration: 0.95 });
  const cards = $$('.card');
  tl.fromTo('#cards', { rotationY: -34, rotationX: 10, z: -160 }, { rotationY: -13, rotationX: 4, z: 0, duration: 2.2, ease: 'power3.out', transformOrigin: '50% 50%' }, 26.7)
    .to('#cards', { rotationY: 9, rotationX: 2, duration: 5.4, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 28.9)
    .from(cards, { x: 900, opacity: 0, rotationY: -40, duration: 1.15, stagger: 0.11, ease: 'expo.out' }, 26.75);
  cards.forEach((c, i) => {
    const t = 28.45 + i * 0.78, parts = [$('.t', c), $('.d', c), $('.n', c), $('.ico', c)];
    tl.to($('.fill', c), { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, t)
      .to(parts, { color: '#0A1B2B', borderColor: '#0A1B2B', duration: 0.3, ease: 'none' }, t + 0.1)
      .to(c, { x: 34, scale: 1.035, duration: 0.5, ease: 'power3.out' }, t)
      .to($('.fill', c), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.5, ease: 'power3.inOut' }, t + 0.86)
      .to([parts[0]], { color: '#F3E9D2', duration: 0.3, ease: 'none' }, t + 0.9)
      .to([parts[1]], { color: 'rgba(243,233,210,0.7)', duration: 0.3, ease: 'none' }, t + 0.9)
      .to([parts[2]], { color: '#D4A853', duration: 0.3, ease: 'none' }, t + 0.9)
      .to([parts[3]], { color: '#F0D592', borderColor: 'rgba(212,168,83,0.7)', duration: 0.3, ease: 'none' }, t + 0.9)
      .to(c, { x: 0, scale: 1, duration: 0.6, ease: 'power2.inOut' }, t + 0.86);
  });
  out(inn('#s4-head'), 33.95, { stagger: 0.04 });
  tl.to(cards, { x: -1000, opacity: 0, rotationY: 30, duration: 0.6, stagger: 0.045, ease: 'power3.in' }, 33.9);

  /* ── SCÈNE 5 · 34.5 → 39.1 s · Signature ── */
  show('#s5', 34.5, 39.15);
  show('#s5-txt', 34.5);
  tl.to(f5a, { p: 1, duration: 2.3, ease: 'power2.inOut' }, 34.5)
    .to(f5b, { p: 1, duration: 2.5, ease: 'power2.inOut' }, 34.85)
    .to(['#s5-arc1', '#s5-arc2'], { opacity: 0, duration: 0.5, ease: 'sine.in' }, 38.5);
  up($$('#s5-txt .xl2 .i'), 34.95, { stagger: 0.18, duration: 1.05 });
  tl.from('#s5-rule', { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, 35.7);
  up($$('#s5-txt .label .i'), 35.9, { duration: 0.8 });
  tl.fromTo('#s5-txt', { scale: 0.97 }, { scale: 1.03, duration: 4.4, ease: 'none' }, 34.6);
  out(inn('#s5-txt'), 38.45, { stagger: 0.05 });
  tl.to('#s5-rule', { scaleX: 0, duration: 0.35, ease: E_OUT }, 38.45);

  /* ── SCÈNE 6 · 39 → 45 s · Appel à l'action ── */
  show('#s6', 39.0);
  tl.from('#end-logo svg', { x: -120, opacity: 0, duration: 1.2 }, 39.1)
    .from('#end-logo .wm', { y: 40, opacity: 0, duration: 1, stagger: 0.12 }, 39.3);
  up(inn('.cta'), 39.7, { duration: 1 });
  tl.from('#s6-rule', { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, 40.0);
  up(inn('.phone'), 40.15, { duration: 1 });
  up(inn('.mail'), 40.35, { duration: 1 });
  up(inn('.svc'), 40.6, { duration: 0.9 });
  show('#s6-pill', 40.8);
  tl.from('#s6-pill', { y: 30, opacity: 0, duration: 0.8 }, 40.8);
  up(inn('.filiale'), 41.0, { duration: 0.9 });
  tl.fromTo('.phone', { scale: 1 }, { scale: 1.045, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 42.2)
    .fromTo(['#end-logo', '.end-body', '.end-foot'], { scale: 1 }, { scale: 1.015, duration: 5.9, ease: 'none', transformOrigin: '50% 50%' }, 39.1);

  tl.set({}, {}, DUR);                           // durée exacte : 45 s
  return tl;
}

/* ───────── Démarrage ───────── */
let stageScale = 1;
const fit = () => {
  if (RENDER) return;
  stageScale = Math.min(innerWidth / W, innerHeight / H);
  const st = $('#stage').style;
  st.transform = `scale(${stageScale})`;
  st.left = (innerWidth - W * stageScale) / 2 + 'px';
  st.top = (innerHeight - H * stageScale) / 2 + 'px';
};
fit(); addEventListener('resize', fit);

const fontSpecs = ['500 100px Cormorant', 'italic 500 100px Cormorant', '600 100px Cormorant', 'italic 600 100px Cormorant',
  '300 30px Josefin', '400 30px Josefin', '600 30px Josefin'];
Promise.all(fontSpecs.map(f => document.fonts.load(f, 'Éàé0'))).then(() => document.fonts.ready).then(() => {
  const tl = build();
  // passage complet à blanc : initialise chaque tween dans l'ordre → rendu déterministe
  for (let t = 0; t <= DUR; t += 1 / 30) tl.seek(t, false);
  tl.seek(0, false); apply();
  window.tl = tl;
  window.seek = (t) => { tl.seek(Math.min(t, DUR), false); apply(); };
  window.DURATION = DUR;
  window.READY = true;
  if (!RENDER) {
    tl.eventCallback('onComplete', () => gsap.delayedCall(1.2, () => tl.restart()));
    tl.play();
    addEventListener('keydown', e => { if (e.code === 'Space') tl.paused(!tl.paused()); });
  }
});
})();
