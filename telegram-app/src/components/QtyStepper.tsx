import { Minus, Plus } from 'lucide-react';
import { haptic } from '@/lib/telegram';

interface Props {
  qty: number;
  onInc: () => void;
  onDec: () => void;
  size?: 'sm' | 'md';
}

export default function QtyStepper({ qty, onInc, onDec, size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-8' : 'h-9';
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <div className={`flex ${h} items-center gap-1 rounded-full bg-surface-2 p-1`}>
      <button
        onClick={() => {
          haptic.light();
          onDec();
        }}
        className={`flex ${btn} items-center justify-center rounded-full text-ink active:scale-90`}
        aria-label="minus"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-6 text-center text-sm font-bold text-ink">{qty}</span>
      <button
        onClick={() => {
          haptic.light();
          onInc();
        }}
        className={`flex ${btn} items-center justify-center rounded-full bg-cherry-500 text-white active:scale-90`}
        aria-label="plus"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
