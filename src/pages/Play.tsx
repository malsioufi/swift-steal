import { useSearchParams } from 'react-router-dom';
import PlayerScreen from '@/components/game/PlayerScreen';

export default function Play() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');

  if (!roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-muted-foreground">No room specified. Return to lobby.</p>
      </div>
    );
  }

  return <PlayerScreen roomId={roomId} />;
}
