import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useWebSocket } from '../../hooks/useWebSocket';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { AuthProvider } from '../../contexts/AuthContext';

const TestWrapper = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>{children}</WebSocketProvider>
  </AuthProvider>
);

describe('useWebSocket hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Module exports', () => {
    it('should export useWebSocket as named export', async () => {
      const module = await import('../../hooks/useWebSocket');
      expect(module.useWebSocket).toBeDefined();
    });

    it('should export useWebSocket as default export', async () => {
      const module = await import('../../hooks/useWebSocket');
      expect(module.default).toBeDefined();
    });
  });

  describe('useWebSocket', () => {
    it('should throw error when used outside WebSocketProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleSpy.mockRestore();
    });

    it('should return websocket object with expected properties', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('subscribe');
    });

    it('should return isConnected as boolean', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('should return isConnected as false without auth', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      // Без токена и пользователя подключение не установлено
      expect(result.current.isConnected).toBe(false);
    });

    it('should have sendMessage function', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should have subscribe function', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      expect(typeof result.current.subscribe).toBe('function');
    });

    it('subscribe should return unsubscribe function', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper: TestWrapper });

      const mockCallback = vi.fn();
      const unsubscribe = result.current.subscribe('TEST_MESSAGE', mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });
  });
});
