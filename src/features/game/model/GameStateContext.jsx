/* eslint-disable react-refresh/only-export-components */
// GameStateContext.js
import { createContext, useContext, useMemo, useReducer, useRef } from 'react';

import * as messageType from '../../../shared/constants/messageType';

// Создаем контекст
const GameStateContext = createContext();

export const initialGameState = Object.freeze({
  playerStates: {},
});

export function selectPlayerStates(state) {
  return state?.playerStates ?? {};
}

export function selectPlayerNames(state) {
  return Object.keys(selectPlayerStates(state));
}

export function selectPlayerState(state, name) {
  if (!name) return undefined;
  return selectPlayerStates(state)[name];
}

export function selectCurrentPlayerState(state, currentPlayerName) {
  return selectPlayerState(state, currentPlayerName);
}

export function wsMessageToGameAction(wsType, wsPayload) {
  switch (wsType) {
    case messageType.INIT_GAME_STATE:
    case messageType.UPDATE_GAME_STATE:
    case messageType.PLAYER_JOIN:
      return { type: wsType, payload: wsPayload };

    case messageType.PLAYER_LEAVE: {
      if (typeof wsPayload === 'string') {
        return { type: wsType, payload: wsPayload };
      }

      const username = wsPayload?.username ?? wsPayload?.name;
      if (!username) return null;
      return { type: wsType, payload: username };
    }

    default:
      return null;
  }
}

function applyDefinedPatch(prev, patch) {
  const base = prev ?? { name: patch?.name };
  let next = base;

  for (const [key, value] of Object.entries(patch ?? {})) {
    if (key === 'name' || value === undefined) continue;
    if (Object.is(base[key], value)) continue;

    if (next === base) next = { ...base };
    next[key] = value;
  }

  return next;
}

export function gameStateReducer(state, action) {
  switch (action?.type) {
    case messageType.INIT_GAME_STATE: {
      const players = action?.payload?.players ?? [];

      const playerStates = players.reduce((acc, player) => {
        acc[player.name] = { ...player };
        return acc;
      }, {});

      return {
        ...state,
        playerStates,
      };
    }

    case messageType.UPDATE_GAME_STATE: {
      const players = action?.payload?.players ?? [];
      if (players.length === 0) return state;

      let nextPlayerStates = state.playerStates;
      let changed = false;

      for (const player of players) {
        if (!player?.name) continue;

        const prevPlayer = state.playerStates[player.name];
        const nextPlayer = applyDefinedPatch(prevPlayer, player);

        if (nextPlayer === prevPlayer) continue;

        if (!changed) {
          changed = true;
          nextPlayerStates = { ...state.playerStates };
        }

        nextPlayerStates[player.name] = nextPlayer;
      }

      if (!changed) return state;

      return {
        ...state,
        playerStates: nextPlayerStates,
      };
    }

    case messageType.PLAYER_JOIN: {
      const player = action?.payload;
      if (!player?.name) return state;

      return {
        ...state,
        playerStates: {
          ...state.playerStates,
          [player.name]: { ...player },
        },
      };
    }

    case messageType.PLAYER_LEAVE: {
      const username = action?.payload;
      if (!username || !state.playerStates[username]) return state;

      const { [username]: _removed, ...rest } = state.playerStates;

      return {
        ...state,
        playerStates: rest,
      };
    }

    default:
      return state;
  }
}

// Провайдер для gameState
export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameStateReducer, initialGameState);

  const stateRef = useRef(state);
  stateRef.current = state;

  const value = useMemo(() => ({ state, stateRef, dispatch }), [dispatch, state]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

// Хук для использования gameState
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
