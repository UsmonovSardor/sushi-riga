import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { menuApi, reviewsApi } from '@/lib/api';
import type { MenuItem, ReviewSummary } from '@/lib/types';
import Page from '@/components/Page';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import CategoryStrip from '@/components/CategoryStrip';
import MenuItemCard from '@/components/MenuItemCard';
import CartCTA from '@/components/CartCTA';
import { GridSkeleton } from '@/components/Skeletons';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const hits = useQuery<MenuItem[]>({ queryKey: ['hits'], queryFn: menuApi.getHits });
  const all = useQuery<MenuItem[]>({ queryKey: ['menu'], queryFn: menuApi.getAll });
  const reviews = useQuery<ReviewSummary>({
    queryKey: ['reviews-summary'],
    queryFn: reviewsApi.summary,
  });

  const featured = (hits.data && hits.data.length ? hits.data : all.data)?.slice(0, 6);

  return (
    <Page>
      <Header />
      <HeroBanner />
      <CategoryStrip />

      <section className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">⭐ {t('home.bestSellers')}</h2>
          <button
            onClick={() => navigate('/menu')}
            className="text-sm font-semibold text-cherry-500"
          >
            {t('home.all')}
          </button>
        </div>

        {hits.isLoading || all.isLoading ? (
          <GridSkeleton n={6} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featured?.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                rating={reviews.data?.[item.id]}
              />
            ))}
          </div>
        )}
      </section>

      <CartCTA />
    </Page>
  );
}
