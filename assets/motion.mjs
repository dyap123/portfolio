import { animate } from './vendor/anime.esm.min.js';

export function initMotion(preference) {
  if (preference.matches) return;
  const active = new Map();
  // Nothing is hidden before observation. Missed events and script failures stay readable.
  const restore = (node) => {
    node.style.removeProperty('transform');
    node.style.removeProperty('opacity');
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const node = entry.target;
      observer.unobserve(node);
      if (preference.matches || document.hidden) continue;
      try {
        const animation = animate(node, {
          translateY: [24, 0], opacity: [0.3, 1], duration: 850,
          ease: 'outCubic',
          onComplete: () => { active.delete(node); restore(node); }
        });
        active.set(node, animation);
      } catch (_) { restore(node); }
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-motion], [data-motion-hero]').forEach(node => observer.observe(node));
  const stop = () => {
    observer.disconnect();
    for (const [node, animation] of active) {
      animation.pause();
      restore(node);
    }
    active.clear();
  };
  preference.addEventListener('change', () => { if (preference.matches) stop(); });
  window.addEventListener('pagehide', stop, { once: true });
}
