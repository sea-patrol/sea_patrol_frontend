import { describe, expect, it } from 'vitest';

import { authApi } from '../../../shared/api/authApi';

describe('authApi', () => {
  it('login: returns token and user info on success', async () => {
    const result = await authApi.login('testuser', 'password123');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      token: 'test-jwt-token-valid-user',
      userId: 'test-user-1',
      username: 'testuser',
    });
  });

  it('login: returns normalized http error on invalid credentials', async () => {
    const result = await authApi.login('testuser', 'wrong-password');

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'http',
      status: 401,
      message: 'Invalid username or password',
    });
  });

  it('signup: returns user info on success', async () => {
    const result = await authApi.signup('newuser', 'password123', 'new@example.com');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      id: 'test-user-1',
      username: 'testuser',
      email: 'test@example.com',
    });
  });
});
