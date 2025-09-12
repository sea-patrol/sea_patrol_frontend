
export default function Bouy({ position }) {
    return (
        <mesh position={position}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="brown" />
        </mesh>
    )
}