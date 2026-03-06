import { GameStateProvider } from '../../features/game/model/GameStateContext';
import { WebSocketProvider } from '../../features/realtime/model/WebSocketContext';
import { GameUiProvider } from '../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../features/ui-shell/ui/GameUiShell';
import GameMainScene from '../../scene/GameMainScene';
import './GamePage.css';

function GamePage() {
  return (
    <div className="game-page">
      <WebSocketProvider>
        <GameStateProvider>
          <GameUiProvider>
            <div className="game-page__viewport">
              <GameMainScene />
              <GameUiShell />
            </div>
          </GameUiProvider>
        </GameStateProvider>
      </WebSocketProvider>
    </div>
  );
}

export default GamePage;
