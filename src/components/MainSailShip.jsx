import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { modelUrls } from '../utils/models';
import * as THREE from 'three'

export default function MainSailShip() {
  const { nodes, materials } = useGLTF(modelUrls.sail_ship)
  const { gl } = useThree()

  const moveSpeed = 0.5
  const turnSpeed = 0.05

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
      
      // Get ship's current rotation
      const rotation = shipRef.current.rotation
      // Get ship's current position
      const position = shipRef.current.position
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
