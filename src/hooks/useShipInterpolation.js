import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '../contexts/GameStateContext';

export function useShipInterpolation(shipName) {
  const gameState = useGameState();
  const playerState = gameState.current?.playerStates[shipName];

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
    delta: 0.1,
  });

  // Ref для хранения позиции и вращения для рендеринга
  const resultRef = useRef({
    position: [0, 0, 0],
    rotation: 0,
  });

  // Инициализация начального состояния
  useEffect(() => {
    if (playerState) {
      currentRef.current = {
        x: playerState.x,
        z: playerState.z,
        angle: playerState.angle,
      };

      targetRef.current = {
        x: playerState.x,
        z: playerState.z,
        angle: playerState.angle,
        delta: playerState.delta || 0.1,
      };

      resultRef.current = {
        position: [playerState.x, 0, playerState.z],
        rotation: playerState.angle,
      };
    }
  }, [shipName, playerState]);

  useFrame((state, delta) => {
    if (!playerState) return;

    // Обновляем целевое состояние из gameState
    targetRef.current = {
      x: playerState.x,
      z: playerState.z,
      angle: playerState.angle,
      delta: playerState.delta || 0.1,
    };

    // Плавное обновление позиции
    const smoothFactor = 5;

    const newX = currentRef.current.x + (targetRef.current.x - currentRef.current.x) * delta * smoothFactor;
    const newZ = currentRef.current.z + (targetRef.current.z - currentRef.current.z) * delta * smoothFactor;

    currentRef.current.x = newX;
    currentRef.current.z = newZ;

    // Плавное обновление угла
    const angleDiff = targetRef.current.angle - currentRef.current.angle;
    const newAngle = currentRef.current.angle + angleDiff * delta * smoothFactor;

    currentRef.current.angle = newAngle;

    // Обновляем результат для рендеринга
    resultRef.current = {
      position: [newX, 0, newZ],
      rotation: newAngle,
    };
  });

  return resultRef.current;
}
