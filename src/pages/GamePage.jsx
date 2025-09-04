import ProfileBlock from '../components/ProfileBlock';
import ThreeScene from '../components/ThreeScene';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className='game-profile'>
        <ProfileBlock />
      </div>
      <div className='game-menu'>Меню</div>
      <ThreeScene />
    </div>
  );
}

export default GamePage;