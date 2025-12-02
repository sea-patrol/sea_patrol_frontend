import { useGLTF } from '@react-three/drei';
import sailShipUrl from '../assets/sail_ship.glb';
import boatUrl from '../assets/boat.glb';
import islandUrl from '../assets/island.glb';
import fishHouseUrl from '../assets/fish_house.glb';

// Экспортируем URL'ы для импорта в компонентах
export const modelUrls = {
  sail_ship: sailShipUrl,
  boat: boatUrl,
  island: islandUrl,
  fish_house: fishHouseUrl
};

// Предзагрузка всех моделей (возвращает Promise)
export function preloadAllModels() {
  return Promise.all([
    useGLTF.preload(sailShipUrl),
    useGLTF.preload(boatUrl),
    useGLTF.preload(islandUrl),
    useGLTF.preload(fishHouseUrl)
  ]);
}