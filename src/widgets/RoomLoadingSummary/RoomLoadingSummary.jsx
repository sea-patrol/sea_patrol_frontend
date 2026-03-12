import { resolveLobbyMapMetadata } from '@/shared/lib/mapMetadata';

import './RoomLoadingSummary.css';

function formatNumber(value) {
  return typeof value === 'number' ? value.toFixed(2) : '—';
}

export default function RoomLoadingSummary({
  title,
  body,
  room = null,
  joinResponse = null,
  spawn = null,
  stageLabel = 'Room loading',
  eyebrow = 'Room loading',
}) {
  const roomId = room?.id ?? joinResponse?.roomId ?? 'unknown-room';
  const roomName = room?.name ?? joinResponse?.roomName ?? joinResponse?.name ?? roomId;
  const mapMeta = resolveLobbyMapMetadata({
    mapId: joinResponse?.mapId ?? room?.mapId ?? null,
    mapName: joinResponse?.mapName ?? room?.mapName ?? null,
  });
  const hasCaptainSlots = typeof joinResponse?.currentPlayers === 'number' && typeof joinResponse?.maxPlayers === 'number';
  const hasSpawn = typeof spawn?.x === 'number' && typeof spawn?.z === 'number' && typeof spawn?.angle === 'number';

  return (
    <section className="room-loading-summary" aria-label="Room loading summary">
      <div className="room-loading-summary__copy">
        <p className="room-loading-summary__eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>

      <div className={`room-loading-summary__chart room-loading-summary__chart--${mapMeta.tone}`}>
        <span>{mapMeta.region}</span>
        <strong>{mapMeta.name}</strong>
        <p>{mapMeta.previewLabel}</p>
        <small>{mapMeta.previewCaption}</small>
      </div>

      <dl className="room-loading-summary__meta">
        <div>
          <dt>Room</dt>
          <dd>{roomName}</dd>
        </div>
        <div>
          <dt>Room ID</dt>
          <dd>{roomId}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{stageLabel}</dd>
        </div>
        <div>
          <dt>Map</dt>
          <dd>{mapMeta.name}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{mapMeta.region}</dd>
        </div>
        <div>
          <dt>Map ID</dt>
          <dd>{joinResponse?.mapId ?? room?.mapId ?? mapMeta.id}</dd>
        </div>
        {joinResponse?.status && (
          <div>
            <dt>Server status</dt>
            <dd>{joinResponse.status}</dd>
          </div>
        )}
        {hasCaptainSlots && (
          <div>
            <dt>Captain slots</dt>
            <dd>{joinResponse.currentPlayers}/{joinResponse.maxPlayers}</dd>
          </div>
        )}
        {spawn?.reason && (
          <div>
            <dt>Spawn signal</dt>
            <dd>{spawn.reason}</dd>
          </div>
        )}
        {hasSpawn && (
          <div className="room-loading-summary__meta-row--wide">
            <dt>Spawn coordinates</dt>
            <dd>{`x=${formatNumber(spawn.x)}, z=${formatNumber(spawn.z)}, angle=${formatNumber(spawn.angle)}`}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
