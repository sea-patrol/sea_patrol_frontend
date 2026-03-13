import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '../../features/game/model/GameStateContext';
import { useRoomSession } from '../../features/game/model/RoomSessionContext';
import { useWebSocket } from '../../features/realtime/model/WebSocketContext';
import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';
import LobbyPanel from '../../widgets/LobbyPanel/LobbyPanel';
import RoomLoadingSummary from '../../widgets/RoomLoadingSummary/RoomLoadingSummary';
import './LobbyPage.css';

const LOBBY_CHAT_SCOPE = Object.freeze({
  key: 'group:lobby',
  target: 'group:lobby',
  label: 'Lobby',
  caption: 'Lobby chat',
  emptyState: 'No lobby messages yet. Start the conversation!',
  placeholder: 'Message the lobby...',
});

const DUPLICATE_SESSION_CLOSE = Object.freeze({
  code: 1008,
  reason: 'SEAPATROL_DUPLICATE_SESSION',
});

const ROOM_JOIN_STATUS = Object.freeze({
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  AWAITING_SPAWN: 'awaiting-spawn',
  AWAITING_INIT: 'awaiting-init',
  ERROR: 'error',
});

function createInitialJoinState() {
  return {
    status: ROOM_JOIN_STATUS.IDLE,
    room: null,
    joinResponse: null,
    spawn: null,
    error: null,
  };
}

function isJoinPending(status) {
  return [ROOM_JOIN_STATUS.SUBMITTING, ROOM_JOIN_STATUS.AWAITING_SPAWN, ROOM_JOIN_STATUS.AWAITING_INIT].includes(status);
}

function matchesPendingRoom(payload, room) {
  if (!room?.id || !payload?.roomId) {
    return true;
  }

  return payload.roomId === room.id;
}

