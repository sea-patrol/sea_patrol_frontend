import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

export default function SailShip() {
  const { nodes, materials } = useGLTF('./sailship.glb')

  const force = 10

  const [ subscribeKeys, getKeys ] = useKeyboardControls()

  const ship = useRef()

  useFrame(() =>
  {
      const { forward, backward, leftward, rightward } = getKeys()
      
      if (!ship.current) return
      
      // Get ship's current rotation
      const rotation = ship.current.rotation()
      const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      
      // Create forward direction vector (local Z-axis)
      const forwardDirection = new THREE.Vector3(0, 0, 1)
      forwardDirection.applyQuaternion(quaternion)
      
      if (forward)
      {
          const forwardForce = forwardDirection.clone().multiplyScalar(force)
          ship.current.applyImpulse(forwardForce, true)
      }
      if (backward)
      {
          const backwardForce = forwardDirection.clone().multiplyScalar(-force)
          ship.current.applyImpulse(backwardForce, true)
      }
      if (leftward)
      {
          ship.current.applyTorqueImpulse({ x: 0, y: force, z: 0 }, true)
      }

      if (rightward)
      {
          ship.current.applyTorqueImpulse({ x: 0, y: -force, z: 0 }, true)
      }
  })

  return (
    <RigidBody 
      ref={ship} 
      type="dynamic" 
      colliders={false} 
      position={[0, 0, 0]} 
      restitution={0.2} 
      friction={0.1}
      mass={1}
      linearDamping={0.5}
      angularDamping={0.9}
    >
      <group position={ [ 0, -0.2, 0 ] } dispose={null}>
        <mesh
          name="Hull"
          castShadow
          receiveShadow
          geometry={nodes.Hull.geometry}
          material={materials.Ship}
          userData={{ name: 'Hull' }}
        />
        <mesh
          name="Capitan_cabin"
          castShadow
          receiveShadow
          geometry={nodes.Capitan_cabin.geometry}
          material={materials.Ship}
          userData={{ name: 'Capitan_cabin' }}
        />
        <mesh
          name="Main_mast"
          castShadow
          receiveShadow
          geometry={nodes.Main_mast.geometry}
          material={materials.Ship}
          userData={{ name: 'Main_mast' }}
        />
        <mesh
          name="Bow_sprit"
          castShadow
          receiveShadow
          geometry={nodes.Bow_sprit.geometry}
          material={materials.Ship}
          rotation={[1.281, 0, 0]}
          userData={{ name: 'Bow_sprit' }}
        />
        <mesh
          name="Main_boom"
          castShadow
          receiveShadow
          geometry={nodes.Main_boom.geometry}
          material={materials.Ship}
          rotation={[Math.PI / 2, 0, 0.26]}
          userData={{ name: 'Main_boom' }}
        />
        <mesh
          name="Main_sail"
          castShadow
          receiveShadow
          geometry={nodes.Main_sail.geometry}
          material={materials['Material.001']}
          rotation={[Math.PI / 2, 0, 0.26]}
          userData={{ name: 'Main_sail' }}
        />
      </group>
      <CuboidCollider args={ [ 2, 2.5, 5.5 ] } />
    </RigidBody> 
  )
}

useGLTF.preload('./sailship.glb')