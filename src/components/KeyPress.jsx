import { useEffect, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useWebSocket } from '../contexts/WebSocketContext';
import * as messageType from '../const/messageType';

const KeyPress = () => {
  const [subscribeKeys] = useKeyboardControls();
  const [pressedKeys, setPressedKeys] = useState({
      up: false,
      down: false,
      right: false,
      left: false,
    });

  const { sendMessage, isConnected, subscribe } = useWebSocket();

  useEffect(() => {
      if (!isConnected) {
        console.warn('WebSocket is not connected');
        return;
      }

      const unsubscribe = subscribeKeys((state) => {
        // Формируем новое состояние клавиш
        const newPressedKeys = {
          up: state.up,
          down: state.down,
          right: state.right,
          left: state.left,
        };

        // Проверяем, изменилось ли состояние клавиш
        if (
          newPressedKeys.up !== pressedKeys.up ||
          newPressedKeys.down !== pressedKeys.down ||
          newPressedKeys.right !== pressedKeys.right ||
          newPressedKeys.left !== pressedKeys.left
        ) {
          // Обновляем состояние
          setPressedKeys(newPressedKeys);

          // Отправляем сообщение через WebSocket
          sendMessage([messageType.PLAYER_INPUT, newPressedKeys]);
        }
      });

      return () => {
        unsubscribe();
      };
    }, [subscribeKeys, pressedKeys, sendMessage, isConnected]);

  return null;
};

export default KeyPress;