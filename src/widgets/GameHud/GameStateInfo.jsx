import { useEffect, useState } from 'react';

import { selectPlayerState, useGameState } from '@/features/game/model/GameStateContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import './GameStateInfo.css';

const EMPTY_PLAYER_STATE = { x: 0, z: 0, angle: 0, velocity: 0 };

export default function GameStateInfo({ name }) {
  const { stateRef } = useGameState();
  const { subscribe } = useWebSocket();
  const [playerState, setPlayerState] = useState(EMPTY_PLAYER_STATE);

  useEffect(() => {
    const syncPlayerState = () => {
      const nextPlayerState = selectPlayerState(stateRef.current, name);
      if (!nextPlayerState) {
        setPlayerState(EMPTY_PLAYER_STATE);
        return;
      }

      setPlayerState({
        x: nextPlayerState.x ?? 0,
        z: nextPlayerState.z ?? 0,
        angle: nextPlayerState.angle ?? 0,
        velocity: nextPlayerState.velocity ?? 0,
      });
    };

    syncPlayerState();

    const unsubscribeInit = subscribe(messageType.INIT_GAME_STATE, syncPlayerState);
    const unsubscribeUpdate = subscribe(messageType.UPDATE_GAME_STATE, syncPlayerState);

    return () => {
      unsubscribeInit();
      unsubscribeUpdate();
    };
  }, [name, stateRef, subscribe]);

  return (
    <div className="game-state-info">
      <div className="game-state-info__name">{name ?? 'Unknown captain'}</div>
      <div>X: {playerState.x.toFixed(2)}, Z: {playerState.z.toFixed(2)}</div>
      <div>Угол: {playerState.angle.toFixed(2)}</div>
      <div>Скорость: {playerState.velocity.toFixed(2)}</div>
    </div>
  );
}
