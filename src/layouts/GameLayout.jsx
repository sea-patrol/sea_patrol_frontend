import { WebSocketProvider, GameStateProvider } from '../contexts';

export function GameLayout({ children }) {
  return (
    <WebSocketProvider>
      <GameStateProvider>
        {children}
      </GameStateProvider>
    </WebSocketProvider>
  );
}
