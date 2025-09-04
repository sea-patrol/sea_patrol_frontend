import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate('/game');
  };

  return (
    <div className="home-page">
      <div className="content">
        <h1>Sea Patrol</h1>
        <button className="play-button" onClick={handlePlay}>
          Play
        </button>
      </div>
    </div>
  );
}

export default HomePage;