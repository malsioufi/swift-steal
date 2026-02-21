import { supabase } from '@/integrations/supabase/client';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/1/0 for clarity
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get or create a persistent session ID for this browser tab
let _sessionId: string | null = null;
export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = sessionStorage.getItem('game_session_id');
    if (!_sessionId) {
      _sessionId = crypto.randomUUID();
      sessionStorage.setItem('game_session_id', _sessionId);
    }
  }
  return _sessionId;
}

const PLAYER_COLORS = [
  '185 100% 50%', '0 90% 55%', '270 80% 60%', '120 70% 45%',
  '35 95% 55%', '320 80% 55%', '55 90% 50%',
];

const AVATARS = ['⚡', '🐍', '👻', '💀', '🌑', '🔥', '👤'];

export async function createRoom(): Promise<{ roomId: string; roomCode: string } | null> {
  const sessionId = getSessionId();
  const roomCode = generateRoomCode();

  const { data: room, error } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      host_player_id: sessionId,
      status: 'waiting',
      game_state: {},
    })
    .select()
    .single();

  if (error || !room) {
    console.error('Failed to create room:', error);
    return null;
  }

  return { roomId: room.id, roomCode: room.room_code };
}

export async function joinRoom(roomCode: string, playerName: string): Promise<{
  roomId: string;
  playerId: string;
  playerOrder: number;
} | null> {
  const sessionId = getSessionId();

  // Find room
  const { data: room, error: roomErr } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (roomErr || !room) {
    console.error('Room not found:', roomErr);
    return null;
  }

  // Check existing players count
  const { count } = await supabase
    .from('game_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id);

  const playerOrder = (count || 0);
  if (playerOrder >= room.max_players) {
    console.error('Room is full');
    return null;
  }

  // Check if already joined
  const { data: existing } = await supabase
    .from('game_players')
    .select('id')
    .eq('room_id', room.id)
    .eq('player_session_id', sessionId)
    .maybeSingle();

  if (existing) {
    return { roomId: room.id, playerId: existing.id, playerOrder };
  }

  const isHost = room.host_player_id === sessionId;

  const { data: player, error: playerErr } = await supabase
    .from('game_players')
    .insert({
      room_id: room.id,
      player_session_id: sessionId,
      player_name: playerName.toUpperCase(),
      avatar: AVATARS[playerOrder % AVATARS.length],
      color: PLAYER_COLORS[playerOrder % PLAYER_COLORS.length],
      player_order: playerOrder,
      is_host: isHost,
    })
    .select()
    .single();

  if (playerErr || !player) {
    console.error('Failed to join room:', playerErr);
    return null;
  }

  return { roomId: room.id, playerId: player.id, playerOrder };
}

export async function getRoomPlayers(roomId: string) {
  const { data, error } = await supabase
    .from('game_players')
    .select('*')
    .eq('room_id', roomId)
    .order('player_order');

  if (error) {
    console.error('Failed to get players:', error);
    return [];
  }
  return data || [];
}

export async function getRoom(roomId: string) {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) return null;
  return data;
}

export function subscribeToRoom(roomId: string, onUpdate: (payload: any) => void) {
  return supabase
    .channel(`room-${roomId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rooms',
      filter: `id=eq.${roomId}`,
    }, onUpdate)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_players',
      filter: `room_id=eq.${roomId}`,
    }, onUpdate)
    .subscribe();
}

export async function updateRoomStatus(roomId: string, status: string) {
  await supabase
    .from('game_rooms')
    .update({ status })
    .eq('id', roomId);
}

export async function updateGameState(roomId: string, gameState: Record<string, any>) {
  await supabase
    .from('game_rooms')
    .update({ game_state: gameState })
    .eq('id', roomId);
}

export async function removePlayer(playerId: string) {
  await supabase
    .from('game_players')
    .delete()
    .eq('id', playerId);
}

export async function deleteRoom(roomId: string) {
  await supabase
    .from('game_rooms')
    .delete()
    .eq('id', roomId);
}
