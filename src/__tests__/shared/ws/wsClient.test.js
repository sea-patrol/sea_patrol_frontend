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
});
