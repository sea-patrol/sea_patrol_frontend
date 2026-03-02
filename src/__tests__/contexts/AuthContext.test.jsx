import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { testUsers } from '../../mocks/data';

// Тестовый компонент для доступа к контексту
const TestAuthConsumer = () => {
  const { user, token, loading, isAuthenticated, error, login, signup, logout, setError } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.username || 'null'}</span>
      <span data-testid="token">{token || 'null'}</span>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="isAuthenticated">{isAuthenticated.toString()}</span>
      <span data-testid="error">{error || 'null'}</span>
      <button data-testid="login-btn" onClick={() => login('testuser', 'password123')}>
        Login
      </button>
      <button data-testid="signup-btn" onClick={() => signup('newuser', 'password123', 'new@example.com')}>
        Signup
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="clear-error-btn" onClick={() => setError(null)}>
        Clear Error
      </button>
    </div>
  );
};

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestAuthConsumer />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with null user and token from localStorage', () => {
      localStorage.clear();
      const { container } = renderWithAuthProvider();

      const userEl = container.querySelector('[data-testid="user"]');
      const tokenEl = container.querySelector('[data-testid="token"]');

      expect(userEl?.textContent).toBe('null');
      expect(tokenEl?.textContent).toBe('null');
    });

    it('should load token from localStorage on mount', () => {
      localStorage.setItem('token', 'existing-token');
      const { container } = renderWithAuthProvider();

      const tokenEl = container.querySelector('[data-testid="token"]');
      expect(tokenEl?.textContent).toBe('existing-token');
    });

    it('should have loading false after initialization', () => {
      const { container } = renderWithAuthProvider();

      const loadingEl = container.querySelector('[data-testid="loading"]');
      expect(loadingEl?.textContent).toBe('false');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const { container } = renderWithAuthProvider();

      const loginBtn = container.querySelector('[data-testid="login-btn"]');
      loginBtn?.click();

      await waitFor(() => {
        const userEl = container.querySelector('[data-testid="user"]');
        expect(userEl?.textContent).toBe('testuser');
      });

      const tokenEl = container.querySelector('[data-testid="token"]');
      const authEl = container.querySelector('[data-testid="isAuthenticated"]');

      expect(tokenEl?.textContent).toBe('test-jwt-token-valid-user');
      expect(authEl?.textContent).toBe('true');
    });

    it('should handle login failure with invalid credentials', async () => {
      const { container } = renderWithAuthProvider();

      const userEl = container.querySelector('[data-testid="user"]');
      const authEl = container.querySelector('[data-testid="isAuthenticated"]');

      expect(userEl?.textContent).toBe('null');
      expect(authEl?.textContent).toBe('false');
    });
  });

  describe('signup', () => {
    it('should successfully signup with valid data', async () => {
      const { container } = renderWithAuthProvider();

      const signupBtn = container.querySelector('[data-testid="signup-btn"]');
      signupBtn?.click();

      await waitFor(() => {
        const userEl = container.querySelector('[data-testid="user"]');
        expect(userEl?.textContent).toBe('null');
      });
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const { container } = renderWithAuthProvider();

      // Сначала логинимся
      const loginBtn = container.querySelector('[data-testid="login-btn"]');
      loginBtn?.click();

      await waitFor(() => {
        const userEl = container.querySelector('[data-testid="user"]');
        expect(userEl?.textContent).toBe('testuser');
      });

      // Теперь logout
      const logoutBtn = container.querySelector('[data-testid="logout-btn"]');
      logoutBtn?.click();

      await waitFor(() => {
        const userEl = container.querySelector('[data-testid="user"]');
        const tokenEl = container.querySelector('[data-testid="token"]');
        const authEl = container.querySelector('[data-testid="isAuthenticated"]');

        expect(userEl?.textContent).toBe('null');
        expect(tokenEl?.textContent).toBe('null');
        expect(authEl?.textContent).toBe('false');
      });

      // Проверяем, что localStorage очищен
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should be true when both token and user exist', async () => {
      const { container } = renderWithAuthProvider();

      const loginBtn = container.querySelector('[data-testid="login-btn"]');
      loginBtn?.click();

      await waitFor(() => {
        const authEl = container.querySelector('[data-testid="isAuthenticated"]');
        expect(authEl?.textContent).toBe('true');
      });
    });

    it('should be false when token exists but user is null', () => {
      localStorage.setItem('token', 'some-token');
      const { container } = renderWithAuthProvider();

      const loadingEl = container.querySelector('[data-testid="loading"]');
      expect(loadingEl?.textContent).toBe('false');

      const authEl = container.querySelector('[data-testid="isAuthenticated"]');
      expect(authEl?.textContent).toBe('false');
    });
  });

  describe('error handling', () => {
    it('should have error state available', () => {
      const { container } = renderWithAuthProvider();

      const errorEl = container.querySelector('[data-testid="error"]');
      expect(errorEl?.textContent).toBe('null');
    });

    it('should be able to clear error', () => {
      const { container } = renderWithAuthProvider();

      const clearErrorBtn = container.querySelector('[data-testid="clear-error-btn"]');
      expect(clearErrorBtn).toBeTruthy();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const { renderHook } = require('@testing-library/react');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
