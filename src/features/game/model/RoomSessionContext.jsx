/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';

const RoomSessionContext = createContext();
const ROOM_SESSION_STORAGE_PREFIX = 'room-session:';

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

function getRoomSessionStorageKey(username) {
  if (typeof username !== 'string' || !username.trim()) {
    return null;
  }

  return `${ROOM_SESSION_STORAGE_PREFIX}${username.trim()}`;
}

function clearStoredRoomSession(storageKey) {
  if (!storageKey) {
    return;
  }

  localStorage.removeItem(storageKey);
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

function restoreStoredRoomSession(storageKey) {
  if (!storageKey) {
    return createInitialRoomSessionState();
  }

  const rawSession = localStorage.getItem(storageKey);
  if (!rawSession) {
    return createInitialRoomSessionState();
  }

  try {
    return normalizeStoredRoomSession(JSON.parse(rawSession));
  } catch {
    clearStoredRoomSession(storageKey);
    return createInitialRoomSessionState();
  }
}

function persistRoomSession(storageKey, roomSession) {
  if (!storageKey || !roomSession?.room?.id) {
    clearStoredRoomSession(storageKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify({
    phase: roomSession.phase,
    room: roomSession.room,
    joinResponse: roomSession.joinResponse,
    spawn: roomSession.spawn,
  }));
}

export function RoomSessionProvider({ children }) {
  const { token, user } = useAuth();
  const storageKey = getRoomSessionStorageKey(user?.username);
  const storageKeyRef = useRef(storageKey);
  const suppressNextPersistRef = useRef(false);
  const [roomSession, setRoomSession] = useState(() => (
    token && storageKey ? restoreStoredRoomSession(storageKey) : createInitialRoomSessionState()
  ));

  useEffect(() => {
    const previousStorageKey = storageKeyRef.current;
    storageKeyRef.current = storageKey;

    if (!token) {
      suppressNextPersistRef.current = true;
      setRoomSession(createInitialRoomSessionState());
      return;
    }

    if (!storageKey) {
      setRoomSession(createInitialRoomSessionState());
      return;
    }

    setRoomSession((prevSession) => {
      if (prevSession.room?.id) {
        return prevSession;
      }

      return restoreStoredRoomSession(storageKey);
    });
  }, [storageKey, token]);

  useEffect(() => {
    if (!token || !storageKey) {
      return;
    }

    if (suppressNextPersistRef.current) {
      suppressNextPersistRef.current = false;
      return;
    }

    persistRoomSession(storageKey, roomSession);
  }, [roomSession, storageKey, token]);

  useEffect(() => {
    if (!token || !storageKey) {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== storageKey) {
        return;
      }

      if (!event.newValue) {
        setRoomSession(createInitialRoomSessionState());
        return;
      }

      try {
        setRoomSession(normalizeStoredRoomSession(JSON.parse(event.newValue)));
      } catch {
        clearStoredRoomSession(storageKey);
        setRoomSession(createInitialRoomSessionState());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [storageKey, token]);

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
    clearStoredRoomSession(storageKeyRef.current);
    setRoomSession(createInitialRoomSessionState());
  }, []);

  const resetRoomSession = useCallback(() => {
    suppressNextPersistRef.current = true;
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
    resetRoomSession,
  }), [
    applyRoomJoined,
    applySpawnAssigned,
    clearRoomSession,
    hydrateRoomEntry,
    markRoomActive,
    resetRoomSession,
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
