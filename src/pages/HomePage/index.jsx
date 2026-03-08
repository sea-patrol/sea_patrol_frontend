import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import Login from '../../features/auth/ui/Login';
import Signup from '../../features/auth/ui/Signup';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
import './HomePage.css';

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { state } = useGameState();
  const { roomSession } = useRoomSession();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasActiveRoom = Boolean(currentPlayerState && roomSession.room);
  const primaryActionLabel = hasActiveRoom ? 'Return to room' : 'Enter lobby';
  const primaryHint = hasActiveRoom
    ? `Captain ${user?.username} already has an active room session in ${roomSession.room?.name ?? roomSession.room?.id}.`
    : 'You need to login to reach the harbor lobby';

  useEffect(() => {
    if (!isAuthenticated && location.state?.openAuth === 'login') {
      setShowAuth(true);
      setAuthMode('login');
    }
  }, [isAuthenticated, location.state]);

  const handlePlay = () => {
    if (isAuthenticated) {
      navigate(hasActiveRoom ? '/game' : '/lobby');
    } else {
      setShowAuth(true);
      setAuthMode('login');
    }
  };

  const handleLoginSuccess = () => {
    setShowAuth(false);
    navigate('/lobby');
  };

  const handleSignupSuccess = () => {
    setAuthMode('login');
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
              {primaryActionLabel}
            </button>
            <p className="login-hint">{primaryHint}</p>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="guest-actions">
            <button className="play-button" onClick={handlePlay}>
              {primaryActionLabel}
            </button>
            <p className="login-hint">{primaryHint}</p>
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
