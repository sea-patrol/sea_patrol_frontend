import { describeRelativeWind, describeSailDrive, getWindCompassLabel, getWindStrengthLabel, toDegrees } from './windFeedback';

import { useAuth } from '@/features/auth/model/AuthContext';
import { selectCurrentPlayerState, selectWindState, useGameState } from '@/features/game/model/GameStateContext';
import pirateAvatar from '@/shared/assets/Pirate.jpg';


import './ProfileBlock.css';

const IS_DEV = import.meta.env.DEV;

const ProfileBlock = () => {
  const { user } = useAuth();
  const { state } = useGameState();
  const currentPlayerState = selectCurrentPlayerState(state, user?.username);
  const windState = selectWindState(state);
  const sailLevel = Number.isInteger(currentPlayerState?.sailLevel) ? currentPlayerState.sailLevel : null;
  const velocity = Number.isFinite(currentPlayerState?.velocity) ? currentPlayerState.velocity : 0;
  const windAngle = windState?.angle ?? null;
  const windSpeed = Number.isFinite(windState?.speed) ? windState.speed : 0;
  const windDegrees = toDegrees(windAngle);
  const windCompass = getWindCompassLabel(windAngle);
  const windStrength = getWindStrengthLabel(windSpeed);
  const relativeWind = describeRelativeWind(currentPlayerState?.angle, windAngle);
  const sailDriveCopy = describeSailDrive({
    sailLevel,
    shipAngle: currentPlayerState?.angle,
    windAngle,
    windSpeed,
  });

  return (
    <div className="profile">
      <div className="avatar">
        <img src={pirateAvatar} alt="Аватар игрока" />
      </div>
      <div className="meta">
        <div className="eyebrow">Captain</div>
        <div className="name">{user?.username ?? 'Guest Captain'}</div>
        <div className="stats">
          <div className="stats__row">
            <span>Скорость</span>
            <strong>{velocity.toFixed(2)}</strong>
          </div>
          <div className="stats__row">
            <span>Паруса</span>
            <strong>{sailLevel ?? '-'}/3</strong>
          </div>
        </div>
        <div className="wind-panel">
          <div className="wind-panel__heading">
            <span className="wind-panel__strength">{windStrength}</span>
            <span>{windSpeed.toFixed(2)}</span>
          </div>
          <div className="wind-panel__meta">
            Ветер: {windDegrees ?? '-'}° / {windCompass}
          </div>
          <div className="wind-panel__meta">
            Курс и ветер: {relativeWind?.label ?? 'Unknown'}
          </div>
          <div className="wind-panel__copy">{sailDriveCopy}</div>
        </div>
        {IS_DEV && currentPlayerState && (
          <div className="debug-panel">
            <div className="debug-panel__title">Debug</div>
            <div>X: {(currentPlayerState.x ?? 0).toFixed(2)}, Z: {(currentPlayerState.z ?? 0).toFixed(2)}</div>
            <div>Угол: {(currentPlayerState.angle ?? 0).toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileBlock;
