// ═══════════════════════════════════════════════════
// THE DRAWING SET — shared LACC foundation time-lapse engine
// The real footing map draws itself, then a year of pours
// plays back (CUP complete 5.29.26, S-line underway).
// Used by the Projects hero (scroll-scrubbed) and a compact
// auto-playing embed on the About page.
// anime.js v4 (vendored).
// ═══════════════════════════════════════════════════

import { createTimeline, createSpring, stagger, svg } from './vendor/anime.esm.min.js';
import { LACC_GEO as G } from './lacc-geo.js';

const NS = 'http://www.w3.org/2000/svg';
const SPRING = createSpring({ stiffness: 280, damping: 17 });

function el(name, attrs, parent) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function chunk(arr, n) {
  const per = Math.ceil(arr.length / n) || 1, out = [];
  for (let i = 0; i < arr.length; i += per) out.push(arr.slice(i, i + per));
  return out;
}

// ── Pour reality (pure from G) ─────────────────────
const cupXY = (x, y) => x >= G.cup.x0 && x <= G.cup.x1 && y >= G.cup.y0 && y <= G.cup.y1;
const slXY  = (x, y) => !cupXY(x, y) && x >= G.sline.x0 && x <= G.sline.x1;
const inCup = f => cupXY(f[0], f[1]);
const inSline = f => slXY(f[0], f[1]);
const cupF = G.foot.filter(inCup).sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
const pouredF = G.foot.filter(inSline).sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
const plannedF = G.foot.filter(f => !inCup(f) && !inSline(f));

const beams = G.beams || [];
const bMid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
const cupB = beams.filter(b => { const [x, y] = bMid(b); return cupXY(x, y); });
const pouredB = beams.filter(b => { const [x, y] = bMid(b); return slXY(x, y); });
const plannedB = beams.filter(b => { const [x, y] = bMid(b); return !cupXY(x, y) && !slXY(x, y); });

export const LACC_TOTAL = G.foot.length + beams.length;
export const LACC_POURED = cupF.length + cupB.length + pouredF.length + pouredB.length;

