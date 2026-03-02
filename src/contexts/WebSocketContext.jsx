/**
 * @file WebSocketContext - Контекст WebSocket соединения
 * @description Управление WebSocket подключением с useReducer, переподключением и подпиской на сообщения
 */

import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';

import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

const WS_URL = 'ws://localhost:8080/ws/game';

/**
 * @typedef {Object} WebSocketState
 * @property {boolean} isConnected - Статус подключения
 * @property {Map<string, Set<Function>>} subscribers - Подписчики по типам сообщений
 * @property {number} reconnectAttempts - Количество попыток переподключения
 * @property {WebSocket|null} ws - WebSocket инстанс
 */

/**
 * @typedef {Object} WebSocketAction
 * @property {string} type - Тип действия
 * @property {any} [payload] - Данные действия
 */

/**
 * Типы действий для редьюсера
 */
const ActionTypes = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  SET_SUBSCRIBER: 'SET_SUBSCRIBER',
  REMOVE_SUBSCRIBER: 'REMOVE_SUBSCRIBER',
  INCREMENT_RECONNECT: 'INCREMENT_RECONNECT',
  RESET_RECONNECT: 'RESET_RECONNECT',
  SET_WS: 'SET_WS'
};

/**
 * @type {WebSocketState}
 */
const initialState = {
  isConnected: false,
  subscribers: new Map(),
  reconnectAttempts: 0,
  ws: null
};

/**
 * Редьюсер для управления состоянием WebSocket
 * @param {WebSocketState} state - Текущее состояние
 * @param {WebSocketAction} action - Действие
 * @returns {WebSocketState} Новое состояние
 */
function webSocketReducer(state, action) {
  switch (action.type) {
    case ActionTypes.CONNECT:
      return {
        ...state,
        isConnected: true,
        reconnectAttempts: 0
      };

    case ActionTypes.DISCONNECT:
      return {
        ...state,
        isConnected: false
      };

    case ActionTypes.SET_SUBSCRIBER: {
      const { messageType, callback } = action.payload;
      const newSubscribers = new Map(state.subscribers);
      if (!newSubscribers.has(messageType)) {
        newSubscribers.set(messageType, new Set());
      }
      newSubscribers.get(messageType).add(callback);
      return {
        ...state,
        subscribers: newSubscribers
      };
    }

    case ActionTypes.REMOVE_SUBSCRIBER: {
      const { messageType, callback } = action.payload;
      const newSubscribers = new Map(state.subscribers);
      if (newSubscribers.has(messageType)) {
        newSubscribers.get(messageType).delete(callback);
        if (newSubscribers.get(messageType).size === 0) {
          newSubscribers.delete(messageType);
        }
      }
      return {
        ...state,
        subscribers: newSubscribers
      };
    }

    case ActionTypes.INCREMENT_RECONNECT:
      return {
        ...state,
        reconnectAttempts: state.reconnectAttempts + 1
      };

    case ActionTypes.RESET_RECONNECT:
      return {
        ...state,
        reconnectAttempts: 0
      };

    case ActionTypes.SET_WS:
      return {
        ...state,
        ws: action.payload
      };

    default:
      return state;
  }
}

/**
 * Хук для доступа к контексту WebSocket
 * @returns {Object} Объект контекста WebSocket
 * @throws {Error} Если используется вне WebSocketProvider
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * Вычисляет задержку для переподключения с экспоненциальным ростом
 * @param {number} attempts - Количество попыток
 * @returns {number} Задержка в миллисекундах (максимум 30 секунд)
 */
function getReconnectDelay(attempts) {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  return delay;
}

/**
 * Провайдер контекста WebSocket
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 */
export const WebSocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(webSocketReducer, initialState);
  const { token, user } = useAuth();
  const reconnectTimeoutRef = useRef(null);

  /**
   * Очищает таймер переподключения
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Закрывает текущее WebSocket соединение
   */
  const closeWebSocket = useCallback(() => {
    if (state.ws) {
      state.ws.close();
      dispatch({ type: ActionTypes.SET_WS, payload: null });
    }
  }, [state.ws]);

  /**
   * Подключается к WebSocket серверу
   */
  const connectWebSocket = useCallback(() => {
    if (!token || !user) return;

    closeWebSocket();

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    dispatch({ type: ActionTypes.SET_WS, payload: ws });

    ws.onopen = () => {
      dispatch({ type: ActionTypes.CONNECT });
      dispatch({ type: ActionTypes.RESET_RECONNECT });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      dispatch({ type: ActionTypes.DISCONNECT });
    };

    ws.onclose = () => {
      dispatch({ type: ActionTypes.DISCONNECT });

      // Планируем переподключение с экспоненциальной задержкой
      clearReconnectTimeout();
      dispatch({ type: ActionTypes.INCREMENT_RECONNECT });

      reconnectTimeoutRef.current = setTimeout(() => {
        if (token && user) {
          connectWebSocket();
        }
      }, getReconnectDelay(state.reconnectAttempts + 1));
    };

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        const messageType = messageData.type;
        const payload = messageData.payload;

        // Уведомляем всех подписчиков данного типа
        state.subscribers.get(messageType)?.forEach((callback) => {
          try {
            callback(payload);
          } catch (callbackError) {
            console.error('Error in subscriber callback:', callbackError);
          }
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [token, user, state.reconnectAttempts, closeWebSocket, clearReconnectTimeout, state.subscribers]);

  // Подключение при авторизации
  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    }

    return () => {
      closeWebSocket();
      clearReconnectTimeout();
    };
  }, [token, user, connectWebSocket, closeWebSocket, clearReconnectTimeout]);

  /**
   * Отправляет сообщение через WebSocket
   * @param {any} messageData - Данные сообщения для отправки
   */
  const sendMessage = useCallback((messageData) => {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      try {
        state.ws.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }, [state.ws]);

  /**
   * Подписывается на сообщения определённого типа
   * @param {string} messageType - Тип сообщения для подписки
   * @param {Function} callback - Функция обратного вызова
   * @returns {Function} Функция для отписки
   */
  const subscribe = useCallback((messageType, callback) => {
    dispatch({ type: ActionTypes.SET_SUBSCRIBER, payload: { messageType, callback } });

    // Возвращаем функцию для отписки
    return () => {
      dispatch({ type: ActionTypes.REMOVE_SUBSCRIBER, payload: { messageType, callback } });
    };
  }, []);

  const value = {
    isConnected: state.isConnected,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
