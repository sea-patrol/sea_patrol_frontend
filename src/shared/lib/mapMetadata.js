const KNOWN_MAPS = Object.freeze([
  {
    id: 'caribbean-01',
    name: 'Caribbean Sea',
    region: 'Caribbean',
    previewLabel: 'Tropical Archipelago',
    previewCaption: 'Warm trade winds, island harbors and open blue water.',
    tone: 'tropical',
  },
  {
    id: 'test-sandbox-01',
    name: 'Test Sandbox',
    region: 'Dev Waters',
    previewLabel: 'Debug Sandbox',
    previewCaption: 'Minimal test range for spawn, wind and room bootstrap checks.',
    tone: 'debug',
  },
]);

const KNOWN_MAPS_BY_ID = Object.freeze(Object.fromEntries(KNOWN_MAPS.map((map) => [map.id, map])));

function normalizeMapId(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function listKnownLobbyMaps() {
  return KNOWN_MAPS;
}

export function resolveLobbyMapMetadata(mapLike) {
  const mapId = normalizeMapId(typeof mapLike === 'string' ? mapLike : mapLike?.mapId ?? mapLike?.id);
  const knownMap = mapId ? KNOWN_MAPS_BY_ID[mapId] : null;
  const fallbackMapName = typeof mapLike === 'object' ? mapLike?.mapName ?? mapLike?.name : null;

  return {
    id: mapId ?? 'unknown-map',
    name: knownMap?.name ?? fallbackMapName ?? mapId ?? 'Unknown Waters',
    region: knownMap?.region ?? 'Unknown Region',
    previewLabel: knownMap?.previewLabel ?? 'Uncharted Waters',
    previewCaption: knownMap?.previewCaption ?? 'This room references a map that is not yet described in the lobby metadata registry.',
    tone: knownMap?.tone ?? 'unknown',
    isKnown: Boolean(knownMap),
  };
}
