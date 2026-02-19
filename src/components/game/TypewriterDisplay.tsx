import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function TypewriterDisplay() {
  const { revealedText, phase, currentQuestion } = useGameStore();

  if (!currentQuestion) return null;

  return (
    <div className="w-full px-4 py-6">
      <div className="bg-card/50 border border-border rounded-lg p-4 sm:p-6 min-h-[80px] flex items-center">
        <p className="font-mono-game text-sm sm:text-base text-foreground leading-relaxed tracking-wide">
          {revealedText}
          {phase === 'TYPEWRITER' && (
            <span 
              className="inline-block w-2 h-5 bg-primary ml-0.5 align-middle"
              style={{ animation: 'typewriter-cursor 0.8s step-end infinite' }}
            />
          )}
        </p>
      </div>
      
      {currentQuestion.category && (
        <div className="mt-2 text-center">
          <span className="text-[10px] font-display tracking-[0.3em] uppercase text-muted-foreground">
            {currentQuestion.category}
          </span>
        </div>
      )}
    </div>
  );
}
