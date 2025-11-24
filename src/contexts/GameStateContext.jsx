// GameStateContext.js
import { createContext, useContext, useRef } from 'react';

// Создаем контекст
const GameStateContext = createContext();

// Провайдер для gameState
export function GameStateProvider({ children }) {
  // Глобальное состояние игры
  const gameState = useRef({
    playerStates: {}, // Здесь хранятся данные о всех игроках
  });

  return (
    <GameStateContext.Provider value={gameState}>
      {children}
    </GameStateContext.Provider>
  );
}

// Хук для использования gameState
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}