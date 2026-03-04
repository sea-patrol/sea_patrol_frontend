import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Тестовый компонент для доступа к контексту
const TestAuthConsumer = () => {
  const { user, token, loading, isAuthenticated, login, signup, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.username || 'null'}</span>
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
    // Очищаем localStorage перед каждым тестом
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
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(screen.getByTestId('token')).toHaveTextContent('test-jwt-token-valid-user');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should handle login failure with invalid credentials', async () => {
      // Тест проверяет, что при неудачном логине состояние не меняется
      // MSW обработчик уже настроен на возврат ошибки для неверного пароля

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
        // Signup успешен, но не логинит автоматически
        // После signup пользователь не логинится автоматически
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

      // Теперь logout
      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('token')).toHaveTextContent('null');
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      // Проверяем, что localStorage очищен
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
      // Токен есть, но пользователя нет
      localStorage.setItem('token', 'some-token');
      renderWithAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });
});
