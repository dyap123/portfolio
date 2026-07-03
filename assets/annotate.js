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

  var marks = []; // drawn annotations, kept for resize redraw

  function configFor(el, instant) {
    var type = el.dataset.ann || 'underline';
    return {
      type: type,
      color: el.dataset.annColor || COLORS[type] || '#1E4B8F',
      strokeWidth: 2.5,
      padding: type === 'circle' ? 10 : 5,
      iterations: 2,
      animationDuration: 900,
      animate: !instant,
      multiline: true
    };
  }

  // rough-notation measures the element once at draw time; if the element is
  // still mid-reveal-transform or its counter is still ticking, the mark lands
  // off the text. Wait until the document-space rect holds still.
  function whenSettled(el, cb) {
    var last = null, still = 0, t0 = performance.now();
    (function tick() {
      var r = el.getBoundingClientRect();
      var key = Math.round(r.left) + ',' + Math.round(r.top + window.pageYOffset) + ',' +
                Math.round(r.width) + ',' + Math.round(r.height);
      still = (key === last) ? still + 1 : 0;
      last = key;
      if (still >= 3 || performance.now() - t0 > 2500) return cb();
      requestAnimationFrame(tick);
    })();
  }

  function annotate(el, instant) {
    if (!window.RoughNotation || el.__annotated) return;
    el.__annotated = true;
    var delay = instant ? 0 : parseInt(el.dataset.annDelay || '150', 10);
    setTimeout(function () {
      whenSettled(el, function () {
        var a = window.RoughNotation.annotate(el, configFor(el, instant));
        marks.push({ el: el, ann: a });
        a.show();
      });
    }, delay);
  }

  // reflow moves the text out from under the SVG — redraw in place
  var resizeTimer;
  window.addEventListener('resize', function () {
    if (!marks.length) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      marks.forEach(function (m) {
        m.ann.remove();
        m.ann = window.RoughNotation.annotate(m.el, configFor(m.el, true));
        m.ann.show();
      });
    }, 200);
  });

  function init() {
    // marks are hand-placed only (data-ann) — structural rules belong to the sheet chrome, not the pen
    var els = document.querySelectorAll('[data-ann]');
    if (!els.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // static markup, no draw-in
      els.forEach(function (el) { annotate(el, true); });
      return;
    }
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { annotate(el); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { annotate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function start() {
    // web fonts reflow the text after load — never measure against fallback metrics
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
    else init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
