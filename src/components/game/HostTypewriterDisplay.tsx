import { useHostGameStore } from '@/store/hostGameStore';

export default function HostTypewriterDisplay() {
  const { revealedText, phase, currentQuestion } = useHostGameStore();

  if (!currentQuestion) return null;

  return (
    <div className="w-full px-6 py-6">
      <div className="bg-card/50 border border-border rounded-lg p-6 sm:p-8 min-h-[100px] flex items-center">
        <p className="font-mono-game text-lg sm:text-xl text-foreground leading-relaxed tracking-wide">
          {revealedText}
          {phase === 'TYPEWRITER' && (
            <span
              className="inline-block w-3 h-6 bg-primary ml-0.5 align-middle"
              style={{ animation: 'typewriter-cursor 0.8s step-end infinite' }}
            />
          )}
        </p>
      </div>

      {currentQuestion.category && (
        <div className="mt-3 text-center">
          <span className="text-xs font-display tracking-[0.3em] uppercase text-muted-foreground">
            {currentQuestion.category}
          </span>
        </div>
      )}
    </div>
  );
}
