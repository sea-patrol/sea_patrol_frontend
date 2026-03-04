import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';


import CameraFollower from './camera/CameraFollower';
import { LoadingScreen } from './LoadingScreen';
import { Bouys } from './ocean/Buoys';
import Ocean from './ocean/Ocean';

import { selectPlayerState } from '@/features/game/model/GameStateContext';
import PlayerSailShip from '@/features/ships/ui/PlayerSailShip';

export default function GameSceneCanvas({
  playerNames,
  currentPlayerName,
  currentPlayerShipRef,
  stateRef,
  perfNode,
  sunPosition,
  turbidity,
}) {
  const safePlayerNames = Array.isArray(playerNames) ? playerNames : [];
  const safeSunPosition = Array.isArray(sunPosition) ? sunPosition : [500, 150, -1000];

  return (
    <Canvas dpr={1} camera={{ position: [0, 5, 100], fov: 55, near: 1, far: 1000 }}>
      {perfNode}
      <Suspense fallback={LoadingScreen}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Sky scale={1000} sunPosition={safeSunPosition} turbidity={turbidity} />
        <Ocean />
        {/* Рендерим корабли всех игроков */}
        {safePlayerNames.map((name) => {
          const playerState = selectPlayerState(stateRef.current, name);
          if (!playerState) return null;

          return (
            <PlayerSailShip
              key={name}
              name={name}
              isCurrentPlayer={name === currentPlayerName}
              shipRef={name === currentPlayerName ? currentPlayerShipRef : null}
            />
          );
        })}

        {/* Камера следует за кораблем текущего игрока */}
        <CameraFollower targetRef={currentPlayerShipRef} />
        <Bouys position={[0, 0, 0]} />
      </Suspense>
    </Canvas>
  );
}
