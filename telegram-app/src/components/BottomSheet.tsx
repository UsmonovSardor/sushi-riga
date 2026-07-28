import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { haptic } from '@/lib/telegram';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Reusable draggable-dismiss bottom sheet with scrim. */
export default function BottomSheet({ open, onClose, children }: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              haptic.light();
              onClose();
            }}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] max-w-[520px] overflow-y-auto rounded-t-3xl bg-surface no-scrollbar"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) {
                haptic.light();
                onClose();
              }
            }}
          >
            <div className="sticky top-0 z-10 flex justify-center bg-surface pb-1 pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-ink-faint/40" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
