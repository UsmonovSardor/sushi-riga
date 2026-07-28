import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, MessageSquare, Wallet, CreditCard, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/store/cart';
import { useCheckout } from '@/store/checkout';
import { useAuth } from '@/store/auth';
import { useLang } from '@/hooks/useLang';
import { useMainButton } from '@/hooks/useMainButton';
import { ordersApi, tmaApi } from '@/lib/api';
import { eur, cn } from '@/lib/format';
import { haptic, tg, getTgUser } from '@/lib/telegram';
import Page from '@/components/Page';

const FREE_DELIVERY_FROM = 20;
const DELIVERY_FEE = 2.5;

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();
  const { lines, subtotal, clear } = useCart();
  const cs = useCheckout();
  const user = useAuth((s) => s.user);
  const tgUser = getTgUser();

  const [name, setName] = useState(cs.name || user?.name || tgUser?.first_name || '');
  const [phone, setPhone] = useState(cs.phone || user?.phone || '');
  const [address, setAddress] = useState(cs.address || '');
  const [note, setNote] = useState(cs.note || '');
  const [pay, setPay] = useState<'cash' | 'card'>(cs.payMethod || 'cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const config = useQuery({ queryKey: ['tma-config'], queryFn: tmaApi.config });
  const cardEnabled = Boolean(config.data?.payments);

  const sub = subtotal();
  const delivery = sub >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = sub + delivery;

  const phoneDigits = phone.replace(/\D/g, '');
  const valid = name.trim().length >= 2 && phoneDigits.length >= 7 && address.trim().length >= 4;

  // Redirect if cart emptied
  useEffect(() => {
    if (lines.length === 0 && !submitting) navigate('/menu', { replace: true });
  }, [lines.length, submitting, navigate]);

  const placeOrder = useMemo(
    () => async () => {
      if (!valid || submitting) {
        haptic.error();
        return;
      }
      setSubmitting(true);
      setError('');
      cs.set({ name, phone, address, note, payMethod: pay });

      try {
        const { order } = await ordersApi.create({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note.trim(),
          lang,
          payMethod: pay,
          items: lines.map((l) => ({
            id: l.id,
            qty: l.qty,
            e: l.e,
            name: l.name,
            price: l.price,
          })),
        });

        // Card → Telegram Payments invoice
        if (pay === 'card' && cardEnabled && tg?.openInvoice) {
          const { url } = await tmaApi.invoice(order.id);
          tg.openInvoice(url, (status) => {
            if (status === 'paid') {
              haptic.success();
              clear();
              navigate(`/order/${order.id}`, { state: { order }, replace: true });
            } else {
              // Order exists but unpaid — let user retry or switch to cash
              haptic.warning();
              setSubmitting(false);
              if (status === 'failed') setError('Payment failed');
            }
          });
          return;
        }

        haptic.success();
        clear();
        navigate(`/order/${order.id}`, { state: { order }, replace: true });
      } catch (e) {
        haptic.error();
        setError((e as Error).message || 'Error');
        setSubmitting(false);
      }
    },
    [valid, submitting, name, phone, address, note, pay, cardEnabled, lang, lines, cs, clear, navigate]
  );

  useMainButton({
    text: submitting
      ? '…'
      : `${pay === 'card' ? t('checkout.pay_place') : t('checkout.place')} · ${eur(total)}`,
    active: valid && !submitting,
    progress: submitting,
    onClick: placeOrder,
  });

  const shareContact = () => {
    haptic.light();
    tg?.requestContact?.((ok) => {
      if (ok && tgUser) {
        // Newer clients expose the phone via the bot; here we just nudge the user.
        haptic.success();
      }
    });
  };

  return (
    <Page>
      <div
        className="px-4 pb-2 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('checkout.title')}</h1>
      </div>

      <div className="space-y-3 px-4">
        <Field icon={<User size={18} />} label={t('checkout.name')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={t('checkout.name')}
          />
        </Field>

        <Field icon={<Phone size={18} />} label={t('checkout.phone')}>
          <div className="flex items-center gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="input flex-1"
              placeholder="+371 ..."
            />
            {tg?.requestContact && (
              <button
                onClick={shareContact}
                className="shrink-0 rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-cherry-500"
              >
                📱
              </button>
            )}
          </div>
        </Field>

        <Field icon={<MapPin size={18} />} label={t('checkout.address')}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
            placeholder={t('checkout.address')}
          />
        </Field>

        <Field icon={<MessageSquare size={18} />} label={t('checkout.note')}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder={t('checkout.note')}
          />
        </Field>

        {/* Payment method */}
        <div className="pt-1">
          <div className="mb-2 text-sm font-semibold text-ink-dim">{t('checkout.pay')}</div>
          <div className="grid grid-cols-2 gap-2.5">
            <PayOption
              active={pay === 'cash'}
              icon={<Wallet size={18} />}
              label={t('checkout.cash')}
              onClick={() => {
                haptic.select();
                setPay('cash');
              }}
            />
            <PayOption
              active={pay === 'card'}
              icon={<CreditCard size={18} />}
              label={t('checkout.card')}
              soon={!cardEnabled}
              onClick={() => {
                if (!cardEnabled) {
                  haptic.warning();
                  return;
                }
                haptic.select();
                setPay('card');
              }}
            />
          </div>
        </div>

        {/* Totals */}
        <div className="mt-2 space-y-1.5 rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex justify-between text-sm text-ink-dim">
            <span>{t('cart.subtotal')}</span>
            <span className="font-semibold text-ink">{eur(sub)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-dim">
            <span>{t('cart.delivery')}</span>
            <span className="font-semibold text-ink">{delivery === 0 ? '✓' : eur(delivery)}</span>
          </div>
          <div className="my-1 h-px bg-line" />
          <div className="flex justify-between">
            <span className="text-base font-bold text-ink">{t('cart.total')}</span>
            <span className="text-xl font-extrabold text-ink">{eur(total)}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* In-page fallback button (for browser / no MainButton) */}
      <div className="mx-4 mt-4">
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={!valid || submitting}
          onClick={placeOrder}
          className={cn(
            'flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white transition',
            valid && !submitting
              ? 'bg-gradient-to-r from-cherry-500 to-cherry-600 shadow-glow'
              : 'bg-surface-2 text-ink-faint'
          )}
        >
          <span className="text-base font-bold">
            {submitting ? '…' : t('checkout.place')}
          </span>
          <span className="text-lg font-extrabold">{eur(total)}</span>
        </motion.button>
      </div>
      <div className="h-8" />

      <style>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border-radius: 0.9rem;
          padding: 0.7rem 0.9rem;
          color: var(--ink);
          font-size: 0.95rem;
          outline: none;
        }
        .input::placeholder { color: var(--ink-faint); }
      `}</style>
    </Page>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink-dim">
        <span className="text-cherry-500">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function PayOption({
  icon,
  label,
  active,
  soon,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  soon?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={soon}
      className={cn(
        'relative flex items-center gap-2 rounded-2xl border p-3.5 text-left text-sm font-semibold transition',
        active
          ? 'border-cherry-500 bg-cherry-500/10 text-ink'
          : 'border-line bg-surface text-ink-dim'
      )}
    >
      <span className={active ? 'text-cherry-500' : 'text-ink-faint'}>{icon}</span>
      <span className="leading-tight">{label}</span>
      {soon && (
        <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold text-ink-faint">
          <Lock size={9} /> soon
        </span>
      )}
    </button>
  );
}
