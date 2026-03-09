import { describe, expect, it } from 'vitest';

import {
  GAME_UI_MODE,
  gameUiReducer,
  initialGameUiState,
  isGameplayInputAllowed,
  selectGameUiMode,
  UI_WINDOW,
} from '../../../features/ui-shell/model/gameUiState';

describe('gameUiState reducer', () => {
  it('tracks screen and overlay modes through the planned MVP transitions', () => {
    let state = initialGameUiState;

    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.LOADING);
    expect(isGameplayInputAllowed(state)).toBe(false);

    state = gameUiReducer(state, { type: 'SET_SCREEN_MODE', payload: GAME_UI_MODE.SAILING });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.SAILING);
    expect(isGameplayInputAllowed(state)).toBe(true);

    state = gameUiReducer(state, { type: 'OPEN_CHAT' });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.CHAT_FOCUS);
    expect(isGameplayInputAllowed(state)).toBe(false);

    state = gameUiReducer(state, { type: 'RETURN_TO_SAILING' });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.SAILING);

    state = gameUiReducer(state, { type: 'TOGGLE_WINDOW', payload: UI_WINDOW.INVENTORY });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.WINDOW_FOCUS);
    expect(state.activeWindow).toBe(UI_WINDOW.INVENTORY);

    state = gameUiReducer(state, { type: 'TOGGLE_WINDOW', payload: UI_WINDOW.INVENTORY });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.SAILING);
    expect(state.activeWindow).toBeNull();

    state = gameUiReducer(state, { type: 'TOGGLE_MENU' });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.MENU_OPEN);

    state = gameUiReducer(state, { type: 'SET_SCREEN_MODE', payload: GAME_UI_MODE.ROOM_LOADING });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.ROOM_LOADING);
    expect(state.activeWindow).toBeNull();
    expect(isGameplayInputAllowed(state)).toBe(false);

    state = gameUiReducer(state, { type: 'SET_SCREEN_MODE', payload: GAME_UI_MODE.RECONNECTING });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.RECONNECTING);
    expect(state.activeWindow).toBeNull();
  });

  it('allows chat focus to return back to lobby screen mode', () => {
    let state = gameUiReducer(initialGameUiState, { type: 'SET_SCREEN_MODE', payload: GAME_UI_MODE.LOBBY });

    state = gameUiReducer(state, { type: 'OPEN_CHAT' });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.CHAT_FOCUS);

    state = gameUiReducer(state, { type: 'RETURN_TO_SAILING' });
    expect(selectGameUiMode(state)).toBe(GAME_UI_MODE.LOBBY);
  });
});
