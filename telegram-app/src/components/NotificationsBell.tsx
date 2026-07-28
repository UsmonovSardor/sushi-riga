import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight } from 'lucide-react';
import { ordersApi, getToken } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { useLang } from '@/hooks/useLang';
import { loc, cn } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import BottomSheet from './BottomSheet';

interface NewsItem {
  emoji: string;
  title: string;
  body: string;
}

const STATUS_EMOJI: Record<OrderStatus, string> = {
  new: '📥',
  cooking: '👨‍🍳',
  ready: '✅',
  delivered: '🛵',
  cancelled: '❌',
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();

  const { data: orders } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: ordersApi.mine,
    enabled: Boolean(getToken()),
    retry: false,
    refetchInterval: 20000,
  });

  const active = (orders || []).filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  const news = t('news', { returnObjects: true }) as NewsItem[];
  const badge = active.length;

  return (
    <>
      <button
        onClick={() => {
          haptic.light();
          setOpen(true);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-card active:scale-95"
        aria-label="notifications"
      >
        <Bell size={17} className="text-ink-dim" />
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cherry-500 px-1 text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="px-4 pb-8 pt-2">
          <h2 className="mb-4 text-lg font-extrabold text-ink">{t('notif.title')}</h2>

          {/* Active orders */}
          {active.length > 0 && (
            <div className="mb-5 space-y-2">
              {active.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    haptic.select();
                    setOpen(false);
                    navigate(`/order/${o.id}`, { state: { order: o } });
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-cherry-500/12 to-transparent p-3.5 text-left active:scale-[0.99]"
                >
                  <span className="text-2xl">{STATUS_EMOJI[o.status]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink">
                      {t('notif.yourOrder')} #{o.id}
                    </div>
                    <div className="text-xs font-semibold text-cherry-500">
                      {t(`order.status.${o.status}`)}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-faint" />
                </button>
              ))}
            </div>
          )}

          {/* News */}
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
            {t('notif.newsTitle')}
          </div>
          <div className="space-y-2">
            {news.map((n, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5',
                )}
              >
                <span className="text-2xl">{n.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-ink">{n.title}</div>
                  <div className="mt-0.5 text-xs text-ink-dim">{n.body}</div>
                </div>
              </div>
            ))}
          </div>

          {active.length === 0 && (
            <p className="mt-4 text-center text-xs text-ink-faint">
              {loc(
                { ru: 'Здесь появятся статусы ваших заказов', lv: 'Šeit parādīsies jūsu pasūtījumu statusi', en: 'Your order statuses will appear here' },
                lang
              )}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
