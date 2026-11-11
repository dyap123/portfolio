const sheets = [
  ['concrete-quantities','Concrete quantity sheet'],
  ['excavation-reference','Excavation footprint reference'],
  ['embed-counts','Embed count sheet'],
  ['drone-model-sheet','Drone overlay sheet']
];
const drawing = (file, alt, caption) => ({ src: 'assets/drawings/' + file + '.jpg?v=redacted2', href: 'assets/drawings/' + file + '.pdf?v=redacted2', alt, caption });
const films = [
  ['assets/field-details/knife-plate-setting','Knife plate crane setting','knife-plate',
    drawing('knife-plate-supports','Knife plate support shop drawing with plan, section, plate dimensions, and bracing details','Knife plate support details')],
  ['assets/field-details/elevator-pit-half-speed','Elevator pit, half speed','elevator-pit',
    drawing('elevator-pit-details','Elevator pit shop drawing showing foundation plan, pit slab, grade beams, plinths, and sections','Elevator pit shop drawing')],
  ['assets/field-details/pile-cap-exit','Exiting a pile cap','pile-cap',
    { src: 'assets/openyap/model-rebar.png', alt: 'YapGrid foundation model showing pile caps, grade beams, piles, and embeds', caption: 'YapGrid foundation model' }],
  // Clips with no matching drawing of the same element stand alone.
  ['assets/media/night-pour-1','Night rebar coordination','night-pours',null],
  ['assets/media/night-pour-2','Mass concrete coordination','night-pours',null],
  ['assets/media/grade-beam','Grade beam inspection','grade-beam',null]
];
export function initCarousels() {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const video = root.querySelector('video');
    const items = video ? films : sheets;
    let index = 0, visible = false, timer = null, internalPause = false;
    let automatic = !preference.matches && !navigator.connection?.saveData;
    const auto = root.querySelector('[data-auto]');
    const clear = () => { clearTimeout(timer); timer = null; };
    const ready = () => visible && !document.hidden && automatic;
    function pauseInternally() { if (video && !video.paused) { internalPause = true; video.pause(); } }
    function label() { auto.textContent = automatic ? 'Pause rotation' : 'Start rotation'; auto.setAttribute('aria-pressed', String(automatic)); root.querySelector('[data-position]').setAttribute('aria-live', automatic ? 'off' : 'polite'); }
    function schedule() {
      clear();
      if (!ready()) return;
      if (video) {
        if (!video.getAttribute('src')) video.src = items[index][0] + '.mp4';
        video.muted = true;
        video.play().catch(() => {});
      } else timer = setTimeout(() => show(index + 1), 6500);
    }
    function show(next) {
      clear();
      pauseInternally();
      index = (next + items.length) % items.length;
      const item = items[index];
      root.querySelector('[data-caption]').textContent = item[1];
      root.querySelector('[data-position]').textContent = `${index + 1} / ${items.length}`;
      if (video) {
        video.poster = item[0] + '.jpg';
        video.src = item[0] + '.mp4';
        video.setAttribute('aria-label', item[1]);
        root.querySelector('[data-detail]').href = 'fieldwork.html#' + item[2];
        const pair = root.querySelector('[data-field-pair]');
        const fig = root.querySelector('[data-detail-fig]');
        const detail = item[3];
        if (pair && fig) {
          pair.classList.toggle('is-solo', !detail);
          fig.hidden = !detail;
          if (detail) {
            const drawingScroll = fig.querySelector('.drawing-scroll');
            // A new sheet must not inherit the previous sheet's horizontal pan.
            if (drawingScroll) drawingScroll.scrollLeft = 0;
            root.querySelector('[data-detail-img]').src = detail.src;
            root.querySelector('[data-detail-img]').alt = detail.alt;
            root.querySelector('[data-detail-caption]').textContent = detail.caption;
            const open = root.querySelector('[data-detail-open]');
            if (detail.href) { open.href = detail.href; open.setAttribute('aria-label', 'Open ' + detail.caption.toLowerCase()); }
            else { open.removeAttribute('href'); open.removeAttribute('aria-label'); }
          }
        }
      } else {
        root.querySelector('[data-sheet]').src = 'assets/exports/' + item[0] + '.jpg?v=redacted2';
        root.querySelector('[data-sheet]').alt = item[1];
        root.querySelector('[data-item-link]').href = 'assets/exports/' + item[0] + '.pdf?v=redacted2';
      }
      schedule();
    }
    root.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
    root.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
    auto.addEventListener('click', () => {
      automatic = !automatic; label();
      if (!automatic) { clear(); pauseInternally(); } else schedule();
    });
    video?.addEventListener('ended', () => { if (ready()) show(index + 1); });
    // Honor a pause from native controls or another foreground film; do not restart on a timer.
    video?.addEventListener('pause', () => {
      clear();
      if (internalPause) { internalPause = false; return; }
      if (!video.ended) { automatic = false; label(); }
    });
    if (!video) root.addEventListener('focusin', () => { automatic = false; clear(); label(); });
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) { clear(); pauseInternally(); } else schedule();
    }, { threshold: 0.3 });
    observer.observe(root);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clear(); pauseInternally(); } else schedule();
    });
    preference.addEventListener('change', () => {
      if (preference.matches) { automatic = false; label(); clear(); pauseInternally(); }
    });
    window.addEventListener('pagehide', () => { clear(); pauseInternally(); observer.disconnect(); }, { once: true });
    label();
    // Native playback remains available even when automatic rotation is disabled.
    if (video) video.src = films[0][0] + '.mp4';
  });
}
