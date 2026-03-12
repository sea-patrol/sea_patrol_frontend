import { useEffect, useState } from 'react';

import { describeRelativeWind, describeSailDrive, getWindCompassLabel, getWindStrengthLabel, toDegrees } from './windFeedback';

import { selectPlayerState, selectWindState, useGameState } from '@/features/game/model/GameStateContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';

import './GameStateInfo.css';

const EMPTY_PLAYER_STATE = { x: 0, z: 0, angle: 0, velocity: 0, sailLevel: null };
const EMPTY_WIND_STATE = { angle: 0, speed: 0 };

export default function GameStateInfo({ name }) {
  const { stateRef } = useGameState();
  const { subscribe } = useWebSocket();
  const [viewState, setViewState] = useState({
    player: EMPTY_PLAYER_STATE,
    wind: EMPTY_WIND_STATE,
  });
  const windDegrees = toDegrees(viewState.wind.angle);
  const windCompass = getWindCompassLabel(viewState.wind.angle);
  const windStrength = getWindStrengthLabel(viewState.wind.speed);
  const relativeWind = describeRelativeWind(viewState.player.angle, viewState.wind.angle);
  const sailDriveCopy = describeSailDrive({
    sailLevel: viewState.player.sailLevel,
    shipAngle: viewState.player.angle,
    windAngle: viewState.wind.angle,
    windSpeed: viewState.wind.speed,
  });

  useEffect(() => {
    const syncGameState = () => {
      const nextPlayerState = selectPlayerState(stateRef.current, name);
      const nextWindState = selectWindState(stateRef.current);

      setViewState({
        player: nextPlayerState
          ? {
              x: nextPlayerState.x ?? 0,
              z: nextPlayerState.z ?? 0,
              angle: nextPlayerState.angle ?? 0,
              velocity: nextPlayerState.velocity ?? 0,
              sailLevel: Number.isInteger(nextPlayerState.sailLevel) ? nextPlayerState.sailLevel : null,
            }
          : EMPTY_PLAYER_STATE,
        wind: nextWindState
          ? {
              angle: nextWindState.angle ?? 0,
              speed: nextWindState.speed ?? 0,
            }
          : EMPTY_WIND_STATE,
      });
    };

    syncGameState();

    const unsubscribeInit = subscribe(messageType.INIT_GAME_STATE, syncGameState);
    const unsubscribeUpdate = subscribe(messageType.UPDATE_GAME_STATE, syncGameState);

    return () => {
      unsubscribeInit();
      unsubscribeUpdate();
    };
  }, [name, stateRef, subscribe]);

  return (
    <div className="game-state-info">
      <div className="game-state-info__name">{name ?? 'Unknown captain'}</div>
      <div>X: {viewState.player.x.toFixed(2)}, Z: {viewState.player.z.toFixed(2)}</div>
      <div>Угол: {viewState.player.angle.toFixed(2)}</div>
      <div>Скорость: {viewState.player.velocity.toFixed(2)}</div>
      <div>Паруса: {viewState.player.sailLevel ?? '-'}/3</div>
      <div className="game-state-info__wind-card">
        <div className="game-state-info__wind-heading">
          <span className="game-state-info__wind-strength">{windStrength}</span>
          <span>{viewState.wind.speed.toFixed(2)}</span>
        </div>
        <div className="game-state-info__wind-meta">
          Ветер: {windDegrees ?? '-'}° / {windCompass}
        </div>
        <div className="game-state-info__wind-meta">
          Курс и ветер: {relativeWind?.label ?? 'Unknown'}
        </div>
        <div className="game-state-info__wind-copy">{sailDriveCopy}</div>
      </div>
    </div>
  );
}
