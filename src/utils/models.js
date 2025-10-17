import { useGLTF } from '@react-three/drei';
import sailShipUrl from '../assets/sail_ship.glb';

// Экспортируем URL'ы для импорта в компонентах
export const modelUrls = {
  sail_ship: sailShipUrl
};

// Предзагрузка всех моделей (возвращает Promise)
export function preloadAllModels() {
  return Promise.all([
    useGLTF.preload(sailShipUrl)
  ]);
}