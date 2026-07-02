// ═══════════════════════════════════════════════════
// THE DRAWING SET — scroll-triggered redlines
// rough-notation wiring: elements opt in via data-ann.
//   data-ann="circle|underline|box|highlight|bracket|strike-through"
//   data-ann-color  (default: role-based below)
//   data-ann-delay  (ms after reveal, default 150)
// The set gets marked up like a drawing under review.
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  var COLORS = {
    circle: '#B3261E',       // stamp red — the reviewer's pen
    box: '#B3261E',
    underline: '#1E4B8F',    // blueprint blue
    bracket: '#1E4B8F',
    highlight: 'rgba(232,84,31,0.28)', // safety-orange marker
    'strike-through': '#B3261E'
  };

  function annotate(el) {
    if (!window.RoughNotation || el.__annotated) return;
    el.__annotated = true;
    var type = el.dataset.ann || 'underline';
    var a = window.RoughNotation.annotate(el, {
      type: type,
      color: el.dataset.annColor || COLORS[type] || '#1E4B8F',
      strokeWidth: 2.5,
      padding: type === 'circle' ? 10 : 5,
      iterations: 2,
      animationDuration: 900,
      multiline: true
    });
    setTimeout(function () { a.show(); }, parseInt(el.dataset.annDelay || '150', 10));
  }

  function init() {
    // every accented heading gets the reviewer's blue underline unless it opted into something else
    document.querySelectorAll('h1 .grad, h2 .grad').forEach(function (el) {
      if (!el.dataset.ann) el.dataset.ann = 'underline';
    });
    var els = document.querySelectorAll('[data-ann]');
    if (!els.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // static markup, no draw-in
      els.forEach(function (el) {
        el.dataset.annDelay = '0';
        annotate(el);
      });
      return;
    }
    if (!('IntersectionObserver' in window)) { els.forEach(annotate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { annotate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
