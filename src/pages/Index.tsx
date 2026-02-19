import { useGameStore } from '@/store/gameStore';
import LobbyScreen from '@/components/game/LobbyScreen';
import GameScreen from '@/components/game/GameScreen';

const Index = () => {
  const { phase } = useGameStore();

  if (phase === 'LOBBY' && useGameStore.getState().players.length === 0) {
    return <LobbyScreen />;
  }

  return <GameScreen />;
};

export default Index;
