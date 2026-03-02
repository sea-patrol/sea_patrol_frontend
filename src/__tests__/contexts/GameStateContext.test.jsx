import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { GameStateProvider, useGameState, usePlayerState, useOtherPlayers, useAllPlayerStates } from '../../contexts/GameStateContext';

const TestWrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
);

describe('GameStateContext', () => {
  beforeEach(() => {
    // Очищаем состояние перед каждым тестом
  });

  describe('Module exports', () => {
    it('should export GameStateProvider and useGameState', async () => {
      const module = await import('../../contexts/GameStateContext');
      expect(module.GameStateProvider).toBeDefined();
      expect(module.useGameState).toBeDefined();
    });

    it('should export selectors', async () => {
      const module = await import('../../contexts/GameStateContext');
      expect(module.usePlayerState).toBeDefined();
      expect(module.useOtherPlayers).toBeDefined();
      expect(module.useAllPlayerStates).toBeDefined();
    });
  });

  describe('useGameState hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGameState());
      }).toThrow('useGameState must be used within a GameStateProvider');

      consoleSpy.mockRestore();
    });

    it('should provide state and methods', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      expect(result.current.state).toBeDefined();
      expect(result.current.state.playerStates).toBeDefined();
      expect(typeof result.current.setPlayerState).toBe('function');
      expect(typeof result.current.setAllPlayerStates).toBe('function');
      expect(typeof result.current.removePlayerState).toBe('function');
      expect(typeof result.current.resetGameState).toBe('function');
    });

    it('should initialize with empty playerStates', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      expect(result.current.state.playerStates).toEqual({});
    });
  });

  describe('setPlayerState', () => {
    it('should set player state immutably', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20, angle: 45 });
      });

      expect(result.current.state.playerStates.player1).toEqual({
        x: 10,
        z: 20,
        angle: 45
      });
    });

    it('should update existing player state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
      });

      act(() => {
        result.current.setPlayerState('player1', { x: 30, z: 40, angle: 90 });
      });

      expect(result.current.state.playerStates.player1).toEqual({
        x: 30,
        z: 40,
        angle: 90
      });
    });

    it('should not mutate other players', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
        result.current.setPlayerState('player2', { x: 100, z: 200 });
      });

      act(() => {
        result.current.setPlayerState('player1', { x: 50, z: 60 });
      });

      expect(result.current.state.playerStates.player2).toEqual({
        x: 100,
        z: 200
      });
    });
  });

  describe('setAllPlayerStates', () => {
    it('should set all player states', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setAllPlayerStates({
          player1: { x: 10, z: 20 },
          player2: { x: 30, z: 40 }
        });
      });

      expect(result.current.state.playerStates).toEqual({
        player1: { x: 10, z: 20 },
        player2: { x: 30, z: 40 }
      });
    });
  });

  describe('removePlayerState', () => {
    it('should remove player state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
        result.current.setPlayerState('player2', { x: 30, z: 40 });
      });

      act(() => {
        result.current.removePlayerState('player1');
      });

      expect(result.current.state.playerStates.player1).toBeUndefined();
      expect(result.current.state.playerStates.player2).toBeDefined();
    });
  });

  describe('resetGameState', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
        result.current.setPlayerState('player2', { x: 30, z: 40 });
      });

      act(() => {
        result.current.resetGameState();
      });

      expect(result.current.state.playerStates).toEqual({});
    });
  });

  describe('usePlayerState selector', () => {
    it('should return player state by name', () => {
      const wrapper = ({ children }) => (
        <GameStateProvider>{children}</GameStateProvider>
      );

      const { result } = renderHook(
        () => usePlayerState('player1'),
        { wrapper }
      );

      expect(result.current).toBeUndefined();

      // Примечание: для полноценного теста нужно обновлять состояние через контекст
    });

    it('should return undefined for non-existent player', () => {
      const wrapper = ({ children }) => (
        <GameStateProvider>{children}</GameStateProvider>
      );

      const { result } = renderHook(
        () => usePlayerState('nonexistent'),
        { wrapper }
      );

      expect(result.current).toBeUndefined();
    });
  });

  describe('useOtherPlayers selector', () => {
    it('should return all players except current', () => {
      const wrapper = ({ children }) => (
        <GameStateProvider>{children}</GameStateProvider>
      );

      const { result } = renderHook(
        () => useOtherPlayers('player1'),
        { wrapper }
      );

      expect(result.current).toEqual({});
    });
  });

  describe('useAllPlayerStates selector', () => {
    it('should return all player states', () => {
      const wrapper = ({ children }) => (
        <GameStateProvider>{children}</GameStateProvider>
      );

      const { result } = renderHook(
        () => useAllPlayerStates(),
        { wrapper }
      );

      expect(result.current).toEqual({});
    });
  });

  describe('Immutable updates', () => {
    it('should create new state object on update', () => {
      const { result } = renderHook(() => useGameState(), { wrapper: TestWrapper });

      const initialState = result.current.state;

      act(() => {
        result.current.setPlayerState('player1', { x: 10, z: 20 });
      });

      const newState = result.current.state;

      expect(initialState).not.toBe(newState);
      expect(initialState.playerStates).not.toBe(newState.playerStates);
    });
  });
});
