import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../features/auth/model/AuthContext';
import GamePage from '../pages/GamePage';
import HomePage from '../pages/HomePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
