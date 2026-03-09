import { useFrame } from '@react-three/fiber';
import ReactThreeTestRenderer, { act, waitFor } from '@react-three/test-renderer';
import { useEffect, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { GameStateProvider, useGameState } from '../../features/game/model/GameStateContext';
import PlayerSailShip from '../../features/ships/ui/PlayerSailShip';
import * as messageType from '../../shared/constants/messageType';

vi.mock('../../features/ships/ui/ShipModel', () => {
  return { default: () => null };
});

function GameStateDriver({ player, spawn, shipRef }) {
  const { dispatch } = useGameState();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      dispatch({ type: messageType.INIT_GAME_STATE, payload: { players: [player] } });
      return;
    }

    dispatch({ type: messageType.UPDATE_GAME_STATE, payload: { players: [player] } });
  }, [dispatch, player]);

  useEffect(() => {
    if (!spawn) return;
    dispatch({
      type: messageType.SPAWN_ASSIGNED,
      payload: {
        currentPlayerName: player.name,
        spawn,
      },
    });
  }, [dispatch, player.name, spawn]);

  return <PlayerSailShip name={player.name} isCurrentPlayer shipRef={shipRef} />;
}

function Scene({ player, spawn = null, shipRef }) {
  return (
    <GameStateProvider>
      <GameStateDriver player={player} spawn={spawn} shipRef={shipRef} />
    </GameStateProvider>
  );
}

describe('PlayerSailShip', () => {
  it('updates position and angle towards game state using interpolation, but snaps on SPAWN_ASSIGNED', async () => {
    const shipRef = { current: null };
    if (vi.isMockFunction(useFrame)) {
      useFrame.mockClear();
    }

    const initialPlayer = {
      name: 'alice',
      x: 2,
      z: 3,
      angle: 0.2,
      width: 1,
      height: 1,
      length: 1,
      delta: 0.1,
    };

    const renderer = await ReactThreeTestRenderer.create(<Scene player={initialPlayer} shipRef={shipRef} />);

    await waitFor(() => {
      expect(shipRef.current).not.toBeNull();
    });

    expect(vi.isMockFunction(useFrame)).toBe(true);
    const frameCallback = useFrame.mock.calls[0][0];

    await act(async () => {});

    await act(async () => {
      frameCallback({}, 1);
    });

    expect(shipRef.current.position.x).toBeCloseTo(2, 6);
    expect(shipRef.current.position.z).toBeCloseTo(3, 6);
    expect(shipRef.current.rotation.y).toBeCloseTo(0.2, 6);

    const nextPlayer = {
      ...initialPlayer,
      x: 10,
      z: 4,
      angle: 1,
    };

    await act(async () => {
      await renderer.update(<Scene player={nextPlayer} shipRef={shipRef} />);
    });

    await act(async () => {
      frameCallback({}, 0.5);
    });

    expect(shipRef.current.position.x).toBeCloseTo(6, 6);
    expect(shipRef.current.position.z).toBeCloseTo(3.5, 6);
    expect(shipRef.current.rotation.y).toBeCloseTo(0.6, 6);

    await act(async () => {
      await renderer.update(
        <Scene
          player={nextPlayer}
          spawn={{ reason: 'RESPAWN', x: -12, z: 9, angle: 0.75 }}
          shipRef={shipRef}
        />,
      );
    });

    await act(async () => {
      frameCallback({}, 0.1);
    });

    expect(shipRef.current.position.x).toBeCloseTo(-12, 6);
    expect(shipRef.current.position.z).toBeCloseTo(9, 6);
    expect(shipRef.current.rotation.y).toBeCloseTo(0.75, 6);

    await renderer.unmount();
  });
});
