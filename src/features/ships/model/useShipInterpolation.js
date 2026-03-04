import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export function clamp01(value) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function computeLerpAlpha(deltaSeconds, speed = 1) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  if (!Number.isFinite(speed) || speed <= 0) return 0;
  return clamp01(deltaSeconds * speed);
}

export function lerpScalar(current, target, alpha) {
  return current + (target - current) * alpha;
}

export function interpolateTransform(current, target, { deltaSeconds, positionSpeed = 1, rotationSpeed = 1 }) {
  const positionAlpha = computeLerpAlpha(deltaSeconds, positionSpeed);
  const rotationAlpha = computeLerpAlpha(deltaSeconds, rotationSpeed);

  return {
    x: lerpScalar(current.x, target.x, positionAlpha),
    z: lerpScalar(current.z, target.z, positionAlpha),
    angle: lerpScalar(current.angle, target.angle, rotationAlpha),
  };
}

export function useShipInterpolation({
  shipRef,
  name,
  getPlayerState,
  positionSpeed = 1,
  rotationSpeed = 1,
  serverDeltaFallback = 0.1,
}) {
  const currentRef = useRef({ x: 0, z: 0, angle: 0 });
  const targetRef = useRef({ x: 0, z: 0, angle: 0, delta: serverDeltaFallback });

  const getPlayerStateRef = useRef(getPlayerState);
  getPlayerStateRef.current = getPlayerState;

  const optionsRef = useRef({ positionSpeed, rotationSpeed, serverDeltaFallback });
  optionsRef.current = { positionSpeed, rotationSpeed, serverDeltaFallback };

  useEffect(() => {
    const initialPlayerState = getPlayerStateRef.current?.(name);
    if (!initialPlayerState) return;

    currentRef.current = {
      x: initialPlayerState.x,
      z: initialPlayerState.z,
      angle: initialPlayerState.angle,
    };

    targetRef.current = {
      x: initialPlayerState.x,
      z: initialPlayerState.z,
      angle: initialPlayerState.angle,
      delta: initialPlayerState.delta || optionsRef.current.serverDeltaFallback,
    };
  }, [name]);

  useFrame((_, deltaSeconds) => {
    const ship = shipRef?.current;
    if (!ship) return;

    const playerState = getPlayerStateRef.current?.(name);
    if (!playerState) return;

    targetRef.current = {
      x: playerState.x,
      z: playerState.z,
      angle: playerState.angle,
      delta: playerState.delta || optionsRef.current.serverDeltaFallback,
    };

    const next = interpolateTransform(currentRef.current, targetRef.current, {
      deltaSeconds,
      positionSpeed: optionsRef.current.positionSpeed,
      rotationSpeed: optionsRef.current.rotationSpeed,
    });

    currentRef.current = { ...currentRef.current, ...next };

    ship.position.set(currentRef.current.x, 0, currentRef.current.z);
    ship.rotation.y = currentRef.current.angle;
  });

  return { currentRef, targetRef };
}
