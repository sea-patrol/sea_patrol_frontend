/**
 * @file useWebSocket - Хук для работы с WebSocket
 * @description Обёртка над WebSocketContext с утилитами для отправки и подписки на сообщения
 */

import { useWebSocket as useWebSocketContext } from '../contexts/WebSocketContext';

/**
 * Хук для доступа к контексту WebSocket
 * @returns {Object} Объект с методами и состоянием WebSocket
 * @returns {boolean} returns.isConnected - Статус подключения к WebSocket
 * @returns {Function} returns.sendMessage - Функция отправки сообщений
 * @returns {Function} returns.subscribe - Функция подписки на сообщения типа
 *
 * @example
 * const { isConnected, sendMessage, subscribe } = useWebSocket();
 *
 * @example
 * // Отправка сообщения
 * sendMessage(['CHAT_MESSAGE', { to: 'global', text: 'Hello!' }]);
 *
 * @example
 * // Подписка на сообщения
 * useEffect(() => {
 *   const unsubscribe = subscribe('CHAT_MESSAGE', (payload) => {
 *     console.log('Received:', payload);
 *   });
 *   return unsubscribe;
 * }, [subscribe]);
 */
export function useWebSocket() {
  return useWebSocketContext();
}

export default useWebSocket;
