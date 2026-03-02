/**
 * @file AuthContext - Контекст аутентификации
 * @description Управление состоянием пользователя, токеном и методами входа/выхода
 */

import { createContext, useContext, useState, useEffect } from 'react';

import { login as loginApi, signup as signupApi, saveToken, getToken, clearAuthStorage } from '../api/auth';

const AuthContext = createContext();

/**
 * Хук для доступа к контексту аутентификации
 * @returns {Object} Объект контекста аутентификации
 * @throws {Error} Если используется вне AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Провайдер контекста аутентификации
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Сбрасываем loading после инициализации токена
  useEffect(() => {
    setLoading(false);
  }, []);

  /**
   * Выполняет вход пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} Результат входа { success: boolean, error?: string }
   */
  const login = async (username, password) => {
    setError(null);
    const result = await loginApi(username, password);

    if (result.success) {
      setToken(result.token);
      setUser(result.user);
      saveToken(result.token);
      return { success: true };
    } else {
      setError(result.error);
      return { success: false, error: result.error };
    }
  };

  /**
   * Регистрирует нового пользователя
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @param {string} email - Email
   * @returns {Promise<Object>} Результат регистрации { success: boolean, error?: string, user?: Object }
   */
  const signup = async (username, password, email) => {
    setError(null);
    const result = await signupApi(username, password, email);

    if (result.success) {
      return { success: true, user: result.user };
    } else {
      setError(result.error);
      return { success: false, error: result.error };
    }
  };

  /**
   * Выполняет выход пользователя
   * Очищает состояние и localStorage
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    clearAuthStorage();
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
