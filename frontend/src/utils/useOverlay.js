import { useEffect } from 'react';

// Ref-counted body scroll-lock so overlapping overlays (e.g. Cart → Checkout)
// never flash the page back into a scrollable state between transitions.
let locks = 0;
let savedOverflow = '';
let savedPadRight = '';

function lock() {
  if (locks === 0) {
    savedOverflow = document.body.style.overflow;
    savedPadRight = document.body.style.paddingRight;
    // Compensate for the disappearing scrollbar to avoid a layout jump on desktop
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    document.body.style.overflow = 'hidden';
  }
  locks++;
}

function unlock() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPadRight;
  }
}

/**
 * Locks background scroll and wires Escape-to-close while an overlay is open.
 * @param {boolean} isOpen  whether the overlay is currently visible
 * @param {() => void} [onClose]  called when the user presses Escape
 */
export function useOverlay(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    lock();
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [isOpen, onClose]);
}
