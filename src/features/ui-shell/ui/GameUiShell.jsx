import { useEffect, useMemo, useRef, useState } from 'react';

import { GAME_UI_MODE, UI_WINDOW, useGameUi } from '../model/GameUiContext';

import './GameUiShell.css';
import GameUiHotkeys from './GameUiHotkeys';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useDebugUi } from '@/features/debug/model/DebugUiContext';
import { selectCurrentPlayerState, useGameState } from '@/features/game/model/GameStateContext';
import { useRoomSession } from '@/features/game/model/RoomSessionContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import ChatBlock from '@/widgets/ChatPanel/ChatBlock';
import ProfileBlock from '@/widgets/GameHud/ProfileBlock';
import RoomLoadingSummary from '@/widgets/RoomLoadingSummary/RoomLoadingSummary';

const WINDOW_COPY = {
  [UI_WINDOW.INVENTORY]: {
    title: 'Inventory',
    description: 'Cargo and inventory UI will plug into this shell slot in TASK-041.',
  },
  [UI_WINDOW.JOURNAL]: {
    title: 'Journal',
    description: 'Quest and journal UI will attach here in TASK-048.',
  },
  [UI_WINDOW.MAP]: {
    title: 'Map',
    description: 'Map and minimap flow will grow from this shell window in later tasks.',
  },
};

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
  AWAITING_SPAWN: 'awaiting-spawn',
  AWAITING_INIT: 'awaiting-init',
  ERROR: 'error',
});

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

function createInitialRoomJoinState(initialRoomEntry = null) {
  if (!initialRoomEntry) {
    return {
      status: ROOM_JOIN_STATUS.IDLE,
      room: null,
      joinResponse: null,
      spawn: null,
      error: null,
    };
  }

  const room = resolveRoomMeta(initialRoomEntry.room ?? initialRoomEntry.joinResponse, initialRoomEntry.room ?? null);

  return {
    status: initialRoomEntry.spawn ? ROOM_JOIN_STATUS.AWAITING_INIT : ROOM_JOIN_STATUS.AWAITING_SPAWN,
    room,
    joinResponse: initialRoomEntry.joinResponse ?? null,
    spawn: initialRoomEntry.spawn ?? null,
    error: null,
  };
}

function isRoomJoinPending(status) {
  return [ROOM_JOIN_STATUS.AWAITING_SPAWN, ROOM_JOIN_STATUS.AWAITING_INIT].includes(status);
}

function getRoomLoadingCopy(roomJoinState) {
  const roomName = roomJoinState.room?.name || roomJoinState.joinResponse?.roomId || 'Selected room';

  switch (roomJoinState.status) {
    case ROOM_JOIN_STATUS.AWAITING_SPAWN:
      return {
        stageLabel: 'Awaiting spawn',
        title: 'Assigning spawn',
        body: `Backend accepted the room admission for ${roomName}. Waiting for authoritative SPAWN_ASSIGNED before gameplay starts.`,
      };

    case ROOM_JOIN_STATUS.AWAITING_INIT: {
      const spawn = roomJoinState.spawn;
      const hasSpawn = typeof spawn?.x === 'number' && typeof spawn?.z === 'number' && typeof spawn?.angle === 'number';
      const spawnCopy = hasSpawn
        ? ` Spawn received at x=${spawn.x.toFixed(2)}, z=${spawn.z.toFixed(2)}, angle=${spawn.angle.toFixed(2)}.`
        : '';

      return {
        stageLabel: 'Awaiting init',
        title: 'Initializing room state',
        body: `Spawn is assigned for ${roomName}. Waiting for INIT_GAME_STATE/current player snapshot to switch into sailing.${spawnCopy}`,
      };
    }

    case ROOM_JOIN_STATUS.ERROR:
      return {
        stageLabel: 'Join rejected',
        title: 'Room entry failed',
        body: roomJoinState.error ?? 'Room entry could not be completed.',
      };

    default:
      return {
        stageLabel: 'Waiting for context',
        title: 'Preparing room session',
        body: 'Waiting for room session context.',
      };
  }
}

function formatSeconds(ms) {
  return Math.max(1, Math.ceil(ms / 1000));
}

