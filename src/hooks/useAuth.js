/**
 * @file useAuth - Хук для работы с аутентификацией
 * @description Обёртка над AuthContext с дополнительными утилитами
 */

import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Хук для доступа к контексту аутентификации
 * @returns {Object} Объект с методами и состоянием аутентификации
 * @returns {Object|null} returns.user - Данные текущего пользователя
 * @returns {string|null} returns.token - JWT токен
 * @returns {boolean} returns.loading - Статус загрузки
 * @returns {string|null} returns.error - Последняя ошибка
 * @returns {boolean} returns.isAuthenticated - Статус аутентификации
 * @returns {Function} returns.login - Функция входа
 * @returns {Function} returns.signup - Функция регистрации
 * @returns {Function} returns.logout - Функция выхода
 * @returns {Function} returns.setError - Функция сброса ошибки
 *
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 *
 * @example
 * const result = await login('username', 'password');
 * if (result.success) {
 *   console.log('Logged in as', user.username);
 * }
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
