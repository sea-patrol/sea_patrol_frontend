import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
import { useWebSocket } from '../../features/realtime/model/WebSocketContext';
import { GameUiProvider } from '../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../features/ui-shell/ui/GameUiShell';
import GameMainScene from '../../scene/GameMainScene';
import * as messageType from '../../shared/constants/messageType';
import './GamePage.css';

const RECONNECT_GRACE_PERIOD_MS = 15_000;

const RECONNECT_STATUS = Object.freeze({
  IDLE: 'idle',
  WAITING_SOCKET: 'waiting-socket',
  WAITING_ROOM: 'waiting-room',
  WAITING_STATE: 'waiting-state',
});

function normalizeRoomEntry(roomEntry) {
  if (!roomEntry || typeof roomEntry !== 'object') {
    return null;
  }

  if (roomEntry.room?.id || roomEntry.joinResponse?.roomId) {
    return roomEntry;
  }

  return null;
}

function createInitialReconnectSession() {
  return {
    status: RECONNECT_STATUS.IDLE,
    roomId: null,
    deadlineAt: null,
  };
}

function createReconnectSession(roomId, isConnected) {
  return {
    status: isConnected ? RECONNECT_STATUS.WAITING_ROOM : RECONNECT_STATUS.WAITING_SOCKET,
    roomId,
    deadlineAt: Date.now() + RECONNECT_GRACE_PERIOD_MS,
  };
}

function isReconnectPending(status) {
  return status !== RECONNECT_STATUS.IDLE;
}

function getReconnectNotice(reason) {
  switch (reason) {
    case 'lobby-fallback':
      return {
        title: 'Reconnect moved back to lobby',
        body: 'Backend did not restore the previous room session and returned this client to the harbor lobby. Start a new room join flow from the room list.',
      };

    case 'timeout':
    default:
      return {
        title: 'Reconnect window expired',
        body: 'The room session was not restored within the 15-second reconnect grace window. Start a new room join flow from the harbor lobby.',
      };
  }
}

