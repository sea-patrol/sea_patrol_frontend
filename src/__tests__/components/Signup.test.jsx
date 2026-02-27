import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import Signup from '../../components/Signup';

const mockOnSwitchToLogin = vi.fn();
const mockOnSignupSuccess = vi.fn();

const renderSignup = () => {
  return render(
    <AuthProvider>
      <Signup
        onSwitchToLogin={mockOnSwitchToLogin}
        onSignupSuccess={mockOnSignupSuccess}
      />
    </AuthProvider>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('should render signup form with all fields', () => {
      renderSignup();

      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password:$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render switch to login link', () => {
      renderSignup();

      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should start with empty form fields', () => {
      renderSignup();

      expect(screen.getByLabelText(/username:/i)).toHaveValue('');
      expect(screen.getByLabelText(/email:/i)).toHaveValue('');
      expect(screen.getByLabelText(/^password:$/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirm password:/i)).toHaveValue('');
    });
  });

  describe('Form Interaction', () => {
    it('should update form state on input change', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      expect(usernameInput).toHaveValue('newuser');
      expect(emailInput).toHaveValue('new@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    it('should call onSwitchToLogin when clicking login link', async () => {
      const user = userEvent.setup();
      renderSignup();

      const loginLink = screen.getByRole('button', { name: /login/i });
      await user.click(loginLink);

      expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should require all fields', async () => {
      const user = userEvent.setup();
      renderSignup();

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      // Форма не должна отправляться без данных
      expect(mockOnSignupSuccess).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSignup();

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

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockOnSignupSuccess).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/password must be at least 6 characters long/i)
      ).toBeInTheDocument();
      expect(mockOnSignupSuccess).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      // HTML5 валидация должна сработать
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Submission', () => {
    it('should call signup with valid data on submit', async () => {
      const user = userEvent.setup();
      renderSignup();

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
        expect(mockOnSignupSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should show error message on signup failure', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      // Пытаемся зарегистрировать существующего пользователя
      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      });

      expect(mockOnSignupSuccess).not.toHaveBeenCalled();
    });

    it('should call signup on submit', async () => {
      const user = userEvent.setup();
      renderSignup();

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
        expect(mockOnSignupSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear error message on successful submit', async () => {
      const user = userEvent.setup();
      renderSignup();

      const usernameInput = screen.getByLabelText(/username:/i);
      const emailInput = screen.getByLabelText(/email:/i);
      const passwordInput = screen.getAllByLabelText(/password:/i)[0];
      const confirmPasswordInput = screen.getByLabelText(/confirm password:/i);

      // Сначала ошибка - пароли не совпадают
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

      // Теперь исправляем и отправляем снова
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'password123');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSignupSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      renderSignup();

      expect(screen.getByLabelText(/username:/i)).toHaveAttribute('id', 'username');
      expect(screen.getByLabelText(/email:/i)).toHaveAttribute('id', 'email');
      expect(screen.getAllByLabelText(/password:/i)[0]).toHaveAttribute('id', 'password');
      expect(screen.getByLabelText(/confirm password:/i)).toHaveAttribute('id', 'confirmPassword');
    });

    it('should have proper button types', () => {
      renderSignup();

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toHaveAttribute('type', 'submit');

      const switchButton = screen.getByRole('button', { name: /login/i });
      expect(switchButton).toHaveAttribute('type', 'button');
    });

    it('should use required attribute on inputs', () => {
      renderSignup();

      expect(screen.getByLabelText(/username:/i)).toBeRequired();
      expect(screen.getByLabelText(/email:/i)).toBeRequired();
      expect(screen.getAllByLabelText(/password:/i)[0]).toBeRequired();
      expect(screen.getByLabelText(/confirm password:/i)).toBeRequired();
    });
  });
});
