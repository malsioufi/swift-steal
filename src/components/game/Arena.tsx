import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import PlayerAvatar from './PlayerAvatar';

interface ArenaProps {
  isTargetMode?: boolean;
  onTargetSelect?: (playerId: string) => void;
}

export default function Arena({ isTargetMode = false, onTargetSelect }: ArenaProps) {
  const { players, buzzedPlayerId, currentRound } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const activePlayers = players.filter(p => p.status !== 'ELIMINATED');
  
  // Arena dimensions - responsive
  const size = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 40 : 360);
  const centerX = size / 2;
  const centerY = size / 2;
  const arenaRadius = size * 0.35;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto arena-gradient rounded-full border border-arena-ring/30"
      style={{ width: size, height: size }}
    >
      {/* Arena ring glow */}
      <div 
        className="absolute inset-2 rounded-full border border-arena-ring/20"
        style={{ boxShadow: 'inset 0 0 40px hsl(185 80% 30% / 0.1)' }}
      />
      
      {/* Center info */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs font-display text-muted-foreground tracking-widest uppercase">
            Round
          </div>
          <div className="text-3xl font-display font-bold text-primary text-glow-primary">
            {currentRound || '—'}
          </div>
        </div>
      </div>

      {/* Players */}
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
            isTargetable={isTargetMode && player.status === 'ACTIVE' && player.id !== buzzedPlayerId && !player.isHuman}
            onClick={() => onTargetSelect?.(player.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
