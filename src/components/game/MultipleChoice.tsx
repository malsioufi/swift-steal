import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';

export default function MultipleChoice({ disabled: forceDisabled = false }: { disabled?: boolean }) {
  const { t } = useTranslation();
  const { currentQuestion, selectMultipleChoice, answerResult } = useGameStore();

  if (!currentQuestion) return null;

  return (
    <div className="w-full px-4 space-y-3">
      <h3 className="text-center font-display text-sm tracking-widest uppercase text-muted-foreground">
        {t('game.multipleChoice')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {currentQuestion.choices.map((choice, i) => (
          <motion.button
            key={choice}
            onClick={() => selectMultipleChoice(choice)}
            disabled={forceDisabled || answerResult !== null}
            className="bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50
                       text-secondary-foreground font-mono-game text-sm px-4 py-3 rounded-lg
                       transition-colors disabled:opacity-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {choice}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
