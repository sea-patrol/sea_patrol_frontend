import { KeyboardControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';

import GameDebugOverlay from './GameDebugOverlay';
import GameSceneCanvas from './GameSceneCanvas';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useGameState } from '@/features/game/model/GameStateContext';
import { useGameWsGameState } from '@/features/game/model/useGameWsGameState';
import KeyPress from '@/features/player-controls/ui/KeyPress';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import { preloadAllModels } from '@/shared/assets/models';

function GameMainScene() {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [playerNames, setPlayerNames] = useState([]);
  const currentPlayerShipRef = useRef(null);
  const currentPlayerName = user?.username ?? null;
  const { stateRef, dispatch } = useGameState();

  useEffect(() => {
    preloadAllModels().catch((error) => {
      console.error('Failed to preload models', error);
    });
  }, []);

  useGameWsGameState({ subscribe, dispatch, setPlayerNames });

  return (
    <GameDebugOverlay>
      {({ perfNode, sunPosition, turbidity }) => (
        <KeyboardControls
          map={[
            { name: 'up', keys: ['ArrowUp', 'KeyW'] },
            { name: 'down', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          ]}
        >
          <KeyPress />
          <GameSceneCanvas
            playerNames={playerNames}
            currentPlayerName={currentPlayerName}
            currentPlayerShipRef={currentPlayerShipRef}
            stateRef={stateRef}
            perfNode={perfNode}
            sunPosition={sunPosition}
            turbidity={turbidity}
          />
        </KeyboardControls>
      )}
    </GameDebugOverlay>
  );
}

export default GameMainScene;
