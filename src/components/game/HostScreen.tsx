import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHostGameStore } from '@/store/hostGameStore';
import { supabase } from '@/integrations/supabase/client';
import HostArena from '@/components/game/HostArena';
import HostTypewriterDisplay from '@/components/game/HostTypewriterDisplay';
import GameStatusBar from '@/components/game/GameStatusBar';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import MultipleChoice from '@/components/game/MultipleChoice';


const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];

interface HostScreenProps {
  roomId: string;
}

export default function HostScreen({ roomId }: HostScreenProps) {
  const { t } = useTranslation();
  const {
    phase, currentRound, players, buzzedPlayerId, answerResult,
    advanceTypewriter, endRound, nextRound, startRound,
    initFromRoom, eliminatedThisRound, currentQuestion,
    questionInRound, lastSubmittedAnswer, correctAnswer, answeringPlayerName,
    buzzedDuringMC, runBotBuzz, runBotAnswer, runBotTargetSelect,
    selectTarget, resetGame,
  } = useHostGameStore();

  const typewriterInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stake = currentRound > 0 ? ROUND_STAKES[currentRound - 1] : 0;
  const initialized = useRef(false);

  // Initialize from room on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initFromRoom(roomId);
    }
  }, [roomId, initFromRoom]);

  // Listen for player actions via Realtime
  useEffect(() => {
    const playerChannel = supabase
      .channel(`host-player-actions-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_players',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const action = payload.new.last_action as any;
        if (!action || !action.type) return;
        const playerSessionId = payload.new.player_session_id as string;
        const store = useHostGameStore.getState();
        
        switch (action.type) {
          case 'buzz':
            store.buzz(playerSessionId);
            break;
          case 'answer':
            if (store.buzzedPlayerId === playerSessionId) {
              store.submitAnswer(action.value);
            }
            break;
          case 'select_mc':
            if (store.buzzedPlayerId === playerSessionId) {
              store.selectMultipleChoice(action.value);
            }
            break;
          case 'select_target':
            if (store.buzzedPlayerId === playerSessionId) {
              store.selectTarget(action.value);
            }
            break;
        }

        // Clear the action to avoid re-processing
        supabase
          .from('game_players')
          .update({ last_action: null })
          .eq('id', payload.new.id)
          .then();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playerChannel);
    };
  }, [roomId]);

  // Auto-start first round after init
  useEffect(() => {
    if (phase === 'LOBBY' && players.length > 0) {
      const timer = setTimeout(() => startRound(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, players.length, startRound]);

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
    if (phase === 'ANSWERING' && buzzedPlayerId) {
      const player = players.find(p => p.id === buzzedPlayerId);
      if (player?.isBot) {
        runBotAnswer();
      }
    }
  }, [phase, buzzedPlayerId, players, runBotAnswer]);

  // Bot target selection
  useEffect(() => {
    if (phase === 'STEAL_SELECT' && buzzedPlayerId) {
      const player = players.find(p => p.id === buzzedPlayerId);
      if (player?.isBot) {
        runBotTargetSelect();
      }
    }
  }, [phase, buzzedPlayerId, players, runBotTargetSelect]);

  // Bot buzz during multiple choice
  useEffect(() => {
    if (phase === 'MULTIPLE_CHOICE') {
      const interval = setInterval(() => {
        runBotBuzz();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [phase, runBotBuzz]);

  // Auto end round after elimination display
  useEffect(() => {
    if (phase === 'ROUND_END' && !eliminatedThisRound) {
      const timer = setTimeout(() => endRound(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, eliminatedThisRound, endRound]);

  const humanPlayers = players.filter(p => !p.isBot);
  const botPlayers = players.filter(p => p.isBot);
  const activePlayers = players.filter(p => p.status !== 'ELIMINATED');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Host badge + connection indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="px-3 py-1 bg-danger/20 border border-danger/30 rounded-md">
          <span className="text-[10px] font-display text-danger tracking-[0.3em] uppercase">
            {t('host.badge', 'HOST SCREEN')}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] font-mono-game text-muted-foreground">
            {humanPlayers.length} <span className="text-primary">{humanPlayers.length === 1 ? 'PLAYER' : 'PLAYERS'}</span>
            {botPlayers.length > 0 && (
              <> · {botPlayers.length} <span className="text-muted-foreground/60">BOTS</span></>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-card border border-border rounded-md">
          <span className="text-[10px] font-mono-game text-muted-foreground">
            {activePlayers.length}<span className="text-primary">/{players.length}</span> ALIVE
          </span>
        </div>
      </div>

      {/* Status bar */}
      {currentRound > 0 && (
        <GameStatusBar round={currentRound} stake={stake} questionNum={questionInRound} totalQuestions={5} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-6 py-4 gap-6">
        {/* Arena - larger for big screen */}
        <div className="flex justify-center py-4" style={{ overflow: 'visible' }}>
          <HostArena
            isTargetMode={phase === 'STEAL_SELECT'}
            onTargetSelect={(id) => selectTarget(id)}
          />
        </div>

        {/* Question display */}
        {(phase === 'TYPEWRITER' || phase === 'ANSWERING' || phase === 'STEAL_SELECT' || phase === 'MULTIPLE_CHOICE') && (
          <HostTypewriterDisplay />
        )}

        {/* Answering indicator */}
        {phase === 'ANSWERING' && buzzedPlayerId && (
          <div className="text-center">
            <p className="font-display text-base text-danger animate-pulse-glow tracking-widest uppercase">
              {players.find(p => p.id === buzzedPlayerId)?.name} {t('host.isAnswering', 'is answering...')}
            </p>
          </div>
        )}

        {/* Answer reveal */}
        {lastSubmittedAnswer && answerResult && phase !== 'TYPEWRITER' && (
          <div className="w-full px-6">
            <div className={`border rounded-lg p-4 text-center space-y-2 ${
              answerResult === 'correct'
                ? 'border-gold/50 bg-gold/10'
                : 'border-danger/50 bg-danger/10'
            }`}>
              <p className="text-xs font-display tracking-widest uppercase text-muted-foreground">
                {answeringPlayerName} {t('host.answered', 'answered')}:
              </p>
              <p className={`font-mono-game text-lg font-bold ${
                answerResult === 'correct' ? 'text-gold' : 'text-danger'
              }`}>
                "{lastSubmittedAnswer}"
              </p>
              {answerResult === 'incorrect' && correctAnswer && (
                <p className="text-sm text-muted-foreground">
                  {t('host.correctAnswer', 'Correct answer')}: <span className="text-gold font-bold">{correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Target selection indicator */}
        {phase === 'STEAL_SELECT' && (
          <div className="text-center">
            <p className="font-display text-base text-gold text-glow-gold tracking-widest uppercase animate-pulse-glow">
              {players.find(p => p.id === buzzedPlayerId)?.name} {t('host.selectingTarget', 'is selecting a target...')}
            </p>
          </div>
        )}

        {/* Multiple choice display */}
        {phase === 'MULTIPLE_CHOICE' && <MultipleChoice disabled />}

        {/* Round end */}
        {phase === 'ROUND_END' && eliminatedThisRound && (
          <div className="text-center space-y-6">
            <p className="font-display text-2xl text-danger text-glow-danger">
              {players.find(p => p.id === eliminatedThisRound)?.name} {t('game.eliminated_player')}
            </p>
            <button
              onClick={nextRound}
              className="px-10 py-4 bg-primary text-primary-foreground font-display font-bold rounded-lg 
                         uppercase tracking-wider glow-primary text-lg"
            >
              {currentRound >= 7 ? t('game.newGame') : t('game.nextRound')}
            </button>
          </div>
        )}

        {/* Game over */}
        {phase === 'GAME_OVER' && (
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-display font-black text-gold text-glow-gold">
              {t('host.gameOver', 'GAME OVER')}
            </h2>
            {/* Show winner */}
            {(() => {
              const winner = players
                .filter(p => p.status !== 'ELIMINATED')
                .sort((a, b) => b.points - a.points)[0];
              return winner ? (
                <div className="space-y-2">
                  <p className="text-lg font-display text-primary tracking-wider">
                    {t('host.winner', 'Winner')}: <span className="text-gold font-bold">{winner.name}</span>
                  </p>
                  <p className="text-sm font-mono-game text-muted-foreground">
                    {winner.points} {t('game.points')}
                  </p>
                </div>
              ) : null;
            })()}
            <button
              onClick={() => {
                resetGame();
                window.location.href = '/';
              }}
              className="px-10 py-4 bg-primary text-primary-foreground font-display font-bold rounded-lg 
                         uppercase tracking-wider glow-primary text-lg"
            >
              {t('game.newGame')}
            </button>
          </div>
        )}

        {/* Waiting to start */}
        {phase === 'LOBBY' && players.length > 0 && (
          <div className="text-center">
            <p className="font-display text-sm text-muted-foreground tracking-widest uppercase animate-pulse-glow">
              {t('host.starting', 'Starting game...')}
            </p>
          </div>
        )}
      </div>

      {/* Scoreboard sidebar */}
      <div className="absolute top-16 right-4 w-48 space-y-1">
        <p className="text-[10px] font-display text-muted-foreground tracking-[0.2em] uppercase mb-2">
          {t('host.scoreboard', 'Scoreboard')}
        </p>
        {[...players]
          .sort((a, b) => b.points - a.points)
          .map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                p.status === 'ELIMINATED' ? 'opacity-30' : ''
              } ${p.status === 'FROZEN' ? 'bg-ice/10' : ''}`}
            >
              <span className="text-sm">{p.avatar}</span>
              <span
                className="font-display font-bold truncate flex-1"
                style={{ color: `hsl(${p.color})` }}
              >
                {p.name}
              </span>
              <span className="font-mono-game text-muted-foreground">
                {p.points}
              </span>
              {p.isBot && (
                <span className="text-[8px] text-muted-foreground/50">BOT</span>
              )}
            </div>
          ))}
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
