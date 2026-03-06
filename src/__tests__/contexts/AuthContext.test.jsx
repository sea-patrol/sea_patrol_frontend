import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { AuthProvider, useAuth } from '../../features/auth/model/AuthContext';

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
    it('should initialize with null user and token from localStorage', () => {
      localStorage.clear();
      renderWithAuthProvider();

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    it('should load token from localStorage on mount', () => {
      localStorage.setItem('token', 'existing-token');
      renderWithAuthProvider();

      expect(screen.getByTestId('token')).toHaveTextContent('existing-token');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials even without userId in payload', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('test-jwt-token-valid-user');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should keep unauthenticated state before successful login', async () => {
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
    it('should clear user and token on logout', async () => {
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
    });
  });

  describe('isAuthenticated', () => {
    it('should be true when both token and user exist', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
    });

    it('should be false when token exists but user is null', async () => {
      localStorage.setItem('token', 'some-token');
      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });
});
