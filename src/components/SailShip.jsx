import { useGLTF } from '@react-three/drei'

export default function SailShip(props) {
  const ship = useGLTF('./sailship.glb')
  return <primitive object={ ship.scene } {...props} />
}

useGLTF.preload('./sailship.glb')