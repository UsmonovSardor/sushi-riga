import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { haptic } from '@/lib/telegram';

export default function HeroBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-cherry-600 via-cherry-500 to-[#ff6a3d] p-5 shadow-glow"
    >
      <div className="absolute -right-6 -top-8 text-[120px] opacity-20 blur-[1px]">🍣</div>
      <div className="relative z-10 max-w-[70%]">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          🔥 Sale
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight text-white">
          {t('home.saleTitle')}
        </h2>
        <p className="mt-1 text-sm text-white/80">{t('home.saleSub')}</p>
        <button
          onClick={() => {
            haptic.medium();
            navigate('/menu/sets');
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-cherry-600 active:scale-95"
        >
          {t('home.orderNow')}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
