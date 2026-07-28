import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MenuItem } from '@/lib/types';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { useLang } from '@/hooks/useLang';
import { loc, eur } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import StarRating from './StarRating';
import QtyStepper from './QtyStepper';

interface Props {
  item: MenuItem;
  rating?: { avg: number; count: number };
}

export default function MenuItemCard({ item, rating }: Props) {
  const lang = useLang();
  const { add, inc, dec, qtyOf } = useCart();
  const openProduct = useUI((s) => s.openProduct);
  const qty = qtyOf(item.id);

  const open = () => {
    haptic.light();
    openProduct(item);
  };

  return (
    <motion.div
      layout
      className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card"
    >
      <div onClick={open} className="relative aspect-[5/4] w-full cursor-pointer overflow-hidden bg-surface-2">
        {item.img ? (
          <img
            src={item.img}
            alt={loc(item.name, lang)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {item.e || '🍣'}
          </div>
        )}
        {item.hit && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-black shadow">
            ⭐ HIT
          </span>
        )}
        {item.old && item.old > item.price && (
          <span className="absolute right-2 top-2 rounded-full bg-cherry-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
            -{Math.round((1 - item.price / item.old) * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div onClick={open} className="cursor-pointer">
          <h3 className="clamp-2 text-sm font-bold leading-tight text-ink">
            {loc(item.name, lang)}
          </h3>
          <p className="clamp-2 mt-1 text-xs leading-snug text-ink-faint">
            {loc(item.desc, lang)}
          </p>
        </div>

        {rating && rating.avg > 0 && (
          <div className="mt-1.5">
            <StarRating value={rating.avg} count={rating.count} />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col">
            {item.old && item.old > item.price && (
              <span className="text-[11px] font-medium text-ink-faint line-through">
                {eur(item.old)}
              </span>
            )}
            <span className="text-base font-extrabold text-ink">{eur(item.price)}</span>
          </div>

          {qty > 0 ? (
            <QtyStepper qty={qty} onInc={() => inc(item.id)} onDec={() => dec(item.id)} size="sm" />
          ) : (
            <button
              onClick={() => {
                haptic.medium();
                add(item);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cherry-500 text-white shadow-glow active:scale-90"
              aria-label="add"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
