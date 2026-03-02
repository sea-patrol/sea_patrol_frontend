import { useKeyboardControls } from '@react-three/drei';
import { useEffect } from 'react';

import * as messageType from '../const/messageType';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * Компонент обработки нажатий клавиш для управления кораблём
 * @description Отправляет состояния клавиш на сервер через WebSocket
 */
const KeyPress = () => {
  const [subscribeKeys] = useKeyboardControls();
  const { sendMessage, isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    const unsubscribe = subscribeKeys((state) => {
      // Формируем состояние клавиш
      const pressedKeys = {
        up: state.up,
        down: state.down,
        right: state.right,
        left: state.left,
      };

      // Отправляем сообщение через WebSocket
      sendMessage([messageType.PLAYER_INPUT, pressedKeys]);
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeKeys, sendMessage, isConnected, subscribe]);

  return null;
};

export default KeyPress;
