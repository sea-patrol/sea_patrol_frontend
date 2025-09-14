import * as THREE from 'three'
import { useMemo } from 'react'
import { Text } from '@react-three/drei'

const boxGeometry = new THREE.BoxGeometry(2, 2, 2)
const xMaterial = new THREE.MeshStandardMaterial({ color: 'red' })
const zMaterial = new THREE.MeshStandardMaterial({ color: 'blue' })
const xTextMaterial = new THREE.MeshStandardMaterial({ color: 'red' })
const zTextMaterial = new THREE.MeshStandardMaterial({ color: 'blue' })

export function Bouys({ count = 5, step = 50 }) {
    const buoys = useMemo(() =>
    {
        const buoys = []

        for (let i = -count; i <= count; i++) {
            if (i !== 0) {
                const postition = i * step
                buoys.push(<Buoy key={`x-${i}`}  position={ [postition, 0, 0] } material={ xMaterial } text={ postition } textMaterial={xTextMaterial} />)
                buoys.push(<Buoy key={`z-${i}`}  position={ [0, 0, postition] } material={ zMaterial } text={ postition } textMaterial={zTextMaterial} />)
            }
        }
        return buoys
    }, [ count ])

    return <>
        { buoys }
    </>
}

export function Buoy({ position = [0, 0, 0], geometry = boxGeometry, material = xMaterial, text = '0', textMaterial = xTextMaterial}) {
    return (
        <group position={position}>
                <Text
                    position={[0, 3, 0]}
                    fontSize={2}
                    anchorX="center"
                    anchorY="middle"
                    material={textMaterial}
                    material-side={THREE.DoubleSide}>
                {text}
                </Text>
            <mesh geometry={ geometry } material={ material } />
        </group>
    )
}