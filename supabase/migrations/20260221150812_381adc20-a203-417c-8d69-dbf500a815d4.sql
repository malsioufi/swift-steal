
-- Game rooms table
CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  host_player_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  game_state JSONB DEFAULT '{}',
  max_players INT NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game players table
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_session_id UUID NOT NULL, -- client-generated session ID
  player_name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '⚡',
  color TEXT NOT NULL DEFAULT '185 100% 50%',
  player_order INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, ELIMINATED
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Game rooms: anyone can read rooms (to join by code), anyone can create/update
CREATE POLICY "Anyone can read game rooms"
  ON public.game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game rooms"
  ON public.game_rooms FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete game rooms"
  ON public.game_rooms FOR DELETE
  USING (true);

-- Game players: anyone can read/create/update/delete players
CREATE POLICY "Anyone can read game players"
  ON public.game_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game players"
  ON public.game_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game players"
  ON public.game_players FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete game players"
  ON public.game_players FOR DELETE
  USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Index for room code lookups
CREATE INDEX idx_game_rooms_code ON public.game_rooms (room_code);
CREATE INDEX idx_game_players_room ON public.game_players (room_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
