'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('span').textContent = '+';
  navigation.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.querySelector('span').textContent = expanded ? '−' : '+';
  navigation.classList.toggle('is-open', expanded);
});
navigation?.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
const mobileQuery = matchMedia('(max-width: 900px)');
mobileQuery.addEventListener('change', closeMenu);

const hero = document.querySelector('#hero-video');
const toggle = document.querySelector('.film-toggle');
if (hero && toggle) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;
  let loaded = false;
  let inView = false;
  function loadVideo() {
    if (loaded) return;
    const source = hero.querySelector('source');
    source.src = source.dataset.src;
    loaded = true;
    hero.load();
  }
  function updateToggle() {
    const playing = !hero.paused;
    toggle.querySelector('.toggle-symbol').textContent = playing ? 'Ⅱ' : '▶';
    toggle.querySelector('.toggle-text').textContent = playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', playing ? 'Pause overview compilation' : 'Play overview compilation');
  }
  async function play() {
    loadVideo();
    try { await hero.play(); } catch (_) { updateToggle(); }
  }
  toggle.addEventListener('click', () => {
    if (hero.paused) { manuallyPaused = false; play(); }
    else { manuallyPaused = true; hero.pause(); }
  });
  hero.addEventListener('play', updateToggle);
  hero.addEventListener('pause', updateToggle);
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) hero.pause();
    else if (!manuallyPaused && !reduceMotion.matches && !navigator.connection?.saveData && !document.hidden) play();
  }, { threshold: 0.15 });
  observer.observe(hero);
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) hero.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hero.pause();
    else if (inView && !manuallyPaused && !reduceMotion.matches && !navigator.connection?.saveData) play();
  });
}
// Only one foreground film should play at a time.
document.querySelectorAll('video[controls]').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
});

// Motion is optional: failed loading, reduced motion, or data saving leaves the page intact.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && !navigator.connection?.saveData &&
    'IntersectionObserver' in window && document.querySelector('[data-motion], [data-motion-hero]')) {
  import('./motion.mjs?v=dy2').then(({ initMotion }) => initMotion(motionPreference)).catch(() => {});
}

if (document.querySelector('[data-carousel]')) import('./carousels.mjs?v=models4').then(({ initCarousels }) => initCarousels()).catch(() => {});
