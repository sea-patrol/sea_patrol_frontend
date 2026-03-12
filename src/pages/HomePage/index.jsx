import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import Login from '../../features/auth/ui/Login';
import Signup from '../../features/auth/ui/Signup';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
import './HomePage.css';

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { roomSession } = useRoomSession();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const hasKnownRoomSession = Boolean(roomSession.room);
  const accessDeniedNotice = location.state?.accessDenied ?? null;
  const primaryActionLabel = 'Play';
  const primaryHint = hasKnownRoomSession
    ? `Captain ${user?.username} can continue the room session in ${roomSession.room?.name ?? roomSession.room?.id}.`
    : 'Login to enter the harbor lobby and start a new room session.';

  useEffect(() => {
    if (!isAuthenticated && location.state?.openAuth === 'login') {
      setShowAuth(true);
      setAuthMode('login');
    }
  }, [isAuthenticated, location.state]);

  const handlePlay = () => {
    if (isAuthenticated) {
      navigate(hasKnownRoomSession ? '/game' : '/lobby');
      return;
    }

    setShowAuth(true);
    setAuthMode('login');
  };

  const handleLoginSuccess = () => {
    setShowAuth(false);
    navigate(roomSession.room ? '/game' : '/lobby');
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

        {accessDeniedNotice && (
          <section className="home-page__notice" role="alert" aria-live="polite">
            <strong>{accessDeniedNotice.title}</strong>
            <p>{accessDeniedNotice.body}</p>
          </section>
        )}

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
