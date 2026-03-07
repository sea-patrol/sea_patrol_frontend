import { useEffect, useMemo, useRef, useState } from 'react';

import { GAME_UI_MODE, UI_WINDOW, useGameUi } from '../model/GameUiContext';

import './GameUiShell.css';
import GameUiHotkeys from './GameUiHotkeys';

import { useAuth } from '@/features/auth/model/AuthContext';
import { selectCurrentPlayerState, useGameState } from '@/features/game/model/GameStateContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import ChatBlock from '@/widgets/ChatPanel/ChatBlock';
import GameStateInfo from '@/widgets/GameHud/GameStateInfo';
import ProfileBlock from '@/widgets/GameHud/ProfileBlock';

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
        title: 'Initializing room state',
        body: `Spawn is assigned for ${roomName}. Waiting for INIT_GAME_STATE/current player snapshot to switch into sailing.${spawnCopy}`,
      };
    }

    case ROOM_JOIN_STATUS.ERROR:
      return {
        title: 'Room entry failed',
        body: roomJoinState.error ?? 'Room entry could not be completed.',
      };

    default:
      return {
        title: 'Preparing room session',
        body: 'Waiting for room session context.',
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

function ModeBadge({ mode }) {
  return (
    <div className="game-ui-shell__mode" data-mode={mode}>
      {mode}
    </div>
  );
}

export default function GameUiShell({ initialRoomEntry = null }) {
  const chatInputRef = useRef(null);
  const { user, token, loading } = useAuth();
  const { state } = useGameState();
  const { hasToken, isConnected, lastClose, subscribe } = useWebSocket();
  const { activeWindow, mode, openChat, returnToSailing, setScreenMode, toggleMenu, toggleWindow } = useGameUi();
  const [roomJoinState, setRoomJoinState] = useState(() => createInitialRoomJoinState(initialRoomEntry));
  const [activeRoomMeta, setActiveRoomMeta] = useState(() => resolveRoomMeta(initialRoomEntry?.room ?? initialRoomEntry?.joinResponse, null));

  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const hasActiveRoomState = Boolean(currentPlayerState);
  const isPendingRoomJoin = isRoomJoinPending(roomJoinState.status);
  const showSailingHud = ![GAME_UI_MODE.LOADING, GAME_UI_MODE.ROOM_LOADING].includes(mode);
  const showChatHud = mode !== GAME_UI_MODE.LOADING;
  const showChatAction = mode !== GAME_UI_MODE.LOADING;
  const showGameplayActions = ![GAME_UI_MODE.LOADING, GAME_UI_MODE.ROOM_LOADING].includes(mode);

  useEffect(() => {
    if (!token) {
      setRoomJoinState(createInitialRoomJoinState());
      setActiveRoomMeta(null);
    }
  }, [token]);

  useEffect(() => {
    if (!hasActiveRoomState) {
      return;
    }

    setRoomJoinState((prevState) => {
      if (prevState.status === ROOM_JOIN_STATUS.IDLE) {
        return prevState;
      }

      return createInitialRoomJoinState();
    });
  }, [hasActiveRoomState]);

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

    if (hasActiveRoomState) {
      setScreenMode(isConnected ? GAME_UI_MODE.SAILING : GAME_UI_MODE.RECONNECTING);
      return;
    }

    if (isPendingRoomJoin || roomJoinState.status === ROOM_JOIN_STATUS.ERROR) {
      setScreenMode(GAME_UI_MODE.ROOM_LOADING);
      return;
    }

    setScreenMode(GAME_UI_MODE.LOADING);
  }, [hasActiveRoomState, isConnected, isPendingRoomJoin, loading, roomJoinState.status, setScreenMode]);

  const windowCopy = activeWindow ? WINDOW_COPY[activeWindow] : null;
  const roomLoadingCopy = useMemo(() => getRoomLoadingCopy(roomJoinState), [roomJoinState]);
  const currentChatScope = useMemo(() => {
    if (isPendingRoomJoin) {
      return createRoomChatScope(roomJoinState.room ?? roomJoinState.joinResponse ?? activeRoomMeta);
    }

    if (hasActiveRoomState || mode === GAME_UI_MODE.RECONNECTING) {
      return createRoomChatScope(activeRoomMeta);
    }

    return LOBBY_CHAT_SCOPE;
  }, [activeRoomMeta, hasActiveRoomState, isPendingRoomJoin, mode, roomJoinState.joinResponse, roomJoinState.room]);

  const handleOpenChat = () => {
    openChat();
    chatInputRef.current?.focus();
  };

  return (
    <>
      <GameUiHotkeys chatInputRef={chatInputRef} />
      <div className="game-ui-shell">
        <header className="game-ui-shell__topbar">
          <ModeBadge mode={mode} />
          <div className="game-ui-shell__connection">
            <span className={`game-ui-shell__connection-dot ${isConnected ? 'is-online' : 'is-offline'}`} />
            {isConnected ? 'Realtime online' : hasToken ? 'Realtime offline' : 'Guest mode'}
            {!isConnected && lastClose?.code !== undefined && (
              <span className="game-ui-shell__connection-close">
                {String(lastClose.code)}
                {lastClose.reason ? `, ${lastClose.reason}` : ''}
              </span>
            )}
          </div>
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

        {showSailingHud && (
          <div className="game-ui-shell__hud game-ui-shell__hud--state">
            <GameStateInfo name={user?.username} />
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
            <p>Esc closes the menu. This panel is the shell anchor for future in-game menu actions.</p>
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
            <h2>Reconnecting</h2>
            <p>WebSocket connection is temporarily unavailable. The shell now has a dedicated reconnect mode for future resume flow.</p>
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
            <h2>{roomLoadingCopy.title}</h2>
            <p>{roomLoadingCopy.body}</p>
          </section>
        )}
      </div>
    </>
  );
}
