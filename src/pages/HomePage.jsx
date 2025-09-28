import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import Signup from '../components/Signup';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const handlePlay = () => {
    if (isAuthenticated) {
      navigate('/game');
    } else {
      setShowAuth(true);
      setAuthMode('login');
    }
  };

  const handleLoginSuccess = () => {
    setShowAuth(false);
    navigate('/game');
  };

  const handleSignupSuccess = () => {
    setAuthMode('login');
    // Could also automatically log them in or show a success message
  };

  const handleLogout = () => {
    logout();
  };

  const closeAuthModal = () => {
    setShowAuth(false);
  };

  return (
    <div className="home-page">
      <div className="content">
        <h1>Sea Patrol</h1>
        
        {isAuthenticated ? (
          <div className="user-info">
            <p>Welcome, {user?.username}!</p>
            <button className="play-button" onClick={handlePlay}>
              Play
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="guest-actions">
            <button className="play-button" onClick={handlePlay}>
              Play
            </button>
            <p className="login-hint">You need to login to play the game</p>
          </div>
        )}
      </div>

      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <button className="close-button" onClick={closeAuthModal}>
              ×
            </button>
            {authMode === 'login' ? (
              <Login
                onSwitchToSignup={() => setAuthMode('signup')}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <Signup
                onSwitchToLogin={() => setAuthMode('login')}
                onSignupSuccess={handleSignupSuccess}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;