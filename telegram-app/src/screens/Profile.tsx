import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trophy, MessageCircle, Gift, ChevronRight, Star, ClipboardList } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useLang } from '@/hooks/useLang';
import { reviewsApi, getToken } from '@/lib/api';
import type { PendingReview } from '@/lib/types';
import { getTgUser, haptic, tg } from '@/lib/telegram';
import Page from '@/components/Page';
import { loc } from '@/lib/format';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lang = useLang();
  const user = useAuth((s) => s.user);
  const tgUser = getTgUser();
  const name = user?.name || tgUser?.first_name || 'Guest';
  const points = user?.points ?? 0;

  const pending = useQuery<PendingReview[]>({
    queryKey: ['reviews-pending'],
    queryFn: reviewsApi.myPending,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const pendingCount = pending.data?.length ?? 0;

  return (
    <Page>
      <div
        className="px-4 pb-3 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('profile.title')}</h1>
      </div>

      {/* Profile card */}
      <div className="mx-4 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-cherry-600 to-cherry-700 p-5 shadow-glow">
        {tgUser?.photo_url ? (
          <img src={tgUser.photo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 text-white">
          <div className="text-lg font-extrabold">{name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <Trophy size={15} className="text-gold" />
            {points} {t('home.points')}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-5 overflow-hidden rounded-2xl bg-surface shadow-card">
        <ProfileRow
          icon={<ClipboardList size={18} className="text-cherry-500" />}
          label={t('profile.myOrders')}
          onClick={() => navigate('/orders')}
        />
        <div className="mx-4 h-px bg-line" />
        <ProfileRow
          icon={<Star size={18} className="text-cherry-500" />}
          label={loc({ ru: 'Оценить блюда', lv: 'Novērtēt ēdienus', en: 'Rate dishes' }, lang)}
          badge={pendingCount > 0 ? pendingCount : undefined}
          onClick={() => navigate('/reviews')}
        />
        <div className="mx-4 h-px bg-line" />
        <ProfileRow icon={<Gift size={18} className="text-cherry-500" />} label={t('profile.invite')} />
        <div className="mx-4 h-px bg-line" />
        <ProfileRow
          icon={<MessageCircle size={18} className="text-cherry-500" />}
          label={t('profile.support')}
          onClick={() => tg?.openTelegramLink('https://t.me/cherrysushi_support')}
        />
      </div>

      <p className="mt-8 text-center text-xs text-ink-faint">Cherry Sushi · Rīga · v0.1</p>
    </Page>
  );
}

function ProfileRow({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={() => {
        haptic.light();
        onClick?.();
      }}
      className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-surface-2"
    >
      {icon}
      <span className="flex-1 text-left text-sm font-semibold text-ink">{label}</span>
      {badge != null && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cherry-500 px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
      <ChevronRight size={18} className="text-ink-faint" />
    </button>
  );
}
