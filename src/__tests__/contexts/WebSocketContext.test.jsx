import { describe, it, expect, vi } from 'vitest';

// WebSocketContext тесты
// Примечание: Полное тестирование WebSocket требует сложной настройки с mock-socket
// и может конфликтовать с MSW. Эти тесты проверяют базовую функциональность.

describe('WebSocketContext', () => {
  describe('Module', () => {
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

  describe('useWebSocket hook behavior', () => {
    it('should throw error when used outside provider', async () => {
      const { useWebSocket } = await import('../../contexts/WebSocketContext');
      const { renderHook } = await import('@testing-library/react');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('WebSocket API', () => {
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
});
