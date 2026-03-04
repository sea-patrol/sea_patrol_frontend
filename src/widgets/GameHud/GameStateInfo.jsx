import { useEffect, useState } from 'react';

import { selectPlayerState, useGameState } from '@/features/game/model/GameStateContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import './GameStateInfo.css';

export default function GameStateInfo({ name }) {
  // Глобальное состояние игры
  const { stateRef } = useGameState();
  const [playerState, setPlayerState] = useState({x: 0, z: 0, angle: 0, velocity: 0});

  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribeUpdateGameInfo = subscribe(messageType.UPDATE_GAME_STATE, () => {
      const playerState = selectPlayerState(stateRef.current, name);
      setPlayerState({ x: playerState?.x,
          z: playerState?.z,
          angle: playerState?.angle,
          velocity: playerState?.velocity });
    });

    return () => {
      unsubscribeUpdateGameInfo();
    };
  }, [name, stateRef, subscribe]);

  // Если данных о игроке нет, показываем заглушку
  if (!playerState) {
    return (
      <div
        className="game-state-info"
      >
        Загрузка данных...
      </div>
    );
  }

  return (
    <div
      className="game-state-info"
    >
      <div>{name}</div>
      <div>X: {playerState.x ? playerState.x.toFixed(2) : 0}, Z: {playerState.z ? playerState.z.toFixed(2) : 0}</div>
      <div>Угол: {playerState.angle ? playerState.angle.toFixed(2) : 0}</div>
      <div>Скорость: {playerState.velocity ? playerState.velocity.toFixed(2) : 0}</div>
    </div>
  );
}
