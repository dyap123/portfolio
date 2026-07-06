// ═══════════════════════════════════════════════════
// THE DRAWING SET — shared motion (anime.js v4)
// Tasteful, signature-only touches layered on top of
// shell.js's .reveal/counters. Every effect is
// reduced-motion-guarded and no-op if its target is absent.
// Loaded as a module (deferred) on About / Journey / Vision.
// ═══════════════════════════════════════════════════

import { animate, createSpring, stagger, svg, utils } from './vendor/anime.esm.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const POP = createSpring({ stiffness: 260, damping: 16 });
const RISE = createSpring({ stiffness: 190, damping: 22 });

// Fire once when an element scrolls into view.
function onView(el, cb, threshold = 0.4) {
  if (!('IntersectionObserver' in window)) { cb(); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { io.disconnect(); cb(); } });
  }, { threshold });
  io.observe(el);
}

function init() {
  // Reduced motion: leave everything in its natural, fully-visible state.
  if (reduce) return;

  // ── Hero headline — a clean spring rise on load ──
  $$('[data-motion="hero"]').forEach(el => {
    el.style.opacity = '0';
    animate(el, { opacity: [0, 1], translateY: [18, 0], duration: 900, ease: RISE, delay: 120 });
  });

  // ── Portrait — spring pop + faint settle ──
  $$('[data-motion="portrait"]').forEach(el => {
    if (el.style.display === 'none') return;   // onerror-hidden (missing file)
    el.style.opacity = '0';
    animate(el, { opacity: [0, 1], scale: [0.9, 1], rotate: [-2, 0], ease: POP, delay: 260 });
  });

  // ── Stamps — thunk in with a spring when scrolled to ──
  $$('.stamp').forEach(el => {
    // skip stamps an animation engine already owns (e.g. projects hero)
    if (el.closest('.stage-stamp')) return;
    el.style.opacity = '0';
    onView(el, () => animate(el, {
      opacity: [0, 0.9], scale: [1.5, 1], rotate: [-9, -4], ease: POP,
    }), 0.6);
  });

  // ── Sector eyebrows — the label fades up as its section arrives ──
  $$('[data-motion-stagger]').forEach(group => {
    const kids = Array.from(group.children);
    kids.forEach(k => { k.style.opacity = '0'; });
    onView(group, () => animate(kids, {
      opacity: [0, 1], translateY: [12, 0], duration: 620, ease: RISE, delay: stagger(60),
    }), 0.2);
  });

  // ── Nav links — a quiet cascade on load ──
  const links = $$('.nav-links > a');
  if (links.length) {
    links.forEach(a => { a.style.opacity = '0'; });
    animate(links, { opacity: [0, 1], translateY: [-6, 0], duration: 460, ease: 'outQuad', delay: stagger(45, { start: 150 }) });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
