import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/roomService';
import type { GamePhase, Player, TriviaQuestion } from './gameStore';
import type { SyncedGameState } from './hostGameStore';

interface PlayerGameState {
  roomId: string;
  playerId: string; // session ID of this player
  dbPlayerId: string; // UUID from game_players table
  playerName: string;
  connected: boolean;

  // Synced state from host (read-only mirror)
  phase: GamePhase;
  currentRound: number;
  players: Player[];
  currentQuestion: TriviaQuestion | null;
  questionInRound: number;
  revealedText: string;
  buzzedPlayerId: string | null;
  lockedOutPlayerIds: string[];
  answerResult: 'correct' | 'incorrect' | 'timeout' | null;
  lastSubmittedAnswer: string | null;
  correctAnswer: string | null;
  answeringPlayerName: string | null;
  selectedTargetId: string | null;
  buzzedDuringMC: boolean;
  eliminatedThisRound: string | null;

  // Actions
  connectToRoom: (roomId: string) => Promise<void>;
  disconnect: () => void;
  sendBuzz: () => void;
  sendAnswer: (answer: string) => void;
  sendMultipleChoice: (choice: string) => void;
  sendTargetSelect: (targetId: string) => void;
}

let channel: ReturnType<typeof supabase.channel> | null = null;

export const usePlayerGameStore = create<PlayerGameState>((set, get) => ({
  roomId: '',
  playerId: '',
  dbPlayerId: '',
  playerName: '',
  connected: false,
  phase: 'LOBBY',
  currentRound: 0,
  players: [],
  currentQuestion: null,
  questionInRound: 0,
  revealedText: '',
  buzzedPlayerId: null,
  lockedOutPlayerIds: [],
  answerResult: null,
  lastSubmittedAnswer: null,
  correctAnswer: null,
  answeringPlayerName: null,
  selectedTargetId: null,
  buzzedDuringMC: false,
  eliminatedThisRound: null,

  connectToRoom: async (roomId: string) => {
    const sessionId = getSessionId();

    // Find this player's DB record
    const { data: player } = await supabase
      .from('game_players')
      .select('id, player_name')
      .eq('room_id', roomId)
      .eq('player_session_id', sessionId)
      .maybeSingle();

    if (!player) {
      console.error('Player not found in room');
      return;
    }

    set({
      roomId,
      playerId: sessionId,
      dbPlayerId: player.id,
      playerName: player.player_name,
      connected: true,
    });

    // Get initial game state
    const { data: room } = await supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (room?.game_state) {
      const gs = room.game_state as unknown as SyncedGameState;
      set({
        phase: gs.phase,
        currentRound: gs.currentRound,
        players: gs.players,
        currentQuestion: gs.currentQuestion,
        questionInRound: gs.questionInRound,
        revealedText: gs.revealedText,
        buzzedPlayerId: gs.buzzedPlayerId,
        lockedOutPlayerIds: gs.lockedOutPlayerIds,
        answerResult: gs.answerResult,
        lastSubmittedAnswer: gs.lastSubmittedAnswer,
        correctAnswer: gs.correctAnswer,
        answeringPlayerName: gs.answeringPlayerName,
        selectedTargetId: gs.selectedTargetId,
        buzzedDuringMC: gs.buzzedDuringMC,
        eliminatedThisRound: gs.eliminatedThisRound,
      });
    }

    // Subscribe to game_state updates via Realtime
    channel = supabase
      .channel(`player-room-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        const gs = payload.new.game_state as unknown as SyncedGameState;
        if (!gs) return;
        set({
          phase: gs.phase,
          currentRound: gs.currentRound,
          players: gs.players,
          currentQuestion: gs.currentQuestion,
          questionInRound: gs.questionInRound,
          revealedText: gs.revealedText,
          buzzedPlayerId: gs.buzzedPlayerId,
          lockedOutPlayerIds: gs.lockedOutPlayerIds,
          answerResult: gs.answerResult,
          lastSubmittedAnswer: gs.lastSubmittedAnswer,
          correctAnswer: gs.correctAnswer,
          answeringPlayerName: gs.answeringPlayerName,
          selectedTargetId: gs.selectedTargetId,
          buzzedDuringMC: gs.buzzedDuringMC,
          eliminatedThisRound: gs.eliminatedThisRound,
        });
      })
      .subscribe();
  },

  disconnect: () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    set({ connected: false, roomId: '' });
  },

  sendBuzz: async () => {
    const { dbPlayerId } = get();
    if (!dbPlayerId) return;
    await supabase
      .from('game_players')
      .update({ last_action: { type: 'buzz', ts: Date.now() } })
      .eq('id', dbPlayerId);
  },

  sendAnswer: async (answer: string) => {
    const { dbPlayerId } = get();
    if (!dbPlayerId) return;
    await supabase
      .from('game_players')
      .update({ last_action: { type: 'answer', value: answer, ts: Date.now() } })
      .eq('id', dbPlayerId);
  },

  sendMultipleChoice: async (choice: string) => {
    const { dbPlayerId } = get();
    if (!dbPlayerId) return;
    await supabase
      .from('game_players')
      .update({ last_action: { type: 'select_mc', value: choice, ts: Date.now() } })
      .eq('id', dbPlayerId);
  },

  sendTargetSelect: async (targetId: string) => {
    const { dbPlayerId } = get();
    if (!dbPlayerId) return;
    await supabase
      .from('game_players')
      .update({ last_action: { type: 'select_target', value: targetId, ts: Date.now() } })
      .eq('id', dbPlayerId);
  },
}));
