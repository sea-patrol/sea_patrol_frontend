import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useAuth } from '../../hooks/useAuth';
import { AuthProvider } from '../../contexts/AuthContext';

const TestWrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Module exports', () => {
    it('should export useAuth as named export', async () => {
      const module = await import('../../hooks/useAuth');
      expect(module.useAuth).toBeDefined();
    });

    it('should export useAuth as default export', async () => {
      const module = await import('../../hooks/useAuth');
      expect(module.default).toBeDefined();
    });
  });

  describe('useAuth', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return auth object with expected properties', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('signup');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('setError');
    });

    it('should return user as null initially', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.user).toBeNull();
    });

    it('should return token from localStorage if exists', () => {
      localStorage.setItem('token', 'test-token');
      
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.token).toBe('test-token');
    });

    it('should return loading as false after initialization', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.loading).toBe(false);
    });

    it('should return isAuthenticated as false when not logged in', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return error as null initially', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.error).toBeNull();
    });

    it('should have login function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(typeof result.current.login).toBe('function');
    });

    it('should have signup function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(typeof result.current.signup).toBe('function');
    });

    it('should have logout function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(typeof result.current.logout).toBe('function');
    });

    it('should have setError function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(typeof result.current.setError).toBe('function');
    });
  });
});
