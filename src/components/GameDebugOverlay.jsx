import { Leva, useControls } from 'leva';
import { Perf } from 'r3f-perf';

export default function GameDebugOverlay({ children }) {
  const { perfVisible } = useControls('Monitoring', {
    perfVisible: true,
  });

  useControls('PhysicsDebug', {
    physicsDebug: false,
  });

  const { sunX, sunY, sunZ, turbidity } = useControls('Солнце', {
    sunX: { value: 500, min: -1500, max: 1500, step: 10 },
    sunY: { value: 150, min: -1000, max: 1000, step: 10 },
    sunZ: { value: -1000, min: -1000, max: 1000, step: 10 },
    turbidity: { value: 0.1, min: 0, max: 20, step: 0.1 },
  });

  const perfNode = perfVisible ? <Perf position="top-left" /> : null;

  return (
    <>
      <Leva />
      {children({
        perfNode,
        sunPosition: [sunX, sunY, sunZ],
        turbidity,
      })}
    </>
  );
}

