import { useEffect, useRef } from 'react';

import { GAME_UI_MODE, UI_WINDOW, useGameUi } from '../model/GameUiContext';

import './GameUiShell.css';
import GameUiHotkeys from './GameUiHotkeys';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
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

function ModeBadge({ mode }) {
  return (
    <div className="game-ui-shell__mode" data-mode={mode}>
      {mode}
    </div>
  );
}

export default function GameUiShell() {
  const chatInputRef = useRef(null);
  const { user, loading } = useAuth();
  const { hasToken, isConnected, lastClose } = useWebSocket();
  const { activeWindow, mode, openChat, returnToSailing, setScreenMode, toggleMenu, toggleWindow } = useGameUi();

  useEffect(() => {
    if (loading) {
      setScreenMode(GAME_UI_MODE.LOADING);
      return;
    }

    if (!user || !hasToken) {
      setScreenMode(GAME_UI_MODE.LOBBY);
      return;
    }

    if (!isConnected) {
      setScreenMode(GAME_UI_MODE.RECONNECTING);
      return;
    }

    setScreenMode(GAME_UI_MODE.SAILING);
  }, [hasToken, isConnected, loading, setScreenMode, user]);

  const windowCopy = activeWindow ? WINDOW_COPY[activeWindow] : null;

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
            <button type="button" onClick={handleOpenChat}>Chat</button>
            <button type="button" onClick={() => toggleWindow(UI_WINDOW.INVENTORY)}>Inventory</button>
            <button type="button" onClick={() => toggleWindow(UI_WINDOW.JOURNAL)}>Journal</button>
            <button type="button" onClick={() => toggleWindow(UI_WINDOW.MAP)}>Map</button>
            <button type="button" onClick={toggleMenu}>Menu</button>
          </div>
        </header>

        <div className="game-ui-shell__hud game-ui-shell__hud--profile">
          <ProfileBlock />
        </div>

        <div className="game-ui-shell__hud game-ui-shell__hud--state">
          <GameStateInfo name={user?.username} />
        </div>

        <div className="game-ui-shell__hud game-ui-shell__hud--chat">
          <ChatBlock
            inputRef={chatInputRef}
            isChatFocused={mode === GAME_UI_MODE.CHAT_FOCUS}
            onChatFocus={openChat}
            onChatBlur={returnToSailing}
          />
        </div>

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
            <p>UI shell is waiting for auth and scene initialization.</p>
          </section>
        )}

        {mode === GAME_UI_MODE.LOBBY && (
          <section className="game-ui-shell__notice" aria-live="polite">
            <h2>Lobby</h2>
            <p>Lobby mode already exists in the shell model and will receive the room list in TASK-014.</p>
          </section>
        )}
      </div>
    </>
  );
}
