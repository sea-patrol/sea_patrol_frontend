import ChatBlock from '../components/ChatBlock';
import ProfileBlock from '../components/ProfileBlock';
import ThreeScene from '../components/ThreeScene';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className='chat-block'>
        <ChatBlock />
      </div>
      <ThreeScene />
    </div>
  );
}

export default GamePage;