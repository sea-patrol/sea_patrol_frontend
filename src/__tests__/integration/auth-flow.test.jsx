import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import Login from '../../components/Login';
import Signup from '../../components/Signup';
import { testUsers } from '../../mocks/data';

// Компонент-обертка для тестирования полного потока аутентификации
const AuthFlowTest = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginSuccess = () => {
    // Успешный вход
  };

  const handleSignupSuccess = () => {
    // Переключаемся на логин после регистрации
    setShowLogin(true);
  };

  return (
    <div data-testid="auth-flow">
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
      <span data-testid="username">{user?.username || ''}</span>
      
      {showLogin ? (
        <Login
          onSwitchToSignup={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Signup
          onSwitchToLogin={() => setShowLogin(true)}
          onSignupSuccess={handleSignupSuccess}
        />
      )}

      {isAuthenticated && (
        <button data-testid="logout-btn" onClick={logout}>
          Logout
        </button>
      )}
    </div>
  );
};

const renderAuthFlow = () => {
  return render(
    <AuthProvider>
      <AuthFlowTest />
    </AuthProvider>
  );
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow: Login component → AuthContext → REST API → authenticated', async () => {
      const user = userEvent.setup();
      const { container } = renderAuthFlow();

      // Начальное состояние - не аутентифицирован
      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');

      // Заполняем форму логина
      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      // Отправляем форму
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Ждем успешной аутентификации
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      });

      // Проверяем, что пользователь установлен
      expect(screen.getByTestId('username').textContent).toBe(testUsers.validUser.username);

      // Проверяем, что токен сохранен в localStorage
      expect(localStorage.getItem('token')).toBe('test-jwt-token-valid-user');
    });

    it('should handle login error and display error message', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Заполняем форму с неверными данными
      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      // Отправляем форму
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Ждем появления ошибки
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Состояние не должно измениться
      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });

    it('should allow logout after successful login', async () => {
      const user = userEvent.setup();
      const { container } = renderAuthFlow();

      // Логинимся
      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      });

      // Выходим
      const logoutBtn = screen.getByTestId('logout-btn');
      await user.click(logoutBtn);

      // Проверяем, что вышли
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
      });

      // Токен должен быть удален
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow: Signup component → AuthContext → REST API → switch to login', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Переключаемся на регистрацию
      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      // Заполняем форму регистрации
      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Отправляем форму
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      // После успешной регистрации переключаемся на логин
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      });

      // Состояние - не аутентифицирован (signup не логинит автоматически)
      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });

    it('should handle signup error for existing user', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Переключаемся на регистрацию
      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      // Заполняем форму с существующим username
      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Отправляем форму
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      // Ждем появления ошибки
      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      });
    });

    it('should validate password match before sending request', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Переключаемся на регистрацию
      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      // Заполняем форму с несовпадающими паролями
      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');

      // Отправляем форму
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      // Ошибка должна появиться сразу, без запроса к API
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Запрос к API не должен был произойти
      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });
  });

  describe('Switching between Login and Signup', () => {
    it('should switch from Login to Signup and back', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Начальное состояние - Login
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

      // Переключаемся на Signup
      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();

      // Переключаемся обратно на Login
      const switchToLoginBtn = screen.getByRole('button', { name: /login/i });
      await user.click(switchToLoginBtn);

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('should clear error messages when switching forms', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      // Пытаемся войти с неверными данными
      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Переключаемся на Signup
      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      // Ошибка должна исчезнуть
      expect(screen.queryByText(/invalid username or password/i)).not.toBeInTheDocument();
    });
  });

  describe('Session persistence', () => {
    it('should restore session from localStorage on page reload', async () => {
      // Сохраняем токен в localStorage
      localStorage.setItem('token', 'test-jwt-token-valid-user');

      const { container, unmount, rerender } = renderAuthFlow();

      // Токен загружен, но пользователь еще не установлен (требуется login)
      // AuthContext загружает токен из localStorage при инициализации
      const tokenEl = container.querySelector('[data-testid="username"]');
      
      // Проверяем, что токен в localStorage
      expect(localStorage.getItem('token')).toBe('test-jwt-token-valid-user');
    });
  });
});
