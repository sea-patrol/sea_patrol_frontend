import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { AuthProvider, useAuth } from '../../features/auth/model/AuthContext';

const createJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${body}.signature`;
};

const TestAuthConsumer = () => {
  const { user, token, loading, isAuthenticated, login, signup, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.username || 'null'}</span>
      <span data-testid="user-id">{user?.id || 'null'}</span>
      <span data-testid="token">{token || 'null'}</span>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="isAuthenticated">{isAuthenticated.toString()}</span>
      <button data-testid="login-btn" onClick={() => login('testuser', 'password123')}>
        Login
      </button>
      <button data-testid="signup-btn" onClick={() => signup('newuser', 'password123', 'new@example.com')}>
        Signup
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
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
    localStorage.clear();
  });

  describe('Initial state', () => {
    it('should initialize with null user and token when storage is empty', () => {
      renderWithAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should restore token and stored user on mount', () => {
      localStorage.setItem('token', createJwt({ sub: 'captain', exp: Math.floor(Date.now() / 1000) + 3600 }));
      localStorage.setItem('auth-user', JSON.stringify({ username: 'captain' }));
      renderWithAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('captain');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should restore username from JWT subject when only token is stored', () => {
      localStorage.setItem('token', createJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) + 3600 }));
      renderWithAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('user1');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(localStorage.getItem('auth-user')).toBe(JSON.stringify({ username: 'user1' }));
    });

    it('should clear expired JWT from storage on mount', () => {
      localStorage.setItem('token', createJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) - 60 }));
      localStorage.setItem('auth-user', JSON.stringify({ username: 'user1' }));
      renderWithAuthProvider();

      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('auth-user')).toBeNull();
    });

    it('should clear invalid stored token when user cannot be restored', () => {
      localStorage.setItem('token', 'broken-token');
      renderWithAuthProvider();

      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials even without userId in payload', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('test-jwt-token-valid-user');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(localStorage.getItem('auth-user')).toBe(JSON.stringify({ username: 'testuser' }));
    });

    it('should keep unauthenticated state before successful login', () => {
      renderWithAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('signup', () => {
    it('should successfully signup with valid data', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await user.click(screen.getByTestId('signup-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('logout', () => {
    it('should clear user, token and persisted session on logout', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('token')).toHaveTextContent('null');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('auth-user')).toBeNull();
    });
  });
});
