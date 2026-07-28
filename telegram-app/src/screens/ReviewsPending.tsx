import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { reviewsApi, getToken } from '@/lib/api';
import type { PendingReview } from '@/lib/types';
import { useLang } from '@/hooks/useLang';
import { useBackButton } from '@/hooks/useBackButton';
import { loc } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import Page from '@/components/Page';
import BottomSheet from '@/components/BottomSheet';
import RatingInput from '@/components/RatingInput';

export default function ReviewsPending() {
  const navigate = useNavigate();
  const lang = useLang();
  const qc = useQueryClient();
  const hasToken = Boolean(getToken());

  const [selected, setSelected] = useState<PendingReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useBackButton(() => navigate('/profile', { replace: true }));

  const { data, isLoading } = useQuery<PendingReview[]>({
    queryKey: ['reviews-pending'],
    queryFn: reviewsApi.myPending,
    enabled: hasToken,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () =>
      reviewsApi.add({
        menuId: selected!.menuId,
        orderId: selected!.orderId,
        rating,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      haptic.success();
      qc.invalidateQueries({ queryKey: ['reviews-pending'] });
      qc.invalidateQueries({ queryKey: ['reviews-summary'] });
      close();
    },
    onError: () => haptic.error(),
  });

  const close = () => {
    setSelected(null);
    setRating(5);
    setComment('');
  };

  return (
    <Page>
      <div
        className="px-4 pb-2 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <h1 className="text-2xl font-extrabold text-ink">
          {loc({ ru: 'Оцените блюда', lv: 'Novērtējiet ēdienus', en: 'Rate dishes' }, lang)}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          {loc(
            { ru: 'Поделитесь мнением о доставленных заказах', lv: 'Dalieties ar viedokli par pasūtījumiem', en: 'Share your opinion on delivered orders' },
            lang
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 text-center">
          <div className="text-6xl">🌟</div>
          <p className="mt-4 text-sm text-ink-dim">
            {loc({ ru: 'Нет блюд для оценки', lv: 'Nav ēdienu ko novērtēt', en: 'Nothing to rate' }, lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {data.map((p) => (
            <button
              key={`${p.orderId}_${p.menuId}`}
              onClick={() => {
                haptic.select();
                setSelected(p);
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left shadow-card active:scale-[0.99]"
            >
              <span className="text-3xl">{p.itemEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="clamp-2 text-sm font-bold text-ink">{p.itemName}</div>
                <div className="text-xs text-ink-faint">#{p.orderId}</div>
              </div>
              <div className="flex items-center gap-0.5 text-ink-faint">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Rating sheet */}
      <BottomSheet open={Boolean(selected)} onClose={close}>
        {selected && (
          <div className="px-5 pb-8 pt-2">
            <div className="text-center">
              <div className="text-5xl">{selected.itemEmoji}</div>
              <h3 className="mt-2 text-lg font-extrabold text-ink">{selected.itemName}</h3>
            </div>

            <div className="mt-5">
              <RatingInput value={rating} onChange={setRating} />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder={loc(
                { ru: 'Ваш отзыв (по желанию)', lv: 'Jūsu atsauksme (pēc izvēles)', en: 'Your review (optional)' },
                lang
              )}
              className="mt-5 w-full resize-none rounded-2xl bg-surface-2 p-3.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />

            <button
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cherry-500 to-cherry-600 py-4 text-base font-bold text-white shadow-glow active:scale-[0.99] disabled:opacity-60"
            >
              {submit.isPending
                ? '…'
                : loc({ ru: 'Отправить', lv: 'Nosūtīt', en: 'Submit' }, lang)}
            </button>
          </div>
        )}
      </BottomSheet>
    </Page>
  );
}
