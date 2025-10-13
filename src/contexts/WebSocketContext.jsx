import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

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
  const WS_URL = 'ws://localhost:8080/ws/game';

  // Центральное хранилище для подписчиков
  const subscribers = useRef({});

  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, user]);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
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
        if (token && user) {
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
        if (subscribers.current[type]) {
          subscribers.current[type].forEach((callback) => callback(payload));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  };

  const sendMessage = (messageData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Метод для подписки на определенный тип сообщений
  const subscribe = (type, callback) => {
    if (!subscribers.current[type]) {
      subscribers.current[type] = new Set();
    }
    subscribers.current[type].add(callback);

    // Возвращаем функцию для отписки
    return () => {
      if (subscribers.current[type]) {
        subscribers.current[type].delete(callback);
      }
    };
  };

  const value = {
    isConnected,
    sendMessage,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};