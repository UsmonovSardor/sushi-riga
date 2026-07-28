import { Star } from 'lucide-react';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/format';

interface Props {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

/** Interactive 1–5 star picker. */
export default function RatingInput({ value, onChange, size = 32 }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => {
            haptic.select();
            onChange(n);
          }}
          className="active:scale-90"
          aria-label={`${n} stars`}
        >
          <Star
            size={size}
            className={cn(
              'transition',
              n <= value ? 'fill-gold text-gold' : 'text-ink-faint/40'
            )}
          />
        </button>
      ))}
    </div>
  );
}