function getReconnectCopy(reconnectUiState) {
  const roomName = reconnectUiState?.roomName ?? reconnectUiState?.roomId ?? 'the current room';
  const graceSeconds = formatSeconds(reconnectUiState?.graceRemainingMs ?? 0);
  const retryCopy = reconnectUiState?.wsPhase === 'reconnecting' && reconnectUiState?.attempt > 0
    ? ` Retry ${reconnectUiState.attempt} is scheduled in ${formatSeconds(reconnectUiState.retryDelayMs ?? 0)}s.`
    : '';
  const closeReasonCopy = reconnectUiState?.lastClose?.code !== undefined
    ? ` Last close: ${String(reconnectUiState.lastClose.code)}${reconnectUiState.lastClose.reason ? ` (${reconnectUiState.lastClose.reason})` : ''}.`
    : '';

  switch (reconnectUiState?.status) {
    case 'waiting-socket':
      return {
        title: 'Reconnecting to room session',
        body: `Connection to ${roomName} was lost. The client is trying to reopen the realtime link before the 15-second grace window expires. ${graceSeconds}s remaining.${retryCopy}${closeReasonCopy}`,
      };

    case 'waiting-room':
      return {
        title: 'Realtime link restored',
        body: `WebSocket connection is back. Waiting for backend to rebind this client to ${roomName} and resend ROOM_JOINED before the grace window closes. ${graceSeconds}s remaining.${closeReasonCopy}`,
      };

    case 'waiting-state':
      return {
        title: 'Restoring authoritative room state',
        body: `Backend confirmed the room binding for ${roomName}. Waiting for fresh INIT_GAME_STATE so gameplay can safely resume. ${graceSeconds}s remaining.${closeReasonCopy}`,
      };

    default:
      return {
        title: 'Reconnecting',
        body: `Trying to restore ${roomName}. ${graceSeconds}s remaining.${retryCopy}${closeReasonCopy}`,
      };
  }
}

function createRoomChatScope(room) {
  const roomId = room?.id ?? room?.roomId;
  if (!roomId) {
    return LOBBY_CHAT_SCOPE;
  }

  const roomName = room?.name ?? roomId;
  const caption = roomName === roomId ? roomId : `${roomName} (${roomId})`;

  return {
    key: `group:room:${roomId}`,
    target: `group:room:${roomId}`,
    label: 'Room',
    caption,
    emptyState: `No messages in ${roomName} yet. Start with a room callout!`,
    placeholder: `Message ${roomName}...`,
  };
}

