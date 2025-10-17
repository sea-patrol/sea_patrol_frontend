import { Suspense, useEffect} from 'react';
import { Canvas } from '@react-three/fiber';
import { LoadingScreen } from '../components/LoadingScreen';
import { Sky } from '@react-three/drei';
import Ocean from './Ocean';
import MainSailShip from './MainSailShip';
import { Leva, useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { KeyboardControls } from '@react-three/drei'
import { Bouys } from './Buoys';
import { preloadAllModels } from '../utils/models';

function GameMainScene() {

   useEffect(() => {
      console.log("GameMainScene useEffect called")

      preloadAllModels().then(() => {
       console.log("preloadAllModels.then called")
      });
    }, []);

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
              { name: 'forward', keys: [ 'ArrowUp', 'KeyW' ] },
              { name: 'backward', keys: [ 'ArrowDown', 'KeyS' ] },
              { name: 'leftward', keys: [ 'ArrowLeft', 'KeyA' ] },
              { name: 'rightward', keys: [ 'ArrowRight', 'KeyD' ] }
          ] }
      >
        <Canvas camera={{ position: [0, 5, 100], fov: 55, near: 1, far: 20000 }}>
          {perfVisible && <Perf position="top-left" />}
          <Suspense fallback={LoadingScreen} >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
            <Sky scale={1000} sunPosition={[sunX, sunY, sunZ]} turbidity={turbidity} />
            <Ocean />
            <MainSailShip />
            <Bouys position={[0, 0, 0]} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default GameMainScene;