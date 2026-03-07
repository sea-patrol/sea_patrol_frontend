import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../features/auth/model/AuthContext';
import GameRealtimeBridge from '../features/game/model/GameRealtimeBridge';
import { GameStateProvider } from '../features/game/model/GameStateContext';
import { RoomSessionProvider } from '../features/game/model/RoomSessionContext';
import { WebSocketProvider } from '../features/realtime/model/WebSocketContext';
import GamePage from '../pages/GamePage';
import HomePage from '../pages/HomePage';
import LobbyPage from '../pages/LobbyPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <WebSocketProvider>
          <GameStateProvider>
            <RoomSessionProvider>
              <GameRealtimeBridge />
              <div className="app">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/lobby" element={<LobbyPage />} />
                  <Route path="/game" element={<GamePage />} />
                </Routes>
              </div>
            </RoomSessionProvider>
          </GameStateProvider>
        </WebSocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
