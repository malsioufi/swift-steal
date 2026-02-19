import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
}

export default function BuzzerButton({ onBuzz, disabled = false }: BuzzerButtonProps) {
  const { t } = useTranslation();

  return (
    <motion.button
      onClick={onBuzz}
      disabled={disabled}
      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full buzzer-gradient border-4 border-danger/50 
                 font-display font-black text-xl sm:text-2xl tracking-wider
                 text-destructive-foreground uppercase
                 disabled:opacity-30 disabled:cursor-not-allowed disabled:animate-none
                 focus:outline-none"
      style={{
        boxShadow: disabled 
          ? 'none' 
          : '0 0 20px hsl(0 90% 55% / 0.4), 0 0 60px hsl(0 90% 55% / 0.15), inset 0 -4px 8px hsl(0 70% 25% / 0.5)',
      }}
      whileHover={!disabled ? { scale: 1.08 } : undefined}
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      animate={!disabled ? {
        scale: [1, 1.03, 1],
        boxShadow: [
          '0 0 20px hsl(0 90% 55% / 0.4), 0 0 60px hsl(0 90% 55% / 0.15)',
          '0 0 30px hsl(0 90% 55% / 0.6), 0 0 80px hsl(0 90% 55% / 0.25)',
          '0 0 20px hsl(0 90% 55% / 0.4), 0 0 60px hsl(0 90% 55% / 0.15)',
        ],
      } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {t('game.buzz')}
    </motion.button>
  );
}
