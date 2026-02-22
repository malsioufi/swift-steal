import { AnimatePresence } from 'framer-motion';
import { useHostGameStore } from '@/store/hostGameStore';
import PlayerAvatar from './PlayerAvatar';

interface HostArenaProps {
  isTargetMode?: boolean;
  onTargetSelect?: (playerId: string) => void;
}

export default function HostArena({ isTargetMode = false, onTargetSelect }: HostArenaProps) {
  const { players, buzzedPlayerId, currentRound } = useHostGameStore();

  const size = 400; // Larger for big screen
  const centerX = size / 2;
  const centerY = size / 2;
  const arenaRadius = size * 0.38;

  return (
    <div
      className="relative arena-gradient rounded-full border border-arena-ring/30"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-2 rounded-full border border-arena-ring/20"
        style={{ boxShadow: 'inset 0 0 40px hsl(185 80% 30% / 0.1)' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs font-display text-muted-foreground tracking-widest uppercase">
            Round
          </div>
          <div className="text-4xl font-display font-bold text-primary text-glow-primary">
            {currentRound || '—'}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {players.map((player, i) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            index={i}
            totalPlayers={players.length}
            arenaRadius={arenaRadius}
            centerX={centerX}
            centerY={centerY}
            isBuzzed={buzzedPlayerId === player.id}
            isTargetable={isTargetMode && player.status === 'ACTIVE' && player.id !== buzzedPlayerId}
            onClick={() => onTargetSelect?.(player.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
