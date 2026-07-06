// ═══════════════════════════════════════════════════
// THE DRAWING SET — exploded assembly (technical layers)
// Each [data-assembly]: an app broken into its technical
// layers as big 3D plates that explode on scroll-in and
// tilt to the pointer. Click a layer → immersive detail
// (number, name, tech, description, key metric, what it
// connects to) with prev/next + arrow-key navigation and
// a layer-progress rail. Features live on the right.
// anime.js v4 · reduced-motion → flat static state.
// ═══════════════════════════════════════════════════

import { animate, createSpring, stagger } from './vendor/anime.esm.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const POP = createSpring({ stiffness: 120, damping: 12 });
const SETTLE = createSpring({ stiffness: 210, damping: 20 });
const STEP = 50;                 // z-gap between layers
const baseZ = i => i * STEP;

function wire(root) {
  const view = root.querySelector('.assembly-view');
  const stack = root.querySelector('.assembly-plates');
  const plates = Array.from(root.querySelectorAll('.plate'));
  const detail = root.querySelector('.assembly-detail');
  const back = root.querySelector('.assembly-back');
  if (!stack || !plates.length) return;
  const total = plates.length;
  let focused = false, curIdx = -1;

  const chip = t => `<span>${t}</span>`;
  function renderDetail(i) {
    const p = plates[i];
    const n = String(i + 1).padStart(2, '0');
    const chips = (p.dataset.tech || '').split('|').filter(Boolean).map(chip).join('');
    const dots = plates.map((_, j) => `<span class="dot${j === i ? ' on' : ''}" data-dot="${j}"></span>`).join('');
    const metric = p.dataset.metric ? `<div class="d-meta"><span class="dm-k">Key</span><span class="dm-v">${p.dataset.metric}</span></div>` : '';
    const connects = p.dataset.connects ? `<div class="d-meta"><span class="dm-k">Connects</span><span class="dm-v">${p.dataset.connects}</span></div>` : '';
    detail.innerHTML =
      `<div class="d-progress">${dots}</div>` +
      `<div class="d-num">${n}<span class="d-of">/ ${String(total).padStart(2, '0')}</span></div>` +
      `<div class="d-lyr">${p.dataset.lyr || 'Layer'}</div>` +
      `<div class="d-name">${p.dataset.name || ''}</div>` +
      `<div class="d-tech">${chips}</div>` +
      `<p class="d-body">${p.dataset.detail || ''}</p>` +
      (metric + connects ? `<div class="d-foot">${metric}${connects}</div>` : '') +
      `<div class="d-nav"><button class="d-prev" type="button" aria-label="Previous layer">← Prev</button>` +
      `<button class="d-next" type="button" aria-label="Next layer">Next →</button></div>`;
    detail.querySelector('.d-prev').onclick = () => goto(i - 1);
    detail.querySelector('.d-next').onclick = () => goto(i + 1);
    detail.querySelectorAll('[data-dot]').forEach(d => d.onclick = () => goto(Number(d.dataset.dot)));
    curIdx = i;
  }
  function goto(i) {
    i = (i + total) % total;
    renderDetail(i);
    if (!reduce) animate(detail.querySelector('.d-num'), { opacity: [0.35, 1], translateX: [-10, 0], duration: 320, ease: 'outCubic' });
  }
  function openDetail(i) {
    if (focused) return;
    focused = true;
    renderDetail(i);
    root.classList.add('is-focused');
    if (reduce) { detail.style.opacity = '1'; return; }
    animate(detail, { opacity: [0, 1], scale: [0.96, 1], ease: SETTLE });
  }
  function closeDetail() {
    if (!focused) return;
    focused = false;
    if (reduce) { root.classList.remove('is-focused'); return; }
    animate(detail, { opacity: [1, 0], duration: 200, onComplete: () => root.classList.remove('is-focused') });
  }

  plates.forEach((p, i) => {
    p.style.transform = reduce ? `translateZ(${baseZ(i)}px)` : 'translateZ(0px)';
    if (reduce) p.style.opacity = '1';
    p.addEventListener('click', () => openDetail(i));
    if (!reduce) {
      p.addEventListener('pointerenter', () => { if (focused) return; p.classList.add('on'); animate(p, { translateZ: baseZ(i) + 30, scale: 1.03, ease: SETTLE }); });
      p.addEventListener('pointerleave', () => { if (focused) return; p.classList.remove('on'); animate(p, { translateZ: baseZ(i), scale: 1, ease: SETTLE }); });
    }
  });
  back?.addEventListener('click', closeDetail);
  root.addEventListener('keydown', (e) => {
    if (!focused) return;
    if (e.key === 'Escape') closeDetail();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goto(curIdx - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goto(curIdx + 1); }
  });

  if (reduce) return;

  // Explode from the collapsed stack when scrolled into view.
  let played = false;
  const explode = () => {
    if (played) return; played = true;
    animate(plates, { translateZ: (el, i) => [0, baseZ(i)], opacity: [0, 1], delay: stagger(80, { start: 100 }), ease: POP });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); explode(); } }), { threshold: 0.2 });
    io.observe(root);
  } else { explode(); }

  // Pointer-parallax — tilt the stack toward the cursor (off while focused).
  let raf = 0;
  view.addEventListener('pointermove', (e) => {
    if (focused || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = view.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      stack.style.transform = `rotateX(${(56 - dy * 10).toFixed(1)}deg) rotateZ(${(-40 + dx * 14).toFixed(1)}deg)`;
    });
  });
  view.addEventListener('pointerleave', () => { if (!focused) stack.style.transform = 'rotateX(56deg) rotateZ(-40deg)'; });
}

document.querySelectorAll('[data-assembly]').forEach(w => { w.setAttribute('tabindex', '-1'); wire(w); });
