// ═══════════════════════════════════════════════════
// THE DRAWING SET — projects page
// Mounts the shared LACC foundation time-lapse (scroll-
// scrubbed) into the C-000 hero, plus spring reveals for
// the data sheets below.
// ═══════════════════════════════════════════════════

import { animate, createSpring, stagger } from './vendor/anime.esm.min.js';
import { mountLacc } from './lacc-map.js';

const $ = s => document.querySelector(s);
const SPRING_SOFT = createSpring({ stiffness: 180, damping: 20 });

// ── Hero: shared engine, scroll-scrubbed on desktop ──
const planSvg = $('#laccPlan');
if (planSvg) {
  const desktop = matchMedia('(min-width: 861px)').matches;
  mountLacc({
    planSvg,
    stageEl: $('#heroStage'),
    railEl: $('#mRail'),
    countEl: $('#footCount'),
    totalEl: $('#footTotal'),
    dateEl: $('#hudDate'),
    cupStamp: $('#cupStamp'),
  }, { mode: desktop ? 'scrub' : 'autoplay', scrollWrap: $('#heroScroll') });
}

// ── Spring reveals for the data sheets below the hero ──
(function springReveals() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ['.stats-row .stat-cell', '.m-log .row', '.register .row'].forEach(sel => {
    const els = Array.from(document.querySelectorAll(sel));
    if (!els.length) return;
    els.forEach(e => { e.style.opacity = '0'; });
    const io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        io.disconnect();
        animate(els, { opacity: [0, 1], translateY: [16, 0], scale: [0.985, 1], delay: stagger(70), ease: SPRING_SOFT });
      });
    }, { threshold: 0.2 });
    io.observe(els[0].parentElement);
  });
})();
