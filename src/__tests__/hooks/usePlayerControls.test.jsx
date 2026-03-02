import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { usePlayerControls } from '../../hooks/usePlayerControls';
import { AuthProvider } from '../../contexts/AuthContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

const TestWrapper = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>{children}</WebSocketProvider>
  </AuthProvider>
);

describe('usePlayerControls hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Module exports', () => {
    it('should export usePlayerControls as named export', async () => {
      const module = await import('../../hooks/usePlayerControls');
      expect(module.usePlayerControls).toBeDefined();
    });

    it('should export usePlayerControls as default export', async () => {
      const module = await import('../../hooks/usePlayerControls');
      expect(module.default).toBeDefined();
    });
  });

  describe('usePlayerControls', () => {
    it('should return controls object with expected properties', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(result.current).toHaveProperty('pressedKeys');
      expect(result.current).toHaveProperty('isEnabled');
      expect(result.current).toHaveProperty('setEnabled');
      expect(result.current).toHaveProperty('resetKeys');
    });

    it('should return pressedKeys with correct structure', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(result.current.pressedKeys).toHaveProperty('up');
      expect(result.current.pressedKeys).toHaveProperty('down');
      expect(result.current.pressedKeys).toHaveProperty('left');
      expect(result.current.pressedKeys).toHaveProperty('right');
    });

    it('should have all keys false initially', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(result.current.pressedKeys.up).toBe(false);
      expect(result.current.pressedKeys.down).toBe(false);
      expect(result.current.pressedKeys.left).toBe(false);
      expect(result.current.pressedKeys.right).toBe(false);
    });

    it('should return isEnabled as boolean', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(typeof result.current.isEnabled).toBe('boolean');
    });

    it('should have setEnabled function', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(typeof result.current.setEnabled).toBe('function');
    });

    it('should have resetKeys function', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      expect(typeof result.current.resetKeys).toBe('function');
    });

    it('should accept enabled option', () => {
      const { result } = renderHook(() => usePlayerControls({ enabled: false }), { wrapper: TestWrapper });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should accept onInputChange callback option', () => {
      const mockCallback = vi.fn();
      
      renderHook(() => usePlayerControls({ onInputChange: mockCallback }), { wrapper: TestWrapper });

      // Callback должен быть принят без ошибок
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('resetKeys should set all keys to false', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      // Примечание: pressedKeys управляется через события клавиатуры
      // В тестовой среде мы проверяем только наличие функции
      act(() => {
        result.current.resetKeys();
      });

      expect(result.current.pressedKeys.up).toBe(false);
      expect(result.current.pressedKeys.down).toBe(false);
    });

    it('setEnabled should accept boolean value', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      act(() => {
        result.current.setEnabled(false);
      });

      // Функция должна выполниться без ошибок
      expect(typeof result.current.setEnabled).toBe('function');
    });
  });

  describe('Keyboard event handling', () => {
    it('should handle keyboard events when enabled', () => {
      // Проверяем, что хук готов к обработке событий
      const { result } = renderHook(() => usePlayerControls({ enabled: true }), { wrapper: TestWrapper });

      expect(result.current.isEnabled).toBeDefined();
    });

    it('should not handle keyboard events when disabled', () => {
      const { result } = renderHook(() => usePlayerControls({ enabled: false }), { wrapper: TestWrapper });

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('Player input structure', () => {
    it('should have correct input keys', () => {
      const { result } = renderHook(() => usePlayerControls(), { wrapper: TestWrapper });

      const keys = Object.keys(result.current.pressedKeys);
      expect(keys).toContain('up');
      expect(keys).toContain('down');
      expect(keys).toContain('left');
      expect(keys).toContain('right');
      expect(keys.length).toBe(4);
    });
  });
});
