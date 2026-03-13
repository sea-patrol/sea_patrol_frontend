import { Leva, useControls } from 'leva';
import { Perf } from 'r3f-perf';

import { useDebugUi } from '@/features/debug/model/DebugUiContext';

const DEFAULT_SUN_POSITION = [500, 150, -1000];
const DEFAULT_TURBIDITY = 0.1;

export default function GameDebugOverlay({ children }) {
  const { isDebugBuild, isDebugUiVisible } = useDebugUi();

  if (!isDebugBuild || !isDebugUiVisible) {
    return children({
      perfNode: null,
      sunPosition: DEFAULT_SUN_POSITION,
      turbidity: DEFAULT_TURBIDITY,
    });
  }

  return <GameDebugOverlayDev>{children}</GameDebugOverlayDev>;
}

function GameDebugOverlayDev({ children }) {
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
