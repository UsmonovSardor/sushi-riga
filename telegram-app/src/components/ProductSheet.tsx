import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, ShoppingBag } from 'lucide-react';
import { useUI } from '@/store/ui';
import { useCart } from '@/store/cart';
import { reviewsApi } from '@/lib/api';
import type { Review, ReviewSummary } from '@/lib/types';
import { useLang } from '@/hooks/useLang';
import { loc, eur } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import BottomSheet from './BottomSheet';
import QtyStepper from './QtyStepper';
import StarRating from './StarRating';

export default function ProductSheet() {
  const { product, closeProduct } = useUI();
  const { t } = useTranslation();
  const lang = useLang();
  const { add, inc, dec, qtyOf } = useCart();

  const reviews = useQuery<Review[]>({
    queryKey: ['reviews', product?.id],
    queryFn: () => reviewsApi.forMenu(product!.id),
    enabled: Boolean(product),
  });
  const summary = useQuery<ReviewSummary>({
    queryKey: ['reviews-summary'],
    queryFn: reviewsApi.summary,
  });

  const qty = product ? qtyOf(product.id) : 0;
  const stat = product ? summary.data?.[product.id] : undefined;

  return (
    <BottomSheet open={Boolean(product)} onClose={closeProduct}>
      {product && (
        <div className="pb-6">
          {/* Image */}
          <div className="relative mx-4 mt-1 aspect-[16/10] overflow-hidden rounded-2xl bg-surface-2">
            {product.img ? (
              <img src={product.img} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                {product.e || '🍣'}
              </div>
            )}
            {product.hit && (
              <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-black">
                ⭐ HIT
              </span>
            )}
          </div>

          <div className="px-4">
            <div className="mt-3 flex items-start justify-between gap-3">
              <h2 className="text-xl font-extrabold leading-tight text-ink">
                {loc(product.name, lang)}
              </h2>
              {stat && stat.avg > 0 && <StarRating value={stat.avg} count={stat.count} size={14} />}
            </div>

            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              {loc(product.desc, lang)}
            </p>

            {/* Price + add */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-col">
                {product.old && product.old > product.price && (
                  <span className="text-sm font-medium text-ink-faint line-through">
                    {eur(product.old)}
                  </span>
                )}
                <span className="text-2xl font-extrabold text-ink">{eur(product.price)}</span>
              </div>

              {qty > 0 ? (
                <QtyStepper qty={qty} onInc={() => inc(product.id)} onDec={() => dec(product.id)} />
              ) : (
                <button
                  onClick={() => {
                    haptic.medium();
                    add(product);
                  }}
                  className="flex items-center gap-2 rounded-full bg-cherry-500 px-6 py-3 text-sm font-bold text-white shadow-glow active:scale-95"
                >
                  <ShoppingBag size={18} />
                  {t('item.add')}
                </button>
              )}
            </div>

            {/* Reviews */}
            {reviews.data && reviews.data.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-ink">
                  {loc({ ru: 'Отзывы', lv: 'Atsauksmes', en: 'Reviews' }, lang)} ({reviews.data.length})
                </h3>
                <div className="space-y-2.5">
                  {reviews.data.slice(0, 10).map((r) => (
                    <div key={r.id} className="rounded-2xl bg-surface-2 p-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < r.rating ? 'fill-gold text-gold' : 'text-ink-faint/30'}
                          />
                        ))}
                        <span className="ml-auto text-[11px] text-ink-faint">
                          {new Date(r.createdAt).toLocaleDateString(lang)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-1.5 text-sm text-ink-dim">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
