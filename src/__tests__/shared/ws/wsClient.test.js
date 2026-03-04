import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWsClient } from '../../../shared/ws/wsClient';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.sent = [];
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;

    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  send(data) {
    this.sent.push(data);
  }

  receive(data) {
    this.onmessage?.({ data });
  }
}

describe('wsClient', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('routes parsed messages to subscribers', () => {
    const client = createWsClient();
    const onPayload = vi.fn();

    client.subscribe('CHAT_MESSAGE', onPayload);
    client.connect({ getUrl: () => 'ws://example', onConnectionChange: vi.fn() });

    const ws = MockWebSocket.instances[0];
    ws.open();
    ws.receive(JSON.stringify(['CHAT_MESSAGE', { text: 'hi' }]));

    expect(onPayload).toHaveBeenCalledWith({ text: 'hi' });
  });

  it('does not throw on invalid messages and reports error', () => {
    const client = createWsClient();
    const onPayload = vi.fn();
    const onMessageError = vi.fn();

    client.subscribe('CHAT_MESSAGE', onPayload);
    client.connect({ getUrl: () => 'ws://example', onConnectionChange: vi.fn(), onMessageError });

    const ws = MockWebSocket.instances[0];
    ws.open();
    ws.receive('{');

    expect(onPayload).not.toHaveBeenCalled();
    expect(onMessageError).toHaveBeenCalledTimes(1);
  });

  it('send: serializes message and sends when socket is open', () => {
    const client = createWsClient();
    client.connect({ getUrl: () => 'ws://example', onConnectionChange: vi.fn() });

    const ws = MockWebSocket.instances[0];
    ws.open();

    const result = client.send(['PING', { a: 1 }]);
    expect(result.ok).toBe(true);
    expect(ws.sent[0]).toBe(JSON.stringify(['PING', { a: 1 }]));
  });

  it('reconnects with exponential backoff and stops after maxAttempts', () => {
    vi.useFakeTimers();

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const client = createWsClient();
    const onConnectionChange = vi.fn();

    client.connect({
      getUrl: () => 'ws://example',
      onConnectionChange,
      reconnect: { initialDelayMs: 1000, maxDelayMs: 8000, factor: 2, maxAttempts: 3, cooldownMs: 30000 },
    });

    const ws1 = MockWebSocket.instances[0];
    ws1.close();
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 1000);

    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2);

    const ws2 = MockWebSocket.instances[1];
    ws2.close();
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 2000);

    vi.advanceTimersByTime(2000);
    expect(MockWebSocket.instances).toHaveLength(3);

    const ws3 = MockWebSocket.instances[2];
    ws3.close();
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 4000);

    vi.advanceTimersByTime(4000);
    expect(MockWebSocket.instances).toHaveLength(4);

    const ws4 = MockWebSocket.instances[3];
    ws4.close();

    // maxAttempts=3 -> уходим на cooldown
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 30000);

    vi.advanceTimersByTime(30000);
    expect(MockWebSocket.instances).toHaveLength(5);

    setTimeoutSpy.mockRestore();
  });

  it('disconnect clears scheduled reconnect', () => {
    vi.useFakeTimers();

    const client = createWsClient();
    client.connect({
      getUrl: () => 'ws://example',
      onConnectionChange: vi.fn(),
      reconnect: { initialDelayMs: 1000, maxDelayMs: 8000, factor: 2, maxAttempts: 5, cooldownMs: 30000 },
    });

    const ws1 = MockWebSocket.instances[0];
    ws1.close(); // планируем reconnect

    client.disconnect();

    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('does not break current socket on stale close (reconnect race)', () => {
    let url = 'ws://one';

    const client = createWsClient();
    client.connect({
      getUrl: () => url,
      onConnectionChange: vi.fn(),
    });

    const ws1 = MockWebSocket.instances[0];
    ws1.open();

    url = 'ws://two';
    client.connect({
      getUrl: () => url,
      onConnectionChange: vi.fn(),
    });

    const ws2 = MockWebSocket.instances[1];
    ws2.open();

    // старый сокет закрывается после открытия нового
    ws1.close();

    const sendResult = client.send(['PING', { a: 1 }]);
    expect(sendResult.ok).toBe(true);
    expect(ws2.sent[0]).toBe(JSON.stringify(['PING', { a: 1 }]));
  });
});
