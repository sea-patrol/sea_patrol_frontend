import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Глобальная очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Настройка MSW сервера
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Мокирование useGLTF из @react-three/drei
vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useGLTF: vi.fn(() => ({
      nodes: {
        'Материал-material': { geometry: {} },
        'Материал_001-material': { geometry: {} },
        'Материал_004-material': { geometry: {} },
        'Материал_003-material': { geometry: {} },
        'Материал-material_1': { geometry: {} },
        'Материал_003-material_1': { geometry: {} },
        'Материал_003-material_2': { geometry: {} },
        'Материал_003-material_3': { geometry: {} },
        'Материал_007-material': { geometry: {} },
        'Материал-material_2': { geometry: {} },
        'Материал_003-material_4': { geometry: {} },
        'Материал_004-material_1': { geometry: {} },
        'Материал_006-material': { geometry: {} },
        'Материал_003-material_5': { geometry: {} },
        'Материал_003-material_6': { geometry: {} },
        'Материал_005-material': { geometry: {} },
        'Материал_004-material_2': { geometry: {} },
        'Материал_002-material': { geometry: {} },
        Object_45: { geometry: {} },
        Object_47: { geometry: {} },
        Object_49: { geometry: {} },
        Object_51: { geometry: {} },
        'Материал_004-material_3': { geometry: {} },
        'Материал_003-material_7': { geometry: {} },
        'Материал_003-material_8': { geometry: {} },
        Object_15: { geometry: {} },
        Object_24: { geometry: {} },
        Object_55: { geometry: {} },
      },
      materials: {
        Materia: {},
        'Materia.001': {},
        'Materia.004': {},
        'Materia.003': {},
        'Materia.007': {},
        'Materia.006': {},
        'Materia.005': {},
        'Materia.002': {},
        material_0: {},
      },
    })),
  };
});

// Мокирование useFrame из @react-three/fiber
vi.mock('@react-three/fiber', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useFrame: vi.fn(),
  };
});
