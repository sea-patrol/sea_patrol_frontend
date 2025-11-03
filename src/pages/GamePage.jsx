import ChatBlock from '../components/ChatBlock';
import ProfileBlock from '../components/ProfileBlock';
import GameMainScene from '../components/GameMainScene';
import { useAuth } from '../contexts/AuthContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { GameStateProvider } from '../contexts/GameStateContext';
import '../styles/GamePage.css'

function GamePage() {
  const { user } = useAuth();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className='username-display'>
        {user?.username || 'Player'}
      </div>
      <WebSocketProvider>
        <div className='chat-block'>
          <ChatBlock />
        </div>
        <GameStateProvider>
          <GameMainScene />
        </GameStateProvider>
      </WebSocketProvider>
    </div>
  );
}

export default GamePage;