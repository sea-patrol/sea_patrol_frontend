import { useRef } from 'react';
import { useShipInterpolation } from '../hooks/useShipInterpolation';
import { useGameState } from '../contexts/GameStateContext';
import { ShipModel } from './ShipModel';

const WireframeBox = ({ width, height, depth }) => {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial color="orange" wireframe />
    </mesh>
  );
};

/**
 * PlayerSailShip - компонент корабля игрока с интерполяцией позиции.
 *
 * @param {string} name - Имя игрока
 * @param {boolean} isCurrentPlayer - Флаг текущего игрока
 * @param {React.RefObject} shipRef - Ref для корабля (только для текущего игрока)
 */
export default function PlayerSailShip({ name, isCurrentPlayer, shipRef }) {
  const { position, rotation } = useShipInterpolation(name);
  const defaultRef = useRef();
  const shipRefToUse = isCurrentPlayer ? shipRef : defaultRef;
  const gameState = useGameState();
  const state = gameState.current?.playerStates[name];

  return (
    <group ref={shipRefToUse} position={position} rotation={[0, rotation, 0]}>
      {state && (
        <WireframeBox
          width={state.width}
          height={state.height}
          depth={state.length}
        />
      )}
      <ShipModel dispose={false} />
    </group>
  );
}
