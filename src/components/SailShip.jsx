import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'

export default function SailShip() {
  const { nodes, materials } = useGLTF('./sailship.glb')
  return (
    <RigidBody colliders = {false} position={ [ 0, 1, 0 ] }>
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