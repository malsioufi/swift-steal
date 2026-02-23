import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePlayerGameStore } from '@/store/playerGameStore';
import BuzzerButton from '@/components/game/BuzzerButton';
import AnswerInput from '@/components/game/AnswerInput';
import MultipleChoice from '@/components/game/MultipleChoice';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import GameStatusBar from '@/components/game/GameStatusBar';

const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];

interface PlayerScreenProps {
  roomId: string;
}

export default function PlayerScreen({ roomId }: PlayerScreenProps) {
  const { t } = useTranslation();
  const {
    connectToRoom, disconnect, playerId, playerName,
    phase, currentRound, players, buzzedPlayerId,
    answerResult, lockedOutPlayerIds, currentQuestion,
    questionInRound, lastSubmittedAnswer, correctAnswer,
    answeringPlayerName, buzzedDuringMC, eliminatedThisRound,
    revealedText, selectedTargetId,
    sendBuzz, sendAnswer, sendMultipleChoice, sendTargetSelect,
    connected,
  } = usePlayerGameStore();

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      connectToRoom(roomId);
    }
    return () => {
      // disconnect on unmount
    };
  }, [roomId, connectToRoom]);

  const me = players.find(p => p.id === playerId);
  const stake = currentRound > 0 ? ROUND_STAKES[currentRound - 1] : 0;

  const canBuzz = (phase === 'TYPEWRITER' || phase === 'MULTIPLE_CHOICE')
    && me?.status === 'ACTIVE'
    && !lockedOutPlayerIds.includes(playerId);

  const isMyBuzz = buzzedPlayerId === playerId;
  const isAnswering = phase === 'ANSWERING' && isMyBuzz;
  const isSelectingTarget = phase === 'STEAL_SELECT' && isMyBuzz;

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-muted-foreground animate-pulse-glow tracking-widest uppercase text-sm">
          Connecting...
        </p>
      </div>
    );
  }

  if (phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-display text-muted-foreground tracking-[0.3em] uppercase">
            {t('multiplayer.you')}
          </p>
          <h2 className="text-3xl font-display font-black text-primary text-glow-primary tracking-wider">
            {playerName}
          </h2>
          <p className="text-sm font-mono-game text-muted-foreground animate-pulse-glow">
            {t('multiplayer.waitingForHost')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Player eliminated
  if (me?.status === 'ELIMINATED') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display font-black text-danger text-glow-danger">
            {t('game.eliminated')}
          </h2>
          <p className="text-sm font-mono-game text-muted-foreground">
            {me.points} {t('game.points')}
          </p>
          <p className="text-xs font-display text-muted-foreground tracking-widest uppercase">
            {t('game.spectating')}
          </p>
        </div>
      </div>
    );
  }

  // Game over
  if (phase === 'GAME_OVER') {
    const winner = players
      .filter(p => p.status !== 'ELIMINATED')
      .sort((a, b) => b.points - a.points)[0];
    const isWinner = winner?.id === playerId;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className={`text-3xl font-display font-black ${isWinner ? 'text-gold text-glow-gold' : 'text-danger text-glow-danger'}`}>
            {isWinner ? t('game.youWin') : t('game.youLose')}
          </h2>
          <p className="text-sm font-mono-game text-muted-foreground">
            {me?.points || 0} {t('game.points')}
          </p>
          <button
            onClick={() => { disconnect(); window.location.href = '/'; }}
            className="px-8 py-3 bg-primary text-primary-foreground font-display font-bold rounded-lg 
                       uppercase tracking-wider glow-primary"
          >
            {t('game.newGame')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Status bar */}
      {currentRound > 0 && (
        <GameStatusBar round={currentRound} stake={stake} questionNum={questionInRound} totalQuestions={5} />
      )}

      {/* Player info bar */}
      <div className="w-full px-4 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{me?.avatar}</span>
          <span className="font-display font-bold text-sm tracking-wider" style={{ color: me ? `hsl(${me.color})` : undefined }}>
            {playerName}
          </span>
        </div>
        <div className="font-mono-game text-sm text-muted-foreground">
          {me?.points || 0} {t('game.points')}
        </div>
      </div>

      {/* Frozen indicator */}
      {me?.status === 'FROZEN' && (
        <div className="w-full px-4 pb-2">
          <div className="bg-ice/10 border border-ice/30 rounded-lg px-4 py-2 text-center">
            <span className="text-xs font-display text-ice tracking-widest uppercase animate-pulse-glow">
              {t('game.frozen')}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-4 py-4 gap-6">
        
        {/* Question text (abbreviated on mobile) */}
        {(phase === 'TYPEWRITER' || phase === 'ANSWERING' || phase === 'STEAL_SELECT' || phase === 'MULTIPLE_CHOICE') && (
          <div className="w-full px-2">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs font-display text-muted-foreground tracking-[0.2em] uppercase mb-2">
                {currentQuestion?.category || ''}
              </p>
              <p className="font-mono-game text-sm text-foreground leading-relaxed min-h-[3rem]">
                {revealedText}
                {phase === 'TYPEWRITER' && <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5" />}
              </p>
            </div>
          </div>
        )}

        {/* Buzzer */}
        {(phase === 'TYPEWRITER' || phase === 'MULTIPLE_CHOICE') && (
          <div className="flex flex-col items-center gap-3">
            <BuzzerButton onBuzz={sendBuzz} disabled={!canBuzz} />
          </div>
        )}

        {/* I'm answering - text input */}
        {isAnswering && !buzzedDuringMC && (
          <AnswerInput onSubmit={sendAnswer} timeLimit={5} />
        )}

        {/* I'm answering - MC */}
        {isAnswering && buzzedDuringMC && currentQuestion && (
          <div className="w-full px-4 space-y-3">
            <h3 className="text-center font-display text-sm tracking-widest uppercase text-muted-foreground">
              {t('game.multipleChoice')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.choices.map((choice, i) => (
                <motion.button
                  key={choice}
                  onClick={() => sendMultipleChoice(choice)}
                  disabled={answerResult !== null}
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
        )}

        {/* Someone else is answering */}
        {phase === 'ANSWERING' && !isMyBuzz && (
          <div className="text-center">
            <p className="font-display text-sm text-danger animate-pulse-glow tracking-widest uppercase">
              {players.find(p => p.id === buzzedPlayerId)?.name} {t('host.isAnswering', 'is answering...')}
            </p>
          </div>
        )}

        {/* I'm selecting a target */}
        {isSelectingTarget && (
          <div className="w-full px-4 space-y-3">
            <p className="text-center font-display text-sm text-gold text-glow-gold tracking-widest uppercase animate-pulse-glow">
              {t('game.selectTarget')}
            </p>
            <div className="space-y-2">
              {players
                .filter(p => p.id !== playerId && p.status === 'ACTIVE')
                .map((p) => (
                  <motion.button
                    key={p.id}
                    onClick={() => sendTargetSelect(p.id)}
                    disabled={selectedTargetId !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border
                               hover:border-danger/50 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <span className="font-display font-bold text-sm tracking-wider" style={{ color: `hsl(${p.color})` }}>
                      {p.name}
                    </span>
                    <span className="ml-auto font-mono-game text-xs text-muted-foreground">
                      {p.points} {t('game.points')}
                    </span>
                  </motion.button>
                ))}
            </div>
          </div>
        )}

        {/* Someone else selecting target */}
        {phase === 'STEAL_SELECT' && !isMyBuzz && (
          <div className="text-center">
            <p className="font-display text-sm text-gold text-glow-gold tracking-widest uppercase animate-pulse-glow">
              {players.find(p => p.id === buzzedPlayerId)?.name} {t('host.selectingTarget', 'is selecting a target...')}
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
                {answeringPlayerName} {t('host.answered', 'answered')}:
              </p>
              <p className={`font-mono-game text-sm font-bold ${
                answerResult === 'correct' ? 'text-gold' : 'text-danger'
              }`}>
                "{lastSubmittedAnswer}"
              </p>
              {answerResult === 'incorrect' && correctAnswer && (
                <p className="text-xs text-muted-foreground">
                  {t('host.correctAnswer', 'Correct answer')}: <span className="text-gold font-bold">{correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Multiple choice preview (when not answering) */}
        {phase === 'MULTIPLE_CHOICE' && <MultipleChoice disabled />}

        {/* Round end */}
        {phase === 'ROUND_END' && eliminatedThisRound && (
          <div className="text-center space-y-4">
            <p className="font-display text-lg text-danger text-glow-danger">
              {players.find(p => p.id === eliminatedThisRound)?.name} {t('game.eliminated_player')}
            </p>
            <p className="text-xs font-mono-game text-muted-foreground animate-pulse-glow">
              {t('multiplayer.waitingForHost')}
            </p>
          </div>
        )}
      </div>

      {/* Feedback overlay */}
      {answerResult && (
        <FeedbackOverlay
          type={answerResult}
          detail={answerResult === 'incorrect' && isMyBuzz ? `-${stake} ${t('game.points')}` : undefined}
        />
      )}
    </div>
  );
}
