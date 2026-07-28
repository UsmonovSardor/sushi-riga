import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '@/hooks/useLang';
import { setLang } from '@/i18n';
import { haptic } from '@/lib/telegram';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/format';

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'lv', label: 'Latviešu', flag: 'LV' },
  { id: 'ru', label: 'Русский', flag: 'RU' },
  { id: 'en', label: 'English', flag: 'EN' },
];

/** Compact language switcher for the header. */
export default function LanguageButton() {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          haptic.light();
          setOpen((o) => !o);
        }}
        className="flex h-9 items-center gap-1 rounded-full bg-surface px-2.5 shadow-card active:scale-95"
      >
        <Globe size={15} className="text-ink-dim" />
        <span className="text-xs font-bold text-ink">{lang.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-2xl p-1 shadow-card"
          >
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  haptic.select();
                  setLang(l.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition',
                  lang === l.id ? 'bg-cherry-500/15 text-ink' : 'text-ink-dim active:bg-surface-2'
                )}
              >
                <span className="text-[11px] font-extrabold text-cherry-500">{l.flag}</span>
                <span className="flex-1 font-semibold">{l.label}</span>
                {lang === l.id && <Check size={15} className="text-cherry-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