// ── Timeline stage starts (ms — scrubbed, only ratios matter) ──
const T = { site: 0, grid: 700, layout: 1900, cup: 2800, found: 5300 };
const CUP_FILL = [2900, 4740];
const FOUND_FILL = [5300, 7100];   // fills all remaining foundations → complete AUG 2026
const DEC1  = Date.UTC(2025, 11, 1);
const MAY29 = Date.UTC(2026, 4, 29);
const AUG31 = Date.UTC(2026, 7, 31);   // foundations complete target
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const clamp01 = v => Math.max(0, Math.min(1, v));
const fmtDate = ms => { const d = new Date(ms); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`; };

// ═══════════════════════════════════════════════════
// mountLacc — build + animate one instance.
//   els: { planSvg, railEl?, countEl?, totalEl?, dateEl?, cupStamp?, endStamp?, stageEl }
//   opts: { mode: 'scrub' | 'autoplay' | 'end', scrollWrap? }
// ═══════════════════════════════════════════════════
export function mountLacc(els, opts = {}) {
  const { planSvg } = els;
  if (!planSvg) return null;
  const groupEls = { cup: [], poured: [], planned: [] };
  let railItems = [];

  if (els.totalEl) els.totalEl.textContent = LACC_TOTAL;

  buildPlan();
  if (els.railEl) buildRail();
  const tl = buildTimeline();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = reduce ? 'end' : (opts.mode || 'autoplay');

  if (mode === 'end') {
    tl.seek(tl.duration);
  } else if (mode === 'scrub' && opts.scrollWrap) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = opts.scrollWrap.getBoundingClientRect();
      const span = Math.max(r.height - window.innerHeight, 1);
      const pct = Math.max(0, Math.min(1, -r.top / span));
      tl.seek(pct * tl.duration);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  } else {
    // autoplay once on view; click to replay
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { tl.play(); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(els.stageEl || planSvg);
    if (els.stageEl) els.stageEl.addEventListener('click', () => { tl.seek(0); tl.play(); });
  }
  return { tl, total: LACC_TOTAL, poured: LACC_POURED };

  // ── builders (closures over els/groupEls) ──
  function buildPlan() {
    planSvg.setAttribute('viewBox', G.view.join(' '));
    const frag = document.createDocumentFragment();
    const { fb } = G;

    const gridG = el('g', { class: 'gGrid' });
    G.vlines.forEach(([x, l]) => {
      const minor = l.includes('.');
      el('line', { class: 'gl' + (minor ? ' mn' : ''), x1: x, y1: fb.y0 - 46, x2: x, y2: fb.y1 + 46 }, gridG);
      if (!minor) el('text', { class: 'glb', x, y: fb.y0 - 62, 'text-anchor': 'middle' }, gridG).textContent = l;
    });
    G.hlines.forEach(([y, l]) => {
      el('line', { class: 'gl', x1: fb.x0 - 46, y1: y, x2: fb.x1 + 46, y2: y }, gridG);
      el('text', { class: 'glb', x: fb.x0 - 58, y: y + 10, 'text-anchor': 'end' }, gridG).textContent = l;
    });
    frag.appendChild(gridG);

    // grade beams (behind footings) — thin rotated rects, dashed connectors
    const beamG = el('g', { class: 'gBeam' });
    const addBeams = (list, n, cls, key) => chunk(list, n).forEach(gr => {
      const gEl = el('g', { class: cls + ' beam-g', opacity: 0, 'fill-opacity': 0 }, beamG);
      gr.forEach(([x1, y1, x2, y2, thk]) => {
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, t = Math.max(8, thk);
        el('rect', { x: cx - len / 2, y: cy - t / 2, width: len, height: t, rx: 3, transform: `rotate(${ang.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})` }, gEl);
      });
      groupEls[key].push(gEl);
    });
    addBeams(cupB, 4, 'pour-g cupg', 'cup');
    addBeams(pouredB, 4, 'pour-g', 'poured');
    addBeams(plannedB, 6, 'pour-g', 'planned');
    frag.appendChild(beamG);

    const footG = el('g', { class: 'gFoot' });
    const addGroups = (list, n, cls, key) => chunk(list, n).forEach(gr => {
      const gEl = el('g', { class: cls, opacity: 0, 'fill-opacity': 0 }, footG);
      gr.forEach(([x, y, w, h]) => el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h }, gEl));
      groupEls[key].push(gEl);
    });
    addGroups(cupF, 8, 'pour-g cupg', 'cup');
    addGroups(pouredF, 8, 'pour-g', 'poured');
    addGroups(plannedF, 10, 'pour-g', 'planned');
    frag.appendChild(footG);

    el('rect', { class: 'fbLine', x: fb.x0, y: fb.y0, width: fb.x1 - fb.x0, height: fb.y1 - fb.y0 }, frag);
    el('rect', { class: 'cupFill', x: G.cup.x0, y: G.cup.y0, width: G.cup.x1 - G.cup.x0, height: G.cup.y1 - G.cup.y0, opacity: 0 }, frag);
    el('rect', { class: 'cupLine', x: G.cup.x0, y: G.cup.y0, width: G.cup.x1 - G.cup.x0, height: G.cup.y1 - G.cup.y0 }, frag);
    el('text', { class: 'cupTag', x: (G.cup.x0 + G.cup.x1) / 2, y: G.cup.y1 + 46, 'text-anchor': 'middle', opacity: 0 }, frag).textContent = 'CUP — F–Q.1 / W33–W30';

    const na = el('g', { class: 'gNorth', transform: `translate(${fb.x1 + 40} ${fb.y0 - 40})`, opacity: 0 }, frag);
    el('circle', { cx: 0, cy: 0, r: 40, class: 'na-c' }, na);
    el('polygon', { points: '0,-30 12,14 0,6 -12,14', class: 'na-p' }, na);
    el('text', { class: 'glb', x: 0, y: 62, 'text-anchor': 'middle' }, na).textContent = 'N';

    planSvg.appendChild(frag);
  }

  function buildRail() {
    G.milestones.forEach((m, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="no">.${i + 1}</span><span class="t">${m.label}</span><span class="d">${m.date}</span>`;
      els.railEl.appendChild(li);
    });
    railItems = Array.from(els.railEl.children);
  }
  function updateRail(time) {
    if (!railItems.length) return;
    let active = 0;
    G.milestones.forEach((m, i) => { if (time >= (T[m.id] ?? 0)) active = i; });
    railItems.forEach((li, i) => { li.classList.toggle('on', i === active); li.classList.toggle('done', i < active); });
  }
  function updateHud(t) {
    if (els.dateEl) {
      let label;
      if (t < T.cup) label = '2025';
      else if (t < T.found) label = fmtDate(DEC1 + (MAY29 - DEC1) * clamp01((t - T.cup) / (T.found - T.cup)));
      else if (t < FOUND_FILL[1]) label = fmtDate(MAY29 + (AUG31 - MAY29) * clamp01((t - T.found) / (FOUND_FILL[1] - T.found)));
      else label = 'FOUNDATIONS · AUG 2026';
      els.dateEl.textContent = label;
    }
    if (els.countEl) {
      const nCup = cupF.length + cupB.length;
      const nRest = pouredF.length + pouredB.length + plannedF.length + plannedB.length;
      els.countEl.textContent = Math.round(
        nCup * clamp01((t - CUP_FILL[0]) / (CUP_FILL[1] - CUP_FILL[0])) +
        nRest * clamp01((t - FOUND_FILL[0]) / (FOUND_FILL[1] - FOUND_FILL[0]))
      );
    }
  }

  function q(sel) { return planSvg.querySelectorAll(sel); }
  function buildTimeline() {
    const timeline = createTimeline({
      autoplay: false, defaults: { ease: 'inOutQuad' },
      onUpdate: self => { updateRail(self.currentTime); updateHud(self.currentTime); },
    });
    const [fbDraw] = svg.createDrawable(q('.fbLine'));
    timeline.add(fbDraw, { draw: ['0 0', '0 1'], duration: 640, ease: 'inOutCubic' }, T.site);
    timeline.add(q('.gNorth'), { opacity: [0, 1], duration: 350 }, T.site + 350);

    const glDraw = svg.createDrawable(q('.gGrid .gl'));
    timeline.add(glDraw, { draw: ['0 0', '0 1'], duration: 420, delay: stagger(7), ease: 'linear' }, T.grid);
    timeline.add(q('.gGrid .glb'), { opacity: [0, 0.9], duration: 320, delay: stagger(5) }, T.grid + 220);

    const allGroups = [...groupEls.cup, ...groupEls.poured, ...groupEls.planned];
    timeline.add(allGroups, { opacity: [0, 1], duration: 260, delay: stagger(14) }, T.layout);

    const [cupDraw] = svg.createDrawable(q('.cupLine'));
    timeline.add(cupDraw, { draw: ['0 0', '0 1'], duration: 520, ease: 'inOutCubic' }, T.cup);
    timeline.add(q('.cupFill'), { opacity: [0, 1], duration: 400 }, T.cup + 200);
    timeline.add(q('.cupTag'), { opacity: [0, 1], duration: 260 }, T.cup + 300);
    timeline.add(groupEls.cup, { 'fill-opacity': [0, 1], duration: 300, delay: stagger((CUP_FILL[1] - CUP_FILL[0] - 300) / Math.max(1, groupEls.cup.length - 1)) }, CUP_FILL[0]);
    if (els.cupStamp) timeline.add(els.cupStamp, { opacity: [0, 1], scale: [1.6, 1], ease: SPRING }, CUP_FILL[1] + 60);

    // Foundations complete by AUG 2026 — the remaining pours all fill in.
    const rest = [...groupEls.poured, ...groupEls.planned];
    timeline.add(rest, { 'fill-opacity': [0, 1], duration: 260, delay: stagger((FOUND_FILL[1] - FOUND_FILL[0] - 260) / Math.max(1, rest.length - 1)) }, FOUND_FILL[0]);

    timeline.seek(0); updateRail(0); updateHud(0);
    return timeline;
  }
}
