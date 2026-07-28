import { motion } from 'framer-motion';

/** Premium first-launch splash. */
export default function Splash() {
  return (
    <div className="relative flex h-full min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute -top-1/4 h-96 w-96 rounded-full bg-cherry-500/25 blur-[90px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cherry-500 to-cherry-700 shadow-glow"
      >
        <motion.span
          className="text-6xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          🍣
        </motion.span>
      </motion.div>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-6 text-center"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Cherry Sushi</h1>
        <p className="mt-1 text-sm font-medium text-ink-dim">Rīga · fresh every day</p>
      </motion.div>

      {/* Loader */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-surface-2"
      >
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-cherry-400 to-gold"
          animate={{ x: ['-120%', '360%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
