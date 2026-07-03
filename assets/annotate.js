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

  var marks = []; // { el, ann, key } — drawn annotations, watched for drift

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

  // document-space fingerprint of where the element sits
  function posKey(el) {
    var r = el.getBoundingClientRect();
    return Math.round(r.left + window.pageXOffset) + ',' +
           Math.round(r.top + window.pageYOffset) + ',' +
           Math.round(r.width) + ',' + Math.round(r.height);
  }

  // rough-notation measures the element once at draw time; if the element is
  // still mid-reveal-transform or its counter is still ticking, the mark lands
  // off the text. Wait until the document-space rect holds still.
  function whenSettled(el, cb) {
    var last = null, still = 0, t0 = performance.now();
    (function tick() {
      var key = posKey(el);
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
        a.show();
        marks.push({ el: el, ann: a, key: posKey(el) });
        watch();
      });
    }, delay);
  }

  // ── self-heal: late font swaps, image loads, or content edits can move the
  // text out from under an already-drawn SVG. Re-check anchors for a while
  // after each draw (and on resize) and redraw any mark whose text moved.
  function heal() {
    marks.forEach(function (m) {
      if (!document.contains(m.el)) return;
      var key = posKey(m.el);
      if (key === m.key) return;
      m.ann.remove();
      m.ann = window.RoughNotation.annotate(m.el, configFor(m.el, true));
      m.ann.show();
      m.key = posKey(m.el);
    });
  }

  var watchUntil = 0, watchTimer = null;
  function watch() {
    watchUntil = performance.now() + 12000; // keep checking ~12s past the last draw
    if (watchTimer) return;
    watchTimer = setInterval(function () {
      heal();
      if (performance.now() > watchUntil) { clearInterval(watchTimer); watchTimer = null; }
    }, 800);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    if (!marks.length) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(heal, 200);
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
    // full load + fonts: never measure text against metrics that will change
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(init);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
