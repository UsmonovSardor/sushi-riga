import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersApi, getToken } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import type { Order, OrderStatus } from '@/lib/types';
import { useLang } from '@/hooks/useLang';
import { loc, eur, cn } from '@/lib/format';
import Page from '@/components/Page';

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'bg-sky-500/15 text-sky-400',
  cooking: 'bg-amber-500/15 text-amber-400',
  ready: 'bg-emerald-500/15 text-emerald-400',
  delivered: 'bg-ink-faint/15 text-ink-dim',
  cancelled: 'bg-red-500/15 text-red-400',
};

export default function Orders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useLang();
  const hasToken = Boolean(getToken());

  const { data, isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: ordersApi.mine,
    enabled: hasToken,
    retry: false,
  });

  return (
    <Page>
      <div
        className="px-4 pb-3 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('order.history')}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 text-center">
          <div className="text-6xl">📦</div>
          <p className="mt-4 text-sm text-ink-dim">{t('order.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {data.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                haptic.select();
                navigate(`/order/${o.id}`, { state: { order: o } });
              }}
              className="block w-full rounded-2xl bg-surface p-4 text-left shadow-card active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">
                  {t('order.number')} #{o.id}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    STATUS_STYLE[o.status]
                  )}
                >
                  {t(`order.status.${o.status}`)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs text-ink-faint">
                {o.items.slice(0, 3).map((it, i) => (
                  <span key={i}>
                    {it.e} {loc(it.name, lang)} ×{it.qty}
                    {i < Math.min(o.items.length, 3) - 1 ? ' ·' : ''}
                  </span>
                ))}
                {o.items.length > 3 && <span>+{o.items.length - 3}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ink-faint">
                  {new Date(o.createdAt).toLocaleString(lang)}
                </span>
                <span className="text-base font-extrabold text-ink">{eur(o.total)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Page>
  );
}
