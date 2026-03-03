/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthContext';

const WebSocketContext = createContext();
const WS_URL = 'ws://localhost:8080/ws/game';

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();
  const wsRef = useRef(null);

  // Центральное хранилище для подписчиков
  const subscribersRef = useRef({});

  const tokenRef = useRef(token);
  const userRef = useRef(user);
  tokenRef.current = token;
  userRef.current = user;

  const sendMessage = useCallback((messageData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }, []);

  // Метод для подписки на определенный тип сообщений
  const subscribe = useCallback((type, callback) => {
    if (!subscribersRef.current[type]) {
      subscribersRef.current[type] = new Set();
    }
    subscribersRef.current[type].add(callback);

    // Возвращаем функцию для отписки
    return () => {
      if (subscribersRef.current[type]) {
        subscribersRef.current[type].delete(callback);
      }
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    const currentToken = tokenRef.current;
    const currentUser = userRef.current;

    if (!currentToken || !currentUser) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(currentToken)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (tokenRef.current && userRef.current) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        const type = messageData.type;
        const payload = messageData.payload;

        // Уведомляем всех подписчиков данного типа
        if (subscribersRef.current[type]) {
          subscribersRef.current[type].forEach((callback) => callback(payload));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }, []);

  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket, token, user]);

  const value = useMemo(() => {
    return {
      isConnected,
      sendMessage,
      subscribe,
    };
  }, [isConnected, sendMessage, subscribe]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
