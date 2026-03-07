import { http, HttpResponse } from 'msw';

import { mockAuthResponses, mockRoomCatalogResponses, mockRoomJoinResponses, testUsers } from './data';

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
const ROOMS_API_BASE_URL = `${API_BASE_URL}/api/v1/rooms`;

export const handlers = [
  http.post(`${AUTH_API_BASE_URL}/login`, async ({ request }) => {
    const { username, password } = await request.json();

    if (username === testUsers.validUser.username && password === testUsers.validUser.password) {
      return HttpResponse.json(mockAuthResponses.login.success);
    }

    if (username && password) {
      return HttpResponse.json(mockAuthResponses.login.invalidPassword, { status: 401 });
    }

    return HttpResponse.json(mockAuthResponses.login.validationError, { status: 400 });
  }),

  http.post(`${AUTH_API_BASE_URL}/signup`, async ({ request }) => {
    const { username, password, email } = await request.json();

    if (username === 'existinguser') {
      return HttpResponse.json(
        {
          errors: [
            {
              code: 'SEAPATROL_BAD_REQUEST',
              message: 'Username already exists',
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!username || !password || !email) {
      return HttpResponse.json(mockAuthResponses.signup.validationError, { status: 400 });
    }

    if (password.length < 6) {
      return HttpResponse.json(
        {
          errors: [
            {
              code: 'SEAPATROL_VALIDATION_ERROR',
              message: 'password: size must be between 6 and 72',
            },
          ],
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({ username });
  }),

  http.get(ROOMS_API_BASE_URL, ({ request }) => {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          errors: [
            {
              code: 'SEAPATROL_UNAUTHORIZED',
              message: 'Unauthorized',
            },
          ],
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockRoomCatalogResponses.populated);
  }),

  http.post(`${ROOMS_API_BASE_URL}/:roomId/join`, ({ params, request }) => {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          errors: [
            {
              code: 'SEAPATROL_UNAUTHORIZED',
              message: 'Unauthorized',
            },
          ],
        },
        { status: 401 }
      );
    }

    if (params.roomId === 'regatta-night') {
      return HttpResponse.json(mockRoomJoinResponses.roomFull, { status: 409 });
    }

    return HttpResponse.json({
      ...mockRoomJoinResponses.success,
      roomId: params.roomId,
    });
  }),
];
