import { useRef, useEffect } from 'react';

// Subtle pointer-driven 3D tilt for cards. GPU-only (transform), rAF-throttled,
// and automatically disabled on touch devices and for reduced-motion users.
export function useTilt(max = 8) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (!fine || reduce) return;

    let raf = 0;
    let rect = null;

    const apply = (x, y) => {
      const px = (x - rect.left) / rect.width - 0.5;
      const py = (y - rect.top) / rect.height - 0.5;
      el.style.transform =
        `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
      el.style.setProperty('--gx', `${(px * 100 + 50).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(py * 100 + 50).toFixed(1)}%`);
    };

    const onMove = (e) => {
      if (!rect) rect = el.getBoundingClientRect();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(e.clientX, e.clientY));
    };
    const onEnter = () => { rect = el.getBoundingClientRect(); el.classList.add('tilt-on'); };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      rect = null;
      el.classList.remove('tilt-on');
      el.style.transform = '';
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);

  return ref;
}
