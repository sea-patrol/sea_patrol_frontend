import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useChat } from '../../hooks/useChat';
import { AuthProvider } from '../../contexts/AuthContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

const TestWrapper = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>{children}</WebSocketProvider>
  </AuthProvider>
);

describe('useChat hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Module exports', () => {
    it('should export useChat as named export', async () => {
      const module = await import('../../hooks/useChat');
      expect(module.useChat).toBeDefined();
    });

    it('should export useChat as default export', async () => {
      const module = await import('../../hooks/useChat');
      expect(module.default).toBeDefined();
    });
  });

  describe('useChat', () => {
    it('should return chat object with expected properties', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('newMessage');
      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('setNewMessage');
      expect(result.current).toHaveProperty('clearMessages');
      expect(result.current).toHaveProperty('handleKeyPress');
      expect(result.current).toHaveProperty('stats');
    });

    it('should return empty messages array initially', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(result.current.messages).toEqual([]);
    });

    it('should return empty newMessage initially', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(result.current.newMessage).toBe('');
    });

    it('should return isConnected as boolean', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('should have sendMessage function', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should have setNewMessage function', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(typeof result.current.setNewMessage).toBe('function');
    });

    it('should have clearMessages function', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(typeof result.current.clearMessages).toBe('function');
    });

    it('should have handleKeyPress function', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(typeof result.current.handleKeyPress).toBe('function');
    });

    it('should have stats object', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      expect(result.current.stats).toHaveProperty('total');
      expect(result.current.stats).toHaveProperty('isFull');
      expect(result.current.stats).toHaveProperty('hasMessages');
    });

    it('should update newMessage with setNewMessage', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      act(() => {
        result.current.setNewMessage('Hello');
      });

      expect(result.current.newMessage).toBe('Hello');
    });

    it('should clear messages with clearMessages', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      // Сначала добавим сообщение (через setNewMessage для теста)
      act(() => {
        result.current.setNewMessage('Test message');
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should handle Enter key press', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn()
      };

      act(() => {
        result.current.handleKeyPress(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not handle non-Enter key press', () => {
      const { result } = renderHook(() => useChat(), { wrapper: TestWrapper });

      const mockEvent = {
        key: 'A',
        preventDefault: vi.fn()
      };

      act(() => {
        result.current.handleKeyPress(mockEvent);
      });

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should accept maxMessages option', () => {
      const { result } = renderHook(() => useChat({ maxMessages: 50 }), { wrapper: TestWrapper });

      expect(result.current.stats).toBeDefined();
    });
  });
});
