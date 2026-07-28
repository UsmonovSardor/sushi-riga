import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '@/lib/categories';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/format';

const GRADIENTS: Record<string, string> = {
  hit: 'from-amber-500/20 to-amber-600/5 text-gold',
  cold: 'from-sky-500/20 to-sky-600/5 text-sky-400',
  hot: 'from-red-500/20 to-red-600/5 text-red-400',
  tempura: 'from-orange-500/20 to-orange-600/5 text-orange-400',
  special: 'from-fuchsia-500/20 to-fuchsia-600/5 text-fuchsia-400',
  double: 'from-violet-500/20 to-violet-600/5 text-violet-400',
  sets: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
  food: 'from-yellow-500/20 to-yellow-600/5 text-yellow-400',
  salad: 'from-lime-500/20 to-lime-600/5 text-lime-400',
  snacks: 'from-rose-500/20 to-rose-600/5 text-rose-400',
  drinks: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400',
};

/** Horizontal scrollable category chips. */
export default function CategoryStrip({ active }: { active?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="no-scrollbar mt-5 flex gap-2.5 overflow-x-auto px-4">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => {
            haptic.select();
            navigate(`/menu/${c.id}`);
          }}
          className={cn(
            'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-b p-3 transition',
            GRADIENTS[c.id] || 'from-surface-2 to-surface',
            active === c.id ? 'ring-2 ring-cherry-500' : ''
          )}
          style={{ minWidth: 74 }}
        >
          <span className="text-2xl">{c.e}</span>
          <span className="max-w-[64px] text-center text-[11px] font-semibold leading-tight text-ink">
            {t(c.k)}
          </span>
        </button>
      ))}
    </div>
  );
}
