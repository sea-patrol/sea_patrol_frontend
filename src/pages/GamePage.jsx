import ProfileBlock from '../components/ProfileBlock';
import GameMainScene from '../components/GameMainScene';
import '../styles/GamePage.css'

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className='game-profile'>
        <ProfileBlock />
      </div>
      <div className='game-menu'>Меню</div>
      <GameMainScene />
    </div>
  );
}

export default GamePage;