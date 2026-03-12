import { useEffect, useRef, useState } from 'react';

import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import { roomApi } from '@/shared/api/roomApi';
import * as messageType from '@/shared/constants/messageType';
import { listKnownLobbyMaps, resolveLobbyMapMetadata } from '@/shared/lib/mapMetadata';
import './LobbyPanel.css';

const DEFAULT_MAP_ID = 'caribbean-01';
const CUSTOM_MAP_OPTION = '__custom__';
const KNOWN_MAP_OPTIONS = listKnownLobbyMaps();

function RoomStatusPill({ status }) {
  return (
    <span className={`lobby-panel__status lobby-panel__status--${String(status).toLowerCase()}`}>
      {status}
    </span>
  );
}

function MapPreviewCard({ mapMeta, eyebrow = 'Sea chart', compact = false }) {
  return (
    <section className={`lobby-panel__map-preview lobby-panel__map-preview--${mapMeta.tone}${compact ? ' lobby-panel__map-preview--compact' : ''}`}>
      <p className="lobby-panel__eyebrow">{eyebrow}</p>
      <strong>{mapMeta.name}</strong>
      <span>{mapMeta.region}</span>
      <p>{mapMeta.previewLabel}</p>
      {!compact && <small>{mapMeta.previewCaption}</small>}
    </section>
  );
}

function RoomCard({ room, joiningRoomId, onJoinRoom }) {
  const mapMeta = resolveLobbyMapMetadata(room);
  const isJoinSupported = typeof onJoinRoom === 'function';
  const isJoiningThisRoom = joiningRoomId === room.id;
  const isJoinBusy = Boolean(joiningRoomId);
  const isJoinDisabled = !isJoinSupported || room.status !== 'OPEN' || isJoinBusy;
  const joinLabel = isJoiningThisRoom ? 'Joining...' : room.status === 'OPEN' ? 'Join room' : 'Room full';

  return (
    <li className="lobby-panel__room-card">
      <div className="lobby-panel__room-head">
        <div>
          <h3>{room.name}</h3>
          <p>{mapMeta.name}</p>
          <span className="lobby-panel__room-region">{mapMeta.region}</span>
        </div>
        <RoomStatusPill status={room.status} />
      </div>
      <MapPreviewCard mapMeta={mapMeta} eyebrow="Chart preview" compact />
      <dl className="lobby-panel__room-meta">
        <div>
          <dt>Captain slots</dt>
          <dd>
            {room.currentPlayers}/{room.maxPlayers}
          </dd>
        </div>
        <div>
          <dt>Map ID</dt>
          <dd>{room.mapId}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="lobby-panel__join-button"
        onClick={() => onJoinRoom?.(room)}
        disabled={isJoinDisabled}
      >
        {joinLabel}
      </button>
    </li>
  );
}

function formatRealtimeStatus({ hasToken, isConnected, lastClose }) {
  if (!hasToken) {
    return {
      tone: 'idle',
      title: 'Lobby realtime inactive',
      body: 'Log in to activate the lobby WebSocket for chat and live room updates.',
      closeInfo: null,
    };
  }

  if (isConnected) {
    return {
      tone: 'online',
      title: 'Lobby realtime online',
      body: 'Chat and room snapshots now stream through the lobby WebSocket without waiting for manual refresh.',
      closeInfo: null,
    };
  }

  return {
    tone: 'offline',
    title: 'Lobby realtime reconnecting',
    body: 'Live room updates are temporarily unavailable. The lobby will resubscribe after reconnect, and manual refresh still works.',
    closeInfo: lastClose?.code === undefined ? null : `${String(lastClose.code)}${lastClose.reason ? `, ${lastClose.reason}` : ''}`,
  };
}

function upsertRoomSummary(catalog, roomSummary) {
  if (!catalog || !roomSummary?.id) {
    return catalog;
  }

  const dedupedRooms = [
    ...catalog.rooms.filter((room) => room.id !== roomSummary.id),
    roomSummary,
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    ...catalog,
    rooms: dedupedRooms,
  };
}

