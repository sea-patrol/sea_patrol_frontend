/**
 * @file useGameState - Хук для работы с состоянием игры
 * @description Обёртка над GameStateContext с селекторами для подвыборок состояния
 */

import {
  useGameState as useGameStateContext,
  usePlayerState as usePlayerStateSelector,
  useOtherPlayers as useOtherPlayersSelector,
  useAllPlayerStates as useAllPlayerStatesSelector
} from '../contexts/GameStateContext';

/**
 * Базовый хук для доступа к контексту состояния игры
 * @returns {Object} Объект с состоянием и методами управления
 * @returns {Object} returns.state - Текущее состояние игры
 * @returns {Function} returns.setPlayerState - Установить состояние игрока
 * @returns {Function} returns.setAllPlayerStates - Установить состояния всех игроков
 * @returns {Function} returns.removePlayerState - Удалить состояние игрока
 * @returns {Function} returns.resetGameState - Сбросить состояние игры
 *
 * @example
 * const { state, setPlayerState } = useGameState();
 * setPlayerState('player1', { x: 10, z: 20, angle: 45 });
 */
export function useGameState() {
  return useGameStateContext();
}

/**
 * Селектор для получения состояния конкретного игрока
 * @param {string} playerName - Имя игрока
 * @returns {Object|undefined} Состояние игрока или undefined
 *
 * @example
 * const playerState = usePlayerState('player1');
 * console.log(playerState?.x, playerState?.z);
 */
export function usePlayerState(playerName) {
  return usePlayerStateSelector(playerName);
}

/**
 * Селектор для получения состояний всех игроков кроме текущего
 * @param {string} currentPlayerName - Имя текущего игрока
 * @returns {Object} Состояния других игроков
 *
 * @example
 * const otherPlayers = useOtherPlayers('player1');
 * Object.values(otherPlayers).forEach(player => {
 *   console.log(player.name, player.x);
 * });
 */
export function useOtherPlayers(currentPlayerName) {
  return useOtherPlayersSelector(currentPlayerName);
}

/**
 * Селектор для получения всех состояний игроков
 * @returns {Object} Состояния всех игроков
 *
 * @example
 * const allPlayers = useAllPlayerStates();
 * console.log(Object.keys(allPlayers).length, 'players in game');
 */
export function useAllPlayerStates() {
  return useAllPlayerStatesSelector();
}

export default useGameState;
