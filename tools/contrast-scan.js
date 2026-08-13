/**
 * contrast-scan.js — every piece of text on the page, measured.
 *
 * WHY THIS EXISTS
 * The set was ink on bond paper and then the ground moved to slate. Nearly all of that was a
 * token swap, which is what a design system buys you — but thirty-eight panels were written
 * as literal paper, `rgba(251,250,247,α)`, inside per-page <style> blocks where the swap
 * could not reach. A paper panel over slate composites to mid-grey, and `--primary`, which
 * had been lifted specifically FOR a dark ground, then sat on it at 1.02:1.
 *
 * None of that is visible in the stylesheet. It only exists once the cascade has run and the
 * alpha layers have composited, which is why this measures the RENDERED page rather than
 * reading the CSS: it walks up from each text node compositing every translucent ancestor
 * until it hits an opaque one, then applies the text's own alpha on top.
 *
 * USAGE
 *   python3 -m http.server 8899          # from the repo root
 *   …then in the page console:
 *   const s=document.createElement('script'); s.src='/tools/contrast-scan.js';
 *   document.head.appendChild(s);        // → window.contrastScan()
 *
 * Thresholds are WCAG 2.1 AA: 4.5:1 for body text, 3:1 once it is 24px, or 18.66px bold.
 */
(function () {
  const relLum = (rgb) => {
    const s = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };

  const parse = (str) => {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(str || '');
    return m ? { c: [+m[1], +m[2], +m[3]], a: m[4] == null ? 1 : +m[4] } : null;
  };

  const composite = (fg, bg) => fg.c.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));

  /* The effective background: every translucent ancestor, in paint order, over the page
     ground. Stopping at the first non-transparent ancestor would report `rgba(0,0,0,0)` as
     black and call a perfectly readable label a failure. */
  function backgroundOf(el, ground) {
    const stack = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) { stack.push(bg); if (bg.a === 1) break; }
      node = node.parentElement;
    }
    let base = ground;
    for (let i = stack.length - 1; i >= 0; i--) base = composite(stack[i], base);
    return base;
  }

  window.contrastScan = function contrastScan(opts) {
    opts = opts || {};
    const ground = opts.ground ||
      (parse(getComputedStyle(document.documentElement).backgroundColor) || { c: [255, 255, 255] }).c;
    const fails = [], skipped = [];

    document.querySelectorAll('*').forEach((el) => {
      /* Only OWN text. Without this every ancestor is re-tested against its descendants'
         text and one bad label reports as fifty. */
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
        .map((n) => n.textContent.trim()).join(' ');
      if (!own) return;

      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;      // laid out but not painted

      /* ⚠️ AN ELEMENT WITH A RUNNING ANIMATION LIES ABOUT ITS COMPUTED STYLE.
       *
       * The Construction/Software toggle carries a `ptbeckon` background animation on the
       * inactive tab. While that runs, getComputedStyle().color came back as the value the
       * button had at parse time and stopped tracking the .active class — reporting the two
       * tabs as having each other's colours, and a 1.06:1 failure that a screenshot showed
       * was not there at all. Four false positives, chased a long way.
       *
       * So: skip anything mid-animation and say so, rather than reporting a number that a
       * pixel would contradict. Pause the animation and re-run if you need the real value. */
      if (el.getAnimations && el.getAnimations().some((a) => a.playState === 'running')) {
        skipped.push(el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''));
        return;
      }

      const fg = parse(cs.color);
      if (!fg) return;
      const bg = backgroundOf(el, ground);
      const text = composite(fg, bg);             // the text's own alpha counts too

      const l1 = relLum(text), l2 = relLum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      const px = parseFloat(cs.fontSize);
      const large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      if (ratio >= need) return;

      fails.push({
        ratio: +ratio.toFixed(2), need, px: +px.toFixed(1),
        sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
        text: own.slice(0, 40),
        color: cs.color,
        bg: 'rgb(' + bg.map(Math.round).join(',') + ')',
      });
    });

    fails.sort((a, b) => a.ratio - b.ratio);
    if (!opts.quiet) {
      console.log(`contrast: ${fails.length} failing of ${document.querySelectorAll('*').length} nodes`
        + (skipped.length ? ` · ${skipped.length} skipped mid-animation` : ''));
      if (fails.length) console.table(fails);
      if (skipped.length) console.log('skipped (animating):', [...new Set(skipped)].join(', '));
    }
    fails.skipped = skipped;
    return fails;
  };

  if (!window.__contrastQuiet) console.log('contrastScan() ready');
})();
