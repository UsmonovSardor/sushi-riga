import React, { useEffect, useState } from 'react';
import { ordersApi, reviewsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const STATUS_INFO = {
  new: { label: { lv: 'Jauns', ru: 'Новый', en: 'New' }, icon: '🆕', step: 0 },
  cooking: { label: { lv: 'Gatavo', ru: 'Готовится', en: 'Cooking' }, icon: '👨‍🍳', step: 1 },
  ready: { label: { lv: 'Gatavs', ru: 'Готово', en: 'Ready' }, icon: '✅', step: 2 },
  delivered: { label: { lv: 'Piegādāts', ru: 'Доставлен', en: 'Done' }, icon: '🚀', step: 3 },
  cancelled: { label: { lv: 'Atcelts', ru: 'Отменён', en: 'Cancelled' }, icon: '❌', step: -1 },
};

const STEPS = ['new', 'cooking', 'ready', 'delivered'];

const ratingText = {
  en: ['', 'Bad 😕', 'Okay 😐', 'Good 🙂', 'Great 😍', 'Perfect 🔥'],
  ru: ['', 'Плохо 😕', 'Нормально 😐', 'Хорошо 🙂', 'Отлично 😍', 'Идеально 🔥'],
  lv: ['', 'Slikti 😕', 'Normāli 😐', 'Labi 🙂', 'Ļoti labi 😍', 'Perfekti 🔥'],
};

function Stars({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(i)}
          style={{
            fontSize: size,
            color: (hover || value) >= i ? '#f59e0b' : '#d1d5db',
            cursor: onChange ? 'pointer' : 'default',
            transition: 'color .15s',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewModal({ item, onClose, onDone }) {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoad] = useState(false);
  const [err, setErr] = useState('');

  const L = {
    choose: { lv: 'Jūsu vērtējums:', ru: 'Ваша оценка:', en: 'Your rating:' },
    comment: {
      lv: 'Uzrakstiet komentāru (nav obligāti)...',
      ru: 'Напишите комментарий (необязательно)...',
      en: 'Write a comment (optional)...',
    },
    selectStar: {
      lv: 'Izvēlieties zvaigzni',
      ru: 'Выберите звезду',
      en: 'Please select a star',
    },
    submit: { lv: '⭐ Novērtēt', ru: '⭐ Оценить', en: '⭐ Rate' },
    cancel: { lv: 'Atcelt', ru: 'Отмена', en: 'Cancel' },
    order: { lv: 'Pasūtījums', ru: 'Заказ', en: 'Order' },
  };

  const t = key => L[key]?.[lang] || L[key]?.ru || L[key]?.en;

  async function submit() {
    if (!rating) {
      setErr(t('selectStar'));
      return;
    }

    setLoad(true);
    setErr('');

    try {
      await reviewsApi.add({
        menuId: item.menuId,
        orderId: item.orderId,
        rating,
        comment,
      });
      onDone();
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setLoad(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 28,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>
            {item.itemEmoji || '🍣'}
          </div>

          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>
            {typeof item.itemName === 'object'
              ? item.itemName[lang] || item.itemName.ru || item.itemName.en
              : item.itemName}
          </div>

          <div style={{ fontSize: '.82rem', color: '#9ca3af', marginTop: 4 }}>
            {t('order')} #{item.orderId}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '.85rem', color: '#6b7280', marginBottom: 10 }}>
            {t('choose')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Stars value={rating} onChange={setRating} size={36} />
          </div>

          {rating > 0 && (
            <div
              style={{
                fontSize: '.78rem',
                color: '#f59e0b',
                marginTop: 6,
                fontWeight: 700,
              }}
            >
              {ratingText[lang]?.[rating] || ratingText.ru[rating]}
            </div>
          )}
        </div>

        <textarea
          placeholder={t('comment')}
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={400}
          style={{
            width: '100%',
            height: 90,
            border: '1.5px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '.88rem',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {err && (
          <div style={{ color: '#e31e24', fontSize: '.8rem', marginTop: 6 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              background: '#e31e24',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: '.9rem',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳...' : t('submit')}
          </button>

          <button
            onClick={onClose}
            style={{
              height: 44,
              padding: '0 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage({ isOpen, onClose }) {
  const { lang } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState([]);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewed, setReviewed] = useState(new Set());

  const L = {
    title: { lv: 'Mani pasūtījumi', ru: 'Мои заказы', en: 'My Orders' },
    empty: { lv: 'Nav pasūtījumu', ru: 'Нет заказов', en: 'No orders yet' },
    load: { lv: 'Ielādē...', ru: 'Загрузка...', en: 'Loading...' },
    total: { lv: 'Kopā', ru: 'Итого', en: 'Total' },
    review: { lv: 'Novērtēt', ru: 'Оценить', en: 'Rate' },
    pendingTitle: {
      lv: 'Nenovērtēti ēdieni:',
      ru: 'Неоценённые блюда:',
      en: 'Unrated items:',
    },
    pendingSub: {
      lv: 'Atstājiet savu atsauksmi!',
      ru: 'Оставьте свой отзыв!',
      en: 'Leave your feedback!',
    },
    rated: { lv: '✅ Novērtēts', ru: '✅ Оценено', en: '✅ Rated' },
    ready: {
      lv: '✅ Pasūtījums gatavs!',
      ru: '✅ Заказ готов!',
      en: '✅ Order is ready!',
    },
  };

  const t = key => L[key]?.[lang] || L[key]?.ru || L[key]?.en;

  const loadAll = async () => {
    setLoading(true);

    try {
      const [data, pend] = await Promise.all([
        ordersApi.getMine(),
        reviewsApi.getMyPending().catch(() => []),
      ]);

      setOrders(Array.isArray(data) ? data : []);
      setPending(Array.isArray(pend) ? pend : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!isOpen) return;

  loadAll();
  const id = setInterval(loadAll, 10000);
  window.addEventListener('sr_order_created', loadAll);

  return () => {
    clearInterval(id);
    window.removeEventListener('sr_order_created', loadAll);
  };
}, [isOpen]);

  return (
    <>
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onDone={() => {
            setReviewed(
              s => new Set([...s, reviewItem.menuId + '_' + reviewItem.orderId])
            );

            setPending(p =>
              p.filter(
                x =>
                  !(
                    x.menuId === reviewItem.menuId &&
                    x.orderId === reviewItem.orderId
                  )
              )
            );

            setReviewItem(null);
          }}
        />
      )}

      <div className="orders-overlay" onMouseDown={onClose}>
         <div className="orders-panel" onMouseDown={e => e.stopPropagation()}>
          <div className="orders-head">
            <h2>📦 {t('title')}</h2>
          <button type="button" onMouseDown={e => e.stopPropagation()} onClick={onClose}>×</button>
      </div>
  
          {pending.length > 0 && (
            <div
              style={{
                margin: '12px 16px',
                background: 'linear-gradient(135deg,#fff7ed,#fef3c7)',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1.5px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>⭐</span>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '.88rem',
                    color: '#92400e',
                  }}
                >
                  {t('pendingTitle')} {pending.length}
                </div>

                <div
                  style={{
                    fontSize: '.76rem',
                    color: '#b45309',
                    marginTop: 2,
                  }}
                >
                  {t('pendingSub')}
                </div>
              </div>
            </div>
          )}

          {loading && <p className="orders-empty">{t('load')}</p>}
          {!loading && orders.length === 0 && (
            <p className="orders-empty">{t('empty')}</p>
          )}

          <div className="orders-list">
            {orders.map(order => {
              const info = STATUS_INFO[order.status] || STATUS_INFO.new;
              const stepIdx = STEPS.indexOf(order.status);
              const isCancelled = order.status === 'cancelled';
              const orderPending = pending.filter(p => p.orderId === order.id);

              return (
                <div className="order-card" key={order.id}>
                  <div className="order-top">
                    <strong style={{ color: '#e31e24' }}>#{order.id}</strong>

                    <span
                      style={{
                        background: isCancelled ? '#fee2e2' : '#f0fdf4',
                        color: isCancelled ? '#991b1b' : '#166534',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: '.76rem',
                        fontWeight: 700,
                      }}
                    >
                      {info.icon} {info.label[lang] || info.label.ru}
                    </span>
                  </div>

                  {!isCancelled && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0,
                        padding: '10px 0 6px',
                      }}
                    >
                      {STEPS.map((step, i) => {
                        const done = stepIdx >= i;

                        return (
                          <React.Fragment key={step}>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: done ? '#e31e24' : '#e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '.65rem',
                                  color: done ? '#fff' : '#9ca3af',
                                  fontWeight: 700,
                                  transition: 'background .3s',
                                  boxShadow: done
                                    ? '0 0 0 3px rgba(227,30,36,.15)'
                                    : 'none',
                                }}
                              >
                                {done ? STATUS_INFO[step].icon : i + 1}
                              </div>
                            </div>

                            {i < STEPS.length - 1 && (
                              <div
                                style={{
                                  flex: 1,
                                  height: 3,
                                  background:
                                    stepIdx > i ? '#e31e24' : '#e5e7eb',
                                  transition: 'background .3s',
                                  borderRadius: 2,
                                }}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="order-items" style={{ marginTop: 10 }}>
                    {(order.items || []).map(item => {
                      const pend = orderPending.find(p => p.menuId === item.id);
                      const alreadyDone = reviewed.has(item.id + '_' + order.id);

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom: '1px solid #f3f4f6',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: '.84rem' }}>
                            {item.e}{' '}
                            {typeof item.name === 'object'
                              ? item.name[lang] || item.name.ru || item.name.en
                              : item.name}{' '}
                            ×{item.qty}
                          </span>

                          {pend && !alreadyDone && (
                            <button
                              onClick={() => setReviewItem(pend)}
                              style={{
                                fontSize: '.72rem',
                                background: '#fef9c3',
                                color: '#92400e',
                                border: '1px solid #fbbf24',
                                borderRadius: 8,
                                padding: '3px 10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ⭐ {t('review')}
                            </button>
                          )}

                          {alreadyDone && (
                            <span style={{ fontSize: '.72rem', color: '#22c55e' }}>
                              {t('rated')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="order-total" style={{ marginTop: 10 }}>
                    {t('total')}: <b>€{Number(order.total || 0).toFixed(2)}</b>
                  </div>

                  {order.status === 'ready' && (
                    <div
                      className="order-ready"
                      style={{
                        marginTop: 8,
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: '.84rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      {t('ready')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
