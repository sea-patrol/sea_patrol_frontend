import { useEffect } from 'react';

import { useGameState } from './GameStateContext';
import { useGameWsGameState } from './useGameWsGameState';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useRoomSession } from '@/features/game/model/RoomSessionContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';

export default function GameRealtimeBridge() {
  const { token, user } = useAuth();
  const { subscribe } = useWebSocket();
  const { dispatch } = useGameState();
  const { roomSession } = useRoomSession();

  useGameWsGameState({
    subscribe,
    dispatch,
    currentPlayerName: user?.username ?? null,
    acceptGameMessages: Boolean(roomSession.room),
  });

  useEffect(() => {
    if (!token) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [dispatch, token]);

  return null;
}
