import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { joinRoom, getSessionId } from '@/lib/roomService';
import { supabase } from '@/integrations/supabase/client';
import PlayerScreen from '@/components/game/PlayerScreen';

export default function Play() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedExisting, setCheckedExisting] = useState(false);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-muted-foreground">No room specified. Return to lobby.</p>
      </div>
    );
  }

  // Check if already joined (on first render)
  if (!checkedExisting && !joined) {
    setCheckedExisting(true);
    const sessionId = getSessionId();
    supabase
      .from('game_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('player_session_id', sessionId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setJoined(true);
      });
  }

  if (joined) {
    return <PlayerScreen roomId={roomId} />;
  }

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError(t('multiplayer.enterName'));
      return;
    }
    setLoading(true);
    setError('');

    // We need room_code to join. Fetch it from the room ID.
    const { data: room } = await supabase
      .from('game_rooms')
      .select('room_code, status')
      .eq('id', roomId)
      .maybeSingle();

    if (!room) {
      setError(t('multiplayer.roomNotFound'));
      setLoading(false);
      return;
    }

    if (room.status !== 'waiting') {
      setError(t('multiplayer.gameAlreadyStarted', 'Game has already started'));
      setLoading(false);
      return;
    }

    const result = await joinRoom(room.room_code, playerName.trim());
    if (!result) {
      setError(t('multiplayer.joinFailed'));
      setLoading(false);
      return;
    }

    setJoined(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(185 100% 50%) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="text-center space-y-6 z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl sm:text-3xl font-display font-black text-primary text-glow-primary tracking-wider uppercase">
          {t('multiplayer.joinRoom')}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-display text-muted-foreground tracking-[0.2em] uppercase">
              {t('multiplayer.yourName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
              placeholder={t('multiplayer.namePlaceholder')}
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-center font-display 
                         font-bold text-foreground tracking-wider uppercase placeholder:text-muted-foreground
                         focus:outline-none focus:border-primary/50"
              maxLength={12}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <motion.button
            onClick={handleJoin}
            disabled={loading || !playerName.trim()}
            className="w-full py-4 bg-danger text-destructive-foreground font-display font-black 
                       text-lg uppercase tracking-[0.2em] rounded-lg glow-danger
                       hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? '...' : t('multiplayer.join')}
          </motion.button>
        </div>

        {error && (
          <motion.p
            className="text-xs font-display text-danger tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
