import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelPreload } from '../../hooks/useModelPreload';

// Мокируем useGLTF из @react-three/drei
vi.mock('@react-three/drei', () => ({
  useGLTF: {
    preload: vi.fn(() => Promise.resolve()),
  },
}));

// Мокируем URL модели
vi.mock('../../assets/sail_ship.glb', () => ({
  default: '/mocked-path/sail_ship.glb',
}));

describe('useModelPreload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('вызывает preloadAllModels при монтировании', async () => {
    const { useGLTF } = await import('@react-three/drei');

    renderHook(() => useModelPreload());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(useGLTF.preload).toHaveBeenCalled();
  });

  it('логгирует сообщение об успешной загрузке', async () => {
    const { useGLTF } = await import('@react-three/drei');
    useGLTF.preload.mockResolvedValueOnce({});

    renderHook(() => useModelPreload());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(console.log).toHaveBeenCalledWith('Модели успешно предзагружены');
  });

  it('вызывает preload только один раз при монтировании', async () => {
    const { useGLTF } = await import('@react-three/drei');

    const { rerender } = renderHook(() => useModelPreload());

    // Перерендер не должен вызывать preload снова
    rerender();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(useGLTF.preload).toHaveBeenCalledTimes(1);
  });
});