export default function LobbyPanel({ token, onJoinRoom, joiningRoomId = null, joinError = null, onUnauthorized = null }) {
  const { hasToken, isConnected, lastClose, subscribe } = useWebSocket();
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [roomName, setRoomName] = useState('');
  const [selectedMapOption, setSelectedMapOption] = useState(DEFAULT_MAP_ID);
  const [customMapId, setCustomMapId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState(null);
  const liveCatalogVersionRef = useRef(0);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const applyLiveCatalog = (payload) => {
      if (!payload || !Array.isArray(payload.rooms)) {
        return;
      }

      liveCatalogVersionRef.current += 1;
      setCatalog(payload);
      setError(null);
      setIsLoading(false);
    };

    const unsubscribeSnapshot = subscribe(messageType.ROOMS_SNAPSHOT, applyLiveCatalog);
    const unsubscribeUpdated = subscribe(messageType.ROOMS_UPDATED, applyLiveCatalog);

    return () => {
      unsubscribeSnapshot();
      unsubscribeUpdated();
    };
  }, [subscribe, token]);

  useEffect(() => {
    if (!token) {
      setCatalog(null);
      setError('Login required to load rooms.');
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;
    const liveCatalogVersionAtRequestStart = liveCatalogVersionRef.current;

    setIsLoading(true);
    setError(null);

    roomApi.listRooms(token, { signal: controller.signal }).then((result) => {
      if (!isActive || result.error?.type === 'aborted') {
        return;
      }

      if (liveCatalogVersionRef.current !== liveCatalogVersionAtRequestStart) {
        return;
      }

      if (!result.ok) {
        if (result.error?.status === 401) {
          onUnauthorized?.();
          return;
        }

        setCatalog(null);
        setError(result.error?.message || 'Failed to load rooms.');
        setIsLoading(false);
        return;
      }

      setCatalog(result.data);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [onUnauthorized, reloadNonce, token]);

  const selectedMapId = selectedMapOption === CUSTOM_MAP_OPTION
    ? customMapId.trim()
    : selectedMapOption;
  const selectedMapMeta = resolveLobbyMapMetadata({
    mapId: selectedMapId || selectedMapOption,
  });

  const handleCreateRoom = async (event) => {
    event.preventDefault();

    if (!token) {
      setCreateError('Login required to create a room.');
      return;
    }

    const draft = {};
    const trimmedName = roomName.trim();
    if (trimmedName) {
      draft.name = trimmedName;
    }

    if (selectedMapOption === CUSTOM_MAP_OPTION) {
      const trimmedMapId = customMapId.trim();
      if (!trimmedMapId) {
        setCreateError('Custom mapId is required when custom map mode is selected.');
        return;
      }

      draft.mapId = trimmedMapId;
    } else {
      draft.mapId = selectedMapOption;
    }

    setIsCreatingRoom(true);
    setCreateError(null);

    const result = await roomApi.createRoom(token, draft);
    if (!result.ok) {
      if (result.error?.status === 401) {
        setIsCreatingRoom(false);
        onUnauthorized?.();
        return;
      }

      setCreateError(result.error?.message || 'Failed to create room.');
      setIsCreatingRoom(false);
      return;
    }

    setCatalog((prevCatalog) => upsertRoomSummary(prevCatalog, result.data));
    setRoomName('');
    setSelectedMapOption(DEFAULT_MAP_ID);
    setCustomMapId('');
    setCreateError(null);
    setIsCreatingRoom(false);

    if (!isConnected) {
      setReloadNonce((value) => value + 1);
    }
  };

  const realtimeStatus = formatRealtimeStatus({ hasToken, isConnected, lastClose });
  const rooms = catalog?.rooms ?? [];
  const hasRooms = rooms.length > 0;

  return (
    <section className="lobby-panel" aria-label="Lobby room catalog">
      <div className="lobby-panel__hero">
        <div>
          <p className="lobby-panel__eyebrow">Harbor lobby</p>
          <h2>Choose your waters before the first sail.</h2>
          <p className="lobby-panel__lead">
            The lobby now starts with a REST snapshot and stays current through lobby WebSocket updates while you remain outside a game room.
          </p>
        </div>
        <button
          type="button"
          className="lobby-panel__refresh"
          onClick={() => setReloadNonce((value) => value + 1)}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh rooms'}
        </button>
      </div>

      <div className={`lobby-panel__live-status lobby-panel__live-status--${realtimeStatus.tone}`} aria-live="polite">
        <div>
          <strong>{realtimeStatus.title}</strong>
          <p>{realtimeStatus.body}</p>
        </div>
        {realtimeStatus.closeInfo && <span className="lobby-panel__close-info">Last close: {realtimeStatus.closeInfo}</span>}
      </div>

      <form className="lobby-panel__create-form" onSubmit={handleCreateRoom}>
        <div className="lobby-panel__create-head">
          <div>
            <p className="lobby-panel__eyebrow">Open a room</p>
            <h3>Create a harbor room</h3>
          </div>
          <button type="submit" className="lobby-panel__create-button" disabled={isCreatingRoom}>
            {isCreatingRoom ? 'Creating...' : 'Create room'}
          </button>
        </div>

        <div className="lobby-panel__create-grid">
          <label>
            <span>Room name</span>
            <input
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Optional. Backend will generate Sandbox N if empty."
            />
          </label>

          <label>
            <span>Map</span>
            <select value={selectedMapOption} onChange={(event) => setSelectedMapOption(event.target.value)}>
              {KNOWN_MAP_OPTIONS.map((map) => (
                <option key={map.id} value={map.id}>{`${map.name} (${map.id})`}</option>
              ))}
              <option value={CUSTOM_MAP_OPTION}>Custom mapId</option>
            </select>
          </label>

          {selectedMapOption === CUSTOM_MAP_OPTION && (
            <label className="lobby-panel__create-grid--wide">
              <span>Custom mapId</span>
              <input
                type="text"
                value={customMapId}
                onChange={(event) => setCustomMapId(event.target.value)}
                placeholder="Example: caribbean-01"
              />
            </label>
          )}

          <div className="lobby-panel__create-grid--wide">
            <MapPreviewCard mapMeta={selectedMapMeta} eyebrow="Selected chart" />
          </div>
        </div>

        <p className="lobby-panel__create-note">
          Known lobby maps are described locally so the player can see the region and chart context before room creation. Unknown custom ids still go through backend validation.
        </p>

        {createError && (
          <div className="lobby-panel__create-error" role="alert">
            <strong>Room creation failed</strong>
            <p>{createError}</p>
          </div>
        )}
      </form>

      <div className="lobby-panel__summary" aria-live="polite">
        <div>
          <span>Rooms in harbor</span>
          <strong>{rooms.length}</strong>
        </div>
        <div>
          <span>Room limit</span>
          <strong>{catalog?.maxRooms ?? '—'}</strong>
        </div>
        <div>
          <span>Max captains per room</span>
          <strong>{catalog?.maxPlayersPerRoom ?? '—'}</strong>
        </div>
      </div>

      {joinError && !isLoading && !error && (
        <div className="lobby-panel__join-error" role="alert">
          <strong>Room join failed</strong>
          <p>{joinError}</p>
        </div>
      )}

      {isLoading && (
        <div className="lobby-panel__state" role="status" aria-live="polite">
          <h3>Loading room catalog</h3>
          <p>Requesting the latest harbor snapshot from backend.</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="lobby-panel__state lobby-panel__state--error" role="alert">
          <h3>Unable to load rooms</h3>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && !hasRooms && (
        <div className="lobby-panel__state">
          <h3>No rooms yet</h3>
          <p>The harbor is calm. Use the create form above, and live lobby updates will keep the catalog current.</p>
        </div>
      )}

      {!isLoading && !error && hasRooms && (
        <ol className="lobby-panel__room-list">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} joiningRoomId={joiningRoomId} onJoinRoom={onJoinRoom} />
          ))}
        </ol>
      )}
    </section>
  );
}
