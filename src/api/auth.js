/**
 * @file API-сервис для аутентификации
 * @description Централизованные API-вызовы для login, signup и управления сессией
 */

const API_BASE_URL = 'http://localhost:8080/api/v1/auth';

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success - Статус операции
 * @property {string} [error] - Сообщение об ошибке (если success === false)
 * @property {string} [token] - JWT токен (при успешном login)
 * @property {Object} [user] - Данные пользователя (при успешном signup)
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} username - Имя пользователя
 * @property {string} password - Пароль
 */

/**
 * @typedef {Object} SignupData
 * @property {string} username - Имя пользователя
 * @property {string} password - Пароль
 * @property {string} email - Email
 */

/**
 * Выполняет вход пользователя
 * @param {LoginCredentials} credentials - Учётные данные
 * @returns {Promise<AuthResponse>} Результат аутентификации
 */
export async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const authData = await response.json();
      return {
        success: true,
        token: authData.token,
        user: {
          id: authData.userId,
          username: authData.username
        }
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Login failed'
      };
    }
  } catch (error) {
    console.error('Login API error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Регистрирует нового пользователя
 * @param {SignupData} data - Данные для регистрации
 * @returns {Promise<AuthResponse>} Результат регистрации
 */
export async function signup(username, password, email) {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, email })
    });

    if (response.ok) {
      const userData = await response.json();
      return {
        success: true,
        user: userData
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Signup failed'
      };
    }
  } catch (error) {
    console.error('Signup API error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Очищает сохранённый токен из localStorage
 * @returns {void}
 */
export function clearAuthStorage() {
  localStorage.removeItem('token');
}

/**
 * Сохраняет токен в localStorage
 * @param {string} token - JWT токен
 * @returns {void}
 */
export function saveToken(token) {
  localStorage.setItem('token', token);
}

/**
 * Получает токен из localStorage
 * @returns {string|null} Сохранённый токен или null
 */
export function getToken() {
  return localStorage.getItem('token');
}
