import { describe, expect, it } from 'vitest';

import { messageAdapter } from '../../../shared/ws/messageAdapter';

describe('messageAdapter', () => {
  it('parseMessage: returns ok=false on invalid JSON', () => {
    const result = messageAdapter.parseMessage('{');
    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({ type: 'parse' });
  });

  it('parseMessage: returns ok=false on invalid shape', () => {
    const result = messageAdapter.parseMessage(JSON.stringify({ payload: { a: 1 } }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({ type: 'validation' });
  });

  it('parseMessage: supports tuple shape [type, payload]', () => {
    const result = messageAdapter.parseMessage(JSON.stringify(['PING', { a: 1 }]));
    expect(result.ok).toBe(true);
    expect(result.message).toEqual({ type: 'PING', payload: { a: 1 } });
  });

  it('serializeMessage: returns ok=false when type is missing', () => {
    const result = messageAdapter.serializeMessage({ payload: { a: 1 } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({ type: 'validation' });
  });

  it('serializeMessage: returns JSON string on success', () => {
    const result = messageAdapter.serializeMessage({ type: 'PING', payload: { a: 1 } });
    expect(result.ok).toBe(true);
    expect(result.data).toBe(JSON.stringify({ type: 'PING', payload: { a: 1 } }));
  });

  it('serializeMessage: supports tuple shape [type, payload]', () => {
    const result = messageAdapter.serializeMessage(['PING', { a: 1 }]);
    expect(result.ok).toBe(true);
    expect(result.data).toBe(JSON.stringify(['PING', { a: 1 }]));
  });
});
