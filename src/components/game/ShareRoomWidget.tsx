import { useState, useEffect } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareRoomWidgetProps {
  roomId: string;
}

export default function ShareRoomWidget({ roomId }: ShareRoomWidgetProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from('game_rooms')
      .select('room_code')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) setRoomCode(data.room_code);
      });
  }, [roomId]);

  if (!roomCode) return null;

  const joinUrl = `${window.location.origin}/play?room=${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'STEAL OR DIE',
        text: `Join my game! Room code: ${roomCode}`,
        url: joinUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
      <span className="text-[9px] font-display text-muted-foreground tracking-[0.2em] uppercase">
        ROOM CODE
      </span>
      <span className="text-2xl font-mono-game font-bold text-primary tracking-[0.3em]">
        {roomCode}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-display uppercase tracking-wider
                     bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground
                     border border-border rounded transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          {copied ? 'COPIED' : 'COPY LINK'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-display uppercase tracking-wider
                     bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground
                     border border-border rounded transition-colors"
        >
          <Share2 className="w-3 h-3" />
          SHARE
        </button>
      </div>
    </div>
  );
}
