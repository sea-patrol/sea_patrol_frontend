import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import Ocean from './Ocean';
import SailShip from './SailShip';

function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 5, 100], fov: 55, near: 1, far: 20000 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <Ocean/>
      <Sky scale={1000} sunPosition={[500, 150, -1000]} turbidity={0.1} />
      <SailShip position-y={ 2.5 } />
      <OrbitControls />
    </Canvas>
  );
}

export default ThreeScene;