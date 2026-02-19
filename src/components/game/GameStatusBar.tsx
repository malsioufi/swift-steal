import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface GameStatusBarProps {
  round: number;
  stake: number;
}

const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];

export default function GameStatusBar({ round, stake }: GameStatusBarProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between">
      {/* Round indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
          {t('game.round')}
        </span>
        <div className="flex gap-1">
          {ROUND_STAKES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < round
                  ? 'bg-primary glow-primary'
                  : i === round
                  ? 'bg-danger animate-pulse-glow'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-mono-game text-muted-foreground">
          {round}/7
        </span>
      </div>

      {/* Stake */}
      <motion.div
        className="flex items-center gap-1"
        key={stake}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
      >
        <span className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
          {t('game.stake')}
        </span>
        <span className="text-sm font-display font-bold text-gold text-glow-gold">
          {stake} {t('game.points')}
        </span>
      </motion.div>
    </div>
  );
}