function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading } = useAuth();
  const { state, dispatch } = useGameState();
  const { roomSession, hydrateRoomEntry, clearRoomSession } = useRoomSession();
  const { isConnected, lastClose, reconnectState, subscribe } = useWebSocket();
  const [reconnectSession, setReconnectSession] = useState(createInitialReconnectSession);
  const [now, setNow] = useState(() => Date.now());

  const locationRoomEntry = normalizeRoomEntry(location.state?.roomEntry);
  const effectiveRoomEntry = locationRoomEntry ?? (roomSession.room ? {
    room: roomSession.room,
    joinResponse: roomSession.joinResponse,
    spawn: roomSession.spawn,
  } : null);
  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasRoomContext = Boolean(effectiveRoomEntry?.room || currentPlayerState);
  const shouldMountScene = Boolean(currentPlayerState);
  const roomId = effectiveRoomEntry?.room?.id ?? effectiveRoomEntry?.joinResponse?.roomId ?? null;
  const roomName = effectiveRoomEntry?.room?.name ?? effectiveRoomEntry?.joinResponse?.roomName ?? roomId;

  const previousConnectionRef = useRef(isConnected);
  const reconnectSessionRef = useRef(reconnectSession);
  reconnectSessionRef.current = reconnectSession;

  const resetReconnectSession = useCallback(() => {
    setReconnectSession(createInitialReconnectSession());
  }, []);

  const failReconnect = useCallback((reason) => {
    resetReconnectSession();
    clearRoomSession();
    dispatch({ type: 'RESET_STATE' });
    navigate('/lobby', {
      replace: true,
      state: {
        reconnectNotice: getReconnectNotice(reason),
      },
    });
  }, [clearRoomSession, dispatch, navigate, resetReconnectSession]);

  useEffect(() => {
    if (locationRoomEntry) {
      hydrateRoomEntry(locationRoomEntry);
    }
  }, [hydrateRoomEntry, locationRoomEntry]);

  useEffect(() => {
    if (!roomId) {
      resetReconnectSession();
      previousConnectionRef.current = isConnected;
      return;
    }

    const wasConnected = previousConnectionRef.current;
    if (wasConnected && !isConnected) {
      setReconnectSession(createReconnectSession(roomId, false));
      previousConnectionRef.current = isConnected;
      return;
    }

    if (currentPlayerState) {
      setReconnectSession((prevState) => {
        if (!isReconnectPending(prevState.status)) {
          return prevState;
        }

        if (isConnected && prevState.status === RECONNECT_STATUS.WAITING_SOCKET) {
          return {
            ...prevState,
            status: RECONNECT_STATUS.WAITING_ROOM,
          };
        }

        return prevState;
      });
      previousConnectionRef.current = isConnected;
      return;
    }

    setReconnectSession((prevState) => {
      if (!isReconnectPending(prevState.status) || prevState.roomId !== roomId) {
        return createReconnectSession(roomId, isConnected);
      }

      if (isConnected && prevState.status === RECONNECT_STATUS.WAITING_SOCKET) {
        return {
          ...prevState,
          status: RECONNECT_STATUS.WAITING_ROOM,
        };
      }

      return prevState;
    });

    previousConnectionRef.current = isConnected;
  }, [currentPlayerState, isConnected, roomId, resetReconnectSession]);

  useEffect(() => {
    if (!isReconnectPending(reconnectSession.status)) {
      return undefined;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reconnectSession.status]);

  useEffect(() => {
    if (!isReconnectPending(reconnectSession.status) || !reconnectSession.deadlineAt) {
      return undefined;
    }

    const timeoutMs = Math.max(0, reconnectSession.deadlineAt - Date.now());
    const timeoutId = window.setTimeout(() => {
      failReconnect('timeout');
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [failReconnect, reconnectSession.deadlineAt, reconnectSession.status]);

  useEffect(() => {
    const unsubscribeRoomJoined = subscribe(messageType.ROOM_JOINED, (payload) => {
      const activeReconnect = reconnectSessionRef.current;
      if (!isReconnectPending(activeReconnect.status)) {
        return;
      }

      if (payload?.roomId && activeReconnect.roomId && payload.roomId !== activeReconnect.roomId) {
        return;
      }

      setReconnectSession((prevState) => {
        if (!isReconnectPending(prevState.status)) {
          return prevState;
        }

        return {
          ...prevState,
          status: RECONNECT_STATUS.WAITING_STATE,
        };
      });
    });

    const unsubscribeInitGameState = subscribe(messageType.INIT_GAME_STATE, () => {
      const activeReconnect = reconnectSessionRef.current;
      if (!isReconnectPending(activeReconnect.status)) {
        return;
      }

      resetReconnectSession();
    });

    const handleLobbyFallback = () => {
      const activeReconnect = reconnectSessionRef.current;
      if (!isReconnectPending(activeReconnect.status)) {
        return;
      }

      failReconnect('lobby-fallback');
    };

    const unsubscribeRoomsSnapshot = subscribe(messageType.ROOMS_SNAPSHOT, handleLobbyFallback);
    const unsubscribeRoomsUpdated = subscribe(messageType.ROOMS_UPDATED, handleLobbyFallback);

    return () => {
      unsubscribeRoomJoined();
      unsubscribeInitGameState();
      unsubscribeRoomsSnapshot();
      unsubscribeRoomsUpdated();
    };
  }, [failReconnect, resetReconnectSession, subscribe]);

  const reconnectUiState = useMemo(() => {
    if (!isReconnectPending(reconnectSession.status)) {
      return null;
    }

    return {
      active: true,
      status: reconnectSession.status,
      roomId,
      roomName,
      graceRemainingMs: Math.max(0, (reconnectSession.deadlineAt ?? now) - now),
      wsPhase: reconnectState.phase,
      attempt: reconnectState.attempt,
      retryDelayMs: reconnectState.delayMs,
      lastClose,
    };
  }, [lastClose, now, reconnectSession, reconnectState, roomId, roomName]);

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
          {shouldMountScene && <GameMainScene />}
          <GameUiShell initialRoomEntry={effectiveRoomEntry} reconnectUiState={reconnectUiState} />
        </div>
      </GameUiProvider>
    </div>
  );
}

export default GamePage;

