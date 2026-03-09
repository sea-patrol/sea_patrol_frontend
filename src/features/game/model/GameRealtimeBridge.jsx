import { useEffect } from 'react';

import { useGameState } from './GameStateContext';
import { useGameWsGameState } from './useGameWsGameState';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';


export default function GameRealtimeBridge() {
  const { token } = useAuth();
  const { subscribe } = useWebSocket();
  const { dispatch } = useGameState();

  useGameWsGameState({ subscribe, dispatch });

  useEffect(() => {
    if (!token) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [dispatch, token]);

  return null;
}
