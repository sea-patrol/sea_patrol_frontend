import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
import { useWebSocket } from '../../features/realtime/model/WebSocketContext';
import { GameUiProvider } from '../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../features/ui-shell/ui/GameUiShell';
import GameMainScene from '../../scene/GameMainScene';
import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';
import './GamePage.css';

const RECONNECT_GRACE_PERIOD_MS = 15_000;
const DUPLICATE_SESSION_CLOSE = Object.freeze({
  code: 1008,
  reason: 'SEAPATROL_DUPLICATE_SESSION',
});

const RECONNECT_STATUS = Object.freeze({
  IDLE: 'idle',
  WAITING_SOCKET: 'waiting-socket',
  WAITING_ROOM: 'waiting-room',
  WAITING_STATE: 'waiting-state',
});

const LEAVE_ROOM_STATUS = Object.freeze({
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  ERROR: 'error',
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

function isDuplicateSessionClose(lastClose) {
  return lastClose?.code === DUPLICATE_SESSION_CLOSE.code && lastClose?.reason === DUPLICATE_SESSION_CLOSE.reason;
}

function getAccessDeniedNotice(username) {
  return {
    title: 'Access denied',
    body: `Another browser tab already owns the active game session${username ? ` for ${username}` : ''}. Close that tab or wait until it disconnects, then press Play again.`,
  };
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

function createInitialLeaveRoomState() {
  return {
    status: LEAVE_ROOM_STATUS.IDLE,
    error: null,
  };
}

function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading, logout } = useAuth();
  const { state, dispatch } = useGameState();
  const { roomSession, hydrateRoomEntry, clearRoomSession, resetRoomSession } = useRoomSession();
  const { isConnected, lastClose, reconnectState, subscribe } = useWebSocket();
  const [reconnectSession, setReconnectSession] = useState(createInitialReconnectSession);
  const [leaveRoomState, setLeaveRoomState] = useState(createInitialLeaveRoomState);
  const [exitToLobbyRequested, setExitToLobbyRequested] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const locationRoomEntry = normalizeRoomEntry(location.state?.roomEntry);
  const effectiveRoomEntry = exitToLobbyRequested ? null : locationRoomEntry ?? (roomSession.room ? {
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
  const duplicateSessionHandledRef = useRef(false);
  const exitToLobbyRequestedRef = useRef(exitToLobbyRequested);
  reconnectSessionRef.current = reconnectSession;
  exitToLobbyRequestedRef.current = exitToLobbyRequested;

  const resetReconnectSession = useCallback(() => {
    setReconnectSession(createInitialReconnectSession());
  }, []);

  const failReconnect = useCallback((reason) => {
    if (exitToLobbyRequestedRef.current) {
      return;
    }
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

  const handleAccessDenied = useCallback(() => {
    resetReconnectSession();
    resetRoomSession();
    dispatch({ type: 'RESET_STATE' });
    navigate('/', {
      replace: true,
      state: {
        accessDenied: getAccessDeniedNotice(user?.username),
      },
    });
  }, [dispatch, navigate, resetReconnectSession, resetRoomSession, user?.username]);

  const handleUnauthorized = useCallback(() => {
    resetReconnectSession();
    clearRoomSession();
    dispatch({ type: 'RESET_STATE' });
    logout();
    navigate('/', {
      replace: true,
      state: {
        openAuth: 'login',
      },
    });
  }, [clearRoomSession, dispatch, logout, navigate, resetReconnectSession]);

  const finalizeLeaveToLobby = useCallback(() => {
    setExitToLobbyRequested(true);
    resetReconnectSession();
    clearRoomSession();
    dispatch({ type: 'RESET_STATE' });
    setLeaveRoomState(createInitialLeaveRoomState());
    navigate('/lobby', {
      replace: true,
      state: {
        roomExited: true,
      },
    });
  }, [clearRoomSession, dispatch, navigate, resetReconnectSession]);

  useEffect(() => {
    if (locationRoomEntry) {
      hydrateRoomEntry(locationRoomEntry);
    }
  }, [hydrateRoomEntry, locationRoomEntry]);

  useEffect(() => {
    setLeaveRoomState(createInitialLeaveRoomState());
  }, [roomId]);

  useEffect(() => {
    if (isDuplicateSessionClose(lastClose)) {
      if (!duplicateSessionHandledRef.current) {
        duplicateSessionHandledRef.current = true;
        handleAccessDenied();
      }
      return;
    }

    duplicateSessionHandledRef.current = false;
  }, [handleAccessDenied, lastClose]);

  useEffect(() => {
    if (leaveRoomState.status === LEAVE_ROOM_STATUS.SUBMITTING || exitToLobbyRequested) {
      resetReconnectSession();
      previousConnectionRef.current = isConnected;
      return;
    }

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
  }, [currentPlayerState, exitToLobbyRequested, isConnected, leaveRoomState.status, roomId, resetReconnectSession]);

  useEffect(() => {
    if (exitToLobbyRequested || !isReconnectPending(reconnectSession.status)) {
      return undefined;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [exitToLobbyRequested, reconnectSession.status]);

  useEffect(() => {
    if (exitToLobbyRequested || !isReconnectPending(reconnectSession.status) || !reconnectSession.deadlineAt) {
      return undefined;
    }

    const timeoutMs = Math.max(0, reconnectSession.deadlineAt - Date.now());
    const timeoutId = window.setTimeout(() => {
      failReconnect('timeout');
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [exitToLobbyRequested, failReconnect, reconnectSession.deadlineAt, reconnectSession.status]);

  useEffect(() => {
    const unsubscribeRoomJoined = subscribe(messageType.ROOM_JOINED, (payload) => {
      if (exitToLobbyRequestedRef.current) {
        return;
      }
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
      if (exitToLobbyRequestedRef.current) {
        return;
      }
      const activeReconnect = reconnectSessionRef.current;
      if (!isReconnectPending(activeReconnect.status)) {
        return;
      }

      resetReconnectSession();
    });

    const handleLobbyFallback = () => {
      if (exitToLobbyRequestedRef.current) {
        return;
      }
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

  const handleLeaveRoom = useCallback(async () => {
    if (!token || !roomId || leaveRoomState.status === LEAVE_ROOM_STATUS.SUBMITTING) {
      return;
    }

    setLeaveRoomState({
      status: LEAVE_ROOM_STATUS.SUBMITTING,
      error: null,
    });

    const result = await roomApi.leaveRoom(token, roomId);
    if (!result.ok) {
      if (result.error?.status === 401) {
        handleUnauthorized();
        return;
      }

      setLeaveRoomState({
        status: LEAVE_ROOM_STATUS.ERROR,
        error: result.error?.message || 'Не удалось выйти из комнаты.',
      });
      return;
    }

    finalizeLeaveToLobby();
  }, [finalizeLeaveToLobby, handleUnauthorized, leaveRoomState.status, roomId, token]);

  if (!loading && !token) {
    return <Navigate to="/" replace />;
  }

  if (exitToLobbyRequested) {
    return (
      <Navigate
        to="/lobby"
        replace
        state={{
          roomExited: true,
        }}
      />
    );
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
          <GameUiShell
            initialRoomEntry={effectiveRoomEntry}
            reconnectUiState={reconnectUiState}
            onLeaveRoom={handleLeaveRoom}
            leaveRoomState={leaveRoomState}
          />
        </div>
      </GameUiProvider>
    </div>
  );
}

export default GamePage;

