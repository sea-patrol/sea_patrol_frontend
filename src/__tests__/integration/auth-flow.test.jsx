import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider, useAuth } from '../../features/auth/model/AuthContext';
import Login from '../../features/auth/ui/Login';
import Signup from '../../features/auth/ui/Signup';
import { testUsers } from '../../test/mocks/data';

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

const AuthFlowTest = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginSuccess = () => {
  };

  const handleSignupSuccess = () => {
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
      renderAuthFlow();

      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      });

      expect(screen.getByTestId('username').textContent).toBe(testUsers.validUser.username);
      expect(localStorage.getItem('token')).toBe('test-jwt-token-valid-user');
    });

    it('should handle login error and display error message', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });

    it('should allow logout after successful login', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      });

      const logoutBtn = screen.getByTestId('logout-btn');
      await user.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
      });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Signup Flow', () => {
    it('should complete full signup flow: Signup component → AuthContext → REST API → switch to login', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });

    it('should handle signup error for existing user', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
      });
    });

    it('should validate password match before sending request', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('auth-status').textContent).toBe('not-authenticated');
    });
  });

  describe('Switching between Login and Signup', () => {
    it('should switch from Login to Signup and back', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();

      const switchToLoginBtn = screen.getByRole('button', { name: /login/i });
      await user.click(switchToLoginBtn);

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('should clear error messages when switching forms', async () => {
      const user = userEvent.setup();
      renderAuthFlow();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });

      const switchToSignupBtn = screen.getByRole('button', { name: /sign up/i });
      await user.click(switchToSignupBtn);

      expect(screen.queryByText(/invalid password/i)).not.toBeInTheDocument();
    });
  });

  describe('Session persistence', () => {
    it('should restore authenticated session from localStorage on page reload', async () => {
      const persistedToken = createJwt({
        sub: testUsers.validUser.username,
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      localStorage.setItem('token', persistedToken);
      localStorage.setItem('auth-user', JSON.stringify({ username: testUsers.validUser.username }));

      renderAuthFlow();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
      });

      expect(screen.getByTestId('username').textContent).toBe(testUsers.validUser.username);
      expect(localStorage.getItem('token')).toBe(persistedToken);
      expect(localStorage.getItem('auth-user')).toBe(JSON.stringify({ username: testUsers.validUser.username }));
    });
  });
});
