/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';

const RoomSessionContext = createContext();
const ROOM_SESSION_STORAGE_KEY = 'room-session';

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

function clearStoredRoomSession() {
  localStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
}

function normalizeStoredRoomSession(rawSession) {
  if (!rawSession || typeof rawSession !== 'object') {
    return createInitialRoomSessionState();
  }

  const room = resolveRoomMeta(rawSession.room ?? rawSession.joinResponse, rawSession.room ?? null);
  if (!room?.id) {
    return createInitialRoomSessionState();
  }

  const phase = rawSession.phase === 'active'
    ? 'active'
    : rawSession.spawn
      ? 'spawned'
      : rawSession.joinResponse
        ? 'joined'
        : 'joining';

  return {
    phase,
    room,
    joinResponse: rawSession.joinResponse ?? null,
    spawn: rawSession.spawn ?? null,
  };
}

function restoreStoredRoomSession() {
  const rawSession = localStorage.getItem(ROOM_SESSION_STORAGE_KEY);
  if (!rawSession) {
    return createInitialRoomSessionState();
  }

  try {
    return normalizeStoredRoomSession(JSON.parse(rawSession));
  } catch {
    clearStoredRoomSession();
    return createInitialRoomSessionState();
  }
}

function persistRoomSession(roomSession) {
  if (!roomSession?.room?.id) {
    clearStoredRoomSession();
    return;
  }

  localStorage.setItem(ROOM_SESSION_STORAGE_KEY, JSON.stringify({
    phase: roomSession.phase,
    room: roomSession.room,
    joinResponse: roomSession.joinResponse,
    spawn: roomSession.spawn,
  }));
}

export function RoomSessionProvider({ children }) {
  const { token } = useAuth();
  const [roomSession, setRoomSession] = useState(() => (token ? restoreStoredRoomSession() : createInitialRoomSessionState()));

  useEffect(() => {
    if (!token) {
      clearStoredRoomSession();
      setRoomSession(createInitialRoomSessionState());
      return;
    }

    setRoomSession((prevSession) => {
      if (prevSession.room?.id) {
        return prevSession;
      }

      return restoreStoredRoomSession();
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    persistRoomSession(roomSession);
  }, [roomSession, token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== ROOM_SESSION_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        setRoomSession(createInitialRoomSessionState());
        return;
      }

      try {
        setRoomSession(normalizeStoredRoomSession(JSON.parse(event.newValue)));
      } catch {
        clearStoredRoomSession();
        setRoomSession(createInitialRoomSessionState());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [token]);

  const startRoomJoin = useCallback((room) => {
    setRoomSession({
      phase: 'joining',
      room: room ? { id: room.id, name: room.name ?? room.id } : null,
      joinResponse: null,
      spawn: null,
    });
  }, []);

  const applyRoomJoined = useCallback((payload, fallbackRoom = null) => {
    setRoomSession((prevSession) => ({
      phase: 'joined',
      room: resolveRoomMeta(payload, fallbackRoom ?? prevSession.room),
      joinResponse: payload,
      spawn: prevSession.spawn,
    }));
  }, []);

  const applySpawnAssigned = useCallback((payload, fallbackRoom = null) => {
    setRoomSession((prevSession) => ({
      phase: 'spawned',
      room: resolveRoomMeta(payload, fallbackRoom ?? prevSession.room),
      joinResponse: prevSession.joinResponse,
      spawn: payload,
    }));
  }, []);

  const hydrateRoomEntry = useCallback((roomEntry) => {
    if (!roomEntry) {
      return;
    }

    setRoomSession(normalizeStoredRoomSession({
      phase: roomEntry.phase,
      room: roomEntry.room,
      joinResponse: roomEntry.joinResponse,
      spawn: roomEntry.spawn,
    }));
  }, []);

  const markRoomActive = useCallback(() => {
    setRoomSession((prevSession) => ({
      ...prevSession,
      phase: prevSession.room ? 'active' : prevSession.phase,
    }));
  }, []);

  const clearRoomSession = useCallback(() => {
    clearStoredRoomSession();
    setRoomSession(createInitialRoomSessionState());
  }, []);

  const value = useMemo(() => ({
    roomSession,
    startRoomJoin,
    applyRoomJoined,
    applySpawnAssigned,
    hydrateRoomEntry,
    markRoomActive,
    clearRoomSession,
  }), [
    applyRoomJoined,
    applySpawnAssigned,
    clearRoomSession,
    hydrateRoomEntry,
    markRoomActive,
    roomSession,
    startRoomJoin,
  ]);

  return <RoomSessionContext.Provider value={value}>{children}</RoomSessionContext.Provider>;
}

export function useRoomSession() {
  const context = useContext(RoomSessionContext);
  if (!context) {
    throw new Error('useRoomSession must be used within a RoomSessionProvider');
  }
  return context;
}
