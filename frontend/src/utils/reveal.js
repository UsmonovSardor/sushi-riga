import { useEffect } from 'react';

// Scroll-reveal for cards. One shared IntersectionObserver drives every card on
// the page (not one-per-card), so 100+ items stay cheap. Cards that enter the
// viewport in the same frame are sorted top-to-bottom / left-to-right and given
// a capped, incremental transition-delay → a clean stagger "wave" as you scroll.
// The delay + will-change are cleared once the reveal finishes, so hover/tilt
// stay instant afterwards. GPU-only (opacity + translate/scale); respects
// prefers-reduced-motion (handled in useReveal, which reveals immediately).

let observer = null;

function ensureObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      const shown = entries.filter((e) => e.isIntersecting);
      if (!shown.length) return;
      // Reveal in reading order so the stagger reads as a top-down wave.
      shown.sort((a, b) => {
        const ra = a.boundingClientRect;
        const rb = b.boundingClientRect;
        return ra.top - rb.top || ra.left - rb.left;
      });
      shown.forEach((entry, i) => {
        const el = entry.target;
        const delay = Math.min(i, 8) * 55; // cap so a full screen never lags
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('in');

        const clear = () => {
          el.style.transitionDelay = '';
          el.style.willChange = '';
          el.removeEventListener('transitionend', clear);
        };
        el.addEventListener('transitionend', clear);
        // Fallback cleanup if transitionend never fires (e.g. tab backgrounded).
        setTimeout(clear, delay + 900);

        observer.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  return observer;
}

// Attach reveal behaviour to an existing ref (shared with useTilt on the card).
export function useReveal(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    // Reduced-motion / no-IO: show instantly, no scroll dependency.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return;
    }

    const io = ensureObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, [ref]);
}
