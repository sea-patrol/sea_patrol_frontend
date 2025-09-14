import ChatBlock from '../components/ChatBlock';
import ProfileBlock from '../components/ProfileBlock';
import GameMainScene from '../components/GameMainScene';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className='chat-block'>
        <ChatBlock />
      </div>
      <GameMainScene />
    </div>
  );
}

export default GamePage;