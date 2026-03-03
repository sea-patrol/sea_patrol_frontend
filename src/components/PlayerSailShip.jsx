import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react';

import { selectPlayerState, useGameState } from '../contexts/GameStateContext';

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

  // Глобальное состояние игры
  const { stateRef } = useGameState();
  const state = selectPlayerState(stateRef.current, name);

  // Текущее состояние корабля
  const currentRef = useRef({
    x: 0,
    z: 0,
    angle: 0,
  });

  // Целевое состояние корабля
  const targetRef = useRef({
    x: 0,
    z: 0,
    angle: 0,
    delta: 0.1, // Delta сервера
  });

  useEffect(() => {
    // Инициализация начального состояния
    const initialPlayerState = selectPlayerState(stateRef.current, name);
    if (initialPlayerState) {
      currentRef.current = {
        x: initialPlayerState.x,
        z: initialPlayerState.z,
        angle: initialPlayerState.angle,
      };

      targetRef.current = {
        x: initialPlayerState.x,
        z: initialPlayerState.z,
        angle: initialPlayerState.angle,
        delta: initialPlayerState.delta || 0.1,
      };
    }
  }, [name, stateRef]);

  useFrame((state, delta) => {
    if (!shipRefToUse.current) return;

    // Получаем актуальное целевое состояние из gameState
    const playerState = selectPlayerState(stateRef.current, name);
    if (!playerState) return;

    // Обновляем целевое состояние
    targetRef.current = {
      x: playerState.x,
      z: playerState.z,
      angle: playerState.angle,
      delta: playerState.delta || 0.1,
    };

    const newX = currentRef.current.x + (targetRef.current.x - currentRef.current.x) * delta;
    const newZ = currentRef.current.z + (targetRef.current.z - currentRef.current.z) * delta;

    currentRef.current.x = newX;
    currentRef.current.z = newZ;

    // Плавное обновление угла
    const angleDiff = targetRef.current.angle - currentRef.current.angle;
    const newAngle = currentRef.current.angle + angleDiff * delta;

    currentRef.current.angle = newAngle;

    // Обновляем позицию и угол корабля
    shipRefToUse.current.position.set(newX, 0, newZ);
    shipRefToUse.current.rotation.y = newAngle;
  });

  return (
      <group ref={shipRefToUse} position={[currentRef.current ? currentRef.current.x : 0, 0, currentRef.current ? currentRef.current.z : 0]}>
        {state && (
          <WireframeBox
            width={state.width}
            height={state.height}
            depth={state.length}
          />
        )}
        <ShipModel />
      </group>
  )
}
