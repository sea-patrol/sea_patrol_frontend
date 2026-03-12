const TAU = Math.PI * 2;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeAngle(angle) {
  if (!isFiniteNumber(angle)) return null;
  const normalized = angle % TAU;
  return normalized >= 0 ? normalized : normalized + TAU;
}

export function toDegrees(angle) {
  const normalized = normalizeAngle(angle);
  if (normalized === null) return null;
  return Math.round((normalized * 180) / Math.PI);
}

export function getWindCompassLabel(angle) {
  const normalized = normalizeAngle(angle);
  if (normalized === null) return 'Неизвестно';

  const sectors = ['В', 'СВ', 'С', 'СЗ', 'З', 'ЮЗ', 'Ю', 'ЮВ'];
  const sectorIndex = Math.round(normalized / (Math.PI / 4)) % sectors.length;
  return sectors[sectorIndex];
}

export function getWindStrengthLabel(speed) {
  if (!isFiniteNumber(speed) || speed <= 0.5) return 'Штиль';
  if (speed < 4) return 'Лёгкий ветер';
  if (speed < 8) return 'Умеренный ветер';
  if (speed < 12) return 'Свежий ветер';
  return 'Сильный ветер';
}

export function describeRelativeWind(shipAngle, windAngle) {
  const normalizedShipAngle = normalizeAngle(shipAngle);
  const normalizedWindAngle = normalizeAngle(windAngle);
  if (normalizedShipAngle === null || normalizedWindAngle === null) return null;

  let delta = normalizedWindAngle - normalizedShipAngle;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;

  const absDelta = Math.abs(delta);

  if (absDelta <= Math.PI / 8) {
    return {
      label: 'Попутный ветер',
      hint: 'Ветер идёт с кормы и даёт ровную тягу.',
    };
  }

  if (absDelta >= (Math.PI * 7) / 8) {
    return {
      label: 'Встречный ветер',
      hint: 'Корабль идёт против ветра, поэтому тяга будет слабее.',
    };
  }

  const side = delta > 0 ? 'Левый' : 'Правый';

  if (absDelta >= (Math.PI * 3) / 8 && absDelta <= (Math.PI * 5) / 8) {
    return {
      label: `${side} галс траверз`,
      hint: 'Боковой ветер даёт самую сильную тягу в текущей модели.',
    };
  }

  return {
    label: `${side} галс бейдевинд`,
    hint: 'Ветер идёт под углом к парусам, поэтому тяга будет умеренной.',
  };
}

export function describeSailDrive({ sailLevel, shipAngle, windAngle, windSpeed }) {
  if (!isFiniteNumber(sailLevel) || sailLevel <= 0) {
    return 'Паруса опущены. Корабль не будет набирать ход под парусами.';
  }

  const windStrength = getWindStrengthLabel(windSpeed);
  const relativeWind = describeRelativeWind(shipAngle, windAngle);
  if (!relativeWind) {
    return `Паруса ${sailLevel}/3. Ожидаем authoritative-вектор ветра.`;
  }

  return `Паруса ${sailLevel}/3. ${windStrength}. ${relativeWind.hint}`;
}
