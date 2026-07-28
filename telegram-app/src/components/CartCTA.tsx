import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/store/cart';
import { useMainButton } from '@/hooks/useMainButton';
import { eur } from '@/lib/format';
import { isTelegram } from '@/lib/telegram';
import CartBar from './CartBar';

/**
 * Primary cart CTA for Home/Menu.
 * - In Telegram → native MainButton (no overlap with the tab bar).
 * - In a browser → floating pill.
 */
export default function CartCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const count = useCart((s) => s.count());
  const subtotal = useCart((s) => s.subtotal());
  const inTG = isTelegram();

  useMainButton({
    text: `🛒 ${t('cart.yourCart')} · ${eur(subtotal)}`,
    visible: inTG && count > 0,
    onClick: () => navigate('/cart'),
  });

  if (inTG) return null;
  return <CartBar />;
}
