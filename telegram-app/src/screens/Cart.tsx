import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/store/cart';
import { useLang } from '@/hooks/useLang';
import { useMainButton } from '@/hooks/useMainButton';
import { loc, eur } from '@/lib/format';
import { haptic, isTelegram } from '@/lib/telegram';
import Page from '@/components/Page';
import QtyStepper from '@/components/QtyStepper';

export default function Cart() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();
  const { lines, inc, dec, remove, subtotal } = useCart();
  const total = subtotal();
  const inTG = isTelegram();
  const empty = lines.length === 0;

  useMainButton({
    text: `${t('cart.checkout')} · ${eur(total)}`,
    visible: inTG && !empty,
    onClick: () => navigate('/checkout'),
  });

  if (empty) {
    return (
      <Page>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
          <div className="text-6xl">🛒</div>
          <h2 className="mt-4 text-xl font-extrabold text-ink">{t('cart.empty')}</h2>
          <p className="mt-2 text-sm text-ink-dim">{t('cart.emptyHint')}</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-6 rounded-full bg-cherry-500 px-6 py-3 text-sm font-bold text-white shadow-glow active:scale-95"
          >
            {t('cart.toMenu')}
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div
        className="px-4 pb-3 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('cart.title')}</h1>
      </div>

      <div className="space-y-2.5 px-4">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={l.id}
              layout
              exit={{ opacity: 0, x: -40 }}
              className="flex items-center gap-3 rounded-2xl bg-surface p-2.5 shadow-card"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {l.img ? (
                  <img src={l.img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {l.e}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="clamp-2 text-sm font-bold text-ink">{loc(l.name, lang)}</div>
                <div className="mt-0.5 text-sm font-extrabold text-cherry-500">
                  {eur(l.price * l.qty)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => {
                    haptic.warning();
                    remove(l.id);
                  }}
                  className="text-ink-faint active:scale-90"
                  aria-label="remove"
                >
                  <Trash2 size={16} />
                </button>
                <QtyStepper qty={l.qty} onInc={() => inc(l.id)} onDec={() => dec(l.id)} size="sm" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="mx-4 mt-5 rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-ink">{t('cart.total')}</span>
          <span className="text-2xl font-extrabold text-ink">{eur(total)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">{t('cart.deliveryNote')}</p>
      </div>

      {/* Browser fallback button (Telegram uses the native MainButton) */}
      {!inTG && (
        <div className="fixed inset-x-0 bottom-[76px] z-30 mx-auto max-w-[520px] px-4">
          <button
            onClick={() => {
              haptic.medium();
              navigate('/checkout');
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-cherry-500 to-cherry-600 px-5 py-4 text-white shadow-glow active:scale-[0.99]"
          >
            <span className="text-base font-bold">{t('cart.checkout')}</span>
            <span className="text-lg font-extrabold">{eur(total)}</span>
          </button>
        </div>
      )}
      <div className="h-20" />
    </Page>
  );
}
