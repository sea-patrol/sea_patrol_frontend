import { act, render, screen, waitFor } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  GameStateProvider,
  selectPlayerNames,
  selectPlayerState,
  selectWindState,
  useGameState,
} from '../../features/game/model/GameStateContext';
import { useGameWsGameState } from '../../features/game/model/useGameWsGameState';
import * as messageType from '../../shared/constants/messageType';

function createSubscribeMock() {
  const subscriptions = new Map();
  const unsubscribeSpies = [];

  const subscribe = vi.fn((type, callback) => {
    if (!subscriptions.has(type)) subscriptions.set(type, new Set());
    subscriptions.get(type).add(callback);

    const unsubscribe = vi.fn(() => {
      subscriptions.get(type)?.delete(callback);
      if (subscriptions.get(type)?.size === 0) subscriptions.delete(type);
    });

    unsubscribeSpies.push(unsubscribe);
    return unsubscribe;
  });

  const emit = (type, payload) => {
    const callbacks = subscriptions.get(type);
    if (!callbacks) return;
    callbacks.forEach((cb) => cb(payload));
  };

  return { subscribe, emit, subscriptions, unsubscribeSpies };
}

function GameFlowHarness({ subscribe, currentPlayerName = 'alice' }) {
  const { dispatch, stateRef } = useGameState();
  const [playerNames, setPlayerNames] = useState([]);
  const [, bump] = useState(0);

  const dispatchWithRender = useCallback(
    (action) => {
      dispatch(action);
      bump((v) => v + 1);
    },
    [dispatch],
  );

  useGameWsGameState({ subscribe, dispatch: dispatchWithRender, setPlayerNames, currentPlayerName });

  const names = selectPlayerNames(stateRef.current).sort();
  const alice = selectPlayerState(stateRef.current, 'alice');
  const bob = selectPlayerState(stateRef.current, 'bob');
  const wind = selectWindState(stateRef.current);

  const snapshot = {
    playerNames,
    stateNames: names,
    wind,
    alice: alice
      ? {
          x: alice.x,
          z: alice.z,
          angle: alice.angle,
          sailLevel: alice.sailLevel ?? null,
          spawnRevision: alice.spawnRevision ?? null,
          lastSpawnReason: alice.lastSpawnReason ?? null,
        }
      : null,
    bob: bob
      ? {
          x: bob.x,
          z: bob.z,
          angle: bob.angle,
          sailLevel: bob.sailLevel ?? null,
        }
      : null,
  };

  return (
    <div>
      <pre data-testid="snapshot">{JSON.stringify(snapshot)}</pre>
    </div>
  );
}

describe('game state flow integration', () => {
  it('handles INIT -> UPDATE -> SPAWN_ASSIGNED -> JOIN -> LEAVE and cleans up subscriptions', async () => {
    const mock = createSubscribeMock();

    const { unmount } = render(
      <GameStateProvider>
        <GameFlowHarness subscribe={mock.subscribe} />
      </GameStateProvider>,
    );

    expect(mock.subscribe).toHaveBeenCalledTimes(5);

    await act(() => {
      mock.emit(messageType.INIT_GAME_STATE, {
        wind: { angle: 0.5, speed: 10 },
        players: [{ name: 'alice', x: 1, z: 2, angle: 0.1, sailLevel: 3 }],
      });
    });

    await waitFor(() => {
      const snapshot = JSON.parse(screen.getByTestId('snapshot').textContent);
      expect(snapshot.playerNames).toEqual(['alice']);
      expect(snapshot.stateNames).toEqual(['alice']);
      expect(snapshot.wind).toEqual({ angle: 0.5, speed: 10 });
      expect(snapshot.alice).toEqual({
        x: 1,
        z: 2,
        angle: 0.1,
        sailLevel: 3,
        spawnRevision: null,
        lastSpawnReason: null,
      });
    });

    await act(() => {
      mock.emit(messageType.UPDATE_GAME_STATE, {
        wind: { angle: 0.8, speed: 9.5 },
        players: [{ name: 'alice', x: 5, sailLevel: 2 }],
      });
    });

    await waitFor(() => {
      const snapshot = JSON.parse(screen.getByTestId('snapshot').textContent);
      expect(snapshot.alice.x).toBe(5);
      expect(snapshot.alice.sailLevel).toBe(2);
      expect(snapshot.stateNames).toEqual(['alice']);
      expect(snapshot.wind).toEqual({ angle: 0.8, speed: 9.5 });
    });

    await act(() => {
      mock.emit(messageType.SPAWN_ASSIGNED, {
        roomId: 'sandbox-1',
        reason: 'RESPAWN',
        x: -12,
        z: 9,
        angle: 1.2,
      });
    });

    await waitFor(() => {
      const snapshot = JSON.parse(screen.getByTestId('snapshot').textContent);
      expect(snapshot.alice).toEqual({
        x: -12,
        z: 9,
        angle: 1.2,
        sailLevel: 2,
        spawnRevision: 1,
        lastSpawnReason: 'RESPAWN',
      });
    });

    await act(() => {
      mock.emit(messageType.PLAYER_JOIN, { name: 'bob', x: 9, z: 9, angle: 0, sailLevel: 1 });
    });

    await waitFor(() => {
      const snapshot = JSON.parse(screen.getByTestId('snapshot').textContent);
      expect(snapshot.playerNames.sort()).toEqual(['alice', 'bob']);
      expect(snapshot.stateNames).toEqual(['alice', 'bob']);
      expect(snapshot.bob).toEqual({ x: 9, z: 9, angle: 0, sailLevel: 1 });
    });

    await act(() => {
      mock.emit(messageType.PLAYER_LEAVE, { username: 'bob' });
    });

    await waitFor(() => {
      const snapshot = JSON.parse(screen.getByTestId('snapshot').textContent);
      expect(snapshot.playerNames).toEqual(['alice']);
      expect(snapshot.stateNames).toEqual(['alice']);
      expect(snapshot.bob).toBeNull();
    });

    unmount();
    expect(mock.unsubscribeSpies).toHaveLength(5);
    mock.unsubscribeSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    expect(mock.subscriptions.size).toBe(0);
  });
});
