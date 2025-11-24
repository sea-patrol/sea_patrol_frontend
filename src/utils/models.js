import { useGLTF } from '@react-three/drei';
import sailShipUrl from '../assets/sail_ship.glb';
import boatUrl from '../assets/boat.glb';

// Экспортируем URL'ы для импорта в компонентах
export const modelUrls = {
  sail_ship: sailShipUrl,
  boat: boatUrl
};

// Предзагрузка всех моделей (возвращает Promise)
export function preloadAllModels() {
  return Promise.all([
    useGLTF.preload(sailShipUrl),
    useGLTF.preload(boatUrl)
  ]);
}