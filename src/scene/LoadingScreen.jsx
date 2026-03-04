// src/components/LoadingScreen.jsx
import { Html, useProgress } from '@react-three/drei';
import './LoadingScreen.css';

export function LoadingScreen() {
  const { progress } = useProgress(); // от 0 до 100

  return (
    <Html center>
      <div className="loading-screen">
        Loading... {Math.round(progress)}%
      </div>
    </Html>
  );
}
