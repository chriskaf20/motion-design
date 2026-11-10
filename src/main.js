/* EASY FLY — publicité motion design 35 s (1080×1920, 30 i/s)
   Toute l'animation vit dans une timeline GSAP unique, pilotable image par image
   via window.seek(t) (utilisé par scripts/render.mjs). */
(() => {
const W = 1080, H = 1920, DUR = 35;
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

const MAPC = { x: 540, y: 650 };                 // centre écran de la carte
const cam = { x: 0, y: 0, s: 1 };
const [hx, hy] = proj(HOME.lon, HOME.lat);
const invEls = [];                                // éléments à taille écran constante
const routes = [];                                // tracés animés
const mkPin = (x, y, label, lab, home) => {
  const g = svg('g', { transform: `translate(${x},${y})` }, $('#pins'));
  const inv = svg('g', {}, g); invEls.push(inv);
  const pop = svg('g', { class: 'pop' }, inv);
  const ring = svg('circle', { r: home ? 14 : 10, fill: 'none', stroke: '#B07F28', 'stroke-width': 2, class: 'ring' }, pop);
  svg('circle', { r: home ? 11 : 8, fill: '#FFFFFF' }, pop);
  svg('circle', { r: home ? 7 : 5, fill: home ? '#B07F28' : '#0B2135' }, pop);
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
  const pinv = svg('use', { href: '#plane', width: 34, height: 34, x: -17, y: -17, fill: '#0B2135' }, plane);
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
  el.innerHTML = `<div class="num"><span class="m"><span class="i">DESTINATION&nbsp; <b>${String(i + 1).padStart(2, '0')}</b> / ${String(DESTS.length).padStart(2, '0')}</span></span><span class="code">${d.code}</span></div>
    <div class="name"><span class="m"><span class="i">${d.name}</span></span></div>
    <div class="to"><b><span class="m"><span class="i">${d.code}</span></span></b><span><span class="m"><span class="i">${d.city}</span></span></span></div>`;
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
    if (w > 830) n.style.fontSize = Math.floor(150 * 830 / w) + 'px'; });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onUpdate: apply });
  const E_IN = 'expo.out', E_OUT = 'power3.in';
  const show = (sel, a, b) => { tl.set(sel, { autoAlpha: 1 }, a); if (b != null) tl.set(sel, { autoAlpha: 0 }, b); };
  const up = (t, at, o = {}) => tl.from(t, { yPercent: 118, duration: 1, ease: E_IN, stagger: 0.09, ...o }, at);
  const out = (t, at, o = {}) => tl.to(t, { yPercent: -118, duration: 0.5, ease: E_OUT, stagger: 0.045, ...o }, at);

  /* Fond : lueur chaude et nuages en dérive lente */
  gsap.set('#glow', { opacity: 0.35, y: 260 });
  tl.to('#glow', { opacity: 0.9, y: 0, duration: 3.4, ease: 'sine.out' }, 0)
    .to('#glow', { x: 260, y: 120, opacity: 0.7, duration: 3.4, ease: 'sine.inOut' }, 3.5)
    .to('#glow', { x: -80, y: 360, opacity: 0.45, duration: 2, ease: 'sine.inOut' }, 6.7)
    .to('#glow', { x: 320, y: 60, opacity: 0.75, duration: 3, ease: 'sine.inOut' }, 19.8)
    .to('#glow', { x: 0, y: -160, opacity: 1, duration: 3, ease: 'sine.inOut' }, 26.4)
    .to('#glow', { x: 0, y: 200, opacity: 0.5, duration: 2, ease: 'sine.inOut' }, 29.6)
    .to('#glow2', { x: -420, duration: DUR, ease: 'none' }, 0)
    .fromTo('#cl1', { x: 0 }, { x: 420, duration: DUR, ease: 'none' }, 0)
    .fromTo('#cl2', { x: 0 }, { x: -520, duration: DUR, ease: 'none' }, 0)
    .fromTo('#cl3', { x: 0 }, { x: 360, duration: DUR, ease: 'none' }, 0);

  /* Cadre doré */
  const fr = $('#frame rect'), FL = fr.getTotalLength();
  gsap.set(fr, { strokeDasharray: FL, strokeDashoffset: FL, opacity: 0.7 });
  tl.to(fr, { strokeDashoffset: 0, duration: 2.2, ease: 'power3.inOut' }, 0.1);

  /* ── SCÈNE 1 · 0 → 3.6 s · Révélation du logo ── */
  tl.from('#logo-wing .stripe', { x: -150, opacity: 0, duration: 1.2, stagger: 0.11 }, 0.25)
    .from('#logo-wing', { rotation: -7, transformOrigin: '70% 60%', duration: 1.5 }, 0.25);
  up(inn('.wm-easy'), 0.65, { stagger: 0.06, duration: 1 });
  up(inn('.wm-fly'), 0.9, { stagger: 0.07, duration: 1 });
  tl.from('#s1-rule', { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, 1.35);
  up(inn('#s1-tag'), 1.5, { stagger: 0.06, duration: 0.9 });
  tl.fromTo('#logo', { scale: 0.965 }, { scale: 1.03, duration: 3.6, ease: 'none', transformOrigin: '50% 45%' }, 0);
  out(inn('#s1-tag'), 2.9, { stagger: 0.02, duration: 0.42 });
  tl.to('#s1-rule', { scaleX: 0, duration: 0.35, ease: E_OUT }, 2.95);
  out([...inn('.wm-easy'), ...inn('.wm-fly')], 3.0, { stagger: 0.025, duration: 0.42 });
  tl.to('#logo-wing .stripe', { x: 190, opacity: 0, duration: 0.42, ease: E_OUT, stagger: 0.04 }, 3.05);
  tl.set('#s1', { autoAlpha: 0 }, 3.6);

  /* Signature permanente */
  show('#bug', 3.55, 30.0);
  tl.from('#bug', { y: -40, opacity: 0, duration: 0.9 }, 3.55)
    .to('#bug', { y: -40, opacity: 0, duration: 0.4, ease: E_OUT }, 29.5);

  /* ── SCÈNE 2 · 3.55 → 6.9 s · Typographie cinétique ── */
  show('#s2', 3.55, 6.95);
  gsap.set('#globe', { x: 900, y: 1560, rotation: -18 });
  tl.to('#globe', { opacity: 0.13, duration: 1, ease: 'sine.out' }, 3.6)
    .fromTo('#globe', { scale: 0.86 }, { scale: 1.04, rotation: 6, duration: 3.4, ease: 'none', transformOrigin: '50% 50%' }, 3.55)
    .to('#globe', { opacity: 0, duration: 0.45, ease: 'sine.in' }, 6.4);
  tl.to(f2, { p: 1, duration: 2.3, ease: 'power2.inOut' }, 3.6)
    .to('#s2-arc', { opacity: 0, duration: 0.5, ease: 'sine.in' }, 6.3);
  show('#s2a', 3.6, 6.95);
  up(inn('#s2a'), 3.65, { stagger: 0.17, duration: 1 });
  tl.fromTo('#s2a', { x: 0 }, { x: -22, duration: 3.2, ease: 'none' }, 3.65);
  out(inn('#s2a'), 6.3, { stagger: 0.05, duration: 0.45 });

  /* ── SCÈNE 3 · 6.7 → 20.2 s · Destinations : carte + billet ── */
  const T3 = 6.7, STEP = 1.05, TD = 8.6;
  const TM = TD + DESTS.length * STEP;          // 18.05 : plan large
  show('#s3', T3, 20.2);
  Object.assign(cam, { x: hx + 20, y: hy - 60, s: 1.25 });
  tl.fromTo('#map', { opacity: 0 }, { opacity: 1, duration: 1, ease: 'sine.out' }, T3)
    .to(cam, { x: hx, y: hy - 10, s: 2.5, duration: 2, ease: 'power3.inOut' }, T3);
  tl.from(homePin.pop, { scale: 0, duration: 0.7, ease: 'back.out(2.2)' }, T3 + 0.9);
  for (let t = T3 + 1.1; t < 19.2; t += 2.1)
    tl.fromTo(homePin.ring, { scale: 1, opacity: 0.9 }, { scale: 4.2, opacity: 0, duration: 1.5, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
  show('#chip', T3 + 0.8, 18.3);
  tl.from('#chip', { y: -30, opacity: 0, duration: 0.8 }, T3 + 0.8)
    .to('#chip', { y: -30, opacity: 0, duration: 0.4, ease: E_OUT }, 17.85);
  // billet
  show('#ticket-wrap', T3 + 0.95, TM + 0.6);
  tl.from('#ticket-wrap', { y: 260, opacity: 0, rotation: 3, duration: 1.1, ease: 'expo.out' }, T3 + 0.95)
    .to('#ticket-wrap', { y: 200, opacity: 0, rotation: -2, duration: 0.5, ease: 'power3.in' }, TM + 0.05);
  show('#ticks', TD - 0.3, TM + 0.4);
  tl.from('#ticks i', { scaleX: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.035 }, TD - 0.3)
    .to('#ticks', { opacity: 0, duration: 0.3 }, TM + 0.05);

  DESTS.forEach((d, i) => {
    const t = TD + i * STEP, r = routes[i];
    tl.to(cam, { ...d.cam, duration: 0.95, ease: 'power3.inOut' }, t - 0.25);
    tl.to(r.st, { p: 1, duration: 0.75, ease: 'power2.inOut' }, t + 0.05);
    tl.to(r.st, { o: 0.4, duration: 0.5, ease: 'sine.out' }, t + STEP);
    tl.from(d.pin.pop, { scale: 0, duration: 0.5, ease: 'back.out(2.6)' }, t + 0.62);
    tl.fromTo(d.pin.ring, { scale: 1, opacity: 0.9 }, { scale: 3.6, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.66);
    tl.to(d.tick, { scaleX: 1, duration: STEP, ease: 'none' }, t);
    tl.fromTo('#tk-plane', { x: 0 }, { x: 400, duration: 0.8, ease: 'power2.inOut' }, t + 0.05);
    const I = $$('.i', d.el), code = $('.code', d.el);
    show(d.el, t, t + STEP + 0.3);
    tl.from(I[0], { yPercent: 118, duration: 0.5 }, t)
      .from(code, { scale: 0.6, opacity: 0, duration: 0.45, ease: 'back.out(2)' }, t + 0.1)
      .from(I[1], { yPercent: 112, duration: 0.65 }, t + 0.04)
      .from([I[2], I[3]], { yPercent: 118, duration: 0.55, stagger: 0.06 }, t + 0.16);
    if (i < DESTS.length - 1) {
      const o = t + STEP - 0.2;
      tl.to(I, { yPercent: -118, duration: 0.26, ease: 'power2.in', stagger: 0.015 }, o)
        .to(code, { opacity: 0, duration: 0.18 }, o);
    }
  });

  // plan large : tout le réseau
  tl.to(cam, { x: proj(54, 0)[0], y: proj(0, -6)[1], s: 1.08, duration: 1.5, ease: 'power3.inOut' }, TM - 0.1);
  routes.forEach((r, i) => tl.to(r.st, { o: 1, duration: 0.5, ease: 'sine.out' }, TM + 0.4 + i * 0.04));
  show('#more', TM + 0.2, 20.2);
  up(inn('#more'), TM + 0.3, { stagger: 0.09, duration: 0.85 });
  out(inn('#more'), 19.6, { stagger: 0.035, duration: 0.42 });
  tl.to('#map', { opacity: 0, scale: 1.08, transformOrigin: '50% 34%', duration: 0.55, ease: 'power2.in' }, 19.6);

  /* ── SCÈNE 4 · 20.0 → 26.7 s · Services (cartes en perspective) ── */
  show('#s4', 20.0, 26.7);
  show('#s4-head', 20.0);
  up(inn('#s4-head'), 20.1, { stagger: 0.09, duration: 0.9 });
  const cards = $$('.card');
  tl.fromTo('#cards', { rotationY: -34, rotationX: 10, z: -160 }, { rotationY: -13, rotationX: 4, z: 0, duration: 1.9, ease: 'power3.out', transformOrigin: '50% 50%' }, 20.3)
    .to('#cards', { rotationY: 9, rotationX: 2, duration: 4.2, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 22.0)
    .from(cards, { x: 900, opacity: 0, rotationY: -40, duration: 1.05, stagger: 0.09, ease: 'expo.out' }, 20.35);
  cards.forEach((c, i) => {
    const t = 21.75 + i * 0.66, parts = [$('.t', c), $('.d', c), $('.n', c), $('.ico', c)];
    tl.to($('.fill', c), { scaleX: 1, duration: 0.42, ease: 'power3.inOut' }, t)
      .to(parts[0], { color: '#FFFFFF', duration: 0.25, ease: 'none' }, t + 0.08)
      .to(parts[1], { color: 'rgba(246,238,220,0.8)', duration: 0.25, ease: 'none' }, t + 0.08)
      .to([parts[2], parts[3]], { color: '#E2BD68', duration: 0.25, ease: 'none' }, t + 0.08)
      .to(c, { x: 34, scale: 1.035, duration: 0.45, ease: 'power3.out' }, t)
      .to($('.fill', c), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.42, ease: 'power3.inOut' }, t + 0.72)
      .to(parts[0], { color: '#0B2135', duration: 0.25, ease: 'none' }, t + 0.76)
      .to(parts[1], { color: 'rgba(11,33,53,0.64)', duration: 0.25, ease: 'none' }, t + 0.76)
      .to([parts[2], parts[3]], { color: '#B07F28', duration: 0.25, ease: 'none' }, t + 0.76)
      .to(c, { x: 0, scale: 1, duration: 0.5, ease: 'power2.inOut' }, t + 0.72);
  });
  out(inn('#s4-head'), 26.1, { stagger: 0.035, duration: 0.42 });
  tl.to(cards, { x: -1000, opacity: 0, rotationY: 30, duration: 0.5, stagger: 0.035, ease: 'power3.in' }, 26.0);

  /* ── SCÈNE 5 · 26.6 → 30.0 s · Signature ── */
  show('#s5', 26.6, 30.0);
  show('#s5-txt', 26.6);
  tl.to(f5a, { p: 1, duration: 2.1, ease: 'power2.inOut' }, 26.6)
    .to(f5b, { p: 1, duration: 2.3, ease: 'power2.inOut' }, 26.85)
    .to(['#s5-arc1', '#s5-arc2'], { opacity: 0, duration: 0.45, ease: 'sine.in' }, 29.4);
  up($$('#s5-txt .xl2 .i'), 26.9, { stagger: 0.16, duration: 1 });
  tl.from('#s5-rule', { scaleX: 0, duration: 0.8, ease: 'power3.inOut' }, 27.5);
  up($$('#s5-txt .label .i'), 27.65, { duration: 0.8 });
  tl.fromTo('#s5-txt', { scale: 0.97 }, { scale: 1.03, duration: 3.3, ease: 'none' }, 26.7);
  out(inn('#s5-txt'), 29.35, { stagger: 0.04, duration: 0.42 });
  tl.to('#s5-rule', { scaleX: 0, duration: 0.35, ease: E_OUT }, 29.35);

  /* ── SCÈNE 6 · 29.8 → 35 s · Appel à l'action ── */
  show('#s6', 29.8);
  tl.from('#panel', { y: 1400, duration: 1.2, ease: 'expo.out' }, 29.8)
    .from('#end-logo svg', { x: -120, opacity: 0, duration: 1.1 }, 30.0)
    .from('#end-logo .wm', { y: 40, opacity: 0, duration: 0.9, stagger: 0.1 }, 30.15);
  up(inn('.cta'), 30.35, { duration: 0.95 });
  tl.from('#s6-rule', { scaleX: 0, duration: 0.8, ease: 'power3.inOut' }, 30.6);
  up(inn('.phone'), 30.7, { duration: 0.95 });
  up(inn('.mail'), 30.85, { duration: 0.95 });
  up(inn('.svc'), 31.05, { duration: 0.85 });
  show('#s6-pill', 31.2);
  tl.from('#s6-pill', { y: 30, opacity: 0, duration: 0.8 }, 31.2);
  up(inn('.filiale'), 31.35, { duration: 0.85 });
  tl.fromTo('.phone', { scale: 1 }, { scale: 1.045, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 32.5)
    .fromTo(['.end-body', '.end-foot'], { scale: 1 }, { scale: 1.015, duration: 5, ease: 'none', transformOrigin: '50% 50%' }, 30.0);

  tl.set({}, {}, DUR);                           // durée exacte : 35 s
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
