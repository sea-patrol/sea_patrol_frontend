import { KeyboardControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { preloadAllModels } from '../utils/models';
import { useGameWsGameState } from '../utils/useGameWsGameState';

import GameDebugOverlay from './GameDebugOverlay';
import GameSceneCanvas from './GameSceneCanvas';
import GameStateInfo from './GameStateInfo';
import KeyPress from './KeyPress';

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
