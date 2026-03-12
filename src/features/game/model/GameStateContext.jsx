/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useReducer, useRef } from 'react';

import * as messageType from '../../../shared/constants/messageType';

const GameStateContext = createContext();

export const initialGameState = Object.freeze({
  playerStates: {},
  wind: null,
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

export function selectWindState(state) {
  return state?.wind ?? null;
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

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeWindSnapshot(wind) {
  if (!isFiniteNumber(wind?.angle) || !isFiniteNumber(wind?.speed)) return null;

  return {
    angle: wind.angle,
    speed: wind.speed,
  };
}

export function gameStateReducer(state, action) {
  switch (action?.type) {
    case 'RESET_STATE':
      return initialGameState;

    case messageType.INIT_GAME_STATE: {
      const players = action?.payload?.players ?? [];
      const wind = normalizeWindSnapshot(action?.payload?.wind);

      const playerStates = players.reduce((acc, player) => {
        acc[player.name] = { ...player };
        return acc;
      }, {});

      return {
        ...state,
        playerStates,
        wind,
      };
    }

    case messageType.UPDATE_GAME_STATE: {
      const players = action?.payload?.players ?? [];
      const nextWind = normalizeWindSnapshot(action?.payload?.wind);
      const windChanged =
        nextWind !== null &&
        (state.wind?.angle !== nextWind.angle || state.wind?.speed !== nextWind.speed);

      let nextPlayerStates = state.playerStates;
      let playersChanged = false;

      for (const player of players) {
        if (!player?.name) continue;

        const prevPlayer = state.playerStates[player.name];
        const nextPlayer = applyDefinedPatch(prevPlayer, player);

        if (nextPlayer === prevPlayer) continue;

        if (!playersChanged) {
          playersChanged = true;
          nextPlayerStates = { ...state.playerStates };
        }

        nextPlayerStates[player.name] = nextPlayer;
      }

      if (!playersChanged && !windChanged) return state;

      return {
        ...state,
        playerStates: playersChanged ? nextPlayerStates : state.playerStates,
        wind: windChanged ? nextWind : state.wind,
      };
    }

    case messageType.SPAWN_ASSIGNED: {
      const currentPlayerName = action?.payload?.currentPlayerName;
      const spawn = action?.payload?.spawn;
      const prevPlayer = state.playerStates[currentPlayerName];
      if (!currentPlayerName || !prevPlayer) return state;
      if (!isFiniteNumber(spawn?.x) || !isFiniteNumber(spawn?.z) || !isFiniteNumber(spawn?.angle)) return state;

      const nextPlayer = {
        ...prevPlayer,
        x: spawn.x,
        z: spawn.z,
        angle: spawn.angle,
        velocity: 0,
        lastSpawnReason: spawn.reason ?? prevPlayer.lastSpawnReason,
        spawnRevision: (prevPlayer.spawnRevision ?? 0) + 1,
      };

      return {
        ...state,
        playerStates: {
          ...state.playerStates,
          [currentPlayerName]: nextPlayer,
        },
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

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
