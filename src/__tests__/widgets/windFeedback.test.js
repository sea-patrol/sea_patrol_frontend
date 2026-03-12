import { describe, expect, it } from 'vitest';

import {
  describeRelativeWind,
  describeSailDrive,
  getWindCompassLabel,
  getWindStrengthLabel,
  toDegrees,
} from '../../widgets/GameHud/windFeedback';

describe('windFeedback', () => {
  it('converts radians into degrees and compass labels', () => {
    expect(toDegrees(0)).toBe(0);
    expect(toDegrees(Math.PI / 2)).toBe(90);
    expect(getWindCompassLabel(0)).toBe('E');
    expect(getWindCompassLabel(Math.PI / 2)).toBe('N');
  });

  it('describes relative wind for tailwind, beam and headwind', () => {
    expect(describeRelativeWind(0, 0)).toMatchObject({ label: 'Tailwind' });
    expect(describeRelativeWind(0, Math.PI / 2)).toMatchObject({ label: 'Port beam' });
    expect(describeRelativeWind(0, Math.PI)).toMatchObject({ label: 'Headwind' });
  });

  it('maps wind speed into readable strength labels', () => {
    expect(getWindStrengthLabel(0)).toBe('Calm');
    expect(getWindStrengthLabel(3)).toBe('Light breeze');
    expect(getWindStrengthLabel(6)).toBe('Working breeze');
    expect(getWindStrengthLabel(10)).toBe('Fresh breeze');
    expect(getWindStrengthLabel(14)).toBe('Strong breeze');
  });

  it('explains sail drive from current sail level and wind', () => {
    expect(
      describeSailDrive({
        sailLevel: 0,
        shipAngle: 0,
        windAngle: 0,
        windSpeed: 8,
      }),
    ).toContain('Sails are lowered');

    expect(
      describeSailDrive({
        sailLevel: 3,
        shipAngle: 0,
        windAngle: Math.PI / 2,
        windSpeed: 10,
      }),
    ).toContain('Beam wind gives the strongest sailing pull');
  });
});
