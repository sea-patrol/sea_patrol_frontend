import { useEffect } from 'react';
import { preloadAllModels } from '../utils/models';

export function useModelPreload() {
  useEffect(() => {
    preloadAllModels()
      .then(() => {
        console.log('Модели успешно предзагружены');
      })
      .catch((error) => {
        console.error('Ошибка предзагрузки моделей:', error);
      });
  }, []);
}
