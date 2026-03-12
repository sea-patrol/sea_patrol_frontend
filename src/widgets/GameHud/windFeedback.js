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
  if (normalized === null) return 'Unknown';

  const sectors = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  const sectorIndex = Math.round(normalized / (Math.PI / 4)) % sectors.length;
  return sectors[sectorIndex];
}

export function getWindStrengthLabel(speed) {
  if (!isFiniteNumber(speed) || speed <= 0.5) return 'Calm';
  if (speed < 4) return 'Light breeze';
  if (speed < 8) return 'Working breeze';
  if (speed < 12) return 'Fresh breeze';
  return 'Strong breeze';
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
      label: 'Tailwind',
      hint: 'Wind is aft of the bow. Expect steady push.',
    };
  }

  if (absDelta >= (Math.PI * 7) / 8) {
    return {
      label: 'Headwind',
      hint: 'You are heading into the wind. Drive will feel weaker.',
    };
  }

  const side = delta > 0 ? 'Port' : 'Starboard';

  if (absDelta >= (Math.PI * 3) / 8 && absDelta <= (Math.PI * 5) / 8) {
    return {
      label: `${side} beam`,
      hint: 'Beam wind gives the strongest sailing pull in the current model.',
    };
  }

  return {
    label: `${side} reach`,
    hint: 'Wind is crossing the sails at an angle. Expect moderate pull.',
  };
}

export function describeSailDrive({ sailLevel, shipAngle, windAngle, windSpeed }) {
  if (!isFiniteNumber(sailLevel) || sailLevel <= 0) {
    return 'Sails are lowered. The ship will not build sail drive.';
  }

  const windStrength = getWindStrengthLabel(windSpeed);
  const relativeWind = describeRelativeWind(shipAngle, windAngle);
  if (!relativeWind) {
    return `Sails ${sailLevel}/3. Waiting for authoritative wind vector.`;
  }

  return `Sails ${sailLevel}/3. ${windStrength}. ${relativeWind.hint}`;
}
