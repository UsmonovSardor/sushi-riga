import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cherry-500 to-cherry-700 text-5xl shadow-glow"
      >
        🍣
      </motion.div>
      <div className="text-center">
        <div className="text-xl font-extrabold tracking-tight text-ink">Cherry Sushi</div>
        <div className="mt-1 text-sm text-ink-dim">Rīga</div>
      </div>
      <motion.div
        className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-surface-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full w-1/2 rounded-full bg-cherry-500"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
