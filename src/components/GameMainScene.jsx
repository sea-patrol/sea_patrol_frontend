import { Suspense, useEffect, useRef, useState} from 'react';
import { Canvas } from '@react-three/fiber';
import { LoadingScreen } from '../components/LoadingScreen';
import { Sky } from '@react-three/drei';
import Ocean from './Ocean';
import PlayerSailShip from './PlayerSailShip';
import CameraFollower from './CameraFollower';
import NpcSailShip from './NpcSailShip';
import { Leva, useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { KeyboardControls } from '@react-three/drei'
import { Bouys } from './Buoys';
import { preloadAllModels } from '../utils/models';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import KeyPress from './KeyPress';
import GameStateInfo from './GameStateInfo';
import * as messageType from '../const/messageType';

function GameMainScene() {

  const { user } = useAuth();
  const { sendMessage, isConnected, subscribe } = useWebSocket();

  // Состояние для хранения имен игроков
  const [playerNames, setPlayerNames] = useState([]);

  // Ref для корабля текущего игрока
  const currentPlayerShipRef = useRef(null);

  const currentPlayerName = user.username;

  // Используем глобальный gameState через контекст
  const gameState = useGameState();

  useEffect(() => {
    console.log("GameMainScene useEffect called")

    preloadAllModels().then(() => {
     console.log("preloadAllModels.then called")
    });
  }, []);

  useEffect(() => {
    const unsubscribeInitGameInfo = subscribe(messageType.INIT_GAME_STATE, (payload) => {
      const playersData = payload.players.reduce((acc, player) => {
        acc[player.name] = {
          ...player
        };
        return acc;
      }, {});

      gameState.current.playerStates = playersData;
      setPlayerNames(Object.keys(playersData)); // Обновляем список имен игроков
    });

    const unsubscribeUpdateGameInfo = subscribe(messageType.UPDATE_GAME_STATE, (payload) => {
      payload.players.forEach((player) => {
        // Проверяем, существует ли игрок в текущем состоянии игры
        if (gameState.current.playerStates[player.name]) {
          // Обновляем только указанные поля, если они существуют в payload
          const playerState = gameState.current.playerStates[player.name];
          if (player.x !== undefined) playerState.x = player.x;
          if (player.z !== undefined) playerState.z = player.z;
          if (player.angle !== undefined) playerState.angle = player.angle;
          if (player.velocity !== undefined) playerState.velocity = player.velocity;
          if (player.health !== undefined) playerState.health = player.health;
        }
      });
    });

    const unsubscribePlayerJoin = subscribe(messageType.PLAYER_JOIN, (payload) => {
      gameState.current.playerStates[payload.name] = {
        ...payload
      };

      setPlayerNames((prevNames) => [...prevNames, payload.name]); // Добавляем имя нового игрока
    });

    const unsubscribePlayerLeave = subscribe(messageType.PLAYER_LEAVE, (username) => {
      delete gameState.current.playerStates[username];

      setPlayerNames((prevNames) => prevNames.filter((name) => name !== username)); // Удаляем имя игрока
    });

    return () => {
      unsubscribeInitGameInfo();
      unsubscribeUpdateGameInfo();
      unsubscribePlayerJoin();
      unsubscribePlayerLeave();
    };
  }, [subscribe]);

  const { perfVisible } = useControls('Monitoring', {
    perfVisible: true
  })

  const {physicsDebug} = useControls('PhysicsDebug', {
    physicsDebug: false
  })

  const { sunX, sunY, sunZ, turbidity } = useControls('Солнце', {
    sunX: { value: 500, min: -1500, max: 1500, step: 10 },
    sunY: { value: 150, min: -1000, max: 1000, step: 10 },
    sunZ: { value: -1000, min: -1000, max: 1000, step: 10 },
    turbidity: { value: 0.1, min: 0, max: 20, step: 0.1 }
  });

  return (
    <>
      <Leva />
      <KeyboardControls
          map={ [
              { name: 'up', keys: [ 'ArrowUp', 'KeyW' ] },
              { name: 'down', keys: [ 'ArrowDown', 'KeyS' ] },
              { name: 'left', keys: [ 'ArrowLeft', 'KeyA' ] },
              { name: 'right', keys: [ 'ArrowRight', 'KeyD' ] }
          ] }
      >
        <KeyPress />
        <GameStateInfo name={currentPlayerName} />
        <Canvas camera={{ position: [0, 5, 100], fov: 55, near: 1, far: 1000 }}>
          {perfVisible && <Perf position="top-left" />}
          <Suspense fallback={LoadingScreen} >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
            <Sky scale={1000} sunPosition={[sunX, sunY, sunZ]} turbidity={turbidity} />
            <Ocean />
            {/* Рендерим корабли всех игроков */}
            {playerNames.map((name) => {
              const playerState = gameState.current.playerStates[name];
              if (!playerState) return null;

              return (
                <PlayerSailShip
                  key={name}
                  name={name} // Передаем весь объект playerState
                  isCurrentPlayer={name === currentPlayerName}
                  shipRef={name === currentPlayerName ? currentPlayerShipRef : null} // Передаем ref только для текущего игрока
                />
              );
            })}

            {/* Камера следует за кораблем текущего игрока */}
            <CameraFollower targetRef={currentPlayerShipRef} />
            <Bouys position={[0, 0, 0]} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default GameMainScene;