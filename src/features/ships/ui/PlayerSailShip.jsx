import { useCallback, useRef } from 'react';

import { selectPlayerState, useGameState } from '../../game/model/GameStateContext';
import { useShipInterpolation } from '../model/useShipInterpolation';

import ShipModel from './ShipModel';

const WireframeBox = ({ width, height, depth }) => {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial color="orange" wireframe />
    </mesh>
  );
};

export default function PlayerSailShip({ name, isCurrentPlayer, shipRef }) {
  const localShipRef = useRef(null);

  const shipRefToUse = isCurrentPlayer && shipRef ? shipRef : localShipRef;

  const { stateRef } = useGameState();
  const state = selectPlayerState(stateRef.current, name);

  const getPlayerState = useCallback(
    (playerName) => selectPlayerState(stateRef.current, playerName),
    [stateRef],
  );

  const { currentRef } = useShipInterpolation({
    shipRef: shipRefToUse,
    name,
    getPlayerState,
    positionSpeed: 1,
    rotationSpeed: 1,
    serverDeltaFallback: 0.1,
  });

  return (
    <group ref={shipRefToUse} position={[currentRef.current.x, 0, currentRef.current.z]}>
      {state && (
        <WireframeBox
          width={state.width}
          height={state.height}
          depth={state.length}
        />
      )}
      <ShipModel />
    </group>
  );
}
