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
import GameStateInfo from '@/widgets/GameHud/GameStateInfo';

function GameMainScene() {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();

  // Состояние для хранения имен игроков
  const [playerNames, setPlayerNames] = useState([]);

  // Ref для корабля текущего игрока
  const currentPlayerShipRef = useRef(null);

  const currentPlayerName = user.username;

  // Используем глобальный gameState через контекст
  const { stateRef, dispatch } = useGameState();

  useEffect(() => {
    console.log('GameMainScene useEffect called');

    preloadAllModels().then(() => {
      console.log('preloadAllModels.then called');
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
          <GameStateInfo name={currentPlayerName} />
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
