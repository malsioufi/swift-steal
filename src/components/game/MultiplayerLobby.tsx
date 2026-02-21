import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createRoom, joinRoom, getRoomPlayers, subscribeToRoom, getSessionId } from '@/lib/roomService';
import { supabase } from '@/integrations/supabase/client';

interface MultiplayerLobbyProps {
  onBack: () => void;
  onGameStart: (roomId: string, isHost: boolean) => void;
}

interface RoomPlayer {
  id: string;
  player_name: string;
  avatar: string;
  color: string;
  player_order: number;
  is_host: boolean;
  player_session_id: string;
}

export default function MultiplayerLobby({ onBack, onGameStart }: MultiplayerLobbyProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const sessionId = getSessionId();

  // Refresh players list
  const refreshPlayers = useCallback(async () => {
    if (!roomId) return;
    const p = await getRoomPlayers(roomId);
    setPlayers(p as RoomPlayer[]);
  }, [roomId]);

  // Subscribe to room changes
  useEffect(() => {
    if (!roomId) return;

    const channel = subscribeToRoom(roomId, (payload: any) => {
      // If room status changed to 'playing', start game
      if (payload.table === 'game_rooms' && payload.new?.status === 'playing') {
        onGameStart(roomId, isHost);
        return;
      }
      // Refresh players on any change
      refreshPlayers();
    });

    refreshPlayers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, onGameStart, refreshPlayers]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError(t('multiplayer.enterName'));
      return;
    }
    setLoading(true);
    setError('');

    const result = await createRoom();
    if (!result) {
      setError(t('multiplayer.createFailed'));
      setLoading(false);
      return;
    }

    setCreatedRoomCode(result.roomCode);
    setRoomId(result.roomId);
    setIsHost(true);

    // Join as host
    const joinResult = await joinRoom(result.roomCode, playerName.trim());
    if (!joinResult) {
      setError(t('multiplayer.joinFailed'));
      setLoading(false);
      return;
    }

    setJoined(true);
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError(t('multiplayer.enterName'));
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 5) {
      setError(t('multiplayer.enterCode'));
      return;
    }
    setLoading(true);
    setError('');

    const result = await joinRoom(roomCode.trim(), playerName.trim());
    if (!result) {
      setError(t('multiplayer.roomNotFound'));
      setLoading(false);
      return;
    }

    setRoomId(result.roomId);
    setJoined(true);
    setLoading(false);
  };

  const handleStartGame = async () => {
    if (!roomId || !isHost) return;
    // Update room status to 'playing'
    await supabase
      .from('game_rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);

    onGameStart(roomId, true);
  };

  // Waiting room UI (after creating/joining)
  if (joined && roomId) {
    const displayCode = createdRoomCode || roomCode.toUpperCase();
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, hsl(185 100% 50%) 0%, transparent 70%)' }}
          />
        </div>

        <motion.div
          className="text-center space-y-6 z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Room code display */}
          <div className="space-y-2">
            <p className="text-xs font-display text-muted-foreground tracking-[0.3em] uppercase">
              {t('multiplayer.roomCode')}
            </p>
            <div className="flex justify-center gap-2">
              {displayCode.split('').map((char, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg bg-card border border-primary/30 
                             flex items-center justify-center text-2xl sm:text-3xl font-display font-black text-primary text-glow-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring' }}
                >
                  {char}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Players list */}
          <div className="space-y-3">
            <p className="text-xs font-display text-muted-foreground tracking-[0.2em] uppercase">
              {t('multiplayer.players')} ({players.length}/7)
            </p>
            <div className="space-y-2">
              <AnimatePresence>
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <span className="font-display font-bold text-sm tracking-wider" style={{ color: `hsl(${p.color})` }}>
                      {p.player_name}
                    </span>
                    {p.is_host && (
                      <span className="ml-auto text-[10px] font-display text-gold tracking-widest uppercase">
                        {t('multiplayer.host')}
                      </span>
                    )}
                    {p.player_session_id === sessionId && !p.is_host && (
                      <span className="ml-auto text-[10px] font-display text-primary tracking-widest uppercase">
                        {t('multiplayer.you')}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Waiting dots */}
            {players.length < 2 && (
              <p className="text-xs font-mono-game text-muted-foreground animate-pulse-glow">
                {t('multiplayer.waitingForPlayers')}
              </p>
            )}
          </div>

          {/* Start button (host only) */}
          {isHost && players.length >= 2 && (
            <motion.button
              onClick={handleStartGame}
              className="w-full py-4 bg-danger text-destructive-foreground font-display font-black 
                         text-lg uppercase tracking-[0.2em] rounded-lg glow-danger
                         hover:brightness-110 transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('multiplayer.startGame')} ({players.length} {t('multiplayer.players').toLowerCase()})
            </motion.button>
          )}

          {!isHost && (
            <p className="text-xs font-mono-game text-muted-foreground animate-pulse-glow">
              {t('multiplayer.waitingForHost')}
            </p>
          )}

          <button
            onClick={onBack}
            className="text-xs font-display text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase"
          >
            {t('multiplayer.leave')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background glow */}
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
          {t('multiplayer.title')}
        </h2>

        {mode === 'choose' && (
          <div className="space-y-4">
            {/* Name input */}
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
              />
            </div>

            <motion.button
              onClick={() => { setError(''); setMode('create'); handleCreateRoom(); }}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-danger text-destructive-foreground font-display font-black 
                         text-base uppercase tracking-[0.2em] rounded-lg glow-danger
                         hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('multiplayer.createRoom')}
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-display text-muted-foreground tracking-wider">{t('multiplayer.or')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <motion.button
              onClick={() => { setError(''); setMode('join'); }}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-card border border-primary/30 text-primary font-display font-bold 
                         text-base uppercase tracking-[0.2em] rounded-lg
                         hover:border-primary/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('multiplayer.joinRoom')}
            </motion.button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-display text-muted-foreground tracking-[0.2em] uppercase">
                {t('multiplayer.enterRoomCode')}
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="ABCDE"
                className="w-full px-4 py-4 bg-card border border-border rounded-lg text-center font-display 
                           font-black text-2xl text-foreground tracking-[0.4em] uppercase placeholder:text-muted-foreground/30
                           focus:outline-none focus:border-primary/50"
                maxLength={5}
                autoFocus
              />
            </div>

            <motion.button
              onClick={handleJoinRoom}
              disabled={loading || roomCode.length < 5}
              className="w-full py-4 bg-primary text-primary-foreground font-display font-black 
                         text-base uppercase tracking-[0.2em] rounded-lg glow-primary
                         hover:brightness-110 transition-all disabled:opacity-30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? '...' : t('multiplayer.join')}
            </motion.button>
          </div>
        )}

        {error && (
          <motion.p
            className="text-xs font-display text-danger tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={() => { setMode('choose'); setError(''); onBack(); }}
          className="text-xs font-display text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase"
        >
          {t('multiplayer.back')}
        </button>
      </motion.div>
    </div>
  );
}
