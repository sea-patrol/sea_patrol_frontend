import { useEffect } from 'react';

import { GAME_UI_MODE, UI_WINDOW, useGameUi } from '../model/GameUiContext';

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || ['input', 'textarea', 'select'].includes(tagName);
}

export default function GameUiHotkeys({ chatInputRef }) {
  const { mode, openChat, returnToSailing, toggleMenu, toggleWindow } = useGameUi();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat) return;

      if (isEditableTarget(event.target)) {
        return;
      }

      if ([GAME_UI_MODE.LOADING, GAME_UI_MODE.RECONNECTING, GAME_UI_MODE.RESPAWN].includes(mode)) {
        return;
      }

      if (event.key === 'Enter' && mode === GAME_UI_MODE.SAILING) {
        event.preventDefault();
        openChat();
        chatInputRef?.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();

        if (mode === GAME_UI_MODE.CHAT_FOCUS) {
          chatInputRef?.current?.blur();
          returnToSailing();
          return;
        }

        if (mode === GAME_UI_MODE.WINDOW_FOCUS || mode === GAME_UI_MODE.MENU_OPEN) {
          returnToSailing();
          return;
        }

        if (mode === GAME_UI_MODE.SAILING) {
          toggleMenu();
        }
        return;
      }

      if (![GAME_UI_MODE.SAILING, GAME_UI_MODE.WINDOW_FOCUS].includes(mode)) {
        return;
      }

      const windowByKey = {
        i: UI_WINDOW.INVENTORY,
        j: UI_WINDOW.JOURNAL,
        m: UI_WINDOW.MAP,
      };

      const windowId = windowByKey[event.key.toLowerCase()];
      if (!windowId) return;

      event.preventDefault();
      toggleWindow(windowId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatInputRef, mode, openChat, returnToSailing, toggleMenu, toggleWindow]);

  return null;
}
