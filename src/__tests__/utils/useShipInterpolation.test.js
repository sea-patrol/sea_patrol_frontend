import { describe, expect, it } from 'vitest';

import { clamp01, computeLerpAlpha, interpolateTransform, lerpScalar } from '../../utils/useShipInterpolation';

describe('useShipInterpolation utils', () => {
  it('clamp01: clamps to [0..1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
  });

  it('computeLerpAlpha: uses deltaSeconds * speed and clamps', () => {
    expect(computeLerpAlpha(0, 1)).toBe(0);
    expect(computeLerpAlpha(0.1, 0)).toBe(0);
    expect(computeLerpAlpha(0.5, 1)).toBe(0.5);
    expect(computeLerpAlpha(0.5, 10)).toBe(1);
  });

  it('lerpScalar: linear interpolation', () => {
    expect(lerpScalar(0, 10, 0)).toBe(0);
    expect(lerpScalar(0, 10, 0.5)).toBe(5);
    expect(lerpScalar(0, 10, 1)).toBe(10);
  });

  it('interpolateTransform: interpolates x/z/angle with separate speeds', () => {
    const current = { x: 0, z: 0, angle: 0 };
    const target = { x: 10, z: 20, angle: 1 };

    expect(interpolateTransform(current, target, { deltaSeconds: 0.5, positionSpeed: 1, rotationSpeed: 2 })).toEqual({
      x: 5,
      z: 10,
      angle: 1,
    });
  });
});

