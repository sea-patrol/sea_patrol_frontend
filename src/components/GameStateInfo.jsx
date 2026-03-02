import { useState, useEffect } from 'react';

import * as messageType from '../const/messageType';
import { usePlayerState } from '../hooks/useGameState';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * Компонент отображения информации о состоянии игры
 * @param {Object} props - Пропсы компонента
 * @param {string} props.name - Имя игрока
 */
export default function GameStateInfo({ name }) {
  const { subscribe } = useWebSocket();
  const playerState = usePlayerState(name);
  const [displayState, setDisplayState] = useState({ x: 0, z: 0, angle: 0, velocity: 0 });

  useEffect(() => {
    const unsubscribe = subscribe(messageType.UPDATE_GAME_STATE, () => {
      // Обновляем отображаемое состояние из контекста
      if (playerState) {
        setDisplayState({
          x: playerState.x ?? 0,
          z: playerState.z ?? 0,
          angle: playerState.angle ?? 0,
          velocity: playerState.velocity ?? 0
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, playerState]);

  // Если данных о игроке нет, показываем заглушку
  if (!playerState) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
        }}
      >
        Загрузка данных...
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }}
    >
      <div>{name}</div>
      <div>X: {displayState.x !== undefined ? displayState.x.toFixed(2) : '0.00'}, Z: {displayState.z !== undefined ? displayState.z.toFixed(2) : '0.00'}</div>
      <div>Angle: {displayState.angle !== undefined ? displayState.angle.toFixed(2) : '0.00'}</div>
      <div>Speed: {displayState.velocity !== undefined ? displayState.velocity.toFixed(2) : '0.00'}</div>
    </div>
  );
}
