/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

import { authApi } from '../../../shared/api/authApi';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'auth-user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const buildAuthenticatedUser = (authData) => {
  const user = {
    username: authData.username,
  };

  if (authData.userId) {
    user.id = authData.userId;
  }

  return user;
};

const parseStoredUser = () => {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    return typeof parsedUser?.username === 'string' && parsedUser.username.trim()
      ? buildAuthenticatedUser(parsedUser)
      : null;
  } catch {
    return null;
  }
};

const decodeBase64Url = (value) => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - normalizedValue.length % 4) % 4);
  const decoder = typeof atob === 'function'
    ? atob
    : (input) => Buffer.from(input, 'base64').toString('binary');
  return decoder(`${normalizedValue}${padding}`);
};

const parseTokenPayload = (token) => {
  if (!token || !token.includes('.')) {
    return null;
  }

  try {
    const [, payloadSegment] = token.split('.');
    return JSON.parse(decodeBase64Url(payloadSegment));
  } catch {
    return null;
  }
};

const isTokenExpired = (payload) => {
  if (typeof payload?.exp !== 'number') {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

const parseUserFromPayload = (payload) => {
  const username = payload?.sub ?? payload?.username;
  if (typeof username !== 'string' || !username.trim()) {
    return null;
  }

  return { username };
};

const parseUserFromToken = (token) => {
  const payload = parseTokenPayload(token);
  return payload ? parseUserFromPayload(payload) : null;
};

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

const persistSession = (authData) => {
  const nextUser = buildAuthenticatedUser(authData);
  localStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  return nextUser;
};

const restoreSession = () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return { token: null, user: null };
  }

  const tokenPayload = parseTokenPayload(token);
  if (!tokenPayload || isTokenExpired(tokenPayload)) {
    clearStoredSession();
    return { token: null, user: null };
  }

  const storedUser = parseStoredUser();
  const restoredUser = storedUser ?? parseUserFromPayload(tokenPayload) ?? parseUserFromToken(token);
  if (!restoredUser) {
    clearStoredSession();
    return { token: null, user: null };
  }

  if (!storedUser) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(restoredUser));
  }

  return { token, user: restoredUser };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(restoreSession);

  const login = async (username, password) => {
    try {
      const result = await authApi.login(username, password);

      if (result.ok) {
        const authData = result.data;
        if (!authData?.token || !authData?.username) {
          return { success: false, error: 'Invalid server response' };
        }

        const nextUser = persistSession(authData);
        setSession({ token: authData.token, user: nextUser });
        return { success: true };
      }

      return { success: false, error: result.error?.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const signup = async (username, password, email) => {
    try {
      const result = await authApi.signup(username, password, email);

      if (result.ok) {
        return { success: true, user: result.data };
      }

      return { success: false, error: result.error?.message || 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = () => {
    clearStoredSession();
    setSession({ token: null, user: null });
  };

  const value = {
    user: session.user,
    token: session.token,
    loading: false,
    login,
    signup,
    logout,
    isAuthenticated: !!session.token && !!session.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
