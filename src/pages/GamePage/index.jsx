import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { GameUiProvider } from '../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../features/ui-shell/ui/GameUiShell';
import GameMainScene from '../../scene/GameMainScene';
import './GamePage.css';

function normalizeRoomEntry(roomEntry) {
  if (!roomEntry || typeof roomEntry !== 'object') {
    return null;
  }

  if (roomEntry.room?.id || roomEntry.joinResponse?.roomId) {
    return roomEntry;
  }

  return null;
}

function GamePage() {
  const location = useLocation();
  const { user, token, loading } = useAuth();
  const { state } = useGameState();

  const initialRoomEntry = normalizeRoomEntry(location.state?.roomEntry);
  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasRoomContext = Boolean(initialRoomEntry || currentPlayerState);

  if (!loading && !token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="game-page game-page--guard">
        <section className="game-page__guard-card" aria-live="polite">
          <h1>Preparing room session</h1>
          <p>Waiting for authentication state before entering gameplay.</p>
        </section>
      </div>
    );
  }

  if (!hasRoomContext) {
    return (
      <div className="game-page game-page--guard">
        <section className="game-page__guard-card" aria-live="polite">
          <h1>No active room session</h1>
          <p>Open the harbor lobby first, then join a room before loading the gameplay scene.</p>
          <Link className="game-page__guard-link" to="/lobby">
            Return to lobby
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="game-page">
      <GameUiProvider>
        <div className="game-page__viewport">
          <GameMainScene />
          <GameUiShell initialRoomEntry={initialRoomEntry} />
        </div>
      </GameUiProvider>
    </div>
  );
}

export default GamePage;
