import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useGameState, usePlayerState, useOtherPlayers, useAllPlayerStates } from '../../hooks/useGameState';
import { GameStateProvider } from '../../contexts/GameStateContext';

const TestWrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
);

describe('useGameState hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module exports', () => {
    it('should export useGameState as named export', async () => {
      const module = await import('../../hooks/useGameState');
      expect(module.useGameState).toBeDefined();
    });

    it('should export selectors', async () => {
      const module = await import('../../hooks/useGameState');
      expect(module.usePlayerState).toBeDefined();
      expect(module.useOtherPlayers).toBeDefined();
      expect(module.useAllPlayerStates).toBeDefined();
    });

    it('should export default', async () => {
      const module = await import('../../hooks/useGameState');
      expect(module.default).toBeDefined();
    });
  });

  describe('useGameState', () => {
    it('should throw error when used outside GameStateProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGameState());
      }).toThrow('useGameState must be used within a GameStateProvider');

      consoleSpy.mockRestore();
    });

    it('should return game state object with expected properties', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('setPlayerState');
      expect(result.current).toHaveProperty('setAllPlayerStates');
      expect(result.current).toHaveProperty('removePlayerState');
      expect(result.current).toHaveProperty('resetGameState');
    });

    it('should return state with empty playerStates initially', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      expect(result.current.state.playerStates).toEqual({});
    });

    it('should set player state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20, angle: 45 });
      });

      expect(result.current.state.playerStates.player1).toBeDefined();
      expect(result.current.state.playerStates.player1.x).toBe(10);
    });

    it('should set all player states', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setAllPlayerStates({
          player1: { x: 10, z: 20 },
          player2: { x: 30, z: 40 }
        });
      });

      expect(Object.keys(result.current.state.playerStates).length).toBe(2);
    });

    it('should remove player state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
      });

      act(() => {
        result.current.removePlayerState('player1');
      });

      expect(result.current.state.playerStates.player1).toBeUndefined();
    });

    it('should reset game state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
      });

      act(() => {
        result.current.resetGameState();
      });

      expect(result.current.state.playerStates).toEqual({});
    });
  });

  describe('usePlayerState selector', () => {
    it('should return undefined for non-existent player', () => {
      const { result } = renderHook(
        () => usePlayerState('nonexistent'),
        { wrapper: TestWrapper }
      );

      expect(result.current).toBeUndefined();
    });
  });

  describe('useOtherPlayers selector', () => {
    it('should return empty object when no players', () => {
      const { result } = renderHook(
        () => useOtherPlayers('player1'),
        { wrapper: TestWrapper }
      );

      expect(result.current).toEqual({});
    });
  });

  describe('useAllPlayerStates selector', () => {
    it('should return empty object when no players', () => {
      const { result } = renderHook(
        () => useAllPlayerStates(),
        { wrapper: TestWrapper }
      );

      expect(result.current).toEqual({});
    });
  });
});
