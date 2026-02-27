import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../components/Login';
import { testUsers } from '../../mocks/data';

const mockOnSwitchToSignup = vi.fn();
const mockOnLoginSuccess = vi.fn();

const renderLogin = () => {
  return render(
    <AuthProvider>
      <Login
        onSwitchToSignup={mockOnSwitchToSignup}
        onLoginSuccess={mockOnLoginSuccess}
      />
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('should render login form with all fields', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render switch to signup link', () => {
      renderLogin();

      expect(
        screen.getByText(/don't have an account\?/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should start with empty form fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/username:/i)).toHaveValue('');
      expect(screen.getByLabelText(/password:/i)).toHaveValue('');
    });
  });

  describe('Form Interaction', () => {
    it('should update form state on input change', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should call onSwitchToSignup when clicking sign up link', async () => {
      const user = userEvent.setup();
      renderLogin();

      const signupLink = screen.getByRole('button', { name: /sign up/i });
      await user.click(signupLink);

      expect(mockOnSwitchToSignup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should require username field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/password:/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Форма не должна отправляться без username
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it('should require password field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Форма не должна отправляться без password
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call login with credentials on submit', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should show error message on invalid credentials', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it('should call login on submit', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      await user.type(usernameInput, testUsers.validUser.username);
      await user.type(passwordInput, testUsers.validUser.password);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear error message on new submit attempt', async () => {
      const user = userEvent.setup();
      renderLogin();

      const usernameInput = screen.getByLabelText(/username:/i);
      const passwordInput = screen.getByLabelText(/password:/i);

      // Первая попытка с неверным паролем
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Очищаем поля и вводим правильные данные
      await user.clear(passwordInput);
      await user.type(passwordInput, testUsers.validUser.password);

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      renderLogin();

      const usernameLabel = screen.getByText(/username:/i);
      const passwordLabel = screen.getByText(/password:/i);

      expect(usernameLabel).toHaveAttribute('for', 'username');
      expect(passwordLabel).toHaveAttribute('for', 'password');
    });

    it('should have proper button type', () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');

      const switchButton = screen.getByRole('button', { name: /sign up/i });
      expect(switchButton).toHaveAttribute('type', 'button');
    });
  });
});
