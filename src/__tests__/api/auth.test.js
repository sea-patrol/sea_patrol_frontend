import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { login, signup, clearAuthStorage, saveToken, getToken } from '../../api/auth';

describe('auth API', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module exports', () => {
    it('should export login function', async () => {
      const module = await import('../../api/auth');
      expect(module.login).toBeDefined();
    });

    it('should export signup function', async () => {
      const module = await import('../../api/auth');
      expect(module.signup).toBeDefined();
    });

    it('should export clearAuthStorage function', async () => {
      const module = await import('../../api/auth');
      expect(module.clearAuthStorage).toBeDefined();
    });

    it('should export saveToken function', async () => {
      const module = await import('../../api/auth');
      expect(module.saveToken).toBeDefined();
    });

    it('should export getToken function', async () => {
      const module = await import('../../api/auth');
      expect(module.getToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should return success with token and user on valid credentials', async () => {
      const result = await login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.token).toBe('test-jwt-token-valid-user');
      expect(result.user).toEqual({
        id: 'test-user-1',
        username: 'testuser'
      });
    });

    it('should return failure on invalid credentials', async () => {
      const result = await login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });
  });

  describe('signup', () => {
    it('should return success with user data on valid signup', async () => {
      const result = await signup('newuser', 'password123', 'new@example.com');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
    });

    it('should return failure on invalid signup', async () => {
      const result = await signup('existinguser', 'password123', 'existing@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });
  });

  describe('clearAuthStorage', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      
      clearAuthStorage();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('saveToken', () => {
    it('should save token to localStorage', () => {
      saveToken('new-token');

      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('should overwrite existing token', () => {
      localStorage.setItem('token', 'old-token');
      
      saveToken('new-token');

      expect(localStorage.getItem('token')).toBe('new-token');
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-token');

      const token = getToken();

      expect(token).toBe('test-token');
    });

    it('should return null if no token exists', () => {
      const token = getToken();

      expect(token).toBeNull();
    });
  });

  describe('API endpoint configuration', () => {
    it('should use correct API base URL', async () => {
      // Проверяем, что API использует правильный URL через MSW перехват
      const result = await login('testuser', 'password123');
      
      expect(result.success).toBe(true);
      // MSW обрабатывает запрос на правильный endpoint
    });
  });
});
