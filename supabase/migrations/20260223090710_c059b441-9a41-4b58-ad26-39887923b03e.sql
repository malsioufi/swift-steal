
-- Add last_action column for player-to-host action communication
ALTER TABLE public.game_players ADD COLUMN last_action jsonb DEFAULT NULL;
