import { motion } from 'framer-motion';
import { Player } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  player: Player;
  index: number;
  totalPlayers: number;
  arenaRadius: number;
  centerX: number;
  centerY: number;
  isTargetable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  isBuzzed?: boolean;
}

export default function PlayerAvatar({
  player,
  index,
  totalPlayers,
  arenaRadius,
  centerX,
  centerY,
  isTargetable = false,
  isSelected = false,
  onClick,
  isBuzzed = false,
}: PlayerAvatarProps) {
  // Place players in a circle: start from top (-90°), go clockwise
  const angle = ((2 * Math.PI) / totalPlayers) * index - Math.PI / 2;
  const x = centerX + arenaRadius * Math.cos(angle);
  const y = centerY + arenaRadius * Math.sin(angle);

  const isFrozen = player.status === 'FROZEN';
  const isEliminated = player.status === 'ELIMINATED';

  if (isEliminated) return null;

  return (
    <motion.div
      className={cn(
        'absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 cursor-default select-none',
        isTargetable && 'cursor-pointer',
      )}
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      onClick={isTargetable ? onClick : undefined}
      whileHover={isTargetable ? { scale: 1.15 } : undefined}
      whileTap={isTargetable ? { scale: 0.95 } : undefined}
    >
      {/* Avatar circle */}
      <motion.div
        className={cn(
          'relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all',
          isFrozen && 'ice-overlay',
          isBuzzed && 'glow-danger',
          isSelected && 'glow-gold border-gold',
          isTargetable && !isSelected && 'border-danger hover:glow-danger',
          !isFrozen && !isBuzzed && !isTargetable && !isSelected && 'border-border',
        )}
        style={{
          borderColor: !isFrozen && !isBuzzed && !isTargetable && !isSelected
            ? `hsl(${player.color})` 
            : undefined,
          backgroundColor: `hsl(${player.color} / 0.15)`,
        }}
        animate={isBuzzed ? { scale: [1, 1.15, 1] } : isFrozen ? {} : {}}
        transition={isBuzzed ? { duration: 0.3, repeat: 2 } : {}}
      >
        <span className="text-xl sm:text-2xl">{player.avatar}</span>
        
        {isFrozen && (
          <div className="absolute inset-0 rounded-full ice-overlay flex items-center justify-center">
            <span className="text-lg">❄️</span>
          </div>
        )}
      </motion.div>

      {/* Name */}
      <span
        className={cn(
          'text-[10px] sm:text-xs font-display font-bold tracking-wider uppercase',
          isFrozen && 'text-ice',
          isBuzzed && 'text-danger',
          player.isHuman && 'text-primary text-glow-primary',
          !player.isHuman && !isFrozen && !isBuzzed && 'text-muted-foreground',
        )}
      >
        {player.name}
      </span>

      {/* Points */}
      <motion.span
        className={cn(
          'text-[10px] sm:text-xs font-mono-game',
          isFrozen ? 'text-ice' : 'text-gold',
        )}
        key={player.points}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
      >
        {player.points} pts
      </motion.span>
    </motion.div>
  );
}
