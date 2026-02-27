import { describe, it, expect, beforeEach } from 'vitest';

// PlayerSailShip использует useGLTF и useFrame, которые мокируются в setupTests.js
// Тестируем только базовую структуру и существование компонента

describe('PlayerSailShip Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exist as a module', async () => {
    const module = await import('../../components/PlayerSailShip');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('should be a function component', async () => {
    const module = await import('../../components/PlayerSailShip');
    expect(typeof module.default).toBe('function');
  });
});
