export const GAME_UI_MODE = Object.freeze({
  LOADING: 'LOADING',
  LOBBY: 'LOBBY',
  SAILING: 'SAILING',
  CHAT_FOCUS: 'CHAT_FOCUS',
  WINDOW_FOCUS: 'WINDOW_FOCUS',
  MENU_OPEN: 'MENU_OPEN',
  RECONNECTING: 'RECONNECTING',
  RESPAWN: 'RESPAWN',
});

export const UI_WINDOW = Object.freeze({
  INVENTORY: 'INVENTORY',
  JOURNAL: 'JOURNAL',
  MAP: 'MAP',
});

export const initialGameUiState = Object.freeze({
  screenMode: GAME_UI_MODE.LOADING,
  overlayMode: null,
  activeWindow: null,
});

export function selectGameUiMode(state) {
  return state?.overlayMode ?? state?.screenMode ?? GAME_UI_MODE.LOADING;
}

export function isGameplayInputAllowed(state) {
  return selectGameUiMode(state) === GAME_UI_MODE.SAILING;
}

export function selectActiveWindow(state) {
  return state?.activeWindow ?? null;
}

export function gameUiReducer(state, action) {
  switch (action?.type) {
    case 'SET_SCREEN_MODE': {
      const nextScreenMode = action.payload;
      const shouldResetOverlay = [
        GAME_UI_MODE.LOADING,
        GAME_UI_MODE.LOBBY,
        GAME_UI_MODE.RECONNECTING,
        GAME_UI_MODE.RESPAWN,
      ].includes(nextScreenMode);

      return {
        ...state,
        screenMode: nextScreenMode,
        overlayMode: shouldResetOverlay ? null : state.overlayMode,
        activeWindow: shouldResetOverlay ? null : state.activeWindow,
      };
    }

    case 'OPEN_CHAT':
      if (state.screenMode !== GAME_UI_MODE.SAILING && state.screenMode !== GAME_UI_MODE.LOBBY) {
        return state;
      }

      return {
        ...state,
        overlayMode: GAME_UI_MODE.CHAT_FOCUS,
        activeWindow: null,
      };

    case 'TOGGLE_WINDOW':
      if (state.screenMode !== GAME_UI_MODE.SAILING) return state;

      if (state.overlayMode === GAME_UI_MODE.WINDOW_FOCUS && state.activeWindow === action.payload) {
        return {
          ...state,
          overlayMode: null,
          activeWindow: null,
        };
      }

      return {
        ...state,
        overlayMode: GAME_UI_MODE.WINDOW_FOCUS,
        activeWindow: action.payload,
      };

    case 'TOGGLE_MENU':
      if (state.screenMode !== GAME_UI_MODE.SAILING) return state;

      return {
        ...state,
        overlayMode: state.overlayMode === GAME_UI_MODE.MENU_OPEN ? null : GAME_UI_MODE.MENU_OPEN,
        activeWindow: null,
      };

    case 'RETURN_TO_SAILING':
      if (state.screenMode !== GAME_UI_MODE.SAILING && state.screenMode !== GAME_UI_MODE.LOBBY) return state;

      return {
        ...state,
        overlayMode: null,
        activeWindow: null,
      };

    default:
      return state;
  }
}
