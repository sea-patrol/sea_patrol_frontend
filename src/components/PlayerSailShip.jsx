import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react';

import { usePlayerState } from '../contexts/GameStateContext';
import { modelUrls } from '../utils/models'

const WireframeBox = ({ width, height, depth }) => {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial color="orange" wireframe />
    </mesh>
  );
};

export default function PlayerSailShip({ name, isCurrentPlayer, shipRef }) {
  const { nodes, materials } = useGLTF(modelUrls.sail_ship)

  const shipRefToUse = isCurrentPlayer ? shipRef : useRef();

  // Глобальное состояние игры - используем селектор
  const playerState = usePlayerState(name);

  // Текущее состояние корабля
  const currentRef = useRef({
    x: 0,
    z: 0,
    angle: 0,
  });

  // Целевое состояние корабля
  const targetRef = useRef({
    x: 0,
    z: 0,
    angle: 0,
    delta: 0.1, // Delta сервера
  });

  useEffect(() => {
    // Инициализация начального состояния
    if (playerState) {
      currentRef.current = {
        x: playerState.x,
        z: playerState.z,
        angle: playerState.angle,
      };

      targetRef.current = {
        x: playerState.x,
        z: playerState.z,
        angle: playerState.angle,
        delta: playerState.delta || 0.1,
      };
    }
  }, [name, playerState]);

  useFrame((state, delta) => {
    if (!shipRefToUse.current) return;

    // Получаем актуальное целевое состояние из селектора
    if (!playerState) return;

    // Обновляем целевое состояние
    targetRef.current = {
      x: playerState.x,
      z: playerState.z,
      angle: playerState.angle,
      delta: playerState.delta || 0.1,
    };

    // Плавное обновление позиции
    const smoothFactor = 5; // Коэффициент плавности
    const serverDelta = targetRef.current.delta;

    const newX = currentRef.current.x + (targetRef.current.x - currentRef.current.x) * delta;
    const newZ = currentRef.current.z + (targetRef.current.z - currentRef.current.z) * delta;

    currentRef.current.x = newX;
    currentRef.current.z = newZ;

    // Плавное обновление угла
    const angleDiff = targetRef.current.angle - currentRef.current.angle;
    const newAngle = currentRef.current.angle + angleDiff * delta;

    currentRef.current.angle = newAngle;

    // Обновляем позицию и угол корабля
    shipRefToUse.current.position.set(newX, 0, newZ);
    shipRefToUse.current.rotation.y = newAngle;
  });

  return (
      <group ref={shipRefToUse} position={[currentRef.current ? currentRef.current.x : 0, 0, currentRef.current ? currentRef.current.z : 0]}>
        {playerState && (
          <WireframeBox
            width={playerState.width}
            height={playerState.height}
            depth={playerState.length}
          />
        )}
        <group position={[0, -2.5, 0]} dispose={null}>
          <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, Math.PI]}>
            <mesh
              name="Materia��-material"
              geometry={nodes['Materia��-material'].geometry}
              material={materials.Materia}
            />
            <mesh
              name="Materia��_001-material"
              geometry={nodes['Materia��_001-material'].geometry}
              material={materials['Materia.001']}
            />
            <mesh
              name="Materia��_004-material"
              geometry={nodes['Materia��_004-material'].geometry}
              material={materials['Materia.004']}
            />
            <mesh
              name="Materia��_003-material"
              geometry={nodes['Materia��_003-material'].geometry}
              material={materials['Materia.003']}
            />
            <lineSegments
              name="Object_15"
              geometry={nodes.Object_15.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Materia��-material_1"
              geometry={nodes['Materia��-material_1'].geometry}
              material={materials.Materia}
            />
            <mesh
              name="Materia��_003-material_1"
              geometry={nodes['Materia��_003-material_1'].geometry}
              material={materials['Materia.003']}
            />
            <mesh
              name="Materia��_003-material_2"
              geometry={nodes['Materia��_003-material_2'].geometry}
              material={materials['Materia.003']}
              scale={[-1, 1, 1]}
            />
            <mesh
              name="Materia��_003-material_3"
              geometry={nodes['Materia��_003-material_3'].geometry}
              material={materials['Materia.003']}
            />
            <lineSegments
              name="Object_24"
              geometry={nodes.Object_24.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Materia��_007-material"
              geometry={nodes['Materia��_007-material'].geometry}
              material={materials['Materia.007']}
            />
            <mesh
              name="Materia��-material_2"
              geometry={nodes['Materia��-material_2'].geometry}
              material={materials.Materia}
            />
            <mesh
              name="Materia��_003-material_4"
              geometry={nodes['Materia��_003-material_4'].geometry}
              material={materials['Materia.003']}
            />
            <mesh
              name="Materia��_004-material_1"
              geometry={nodes['Materia��_004-material_1'].geometry}
              material={materials['Materia.004']}
            />
            <mesh
              name="Materia��_006-material"
              geometry={nodes['Materia��_006-material'].geometry}
              material={materials['Materia.006']}
            />
            <mesh
              name="Materia��_003-material_5"
              geometry={nodes['Materia��_003-material_5'].geometry}
              material={materials['Materia.003']}
            />
            <mesh
              name="Materia��_003-material_6"
              geometry={nodes['Materia��_003-material_6'].geometry}
              material={materials['Materia.003']}
            />
            <mesh
              name="Materia��_005-material"
              geometry={nodes['Materia��_005-material'].geometry}
              material={materials['Materia.005']}
            />
            <mesh
              name="Materia��_004-material_2"
              geometry={nodes['Materia��_004-material_2'].geometry}
              material={materials['Materia.004']}
            />
            <mesh
              name="Materia��_002-material"
              geometry={nodes['Materia��_002-material'].geometry}
              material={materials['Materia.002']}
            />
            <mesh
              name="Object_45"
              geometry={nodes.Object_45.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Object_47"
              geometry={nodes.Object_47.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Object_49"
              geometry={nodes.Object_49.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Object_51"
              geometry={nodes.Object_51.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Materia��_004-material_3"
              geometry={nodes['Materia��_004-material_3'].geometry}
              material={materials['Materia.004']}
            />
            <lineSegments
              name="Object_55"
              geometry={nodes.Object_55.geometry}
              material={materials.material_0}
            />
            <mesh
              name="Materia��_003-material_7"
              geometry={nodes['Materia��_003-material_7'].geometry}
              material={materials['Materia.003']}
            />
            <mesh
              name="Materia��_003-material_8"
              geometry={nodes['Materia��_003-material_8'].geometry}
              material={materials['Materia.003']}
            />
          </group>
        </group>
      </group>
  )
}
