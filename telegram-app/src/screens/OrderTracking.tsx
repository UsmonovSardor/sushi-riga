import { useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, Clock, ChefHat, PackageCheck, Bike, XCircle, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersApi, getToken } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { useLang } from '@/hooks/useLang';
import { useBackButton } from '@/hooks/useBackButton';
import { loc, eur, cn } from '@/lib/format';
import Page from '@/components/Page';

const STEPS: { status: OrderStatus; icon: typeof Clock }[] = [
  { status: 'new', icon: Check },
  { status: 'cooking', icon: ChefHat },
  { status: 'ready', icon: PackageCheck },
  { status: 'delivered', icon: Bike },
];

export default function OrderTracking() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();

  const initial = (location.state as { order?: Order } | null)?.order;
  const hasToken = Boolean(getToken());

  useBackButton(() => navigate('/orders', { replace: true }));

  const { data } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: ordersApi.mine,
    enabled: hasToken,
    refetchInterval: (q) => {
      const list = (q.state.data as Order[] | undefined) || [];
      const o = list.find((x) => x.id === id);
      return o && (o.status === 'delivered' || o.status === 'cancelled') ? false : 12000;
    },
  });

  const order = useMemo(
    () => data?.find((o) => o.id === id) || initial,
    [data, id, initial]
  );

  if (!order) {
    return (
      <Page>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
          <div className="text-5xl">🔎</div>
          <p className="mt-4 text-sm text-ink-dim">{t('order.number')} #{id}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-6 rounded-full bg-cherry-500 px-6 py-3 text-sm font-bold text-white"
          >
            {t('order.history')}
          </button>
        </div>
      </Page>
    );
  }

  const cancelled = order.status === 'cancelled';
  const currentIdx = STEPS.findIndex((s) => s.status === order.status);
  const historyAt = (s: OrderStatus) =>
    order.statusHistory?.find((h) => h.status === s)?.at;

  return (
    <Page>
      <div
        className="px-4 pb-2 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('order.tracking')}</h1>
        <p className="mt-1 text-sm text-ink-dim">
          {t('order.number')} <span className="font-bold text-cherry-500">#{order.id}</span>
        </p>
      </div>

      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-emerald-600/5 p-4"
      >
        <PartyPopper className="text-emerald-400" size={24} />
        <div className="text-sm font-semibold text-ink">
          {loc(
            { ru: 'Заказ принят! Мы уже готовим 🍣', lv: 'Pasūtījums pieņemts! Jau gatavojam 🍣', en: 'Order placed! We are cooking 🍣' },
            lang
          )}
        </div>
      </motion.div>

      {/* Stepper */}
      {cancelled ? (
        <div className="mx-4 mt-5 flex items-center gap-3 rounded-2xl bg-red-500/10 p-5">
          <XCircle className="text-red-400" size={28} />
          <div>
            <div className="font-bold text-ink">{t('order.status.cancelled')}</div>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-5 rounded-3xl bg-surface p-5 shadow-card">
          {STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            const Icon = step.icon;
            const at = historyAt(step.status);
            return (
              <div key={step.status} className="flex gap-3.5">
                {/* Rail */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition',
                      done ? 'bg-cherry-500 text-white' : 'bg-surface-2 text-ink-faint',
                      active && 'shadow-glow ring-4 ring-cherry-500/20'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'my-1 w-0.5 flex-1 rounded-full transition',
                        i < currentIdx ? 'bg-cherry-500' : 'bg-surface-2'
                      )}
                      style={{ minHeight: 26 }}
                    />
                  )}
                </div>
                {/* Label */}
                <div className={cn('pb-4', i === STEPS.length - 1 && 'pb-0')}>
                  <div
                    className={cn(
                      'text-[15px] font-bold',
                      done ? 'text-ink' : 'text-ink-faint'
                    )}
                  >
                    {t(`order.status.${step.status}`)}
                  </div>
                  {at && (
                    <div className="mt-0.5 text-xs text-ink-faint">
                      {new Date(at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {active && (
                    <motion.div
                      className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-cherry-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      <div className="mx-4 mt-4 rounded-2xl bg-surface p-4 shadow-card">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-dim">
              {it.e} {loc(it.name, lang)} <span className="text-ink-faint">×{it.qty}</span>
            </span>
            <span className="font-semibold text-ink">{eur(it.price * it.qty)}</span>
          </div>
        ))}
        <div className="my-2 h-px bg-line" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">{t('cart.total')}</span>
          <span className="text-lg font-extrabold text-ink">{eur(order.total)}</span>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate('/menu')}
          className="w-full rounded-2xl bg-surface py-3.5 text-sm font-bold text-ink shadow-card active:scale-[0.99]"
        >
          {t('cart.toMenu')}
        </button>
      </div>
      <div className="h-6" />
    </Page>
  );
}
