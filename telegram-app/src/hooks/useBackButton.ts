import { useEffect, useRef } from 'react';
import { tg } from '@/lib/telegram';

/** Shows Telegram's native BackButton and runs `onBack` when tapped. */
export function useBackButton(onBack: () => void): void {
  const cb = useRef(onBack);
  cb.current = onBack;

  useEffect(() => {
    const bb = tg?.BackButton;
    if (!bb) return;

    const handler = () => cb.current();
    bb.onClick(handler);
    bb.show();

    return () => {
      bb.offClick(handler);
      bb.hide();
    };
  }, []);
}
