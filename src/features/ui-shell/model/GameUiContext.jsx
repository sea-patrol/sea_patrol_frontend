/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import {
  GAME_UI_MODE,
  gameUiReducer,
  initialGameUiState,
  isGameplayInputAllowed,
  selectActiveWindow,
  selectGameUiMode,
  UI_WINDOW,
} from './gameUiState';

const GameUiContext = createContext();

export function GameUiProvider({ children }) {
  const [state, dispatch] = useReducer(gameUiReducer, initialGameUiState);

  const setScreenMode = useCallback((mode) => {
    dispatch({ type: 'SET_SCREEN_MODE', payload: mode });
  }, []);

  const openChat = useCallback(() => {
    dispatch({ type: 'OPEN_CHAT' });
  }, []);

  const toggleWindow = useCallback((windowId) => {
    dispatch({ type: 'TOGGLE_WINDOW', payload: windowId });
  }, []);

  const toggleMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_MENU' });
  }, []);

  const returnToSailing = useCallback(() => {
    dispatch({ type: 'RETURN_TO_SAILING' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      mode: selectGameUiMode(state),
      activeWindow: selectActiveWindow(state),
      isGameplayInputAllowed: isGameplayInputAllowed(state),
      setScreenMode,
      openChat,
      toggleWindow,
      toggleMenu,
      returnToSailing,
    }),
    [openChat, returnToSailing, setScreenMode, state, toggleMenu, toggleWindow],
  );

  return <GameUiContext.Provider value={value}>{children}</GameUiContext.Provider>;
}

export function useGameUi() {
  const context = useContext(GameUiContext);
  if (!context) {
    throw new Error('useGameUi must be used within a GameUiProvider');
  }
  return context;
}

export { GAME_UI_MODE, UI_WINDOW };

