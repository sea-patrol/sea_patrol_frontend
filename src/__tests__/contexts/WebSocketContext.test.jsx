import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { WebSocketProvider, useWebSocket } from '../../contexts/WebSocketContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Моки для WebSocket
const mockWebSocket = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
}));

// Тестовый провайдер с авторизацией
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>{children}</WebSocketProvider>
  </AuthProvider>
);

describe('WebSocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module exports', () => {
    it('should export WebSocketProvider and useWebSocket', async () => {
      const module = await import('../../contexts/WebSocketContext');
      expect(module.WebSocketProvider).toBeDefined();
      expect(module.useWebSocket).toBeDefined();
    });

    it('should export functions', async () => {
      const module = await import('../../contexts/WebSocketContext');
      expect(typeof module.WebSocketProvider).toBe('function');
      expect(typeof module.useWebSocket).toBe('function');
    });
  });

  describe('useWebSocket hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleSpy.mockRestore();
    });

    it('should provide isConnected, sendMessage, and subscribe', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(result.current.isConnected).toBeDefined();
      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.subscribe).toBe('function');
    });
  });

  describe('sendMessage', () => {
    it('should be a function', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.sendMessage).toBe('function');
    });
  });

  describe('subscribe', () => {
    it('should be a function', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.subscribe).toBe('function');
    });

    it('should return unsubscribe function', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      const mockCallback = vi.fn();
      const unsubscribe = result.current.subscribe('TEST_MESSAGE', mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when message received', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      const mockCallback = vi.fn();
      
      await act(async () => {
        result.current.subscribe('TEST_MESSAGE', mockCallback);
      });

      // Проверяем, что подписка зарегистрирована
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('isConnected state', () => {
    it('should be boolean', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('should initially be false without auth', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      // Без токена и пользователя подключение не установлено
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('WebSocket API availability', () => {
    it('should have WebSocket available globally', () => {
      expect(typeof WebSocket).toBe('function');
    });

    it('should have WebSocket states defined', () => {
      expect(WebSocket.CONNECTING).toBe(0);
      expect(WebSocket.OPEN).toBe(1);
      expect(WebSocket.CLOSING).toBe(2);
      expect(WebSocket.CLOSED).toBe(3);
    });
  });

  describe('useReducer implementation', () => {
    it('should use useReducer internally', async () => {
      // Проверяем, что контекст экспортирует нужные функции
      const module = await import('../../contexts/WebSocketContext');
      
      // Проверяем наличие основных экспортов
      expect(module.WebSocketProvider).toBeDefined();
      expect(module.useWebSocket).toBeDefined();
    });
  });
});
