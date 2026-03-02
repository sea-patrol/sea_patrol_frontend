import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShipInterpolation } from '../../hooks/useShipInterpolation';
import { GameStateProvider } from '../../contexts/GameStateContext';

// Мокируем useFrame из @react-three/fiber
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useFrame: vi.fn(),
  };
});

describe('useShipInterpolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <GameStateProvider>{children}</GameStateProvider>
  );

  it('возвращает начальную позицию при отсутствии данных', () => {
    const { result } = renderHook(() => useShipInterpolation('test-player'), { wrapper });

    expect(result.current.position).toEqual([0, 0, 0]);
    expect(result.current.rotation).toBe(0);
  });

  it('корректно обрабатывает отсутствие игрока в gameState', () => {
    const { result } = renderHook(() => useShipInterpolation('non-existent-player'), {
      wrapper,
    });

    expect(result.current.position).toEqual([0, 0, 0]);
  });
});
