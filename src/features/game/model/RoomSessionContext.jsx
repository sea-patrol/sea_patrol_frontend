/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';

const RoomSessionContext = createContext();

function resolveRoomMeta(payload, fallbackRoom = null) {
  const roomId = payload?.roomId ?? payload?.id ?? fallbackRoom?.id ?? null;
  if (!roomId) {
    return fallbackRoom;
  }

  return {
    id: roomId,
    name: fallbackRoom?.name ?? payload?.name ?? payload?.roomName ?? roomId,
  };
}

function createInitialRoomSessionState() {
  return {
    phase: 'idle',
    room: null,
    joinResponse: null,
    spawn: null,
  };
}

export function RoomSessionProvider({ children }) {
  const { token } = useAuth();
  const [roomSession, setRoomSession] = useState(createInitialRoomSessionState);

  useEffect(() => {
    if (!token) {
      setRoomSession(createInitialRoomSessionState());
    }
  }, [token]);

  const value = useMemo(() => ({
    roomSession,
    startRoomJoin: (room) => {
      setRoomSession({
        phase: 'joining',
        room: room ? { id: room.id, name: room.name ?? room.id } : null,
        joinResponse: null,
        spawn: null,
      });
    },
    applyRoomJoined: (payload, fallbackRoom = null) => {
      setRoomSession((prevSession) => ({
        phase: 'joined',
        room: resolveRoomMeta(payload, fallbackRoom ?? prevSession.room),
        joinResponse: payload,
        spawn: prevSession.spawn,
      }));
    },
    applySpawnAssigned: (payload, fallbackRoom = null) => {
      setRoomSession((prevSession) => ({
        phase: 'spawned',
        room: resolveRoomMeta(payload, fallbackRoom ?? prevSession.room),
        joinResponse: prevSession.joinResponse,
        spawn: payload,
      }));
    },
    hydrateRoomEntry: (roomEntry) => {
      if (!roomEntry) {
        return;
      }

      setRoomSession({
        phase: roomEntry.spawn ? 'spawned' : roomEntry.joinResponse ? 'joined' : 'joining',
        room: resolveRoomMeta(roomEntry.room ?? roomEntry.joinResponse, roomEntry.room ?? null),
        joinResponse: roomEntry.joinResponse ?? null,
        spawn: roomEntry.spawn ?? null,
      });
    },
    markRoomActive: () => {
      setRoomSession((prevSession) => ({
        ...prevSession,
        phase: prevSession.room ? 'active' : prevSession.phase,
      }));
    },
    clearRoomSession: () => {
      setRoomSession(createInitialRoomSessionState());
    },
  }), [roomSession]);

  return <RoomSessionContext.Provider value={value}>{children}</RoomSessionContext.Provider>;
}

export function useRoomSession() {
  const context = useContext(RoomSessionContext);
  if (!context) {
    throw new Error('useRoomSession must be used within a RoomSessionProvider');
  }
  return context;
}
