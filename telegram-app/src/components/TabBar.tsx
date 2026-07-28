import { useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCart } from '@/store/cart';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/format';

const TABS = [
  { to: '/', icon: Home, key: 'nav.home' },
  { to: '/menu', icon: UtensilsCrossed, key: 'nav.menu' },
  { to: '/cart', icon: ShoppingBag, key: 'nav.cart' },
  { to: '/orders', icon: ClipboardList, key: 'nav.orders' },
  { to: '/profile', icon: User, key: 'nav.profile' },
] as const;

export default function TabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const count = useCart((s) => s.count());

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around rounded-t-3xl px-2 pt-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      {TABS.map(({ to, icon: Icon, key }) => {
        const active = isActive(to);
        const isCart = to === '/cart';
        return (
          <button
            key={to}
            onClick={() => {
              haptic.select();
              navigate(to);
            }}
            className="relative flex flex-1 flex-col items-center gap-1 py-1.5"
          >
            <span className="relative">
              <Icon
                size={23}
                strokeWidth={active ? 2.5 : 2}
                className={cn('transition-colors', active ? 'text-cherry-500' : 'text-ink-faint')}
              />
              {isCart && count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cherry-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                active ? 'text-ink' : 'text-ink-faint'
              )}
            >
              {t(key)}
            </span>
            {active && (
              <motion.span
                layoutId="tab-dot"
                className="absolute -top-0.5 h-1 w-1 rounded-full bg-cherry-500"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
