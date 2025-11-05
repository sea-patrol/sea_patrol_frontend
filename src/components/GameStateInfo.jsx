import { useRef, useEffect, useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import * as messageType from '../const/messageType';

export default function GameStateInfo({ name }) {
  // Глобальное состояние игры
  const gameState = useGameState();
  const [playerState, setPlayerState] = useState({x: 0, z: 0, angle: 0, velocity: 0});

  const { sendMessage, isConnected, subscribe } = useWebSocket();

  useEffect(() => {  
      const unsubscribeUpdateGameInfo = subscribe(messageType.UPDATE_GAME_STATE, (payload) => {
        const playerState = gameState.current?.playerStates[name];
        setPlayerState({x: playerState?.x,
          z: playerState?.z,
          angle: playerState?.angle,
          velocity: playerState?.velocity});
      });
  
      return () => {
        unsubscribeUpdateGameInfo();
      };
  }, [subscribe]);

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
      <div>X: {playerState.x ? playerState.x.toFixed(2) : 0}, Z: {playerState.z ? playerState.z.toFixed(2) : 0}</div>
      <div>Угол: {playerState.angle ? playerState.angle.toFixed(2) : 0}</div>
      <div>Скорость: {playerState.velocity ? playerState.velocity.toFixed(2) : 0}</div>
    </div>
  );
}