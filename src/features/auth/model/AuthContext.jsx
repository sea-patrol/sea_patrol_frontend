/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

import { authApi } from '../../../shared/api/authApi';

const AuthContext = createContext();

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const result = await authApi.login(username, password);

      if (result.ok) {
        const authData = result.data;
        if (!authData?.token || !authData?.username) {
          return { success: false, error: 'Invalid server response' };
        }

        setToken(authData.token);
        setUser(buildAuthenticatedUser(authData));
        localStorage.setItem('token', authData.token);
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
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
