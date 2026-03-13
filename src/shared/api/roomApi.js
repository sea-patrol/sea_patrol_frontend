const DEFAULT_BACKEND_HOSTNAME = 'localhost';
const DEFAULT_BACKEND_PORT = 8080;

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const getDefaultApiBaseUrl = () => {
  const location = typeof window !== 'undefined' ? window.location : undefined;
  const protocol = location?.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = location?.hostname || DEFAULT_BACKEND_HOSTNAME;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

const API_BASE_URL = trimTrailingSlashes(import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl());
const ROOMS_API_BASE_URL = `${API_BASE_URL}/api/v1/rooms`;

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractHttpError = (status, data) => {
  const firstError = Array.isArray(data?.errors) ? data.errors[0] : null;
  const message = firstError?.message || data?.message || 'Request failed';
  const code = firstError?.code;

  return {
    type: 'http',
    status,
    message,
    code,
    data,
  };
};

const executeAuthorizedJsonRequest = async (url, { method, token, signal, body }) => {
  if (!token) {
    return {
      ok: false,
      error: {
        type: 'auth',
        message: 'Authorization token is required',
      },
    };
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        error: {
          type: 'aborted',
          message: 'Request was aborted',
        },
      };
    }

    return {
      ok: false,
      error: {
        type: 'network',
        message: 'Network error occurred',
        cause: error,
      },
    };
  }

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    return {
      ok: false,
      error: extractHttpError(response.status, data),
    };
  }

  return { ok: true, data };
};

export const roomApi = {
  listRooms: async (token, options = {}) => {
    return executeAuthorizedJsonRequest(ROOMS_API_BASE_URL, {
      method: 'GET',
      token,
      signal: options.signal,
    });
  },

  createRoom: async (token, roomDraft = {}, options = {}) => {
    const payload = {};

    if (typeof roomDraft.name === 'string' && roomDraft.name.trim()) {
      payload.name = roomDraft.name.trim();
    }

    if (typeof roomDraft.mapId === 'string' && roomDraft.mapId.trim()) {
      payload.mapId = roomDraft.mapId.trim();
    }

    return executeAuthorizedJsonRequest(ROOMS_API_BASE_URL, {
      method: 'POST',
      token,
      signal: options.signal,
      body: payload,
    });
  },

  joinRoom: async (token, roomId, options = {}) => {
    return executeAuthorizedJsonRequest(`${ROOMS_API_BASE_URL}/${encodeURIComponent(roomId)}/join`, {
      method: 'POST',
      token,
      signal: options.signal,
      body: {},
    });
  },

  leaveRoom: async (token, roomId, options = {}) => {
    return executeAuthorizedJsonRequest(`${ROOMS_API_BASE_URL}/${encodeURIComponent(roomId)}/leave`, {
      method: 'POST',
      token,
      signal: options.signal,
      body: {},
    });
  },
};
