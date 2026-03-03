/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createWsClient } from '../shared/ws/wsClient';

import { useAuth } from './AuthContext';

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
  const { token, user } = useAuth();

  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = createWsClient();
  }

  const tokenRef = useRef(token);
  const userRef = useRef(user);
  tokenRef.current = token;
  userRef.current = user;

  const connectWebSocket = useCallback(() => {
    clientRef.current.connect({
      getUrl: () => {
        const currentToken = tokenRef.current;
        const currentUser = userRef.current;
        if (!currentToken || !currentUser) return null;
        return `${WS_URL}?token=${encodeURIComponent(currentToken)}`;
      },
      reconnectDelayMs: 3000,
      onConnectionChange: setIsConnected,
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
    clientRef.current.send(messageData);
  }, []);

  const subscribe = useCallback((type, callback) => {
    return clientRef.current.subscribe(type, callback);
  }, []);

  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, token, user]);

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
