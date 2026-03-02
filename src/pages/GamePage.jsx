import { GameLayout } from '../layouts/GameLayout';
import ChatBlock from '../components/ChatBlock';
import ProfileBlock from '../components/ProfileBlock';
import GameMainScene from '../components/GameMainScene';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameLayout>
        <div className='chat-block'>
          <ChatBlock />
        </div>
        <GameMainScene />
      </GameLayout>
    </div>
  );
}

export default GamePage;