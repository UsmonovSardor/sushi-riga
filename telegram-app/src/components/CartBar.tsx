import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/store/cart';
import { eur } from '@/lib/format';
import { haptic } from '@/lib/telegram';

/** Floating cart summary — mirrors the website's "Your Cart €52.70" pill. */
export default function CartBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const count = useCart((s) => s.count());
  const subtotal = useCart((s) => s.subtotal());

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={() => {
            haptic.medium();
            navigate('/cart');
          }}
          className="fixed inset-x-4 bottom-[86px] z-30 mx-auto flex max-w-[488px] items-center justify-between rounded-2xl bg-gradient-to-r from-cherry-500 to-cherry-600 px-4 py-3.5 text-white shadow-glow"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <ShoppingBag size={18} />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-cherry-600">
                {count}
              </span>
            </span>
            <span className="text-sm font-bold">{t('cart.yourCart')}</span>
          </span>
          <span className="flex items-center gap-2 text-base font-extrabold">
            {eur(subtotal)}
            <ArrowRight size={18} />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
