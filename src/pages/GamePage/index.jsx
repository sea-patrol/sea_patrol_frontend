import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
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
  const { roomSession, hydrateRoomEntry } = useRoomSession();

  const locationRoomEntry = normalizeRoomEntry(location.state?.roomEntry);
  const effectiveRoomEntry = locationRoomEntry ?? (roomSession.room ? {
    room: roomSession.room,
    joinResponse: roomSession.joinResponse,
    spawn: roomSession.spawn,
  } : null);
  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasRoomContext = Boolean(effectiveRoomEntry?.room || currentPlayerState);

  useEffect(() => {
    if (locationRoomEntry) {
      hydrateRoomEntry(locationRoomEntry);
    }
  }, [hydrateRoomEntry, locationRoomEntry]);

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
          <p>This route is reserved for the room state. Open the harbor lobby and finish room join initialization first.</p>
          <div className="game-page__guard-actions">
            <Link className="game-page__guard-link" to="/lobby">
              Return to lobby
            </Link>
            <Link className="game-page__ghost-link" to="/">
              Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="game-page">
      <GameUiProvider>
        <div className="game-page__viewport">
          <GameMainScene />
          <GameUiShell initialRoomEntry={effectiveRoomEntry} />
        </div>
      </GameUiProvider>
    </div>
  );
}

export default GamePage;
