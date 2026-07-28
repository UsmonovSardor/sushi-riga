import { useEffect, useRef } from 'react';
import { tg } from '@/lib/telegram';

interface Options {
  text: string;
  visible?: boolean;
  active?: boolean;
  progress?: boolean;
  color?: string;
  onClick: () => void;
}

/**
 * Drives Telegram's native MainButton. Falls back to a no-op in a
 * browser (screens render their own button as well).
 */
export function useMainButton({
  text,
  visible = true,
  active = true,
  progress = false,
  color = '#E11D2A',
  onClick,
}: Options): void {
  const cb = useRef(onClick);
  cb.current = onClick;

  useEffect(() => {
    const mb = tg?.MainButton;
    if (!mb) return;

    const handler = () => cb.current();
    mb.onClick(handler);

    return () => {
      mb.offClick(handler);
      mb.hide();
    };
  }, []);

  useEffect(() => {
    const mb = tg?.MainButton;
    if (!mb) return;

    mb.setParams({ text, color, text_color: '#FFFFFF', is_active: active });

    if (visible) mb.show();
    else mb.hide();

    if (progress) mb.showProgress(false);
    else mb.hideProgress();

    if (active) mb.enable();
    else mb.disable();
  }, [text, visible, active, progress, color]);
}
