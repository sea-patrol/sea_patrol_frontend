import { useEffect, useState } from 'react';

import { roomApi } from '@/shared/api/roomApi';
import './LobbyPanel.css';

function RoomStatusPill({ status }) {
  return (
    <span className={`lobby-panel__status lobby-panel__status--${String(status).toLowerCase()}`}>
      {status}
    </span>
  );
}

function RoomCard({ room }) {
  return (
    <li className="lobby-panel__room-card">
      <div className="lobby-panel__room-head">
        <div>
          <h3>{room.name}</h3>
          <p>{room.mapName}</p>
        </div>
        <RoomStatusPill status={room.status} />
      </div>
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
    </li>
  );
}

export default function LobbyPanel({ token }) {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!token) {
      setCatalog(null);
      setError('Login required to load rooms.');
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setError(null);

    roomApi.listRooms(token, { signal: controller.signal }).then((result) => {
      if (!isActive || result.error?.type === 'aborted') {
        return;
      }

      if (!result.ok) {
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
  }, [reloadNonce, token]);

  const rooms = catalog?.rooms ?? [];
  const hasRooms = rooms.length > 0;

  return (
    <section className="lobby-panel" aria-label="Lobby room catalog">
      <div className="lobby-panel__hero">
        <div>
          <p className="lobby-panel__eyebrow">Harbor lobby</p>
          <h2>Choose your waters before the first sail.</h2>
          <p className="lobby-panel__lead">
            The frontend now loads the room catalog from backend REST on page open. Live lobby WS updates will attach in the next task.
          </p>
        </div>
        <button type="button" className="lobby-panel__refresh" onClick={() => setReloadNonce((value) => value + 1)}>
          Refresh rooms
        </button>
      </div>

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
          <p>The harbor is calm. Create flow will attach later, but the page already handles the empty catalog cleanly.</p>
        </div>
      )}

      {!isLoading && !error && hasRooms && (
        <ol className="lobby-panel__room-list">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </ol>
      )}
    </section>
  );
}
