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
const AUTH_API_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const postJson = async (path, body) => {
  let response;
  try {
    response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
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
      error: {
        type: 'http',
        status: response.status,
        message: data?.message || 'Request failed',
        data,
      },
    };
  }

  return { ok: true, data };
};

export const authApi = {
  login: async (username, password) => {
    return postJson('/login', { username, password });
  },
  signup: async (username, password, email) => {
    return postJson('/signup', { username, password, email });
  },
};
