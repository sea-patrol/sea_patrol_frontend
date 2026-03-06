import { describe, expect, it } from 'vitest';

import { authApi } from '../../../shared/api/authApi';

describe('authApi', () => {
  it('login: returns canonical backend payload on success', async () => {
    const result = await authApi.login('testuser', 'password123');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      token: 'test-jwt-token-valid-user',
      username: 'testuser',
      issuedAt: '2026-03-06T10:00:00.000Z',
      expiresAt: '2026-03-06T11:00:00.000Z',
    });
  });

  it('login: extracts message and code from backend errors array', async () => {
    const result = await authApi.login('testuser', 'wrong-password');

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'http',
      status: 401,
      code: 'SEAPATROL_INVALID_PASSWORD',
      message: 'Invalid password',
    });
  });

  it('signup: returns canonical backend payload on success', async () => {
    const result = await authApi.signup('newuser', 'password123', 'new@example.com');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      username: 'newuser',
    });
  });
});
