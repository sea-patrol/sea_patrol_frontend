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
    expect(getWindCompassLabel(0)).toBe('В');
    expect(getWindCompassLabel(Math.PI / 2)).toBe('С');
  });

  it('describes relative wind for tailwind, beam and headwind', () => {
    expect(describeRelativeWind(0, 0)).toMatchObject({ label: 'Попутный ветер' });
    expect(describeRelativeWind(0, Math.PI / 2)).toMatchObject({ label: 'Левый галс траверз' });
    expect(describeRelativeWind(0, Math.PI)).toMatchObject({ label: 'Встречный ветер' });
  });

  it('maps wind speed into readable strength labels', () => {
    expect(getWindStrengthLabel(0)).toBe('Штиль');
    expect(getWindStrengthLabel(3)).toBe('Лёгкий ветер');
    expect(getWindStrengthLabel(6)).toBe('Умеренный ветер');
    expect(getWindStrengthLabel(10)).toBe('Свежий ветер');
    expect(getWindStrengthLabel(14)).toBe('Сильный ветер');
  });

  it('explains sail drive from current sail level and wind', () => {
    expect(
      describeSailDrive({
        sailLevel: 0,
        shipAngle: 0,
        windAngle: 0,
        windSpeed: 8,
      }),
    ).toContain('Паруса опущены');

    expect(
      describeSailDrive({
        sailLevel: 3,
        shipAngle: 0,
        windAngle: Math.PI / 2,
        windSpeed: 10,
      }),
    ).toContain('Боковой ветер даёт самую сильную тягу');
  });
});
