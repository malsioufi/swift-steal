import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import Arena from '@/components/game/Arena';
import TypewriterDisplay from '@/components/game/TypewriterDisplay';
import BuzzerButton from '@/components/game/BuzzerButton';
import AnswerInput from '@/components/game/AnswerInput';
import MultipleChoice from '@/components/game/MultipleChoice';
import GameStatusBar from '@/components/game/GameStatusBar';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';

const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];

export default function GameScreen() {
  const { t } = useTranslation();
  const {
    phase, currentRound, players, buzzedPlayerId, answerResult,
    advanceTypewriter, buzz, submitAnswer, selectTarget,
    endRound, nextRound, startRound, lockedOutPlayerIds,
    runBotBuzz, runBotAnswer, runBotTargetSelect, eliminatedThisRound,
    currentQuestion, questionInRound, lastSubmittedAnswer, correctAnswer, answeringPlayerName,
  } = useGameStore();

  const typewriterInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const humanPlayer = players.find(p => p.isHuman);
  const stake = currentRound > 0 ? ROUND_STAKES[currentRound - 1] : 0;

  // Typewriter loop
  useEffect(() => {
    if (phase === 'TYPEWRITER') {
      typewriterInterval.current = setInterval(() => {
        advanceTypewriter();
        runBotBuzz();
      }, 50);
      return () => {
        if (typewriterInterval.current) clearInterval(typewriterInterval.current);
      };
    }
  }, [phase, advanceTypewriter, runBotBuzz]);

  // Bot answer logic
  useEffect(() => {
    if (phase === 'ANSWERING' && buzzedPlayerId && buzzedPlayerId !== 'human') {
      runBotAnswer();
    }
  }, [phase, buzzedPlayerId, runBotAnswer]);

  // Bot target selection
  useEffect(() => {
    if (phase === 'STEAL_SELECT' && buzzedPlayerId && buzzedPlayerId !== 'human') {
      runBotTargetSelect();
    }
  }, [phase, buzzedPlayerId, runBotTargetSelect]);

  // Auto end round after elimination display
  useEffect(() => {
    if (phase === 'ROUND_END' && !eliminatedThisRound) {
      // endRound will find the lowest scorer and eliminate them
      const timer = setTimeout(() => endRound(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, eliminatedThisRound, endRound]);

  // Start first round
  useEffect(() => {
    if (phase === 'LOBBY') {
      const timer = setTimeout(() => startRound(), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, startRound]);

  const humanCanBuzz = phase === 'TYPEWRITER' 
    && humanPlayer?.status === 'ACTIVE' 
    && !lockedOutPlayerIds.includes('human');

  const humanIsAnswering = phase === 'ANSWERING' && buzzedPlayerId === 'human';
  const humanIsSelectingTarget = phase === 'STEAL_SELECT' && buzzedPlayerId === 'human';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Status bar */}
      {currentRound > 0 && <GameStatusBar round={currentRound} stake={stake} questionNum={questionInRound} totalQuestions={5} />}

      {/* Arena */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-4 py-2 gap-4">
        <Arena
          isTargetMode={humanIsSelectingTarget}
          onTargetSelect={(id) => selectTarget(id)}
        />

        {/* Question display */}
        {(phase === 'TYPEWRITER' || phase === 'ANSWERING' || phase === 'STEAL_SELECT') && (
          <TypewriterDisplay />
        )}

        {/* Buzzer */}
        {phase === 'TYPEWRITER' && (
          <div className="flex flex-col items-center gap-2">
            <BuzzerButton onBuzz={() => buzz('human')} disabled={!humanCanBuzz} />
            {humanPlayer?.status === 'FROZEN' && (
              <span className="text-xs font-display text-ice animate-pulse-glow">
                {t('game.frozen')}
              </span>
            )}
          </div>
        )}

        {/* Answer input (human answering) */}
        {humanIsAnswering && (
          <AnswerInput onSubmit={(a) => submitAnswer(a)} timeLimit={5} />
        )}

        {/* Bot answering indicator */}
        {phase === 'ANSWERING' && buzzedPlayerId !== 'human' && (
          <div className="text-center">
            <p className="font-display text-sm text-danger animate-pulse-glow tracking-widest uppercase">
              {players.find(p => p.id === buzzedPlayerId)?.name} is answering...
            </p>
          </div>
        )}

        {/* Answer reveal */}
        {lastSubmittedAnswer && answerResult && phase !== 'TYPEWRITER' && (
          <div className="w-full px-4">
            <div className={`border rounded-lg p-3 text-center space-y-1 ${
              answerResult === 'correct' 
                ? 'border-gold/50 bg-gold/10' 
                : 'border-danger/50 bg-danger/10'
            }`}>
              <p className="text-xs font-display tracking-widest uppercase text-muted-foreground">
                {answeringPlayerName} answered:
              </p>
              <p className={`font-mono-game text-sm font-bold ${
                answerResult === 'correct' ? 'text-gold' : 'text-danger'
              }`}>
                "{lastSubmittedAnswer}"
              </p>
              {answerResult === 'incorrect' && correctAnswer && (
                <p className="text-xs text-muted-foreground">
                  Correct answer: <span className="text-gold font-bold">{correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Target selection */}
        {humanIsSelectingTarget && (
          <div className="text-center">
            <p className="font-display text-sm text-gold text-glow-gold tracking-widest uppercase animate-pulse-glow">
              {t('game.selectTarget')}
            </p>
          </div>
        )}

        {/* Multiple choice */}
        {phase === 'MULTIPLE_CHOICE' && <MultipleChoice />}

        {/* Round end */}
        {phase === 'ROUND_END' && eliminatedThisRound && (
          <div className="text-center space-y-4">
            <p className="font-display text-lg text-danger text-glow-danger">
              {players.find(p => p.id === eliminatedThisRound)?.name} {t('game.eliminated_player')}
            </p>
            <button
              onClick={nextRound}
              className="px-8 py-3 bg-primary text-primary-foreground font-display font-bold rounded-lg 
                         uppercase tracking-wider glow-primary"
            >
              {currentRound >= 7 ? t('game.newGame') : t('game.nextRound')}
            </button>
          </div>
        )}

        {/* Game over */}
        {phase === 'GAME_OVER' && (
          <div className="text-center space-y-4">
            {humanPlayer && humanPlayer.status !== 'ELIMINATED' ? (
              <h2 className="text-3xl font-display font-black text-gold text-glow-gold">
                {t('game.youWin')}
              </h2>
            ) : (
              <h2 className="text-3xl font-display font-black text-danger text-glow-danger">
                {t('game.youLose')}
              </h2>
            )}
            <p className="text-sm font-mono-game text-muted-foreground">
              {humanPlayer?.points || 0} {t('game.points')}
            </p>
            <button
              onClick={() => {
                useGameStore.getState().resetGame();
                useGameStore.getState().initGame();
              }}
              className="px-8 py-3 bg-primary text-primary-foreground font-display font-bold rounded-lg 
                         uppercase tracking-wider glow-primary"
            >
              {t('game.newGame')}
            </button>
          </div>
        )}
      </div>

      {/* Feedback overlay */}
      {answerResult && (
        <FeedbackOverlay
          type={answerResult}
          detail={answerResult === 'incorrect' ? `-${stake} ${t('game.points')}` : undefined}
        />
      )}
    </div>
  );
}
