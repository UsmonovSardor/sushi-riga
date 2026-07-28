import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { menuApi, reviewsApi } from '@/lib/api';
import type { MenuItem, ReviewSummary } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { loc, cn } from '@/lib/format';
import { useLang } from '@/hooks/useLang';
import { haptic } from '@/lib/telegram';
import Page from '@/components/Page';
import MenuItemCard from '@/components/MenuItemCard';
import CartCTA from '@/components/CartCTA';
import { GridSkeleton } from '@/components/Skeletons';

export default function Menu() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();
  const [q, setQ] = useState('');

  const active = catId || 'hit';

  const all = useQuery<MenuItem[]>({ queryKey: ['menu'], queryFn: menuApi.getAll });
  const reviews = useQuery<ReviewSummary>({
    queryKey: ['reviews-summary'],
    queryFn: reviewsApi.summary,
  });

  const items = useMemo(() => {
    const list = all.data || [];
    const query = q.trim().toLowerCase();

    if (query) {
      return list.filter((i) => {
        const name = JSON.stringify(i.name).toLowerCase();
        const desc = JSON.stringify(i.desc).toLowerCase();
        return name.includes(query) || desc.includes(query);
      });
    }

    if (active === 'hit') return list.filter((i) => i.hit);

    const cat = CATEGORIES.find((c) => c.id === active);
    const cats = cat?.cats || [active];
    return list.filter((i) => cats.includes((i.cat || '').toLowerCase()));
  }, [all.data, active, q]);

  return (
    <Page>
      {/* Search */}
      <div
        className="sticky top-0 z-20 bg-bg/80 px-4 pb-3 pt-4 backdrop-blur-lg"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <div className="flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5">
          <Search size={18} className="text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="clear">
              <X size={16} className="text-ink-faint" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!q && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                haptic.select();
                navigate(`/menu/${c.id}`);
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition',
                active === c.id
                  ? 'bg-cherry-500 text-white shadow-glow'
                  : 'bg-surface text-ink-dim'
              )}
            >
              <span>{c.e}</span>
              {t(c.k)}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <section className="mt-4 px-4">
        {all.isLoading ? (
          <GridSkeleton n={8} />
        ) : items.length === 0 ? (
          <div className="mt-16 text-center text-ink-faint">
            <div className="text-5xl">🔍</div>
            <p className="mt-3 text-sm">{loc({ ru: 'Ничего не найдено', lv: 'Nekas nav atrasts', en: 'Nothing found' }, lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} rating={reviews.data?.[item.id]} />
            ))}
          </div>
        )}
      </section>

      <CartCTA />
    </Page>
  );
}
