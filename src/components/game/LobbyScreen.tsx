import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import MultiplayerLobby from '@/components/game/MultiplayerLobby';

export default function LobbyScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { initGame } = useGameStore();
  const [view, setView] = useState<'main' | 'multiplayer'>('main');

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const handleSoloStart = () => {
    initGame();
  };

  const handleMultiplayerGameStart = (roomId: string, isHost: boolean) => {
    if (isHost) {
      navigate(`/host?room=${roomId}`);
    } else {
      // Player screen will be built in Phase 3
      navigate(`/play?room=${roomId}`);
    }
  };

  if (view === 'multiplayer') {
    return (
      <MultiplayerLobby
        onBack={() => setView('main')}
        onGameStart={handleMultiplayerGameStart}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(185 100% 50%) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(0 90% 55%) 0%, transparent 70%)' }}
        />
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1.5 border border-border rounded-md
                   text-xs font-display text-muted-foreground hover:text-foreground hover:border-primary/50
                   transition-colors"
      >
        {t('game.language')}
      </button>

      {/* Title */}
      <motion.div
        className="text-center space-y-4 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-5xl sm:text-7xl font-display font-black text-danger text-glow-danger tracking-wider"
          initial={{ letterSpacing: '0.5em', opacity: 0 }}
          animate={{ letterSpacing: '0.15em', opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {t('game.title')}
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base font-mono-game text-muted-foreground tracking-[0.3em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('game.subtitle')}
        </motion.p>

        {/* Stakes preview */}
        <motion.div
          className="flex gap-1 justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[100, 250, 400, 550, 700, 850, 1000].map((s, i) => (
            <div
              key={i}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-muted flex items-center justify-center
                         text-[8px] sm:text-[10px] font-mono-game text-muted-foreground"
            >
              {s}
            </div>
          ))}
        </motion.div>

        {/* Mode buttons */}
        <motion.div
          className="mt-8 flex flex-col gap-3 items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        >
          <motion.button
            onClick={() => setView('multiplayer')}
            className="w-64 py-4 bg-danger text-destructive-foreground font-display font-black 
                       text-lg uppercase tracking-[0.2em] rounded-lg glow-danger
                       hover:brightness-110 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('multiplayer.title')}
          </motion.button>

          <motion.button
            onClick={handleSoloStart}
            className="w-64 py-3 bg-card border border-border text-muted-foreground font-display font-bold 
                       text-sm uppercase tracking-[0.2em] rounded-lg
                       hover:border-primary/30 hover:text-foreground transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('multiplayer.soloPlay')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
