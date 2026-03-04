import { GameStateProvider } from '../../features/game/model/GameStateContext';
import { WebSocketProvider } from '../../features/realtime/model/WebSocketContext';
import GameMainScene from '../../scene/GameMainScene';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';
import ProfileBlock from '../../widgets/GameHud/ProfileBlock';
import './GamePage.css'

function GamePage() {
  return (
    <div className="game-page">
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
