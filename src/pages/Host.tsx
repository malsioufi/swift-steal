import { useSearchParams } from 'react-router-dom';
import HostScreen from '@/components/game/HostScreen';

export default function Host() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');

  if (!roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-muted-foreground">No room specified. Return to lobby.</p>
      </div>
    );
  }

  return <HostScreen roomId={roomId} />;
}
