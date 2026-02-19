import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface FeedbackOverlayProps {
  type: 'correct' | 'incorrect' | 'timeout' | 'stolen' | 'eliminated' | null;
  detail?: string;
}

export default function FeedbackOverlay({ type, detail }: FeedbackOverlayProps) {
  const { t } = useTranslation();

  if (!type) return null;

  const config = {
    correct: { text: t('game.correct'), color: 'text-primary text-glow-primary', bg: 'bg-primary/5' },
    incorrect: { text: t('game.incorrect'), color: 'text-danger text-glow-danger', bg: 'bg-danger/5' },
    timeout: { text: t('game.timeout'), color: 'text-danger text-glow-danger', bg: 'bg-danger/5' },
    stolen: { text: t('game.stolen'), color: 'text-gold text-glow-gold', bg: 'bg-gold/5' },
    eliminated: { text: t('game.eliminated'), color: 'text-danger text-glow-danger', bg: 'bg-danger/5' },
  };

  const c = config[type];

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 z-50 flex items-center justify-center ${c.bg} pointer-events-none`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <h2 className={`text-4xl sm:text-5xl font-display font-black ${c.color}`}>
            {c.text}
          </h2>
          {detail && (
            <p className="mt-2 text-sm font-mono-game text-muted-foreground">{detail}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
