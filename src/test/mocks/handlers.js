import { http, HttpResponse } from 'msw';

import { testUsers, mockAuthResponses } from './data';

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

export const handlers = [
  // POST /api/v1/auth/login
  http.post(`${AUTH_API_BASE_URL}/login`, async ({ request }) => {
    const { username, password } = await request.json();

    // Проверка валидности пользователя
    if (username === testUsers.validUser.username && password === testUsers.validUser.password) {
      return HttpResponse.json(mockAuthResponses.login.success);
    }

    // Неверные учетные данные
    if (username && password) {
      return HttpResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Пустые поля
    return HttpResponse.json(
      { message: 'Username and password are required' },
      { status: 400 }
    );
  }),

  // POST /api/v1/auth/signup
  http.post(`${AUTH_API_BASE_URL}/signup`, async ({ request }) => {
    const { username, password, email } = await request.json();

    // Проверка на существующего пользователя
    if (username === 'existinguser') {
      return HttpResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      );
    }

    // Валидация данных
    if (!username || !password || !email) {
      return HttpResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return HttpResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Успешная регистрация
    return HttpResponse.json(mockAuthResponses.signup.success, { status: 201 });
  }),
];
