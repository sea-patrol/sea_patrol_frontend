import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import Ocean from './Ocean';

function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 5, 100], fov: 55, near: 1, far: 20000 }}>
      <ambientLight intensity={0.5} />

      <Ocean/>
      <Sky scale={1000} sunPosition={[500, 150, -1000]} turbidity={0.1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}

export default ThreeScene;