import { useGLTF } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

export default function MainSailShip() {
  const { nodes, materials } = useGLTF('./sailship.glb')
  const { gl } = useThree()

  const force = 10
  const turnForceValue = 5

  const [ smoothedCameraPosition ] = useState(() => new THREE.Vector3(20, 50, 50))
  const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3())
  // Camera rotation state for mouse control
  const [cameraAngleY, setCameraAngleY] = useState(0) // yaw
  const [cameraAngleX, setCameraAngleX] = useState(0) // pitch
  const [cameraDistance, setCameraDistance] = useState(45.25)
  
  // Mouse state
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [lastMouseX, setLastMouseX] = useState(0)
  const [lastMouseY, setLastMouseY] = useState(0)


  const [ subscribeKeys, getKeys ] = useKeyboardControls()

  const shipRef = useRef()

  // Mouse event handlers
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (event.button === 0) { // Left mouse button
        setIsMouseDown(true)
        setLastMouseX(event.clientX)
        setLastMouseY(event.clientY)
        gl.domElement.style.cursor = 'grabbing'
      }
    }

    const handleMouseUp = (event) => {
      if (event.button === 0) { // Left mouse button
        setIsMouseDown(false)
        gl.domElement.style.cursor = 'grab'
      }
    }

    const handleMouseMove = (event) => {
      if (isMouseDown) {
        const deltaX = event.clientX - lastMouseX
        const deltaY = event.clientY - lastMouseY
        
        // Update camera angles based on mouse movement
        setCameraAngleY(prev => prev - deltaX * 0.005) // Horizontal movement affects yaw
        setCameraAngleX(prev => {
          const newAngle = prev + deltaY * 0.005 // Vertical movement affects pitch
          // Limit pitch to prevent camera flipping
          return Math.max(-Math.PI/3, Math.min(Math.PI/3, newAngle))
        })
        
        setLastMouseX(event.clientX)
        setLastMouseY(event.clientY)
      }
    }

    const handleWheel = (event) => {
      event.preventDefault()
      setCameraDistance(prev => {
        const newDistance = prev + event.deltaY * 0.01
        // Limit zoom distance
        return Math.max(5, Math.min(100, newDistance))
      })
    }

    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel)
    canvas.style.cursor = 'grab'

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.style.cursor = 'default'
    }
  }, [gl.domElement, isMouseDown, lastMouseX, lastMouseY])

  useFrame((state, delta) =>
  {
      const { forward, backward, leftward, rightward } = getKeys()
      
      if (!shipRef.current) return
      
      // Get ship's current rotation
      const rotation = shipRef.current.rotation()
      const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      // Get ship's cuurent position
      const position = shipRef.current.translation()
      // Calculate camera position using spherical coordinates
      const cameraPosition = new THREE.Vector3()
      cameraPosition.x = position.x + cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX)
      cameraPosition.y = position.y + cameraDistance * Math.sin(cameraAngleX) + 18.65
      // Ensure camera Y position is never less than 1
      cameraPosition.y = Math.max(1, cameraPosition.y)
      cameraPosition.z = position.z + cameraDistance * Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
      
      const cameraTarget = new THREE.Vector3()
      cameraTarget.copy(position)
      cameraTarget.y += 0.25 // Slight vertical offset for better framing
      
      smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
      smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

      state.camera.position.copy(smoothedCameraPosition)
      state.camera.lookAt(smoothedCameraTarget)
      
      // Create forward direction vector (local Z-axis)
      const forwardDirection = new THREE.Vector3(0, 0, 1)
      forwardDirection.applyQuaternion(quaternion)
      const turnForce = forwardDirection.clone().multiplyScalar(turnForceValue)
      
      if (forward)
      {
          const forwardForce = forwardDirection.clone().multiplyScalar(force)
          shipRef.current.applyImpulse(forwardForce, true)
      }
      if (backward)
      {
          const backwardForce = forwardDirection.clone().multiplyScalar(-force)
          shipRef.current.applyImpulse(backwardForce, true)
      }
      if (leftward)
      {   
          shipRef.current.applyImpulse(turnForce, true)
          shipRef.current.applyTorqueImpulse({ x: 0, y: force, z: 0 }, true)
      }

      if (rightward)
      {
          shipRef.current.applyImpulse(turnForce, true)
          shipRef.current.applyTorqueImpulse({ x: 0, y: -force, z: 0 }, true)
      }
  })

  return (
      <RigidBody 
        ref={shipRef} 
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