export default function GameUiShell({
  initialRoomEntry = null,
  reconnectUiState = null,
  onLeaveRoom = null,
  leaveRoomState = null,
}) {
  const chatInputRef = useRef(null);
  const { user, token, loading } = useAuth();
  const { isDebugBuild, isDebugUiVisible, toggleDebugUi } = useDebugUi();
  const { state } = useGameState();
  const { roomSession, markRoomActive } = useRoomSession();
  const { isConnected, subscribe } = useWebSocket();
  const { activeWindow, mode, openChat, returnToSailing, setScreenMode, toggleMenu, toggleWindow } = useGameUi();
  const [roomJoinState, setRoomJoinState] = useState(() => createInitialRoomJoinState(initialRoomEntry));
  const [activeRoomMeta, setActiveRoomMeta] = useState(() => resolveRoomMeta(initialRoomEntry?.room ?? initialRoomEntry?.joinResponse, null));

  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasActiveRoomState = Boolean(currentPlayerState);
  const isPendingRoomJoin = isRoomJoinPending(roomJoinState.status);
  const isReconnectMode = Boolean(reconnectUiState?.active);
  const showSailingHud = ![GAME_UI_MODE.LOADING, GAME_UI_MODE.ROOM_LOADING].includes(mode);
  const showChatHud = mode !== GAME_UI_MODE.LOADING;
  const showChatAction = ![GAME_UI_MODE.LOADING, GAME_UI_MODE.RECONNECTING].includes(mode);
  const showGameplayActions = ![GAME_UI_MODE.LOADING, GAME_UI_MODE.ROOM_LOADING, GAME_UI_MODE.RECONNECTING].includes(mode);
  const isLeavePending = leaveRoomState?.status === 'submitting';

  useEffect(() => {
    if (!token) {
      setRoomJoinState(createInitialRoomJoinState());
      setActiveRoomMeta(null);
    }
  }, [token]);

  useEffect(() => {
    if (mode === GAME_UI_MODE.CHAT_FOCUS) {
      return;
    }

    const chatInput = chatInputRef.current;
    if (chatInput && document.activeElement === chatInput) {
      chatInput.blur();
    }
  }, [mode]);

  useEffect(() => {
    const sessionRoomMeta = resolveRoomMeta(roomSession.room, roomSession.room ?? null);
    const initialRoomMeta = resolveRoomMeta(initialRoomEntry?.room ?? initialRoomEntry?.joinResponse, initialRoomEntry?.room ?? null);
    const nextRoomMeta = sessionRoomMeta ?? initialRoomMeta;

    if (!nextRoomMeta?.id) {
      return;
    }

    setActiveRoomMeta((prevState) => {
      if (prevState?.id === nextRoomMeta.id && prevState?.name === nextRoomMeta.name) {
        return prevState;
      }

      return nextRoomMeta;
    });
  }, [initialRoomEntry, roomSession.room]);

  useEffect(() => {
    if (!hasActiveRoomState) {
      return;
    }

    markRoomActive();
    setRoomJoinState((prevState) => {
      if (prevState.status === ROOM_JOIN_STATUS.IDLE) {
        return prevState;
      }

      return createInitialRoomJoinState();
    });
  }, [hasActiveRoomState, markRoomActive]);

  useEffect(() => {
    const unsubscribeRoomJoined = subscribe(messageType.ROOM_JOINED, (payload) => {
      setRoomJoinState((prevState) => {
        const roomMeta = resolveRoomMeta(payload, prevState.room);
        if (roomMeta?.id) {
          setActiveRoomMeta(roomMeta);
        }

        if (!isRoomJoinPending(prevState.status)) {
          return prevState;
        }

        return {
          ...prevState,
          status: prevState.spawn ? ROOM_JOIN_STATUS.AWAITING_INIT : ROOM_JOIN_STATUS.AWAITING_SPAWN,
          joinResponse: payload,
          room: roomMeta,
          error: null,
        };
      });
    });

    const unsubscribeSpawnAssigned = subscribe(messageType.SPAWN_ASSIGNED, (payload) => {
      setRoomJoinState((prevState) => {
        if (!isRoomJoinPending(prevState.status)) {
          return prevState;
        }

        return {
          ...prevState,
          status: ROOM_JOIN_STATUS.AWAITING_INIT,
          spawn: payload,
          error: null,
        };
      });
    });

    const unsubscribeJoinRejected = subscribe(messageType.ROOM_JOIN_REJECTED, (payload) => {
      setRoomJoinState((prevState) => {
        const reason = payload?.reason || 'UNKNOWN';
        const roomId = payload?.roomId || prevState.room?.id;

        return {
          status: ROOM_JOIN_STATUS.ERROR,
          room: prevState.room,
          joinResponse: prevState.joinResponse,
          spawn: prevState.spawn,
          error: roomId ? `Room join rejected for ${roomId}: ${reason}` : `Room join rejected: ${reason}`,
        };
      });
    });

    return () => {
      unsubscribeRoomJoined();
      unsubscribeSpawnAssigned();
      unsubscribeJoinRejected();
    };
  }, [subscribe]);

  useEffect(() => {
    if (loading) {
      setScreenMode(GAME_UI_MODE.LOADING);
      return;
    }

    if (isLeavePending) {
      return;
    }

    if (isReconnectMode) {
      setScreenMode(GAME_UI_MODE.RECONNECTING);
      return;
    }

    if (hasActiveRoomState) {
      setScreenMode(isConnected ? GAME_UI_MODE.SAILING : GAME_UI_MODE.RECONNECTING);
      return;
    }

    if (isPendingRoomJoin || roomJoinState.status === ROOM_JOIN_STATUS.ERROR) {
      setScreenMode(GAME_UI_MODE.ROOM_LOADING);
      return;
    }

    setScreenMode(GAME_UI_MODE.LOADING);
  }, [hasActiveRoomState, isConnected, isLeavePending, isPendingRoomJoin, isReconnectMode, loading, roomJoinState.status, setScreenMode]);

  const windowCopy = activeWindow ? WINDOW_COPY[activeWindow] : null;
  const roomLoadingCopy = useMemo(() => getRoomLoadingCopy(roomJoinState), [roomJoinState]);
  const reconnectCopy = useMemo(() => getReconnectCopy(reconnectUiState), [reconnectUiState]);
  const currentChatScope = useMemo(() => {
    if (isPendingRoomJoin) {
      return createRoomChatScope(roomJoinState.room ?? roomJoinState.joinResponse ?? activeRoomMeta);
    }

    if (hasActiveRoomState || isReconnectMode || mode === GAME_UI_MODE.RECONNECTING) {
      return createRoomChatScope(activeRoomMeta ?? roomSession.room ?? reconnectUiState);
    }

    return LOBBY_CHAT_SCOPE;
  }, [activeRoomMeta, hasActiveRoomState, isPendingRoomJoin, isReconnectMode, mode, reconnectUiState, roomJoinState.joinResponse, roomJoinState.room, roomSession.room]);

  const handleOpenChat = () => {
    openChat();
    chatInputRef.current?.focus();
  };

  return (
    <>
      <GameUiHotkeys chatInputRef={chatInputRef} />
      <div className="game-ui-shell">
        <header className="game-ui-shell__topbar">
          <div className="game-ui-shell__actions">
            {showChatAction && <button type="button" onClick={handleOpenChat}>Chat</button>}
            {showGameplayActions && (
              <>
                <button type="button" onClick={() => toggleWindow(UI_WINDOW.INVENTORY)}>Inventory</button>
                <button type="button" onClick={() => toggleWindow(UI_WINDOW.JOURNAL)}>Journal</button>
                <button type="button" onClick={() => toggleWindow(UI_WINDOW.MAP)}>Map</button>
                <button type="button" onClick={toggleMenu}>Menu</button>
              </>
            )}
          </div>
        </header>

        {showSailingHud && (
          <div className="game-ui-shell__hud game-ui-shell__hud--profile">
            <ProfileBlock />
          </div>
        )}

        {showChatHud && (
          <div className="game-ui-shell__hud game-ui-shell__hud--chat">
            <ChatBlock
              inputRef={chatInputRef}
              isChatFocused={mode === GAME_UI_MODE.CHAT_FOCUS}
              onChatFocus={openChat}
              onChatBlur={returnToSailing}
              chatScope={currentChatScope}
            />
          </div>
        )}

        {mode === GAME_UI_MODE.MENU_OPEN && (
          <section className="game-ui-shell__panel" aria-label="Game menu">
            <h2>Menu</h2>
            <p>Esc closes the menu. Exit returns the captain to the harbor lobby without logging out of the current session.</p>
            <div className="game-ui-shell__menu-actions">
              <button type="button" className="game-ui-shell__menu-danger" onClick={onLeaveRoom} disabled={!onLeaveRoom || isLeavePending}>
                {isLeavePending ? 'Выходим...' : 'Выйти'}
              </button>
              {isDebugBuild && (
                <button type="button" className="game-ui-shell__menu-toggle" onClick={toggleDebugUi}>
                  {isDebugUiVisible ? 'Дебаг: выкл' : 'Дебаг: вкл'}
                </button>
              )}
            </div>
            {leaveRoomState?.error && <p className="game-ui-shell__menu-error">{leaveRoomState.error}</p>}
          </section>
        )}

        {mode === GAME_UI_MODE.WINDOW_FOCUS && windowCopy && (
          <section className="game-ui-shell__panel" aria-label={`${windowCopy.title} window`}>
            <h2>{windowCopy.title}</h2>
            <p>{windowCopy.description}</p>
          </section>
        )}

        {mode === GAME_UI_MODE.RECONNECTING && (
          <section className="game-ui-shell__notice" aria-live="polite">
            <h2>{reconnectCopy.title}</h2>
            <p>{reconnectCopy.body}</p>
          </section>
        )}

        {mode === GAME_UI_MODE.LOADING && (
          <section className="game-ui-shell__notice" aria-live="polite">
            <h2>Loading</h2>
            <p>Waiting for room session context and gameplay state.</p>
          </section>
        )}

        {mode === GAME_UI_MODE.ROOM_LOADING && (
          <section className="game-ui-shell__notice" aria-live="polite">
            <RoomLoadingSummary
              title={roomLoadingCopy.title}
              body={roomLoadingCopy.body}
              room={roomJoinState.room ?? activeRoomMeta}
              joinResponse={roomJoinState.joinResponse}
              spawn={roomJoinState.spawn}
              stageLabel={roomLoadingCopy.stageLabel}
            />
          </section>
        )}
      </div>
    </>
  );
}
