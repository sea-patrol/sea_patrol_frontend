/**
 * @file GameStateContext - Контекст состояния игры
 * @description Управление состоянием игры с useReducer для иммутабельных обновлений
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const GameStateContext = createContext();

/**
 * @typedef {Object} PlayerState
 * @property {string} id - ID игрока
 * @property {string} name - Имя игрока
 * @property {number} x - Позиция X
 * @property {number} z - Позиция Z
 * @property {number} angle - Угол поворота
 * @property {number} velocity - Скорость
 * @property {number} delta - Дельта времени
 * @property {number} width - Ширина
 * @property {number} height - Высота
 * @property {number} length - Длина
 */

/**
 * @typedef {Object} GameState
 * @property {Object<string, PlayerState>} playerStates - Состояния всех игроков
 */

/**
 * @typedef {Object} GameStateAction
 * @property {string} type - Тип действия
 * @property {any} [payload] - Данные действия
 */

/**
 * Типы действий для редьюсера
 */
const ActionTypes = {
  SET_PLAYER_STATE: 'SET_PLAYER_STATE',
  SET_ALL_PLAYER_STATES: 'SET_ALL_PLAYER_STATES',
  REMOVE_PLAYER_STATE: 'REMOVE_PLAYER_STATE',
  RESET_GAME_STATE: 'RESET_GAME_STATE'
};

/**
 * @type {GameState}
 */
const initialState = {
  playerStates: {}
};

/**
 * Редьюсер для управления состоянием игры
 * @param {GameState} state - Текущее состояние
 * @param {GameStateAction} action - Действие
 * @returns {GameState} Новое состояние
 */
function gameStateReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_PLAYER_STATE: {
      const { playerName, playerState } = action.payload;
      return {
        ...state,
        playerStates: {
          ...state.playerStates,
          [playerName]: { ...playerState }
        }
      };
    }

    case ActionTypes.SET_ALL_PLAYER_STATES: {
      const { playerStates } = action.payload;
      return {
        ...state,
        playerStates: { ...playerStates }
      };
    }

    case ActionTypes.REMOVE_PLAYER_STATE: {
      const { playerName } = action.payload;
      const newPlayerStates = { ...state.playerStates };
      delete newPlayerStates[playerName];
      return {
        ...state,
        playerStates: newPlayerStates
      };
    }

    case ActionTypes.RESET_GAME_STATE:
      return initialState;

    default:
      return state;
  }
}

/**
 * Хук для доступа к контексту состояния игры
 * @returns {Object} Объект контекста состояния игры
 * @throws {Error} Если используется вне GameStateProvider
 */
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

/**
 * Селектор для получения состояния конкретного игрока
 * @param {string} playerName - Имя игрока
 * @returns {PlayerState|undefined} Состояние игрока или undefined
 */
export function usePlayerState(playerName) {
  const { state } = useGameState();
  return useMemo(() => state.playerStates[playerName], [state.playerStates, playerName]);
}

/**
 * Селектор для получения состояний всех игроков кроме текущего
 * @param {string} currentPlayerName - Имя текущего игрока
 * @returns {Object<string, PlayerState>} Состояния других игроков
 */
export function useOtherPlayers(currentPlayerName) {
  const { state } = useGameState();
  return useMemo(() => {
    const otherPlayers = {};
    Object.entries(state.playerStates).forEach(([name, playerState]) => {
      if (name !== currentPlayerName) {
        otherPlayers[name] = playerState;
      }
    });
    return otherPlayers;
  }, [state.playerStates, currentPlayerName]);
}

/**
 * Селектор для получения всех состояний игроков
 * @returns {Object<string, PlayerState>} Состояния всех игроков
 */
export function useAllPlayerStates() {
  const { state } = useGameState();
  return state.playerStates;
}

/**
 * Провайдер контекста состояния игры
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 */
export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameStateReducer, initialState);

  /**
   * Устанавливает состояние конкретного игрока
   * @param {string} playerName - Имя игрока
   * @param {PlayerState} playerState - Состояние игрока
   */
  const setPlayerState = useCallback((playerName, playerState) => {
    dispatch({ type: ActionTypes.SET_PLAYER_STATE, payload: { playerName, playerState } });
  }, []);

  /**
   * Устанавливает состояния всех игроков
   * @param {Object<string, PlayerState>} playerStates - Состояния всех игроков
   */
  const setAllPlayerStates = useCallback((playerStates) => {
    dispatch({ type: ActionTypes.SET_ALL_PLAYER_STATES, payload: { playerStates } });
  }, []);

  /**
   * Удаляет состояние игрока
   * @param {string} playerName - Имя игрока
   */
  const removePlayerState = useCallback((playerName) => {
    dispatch({ type: ActionTypes.REMOVE_PLAYER_STATE, payload: { playerName } });
  }, []);

  /**
   * Сбрасывает состояние игры
   */
  const resetGameState = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_GAME_STATE });
  }, []);

  const value = useMemo(() => ({
    state,
    setPlayerState,
    setAllPlayerStates,
    removePlayerState,
    resetGameState
  }), [state, setPlayerState, setAllPlayerStates, removePlayerState, resetGameState]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}
