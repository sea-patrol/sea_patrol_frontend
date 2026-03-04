/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';
import { createWsClient } from '@/shared/ws/wsClient';


const WebSocketContext = createContext();

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

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();
  const [lastClose, setLastClose] = useState(null);

  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = createWsClient();
  }

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const connectWebSocket = useCallback(() => {
    setLastClose(null);
    clientRef.current.connect({
      getUrl: () => {
        const currentToken = tokenRef.current;
        if (!currentToken) return null;
        return `${WS_URL}?token=${encodeURIComponent(currentToken)}`;
      },
      reconnect: {
        initialDelayMs: 1000,
        maxDelayMs: 8000,
        factor: 2,
        maxAttempts: 5,
        cooldownMs: 30000,
      },
      onConnectionChange: setIsConnected,
      onOpen: () => {
        setLastClose(null);
      },
      onClose: (event) => {
        // CloseEvent есть в браузере, но в тестовой среде может быть undefined
        const code = event?.code;
        const reason = event?.reason;
        setLastClose({ code, reason });
        console.warn('WebSocket closed:', { code, reason });
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      },
      onMessageError: (error) => {
        console.error('WebSocket message error:', error);
      },
    });
  }, []);

  const disconnectWebSocket = useCallback(() => {
    clientRef.current.disconnect();
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((messageData) => {
    const result = clientRef.current.send(messageData);
    if (!result.ok) {
      console.warn('WebSocket send failed:', result.error);
    }
  }, []);

  const subscribe = useCallback((type, callback) => {
    return clientRef.current.subscribe(type, callback);
  }, []);

  useEffect(() => {
    if (token) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, token]);

  const value = useMemo(() => {
    return {
      isConnected,
      hasToken: !!token,
      lastClose,
      sendMessage,
      subscribe,
    };
  }, [isConnected, lastClose, sendMessage, subscribe, token]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
