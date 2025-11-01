import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { modelUrls } from '../utils/models'
import * as THREE from 'three'
import { useWebSocket } from '../contexts/WebSocketContext'

export default function PlayerSailShip({ shipRef }) {
  const { nodes, materials } = useGLTF(modelUrls.sail_ship)

  const moveSpeed = 0.5
  const turnSpeed = 0.05

  const [ subscribeKeys, getKeys ] = useKeyboardControls()

  const { sendMessage, isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    // Подписываемся на изменения клавиш
    const unsubscribe = subscribeKeys((state) => {
      if (state.forward) {
        console.log('Forward key pressed');
        // Вызовите здесь вашу логику для движения вперед
      }
      if (state.backward) {
        console.log('Backward key pressed');
        // Вызовите здесь вашу логику для движения назад
      }
      if (state.leftward) {
        console.log('Leftward key pressed');
        // Вызовите здесь вашу логику для движения влево
      }
      if (state.rightward) {
        console.log('Rightward key pressed');
        // Вызовите здесь вашу логику для движения вправо
      }
    });

    // Отписываемся при размонтировании компонента
    return () => {
      unsubscribe();
    };
  }, [subscribeKeys]);

  useFrame((state, delta) =>
  {
      const { forward, backward, leftward, rightward } = getKeys()
      
      if (!shipRef.current) return
      
      // Handle ship movement
      if (forward) {
        shipRef.current.position.x += Math.sin(shipRef.current.rotation.y) * moveSpeed
        shipRef.current.position.z += Math.cos(shipRef.current.rotation.y) * moveSpeed
      }
      if (backward) {
        shipRef.current.position.x -= Math.sin(shipRef.current.rotation.y) * moveSpeed
        shipRef.current.position.z -= Math.cos(shipRef.current.rotation.y) * moveSpeed
      }
      if (leftward) {
        shipRef.current.rotation.y += turnSpeed
      }
      if (rightward) {
        shipRef.current.rotation.y -= turnSpeed
      }
  })

  return (
      <group ref={shipRef} position={[0, 0, 0]}>
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
