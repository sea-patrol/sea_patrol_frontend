import { Server } from 'mock-socket';

const DEFAULT_BACKEND_HOSTNAME = 'localhost';
const DEFAULT_BACKEND_PORT = 8080;

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const getDefaultWsBaseUrl = () => {
  const location = typeof window !== 'undefined' ? window.location : undefined;
  const protocol = location?.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = location?.hostname || DEFAULT_BACKEND_HOSTNAME;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

const WS_BASE_URL = trimTrailingSlashes(import.meta.env.VITE_WS_BASE_URL || getDefaultWsBaseUrl());
const WS_URL = `${WS_BASE_URL}/ws/game`;

/**
 * Создает мок WebSocket сервер для тестирования
 * @param {Object} options - Опции сервера
 * @param {boolean} options.autoConnect - Автоматически соединяться при подключении клиента
 * @returns {Server} Mock WebSocket сервер
 */
export const createMockWebSocket = (options = {}) => {
  const { autoConnect = true } = options;

  const server = new Server(WS_URL);

  server.on('connection', (socket) => {
    if (autoConnect) {
      // Отправляем событие подключения
      socket.send(
        JSON.stringify({
          type: 'CONNECTED',
          payload: { connected: true },
        })
      );
    }

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        // Обработка различных типов сообщений
        switch (message.type) {
          case 'PING':
            socket.send(
              JSON.stringify({
                type: 'PONG',
                payload: { timestamp: Date.now() },
              })
            );
            break;

          case 'CHAT_MESSAGE':
            // Эхо сообщение в чат
            socket.send(
              JSON.stringify({
                type: 'CHAT_MESSAGE',
                payload: {
                  sender: 'system',
                  message: `Received: ${message.payload?.message}`,
                },
              })
            );
            break;

          case 'MOVE':
            // Подтверждение движения
            socket.send(
              JSON.stringify({
                type: 'MOVE_CONFIRMED',
                payload: {
                  x: message.payload?.x || 0,
                  z: message.payload?.z || 0,
                  angle: message.payload?.angle || 0,
                },
              })
            );
            break;

          default:
            // Эхо для неизвестных типов
            socket.send(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    socket.on('close', () => {
      // Клиент отключился
    });
  });

  return server;
};

/**
 * Отправляет тестовое сообщение через мок сервер
 * @param {Server} server - Мок WebSocket сервер
 * @param {Object} message - Сообщение для отправки
 */
export const sendMockMessage = (server, message) => {
  server.clients().forEach((client) => {
    client.send(JSON.stringify(message));
  });
};

/**
 * Симулирует обновление состояния игры
 * @param {Server} server - Мок WebSocket сервер
 * @param {Object} gameState - Новое состояние игры
 */
export const simulateGameStateUpdate = (server, gameState) => {
  sendMockMessage(server, {
    type: 'GAME_STATE_UPDATE',
    payload: gameState,
  });
};

export default createMockWebSocket;
