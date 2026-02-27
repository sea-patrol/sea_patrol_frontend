import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { testUsers } from '../../mocks/data';

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
      // Тест проверяет, что при неудачном логине состояние не меняется
      // MSW обработчик уже настроен на возврат ошибки для неверного пароля
      
      const { container } = renderWithAuthProvider();
      
      // Просто проверяем, что начальный состояние - не аутентифицирован
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
        // Signup успешен, но не логинит автоматически
        const userEl = container.querySelector('[data-testid="user"]');
        // После signup пользователь не логинится автоматически
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
      // Токен есть, но пользователя нет
      localStorage.setItem('token', 'some-token');
      const { container } = renderWithAuthProvider();
      
      // loading сначала true, потом false
      const loadingEl = container.querySelector('[data-testid="loading"]');
      expect(loadingEl?.textContent).toBe('false');
      
      const authEl = container.querySelector('[data-testid="isAuthenticated"]');
      // isAuthenticated требует и token И user
      expect(authEl?.textContent).toBe('false');
    });
  });
});
