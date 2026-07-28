import { Star } from 'lucide-react';
import { cn } from '@/lib/format';

interface Props {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

export default function StarRating({ value, count, size = 12, className }: Props) {
  if (!value) return null;
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star size={size} className="fill-gold text-gold" />
      <span className="text-xs font-semibold text-ink-dim">{value.toFixed(1)}</span>
      {count != null && count > 0 && (
        <span className="text-[11px] text-ink-faint">({count})</span>
      )}
    </span>
  );
}
