import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/model/AuthContext';
import { useWebSocket } from '../../features/realtime/model/WebSocketContext';
import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';
import LobbyPanel from '../../widgets/LobbyPanel/LobbyPanel';
import './LobbyPage.css';

const LOBBY_CHAT_SCOPE = Object.freeze({
  key: 'group:lobby',
  target: 'group:lobby',
  label: 'Lobby',
  caption: 'Lobby chat',
  emptyState: 'No lobby messages yet. Start the conversation!',
  placeholder: 'Message the lobby...',
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

function getJoinStatusCopy(joinState) {
  const roomName = joinState.room?.name ?? joinState.joinResponse?.roomId ?? 'Selected room';

  switch (joinState.status) {
    case ROOM_JOIN_STATUS.SUBMITTING:
      return {
        title: 'Sending room join request',
        body: `Requesting room admission for ${roomName}. The lobby stays active until backend assigns a spawn for the room session.`,
      };

    case ROOM_JOIN_STATUS.AWAITING_SPAWN:
      return {
        title: 'Room admitted',
        body: `Backend accepted the join for ${roomName}. Waiting for authoritative spawn assignment before loading the gameplay scene.`,
      };

    case ROOM_JOIN_STATUS.AWAITING_INIT:
      return {
        title: 'Opening room scene',
        body: `Spawn is assigned for ${roomName}. Transitioning from the harbor lobby into the gameplay scene.`,
      };

    default:
      return null;
  }
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, token, loading, logout } = useAuth();
  const { subscribe } = useWebSocket();
  const [joinState, setJoinState] = useState(createInitialJoinState);

  useEffect(() => {
    if (!token) {
      setJoinState(createInitialJoinState());
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const unsubscribeRoomJoined = subscribe(messageType.ROOM_JOINED, (payload) => {
      setJoinState((prevState) => {
        if (!isJoinPending(prevState.status) || !matchesPendingRoom(payload, prevState.room)) {
          return prevState;
        }

        return {
          ...prevState,
          status: ROOM_JOIN_STATUS.AWAITING_SPAWN,
          room: resolveRoomMeta(payload, prevState.room),
          joinResponse: payload,
          error: null,
        };
      });
    });

    const unsubscribeSpawnAssigned = subscribe(messageType.SPAWN_ASSIGNED, (payload) => {
      setJoinState((prevState) => {
        if (!isJoinPending(prevState.status) || !matchesPendingRoom(payload, prevState.room)) {
          return prevState;
        }

        return {
          ...prevState,
          status: ROOM_JOIN_STATUS.AWAITING_INIT,
          room: resolveRoomMeta(payload, prevState.room),
          spawn: payload,
          error: null,
        };
      });
    });

    const unsubscribeJoinRejected = subscribe(messageType.ROOM_JOIN_REJECTED, (payload) => {
      setJoinState((prevState) => {
        if (!isJoinPending(prevState.status) || !matchesPendingRoom(payload, prevState.room)) {
          return prevState;
        }

        const roomId = payload?.roomId || prevState.room?.id;
        const reason = payload?.reason || 'UNKNOWN';

        return {
          status: ROOM_JOIN_STATUS.ERROR,
          room: prevState.room,
          joinResponse: prevState.joinResponse,
          spawn: null,
          error: roomId ? `Room join rejected for ${roomId}: ${reason}` : `Room join rejected: ${reason}`,
        };
      });
    });

    return () => {
      unsubscribeRoomJoined();
      unsubscribeSpawnAssigned();
      unsubscribeJoinRejected();
    };
  }, [subscribe, token]);

  useEffect(() => {
    if (
      joinState.status !== ROOM_JOIN_STATUS.AWAITING_INIT
      || !joinState.room
      || !joinState.joinResponse
      || !joinState.spawn
    ) {
      return;
    }

    navigate('/game', {
      state: {
        roomEntry: {
          room: joinState.room,
          joinResponse: joinState.joinResponse,
          spawn: joinState.spawn,
        },
      },
    });
  }, [joinState, navigate]);

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

    setJoinState({
      ...createInitialJoinState(),
      status: ROOM_JOIN_STATUS.SUBMITTING,
      room,
    });

    const result = await roomApi.joinRoom(token, room.id);
    if (!result.ok) {
      setJoinState({
        ...createInitialJoinState(),
        status: ROOM_JOIN_STATUS.ERROR,
        room,
        error: result.error?.message || 'Failed to join room.',
      });
      return;
    }

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
    return <Navigate to="/" replace />;
  }

  return (
    <div className="lobby-page">
      <header className="lobby-page__header">
        <div>
          <p className="lobby-page__eyebrow">Sea Patrol</p>
          <h1>Harbor Lobby</h1>
          <p className="lobby-page__lead">
            Choose a room, open a new harbor instance and keep the lobby chat active without loading the 3D sea until room entry is confirmed.
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

      {joinStatusCopy && (
        <section className="lobby-page__notice" aria-live="polite">
          <strong>{joinStatusCopy.title}</strong>
          <p>{joinStatusCopy.body}</p>
        </section>
      )}

      <main className="lobby-page__layout">
        <div className="lobby-page__catalog">
          <LobbyPanel
            token={token}
            onJoinRoom={handleJoinRoom}
            joiningRoomId={joiningRoomId}
            joinError={joinError}
          />
        </div>

        <aside className="lobby-page__chat-column">
          <div className="lobby-page__chat-card">
            <div className="lobby-page__chat-copy">
              <p className="lobby-page__eyebrow">Dockside channel</p>
              <h2>Lobby chat</h2>
              <p>Messages stay in `group:lobby` until backend confirms room admission and spawn assignment.</p>
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
