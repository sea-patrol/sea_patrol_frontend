import ChatBlock from '../components/ChatBlock';
import GameMainScene from '../components/GameMainScene';
import ProfileBlock from '../components/ProfileBlock';
import { GameStateProvider } from '../contexts/GameStateContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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