function resolveRoomMeta(payload, fallbackRoom = null) {
  const roomId = payload?.roomId ?? payload?.id ?? fallbackRoom?.id ?? null;
  if (!roomId) {
    return fallbackRoom;
  }

  return {
    id: roomId,
    name: fallbackRoom?.name ?? payload?.name ?? payload?.roomName ?? roomId,
  };
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

function getJoinStatusCopy(joinState) {
  const roomName = joinState.room?.name ?? joinState.joinResponse?.roomId ?? 'Selected room';

  switch (joinState.status) {
    case ROOM_JOIN_STATUS.SUBMITTING:
      return {
        stageLabel: 'Admission request',
        title: 'Sending room join request',
        body: `Requesting room admission for ${roomName}. The lobby stays active until backend confirms room initialization for the gameplay route.`,
      };

    case ROOM_JOIN_STATUS.AWAITING_SPAWN:
      return {
        stageLabel: 'Awaiting spawn',
        title: 'Room admitted',
        body: `Backend accepted the join for ${roomName}. Waiting for authoritative spawn assignment before room initialization continues.`,
      };

    case ROOM_JOIN_STATUS.AWAITING_INIT:
      return {
        stageLabel: 'Awaiting init',
        title: 'Waiting for room initialization',
        body: `Spawn is assigned for ${roomName}. The lobby keeps the player here until authoritative room state is fully ready.`,
      };

    default:
      return null;
  }
}

export default function LobbyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, loading, logout } = useAuth();
  const { state } = useGameState();
  const { roomSession, startRoomJoin, applyRoomJoined, applySpawnAssigned, clearRoomSession, resetRoomSession } = useRoomSession();
  const { lastClose, subscribe } = useWebSocket();
  const [joinState, setJoinState] = useState(createInitialJoinState);
  const joinStateRef = useRef(joinState);
  const duplicateSessionHandledRef = useRef(false);
  const roomExitedHandledRef = useRef(false);

  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasActiveRoom = Boolean(currentPlayerState && roomSession.room);
  const reconnectNotice = location.state?.reconnectNotice ?? null;
  const roomExited = location.state?.roomExited === true;

  useEffect(() => {
    if (!token) {
      setJoinState(createInitialJoinState());
    }
  }, [token]);

  useEffect(() => {
    joinStateRef.current = joinState;
  }, [joinState]);

  useEffect(() => {
    if (!roomExited) {
      roomExitedHandledRef.current = false;
      return;
    }

    if (roomExitedHandledRef.current) {
      return;
    }

    roomExitedHandledRef.current = true;
    clearRoomSession();
    setJoinState(createInitialJoinState());
    navigate('/lobby', {
      replace: true,
    });
  }, [clearRoomSession, navigate, roomExited]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const unsubscribeRoomJoined = subscribe(messageType.ROOM_JOINED, (payload) => {
      const currentJoinState = joinStateRef.current;
      if (!isJoinPending(currentJoinState.status) || !matchesPendingRoom(payload, currentJoinState.room)) {
        return;
      }

      const room = resolveRoomMeta(payload, currentJoinState.room);
      applyRoomJoined(payload, room);
      setJoinState((prevState) => ({
        ...prevState,
        status: ROOM_JOIN_STATUS.AWAITING_SPAWN,
        room,
        joinResponse: payload,
        error: null,
      }));
    });

    const unsubscribeSpawnAssigned = subscribe(messageType.SPAWN_ASSIGNED, (payload) => {
      const currentJoinState = joinStateRef.current;
      if (!isJoinPending(currentJoinState.status) || !matchesPendingRoom(payload, currentJoinState.room)) {
        return;
      }

      const room = resolveRoomMeta(payload, currentJoinState.room);
      applySpawnAssigned(payload, room);
      setJoinState((prevState) => ({
        ...prevState,
        status: ROOM_JOIN_STATUS.AWAITING_INIT,
        room,
        spawn: payload,
        error: null,
      }));
    });

    const unsubscribeJoinRejected = subscribe(messageType.ROOM_JOIN_REJECTED, (payload) => {
      const currentJoinState = joinStateRef.current;
      if (!isJoinPending(currentJoinState.status) || !matchesPendingRoom(payload, currentJoinState.room)) {
        return;
      }

      const roomId = payload?.roomId || currentJoinState.room?.id;
      const reason = payload?.reason || 'UNKNOWN';
      clearRoomSession();
      setJoinState({
        status: ROOM_JOIN_STATUS.ERROR,
        room: currentJoinState.room,
        joinResponse: currentJoinState.joinResponse,
        spawn: null,
        error: roomId ? `Room join rejected for ${roomId}: ${reason}` : `Room join rejected: ${reason}`,
      });
    });

    return () => {
      unsubscribeRoomJoined();
      unsubscribeSpawnAssigned();
      unsubscribeJoinRejected();
    };
  }, [applyRoomJoined, applySpawnAssigned, clearRoomSession, subscribe, token]);

  const handleUnauthorized = useCallback(() => {
    clearRoomSession();
    setJoinState(createInitialJoinState());
    logout();
    navigate('/', {
      replace: true,
      state: {
        openAuth: 'login',
      },
    });
  }, [clearRoomSession, logout, navigate]);

  const handleDuplicateSession = useCallback(() => {
    resetRoomSession();
    setJoinState(createInitialJoinState());
    navigate('/', {
      replace: true,
      state: {
        accessDenied: getAccessDeniedNotice(user?.username),
      },
    });
  }, [navigate, resetRoomSession, user?.username]);

  useEffect(() => {
    if (isDuplicateSessionClose(lastClose)) {
      if (!duplicateSessionHandledRef.current) {
        duplicateSessionHandledRef.current = true;
        handleDuplicateSession();
      }
      return;
    }

    duplicateSessionHandledRef.current = false;

    if (roomExited) {
      return;
    }

    if (hasActiveRoom) {
      navigate('/game', {
        replace: true,
        state: {
          roomEntry: {
            room: roomSession.room,
            joinResponse: roomSession.joinResponse,
            spawn: roomSession.spawn,
          },
        },
      });
    }
  }, [handleDuplicateSession, hasActiveRoom, lastClose, navigate, roomExited, roomSession]);

  const handleJoinRoom = async (room) => {
    if (!token) {
      setJoinState({
        ...createInitialJoinState(),
        status: ROOM_JOIN_STATUS.ERROR,
        room,
        error: 'Login required to join a room.',
      });
      return;
    }

    startRoomJoin(room);
    setJoinState({
      ...createInitialJoinState(),
      status: ROOM_JOIN_STATUS.SUBMITTING,
      room,
    });

    const result = await roomApi.joinRoom(token, room.id);
    if (!result.ok) {
      if (result.error?.status === 401) {
        handleUnauthorized();
        return;
      }

      clearRoomSession();
      setJoinState({
        ...createInitialJoinState(),
        status: ROOM_JOIN_STATUS.ERROR,
        room,
        error: result.error?.message || 'Failed to join room.',
      });
      return;
    }

    applyRoomJoined(result.data, room);
    setJoinState({
      ...createInitialJoinState(),
      status: ROOM_JOIN_STATUS.AWAITING_SPAWN,
      room,
      joinResponse: result.data,
    });
  };

  const joinStatusCopy = useMemo(() => getJoinStatusCopy(joinState), [joinState]);
  const joiningRoomId = isJoinPending(joinState.status) ? joinState.room?.id ?? null : null;
  const joinError = joinState.status === ROOM_JOIN_STATUS.ERROR ? joinState.error : null;

  if (!loading && !token) {
    return <Navigate to="/" replace state={{ openAuth: 'login' }} />;
  }

  return (
    <div className="lobby-page">
      <header className="lobby-page__header">
        <div>
          <p className="lobby-page__eyebrow">Sea Patrol</p>
          <h1>Harbor Lobby</h1>
          <p className="lobby-page__lead">
            This is the harbor state of the app: no gameplay scene, just rooms, chat and room-entry progress before the captain is moved into a live sea instance.
          </p>
        </div>
        <div className="lobby-page__actions">
          <div className="lobby-page__captain-card">
            <span>Captain</span>
            <strong>{user?.username ?? 'Authenticated sailor'}</strong>
          </div>
          <Link className="lobby-page__ghost-button" to="/">
            Home
          </Link>
          <button type="button" className="lobby-page__ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="lobby-page__state-strip" aria-label="Current application state">
        <div>
          <span>Route state</span>
          <strong>Lobby</strong>
        </div>
        <div>
          <span>Next route</span>
          <strong>Room</strong>
        </div>
        <div>
          <span>Transition rule</span>
          <strong>Join + init complete</strong>
        </div>
      </section>

      {reconnectNotice && (
        <section className="lobby-page__notice lobby-page__notice--warning" aria-live="polite">
          <strong>{reconnectNotice.title}</strong>
          <p>{reconnectNotice.body}</p>
        </section>
      )}

      {joinStatusCopy && (
        <div className="lobby-page__notice" aria-live="polite">
          <RoomLoadingSummary
            title={joinStatusCopy.title}
            body={joinStatusCopy.body}
            room={joinState.room}
            joinResponse={joinState.joinResponse}
            spawn={joinState.spawn}
            stageLabel={joinStatusCopy.stageLabel}
          />
        </div>
      )}

      <main className="lobby-page__layout">
        <div className="lobby-page__catalog">
          <LobbyPanel
            token={token}
            onJoinRoom={handleJoinRoom}
            joiningRoomId={joiningRoomId}
            joinError={joinError}
            onUnauthorized={handleUnauthorized}
          />
        </div>

        <aside className="lobby-page__chat-column">
          <div className="lobby-page__chat-card">
            <div className="lobby-page__chat-copy">
              <p className="lobby-page__eyebrow">Dockside channel</p>
              <h2>Lobby chat</h2>
              <p>Messages stay in `group:lobby` until backend confirms both room admission and room initialization for the gameplay route.</p>
            </div>
            <div className="lobby-page__chat-shell">
              <ChatBlock chatScope={LOBBY_CHAT_SCOPE} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
