// src/components/LoadingScreen.jsx
import { Html, useProgress } from '@react-three/drei';

export function LoadingScreen() {
  const { progress } = useProgress(); // от 0 до 100

  return (
    <Html center>
      <div style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '18px',
        fontFamily: 'monospace'
      }}>
        Loading... {Math.round(progress)}%
      </div>
    </Html>
  );
}