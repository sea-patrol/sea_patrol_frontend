/**
 * @file hooks/index.js - Централизованный экспорт хуков
 * @description Удобный импорт всех хуков из одного места
 */

export { useAuth } from './useAuth';
export { useWebSocket } from './useWebSocket';
export {
  useGameState,
  usePlayerState,
  useOtherPlayers,
  useAllPlayerStates
} from './useGameState';
export { useChat } from './useChat';
export { usePlayerControls } from './usePlayerControls';
