import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  timeLimit: number;
}

export default function AnswerInput({ onSubmit, timeLimit }: AnswerInputProps) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!submitted.current) {
            submitted.current = true;
            onSubmit('');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onSubmit]);

  const handleSubmit = () => {
    if (!submitted.current && answer.trim()) {
      submitted.current = true;
      onSubmit(answer.trim());
    }
  };

  const urgencyColor = timeLeft <= 2 ? 'text-danger text-glow-danger' : timeLeft <= 3 ? 'text-gold' : 'text-primary';

  return (
    <div className="w-full px-4 space-y-3">
      {/* Timer */}
      <div className="flex justify-center">
        <motion.div
          className={`text-4xl font-display font-black ${urgencyColor}`}
          key={timeLeft}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: timeLimit, ease: 'linear' }}
        />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('game.typeAnswer')}
          className="flex-1 bg-input border border-border rounded-lg px-4 py-3 
                     font-mono-game text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          autoComplete="off"
        />
        <motion.button
          onClick={handleSubmit}
          className="px-6 py-3 bg-primary text-primary-foreground font-display font-bold 
                     rounded-lg uppercase tracking-wider text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('game.submit')}
        </motion.button>
      </div>
    </div>
  );
}
