import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store/auth';
import { getTgUser } from '@/lib/telegram';

/** Top header — avatar, greeting, loyalty badge (Oson-Prava style). */
export default function Header() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const tgUser = getTgUser();
  const name = user?.name || tgUser?.first_name || 'Guest';
  const initial = name.charAt(0).toUpperCase();
  const points = user?.points ?? 0;

  return (
    <header
      className="flex items-center justify-between px-4 pt-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {tgUser?.photo_url ? (
            <img
              src={tgUser.photo_url}
              alt={name}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-cherry-500/40"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cherry-500 to-cherry-700 text-lg font-bold text-white">
              {initial}
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg bg-green-500" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold text-ink">{name}</div>
          <div className="text-xs text-ink-dim">{t('home.hello')} 👋</div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 shadow-card">
        <Trophy size={16} className="text-gold" />
        <span className="text-sm font-bold text-ink">{points}</span>
        <span className="text-xs text-ink-faint">{t('home.points')}</span>
      </div>
    </header>
  );
}
