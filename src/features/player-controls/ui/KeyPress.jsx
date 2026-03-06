import { useKeyboardControls } from '@react-three/drei';
import { useEffect, useState } from 'react';

import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import { useGameUi } from '@/features/ui-shell/model/GameUiContext';
import * as messageType from '@/shared/constants/messageType';

const EMPTY_INPUT = {
  up: false,
  down: false,
  right: false,
  left: false,
};

const hasInputChanged = (left, right) => {
  return left.up !== right.up || left.down !== right.down || left.right !== right.right || left.left !== right.left;
};

const KeyPress = () => {
  const [subscribeKeys] = useKeyboardControls();
  const [pressedKeys, setPressedKeys] = useState(EMPTY_INPUT);
  const { isGameplayInputAllowed } = useGameUi();
  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !isGameplayInputAllowed) {
      if (hasInputChanged(pressedKeys, EMPTY_INPUT)) {
        setPressedKeys(EMPTY_INPUT);
        sendMessage([messageType.PLAYER_INPUT, EMPTY_INPUT]);
      }
      return undefined;
    }

    const unsubscribe = subscribeKeys((state) => {
      const nextPressedKeys = {
        up: state.up,
        down: state.down,
        right: state.right,
        left: state.left,
      };

      if (!hasInputChanged(nextPressedKeys, pressedKeys)) {
        return;
      }

      setPressedKeys(nextPressedKeys);
      sendMessage([messageType.PLAYER_INPUT, nextPressedKeys]);
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, isGameplayInputAllowed, pressedKeys, sendMessage, subscribeKeys]);

  return null;
};

export default KeyPress;
