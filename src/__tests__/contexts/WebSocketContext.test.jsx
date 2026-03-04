import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockToken = 'test-token';

let lastClient = null;
let lastConnectOptions = null;
let subscribersByType = null;

vi.mock('@/features/auth/model/AuthContext', () => {
  return {
    useAuth: () => ({ token: mockToken }),
  };
});

vi.mock('@/shared/ws/wsClient', () => {
  return {
    createWsClient: () => {
      lastConnectOptions = null;
      subscribersByType = new Map();

      const client = {
        connect: vi.fn((options) => {
          lastConnectOptions = options;
        }),
        disconnect: vi.fn(),
        send: vi.fn(() => ({ ok: true })),
        subscribe: vi.fn((type, callback) => {
          if (!subscribersByType.has(type)) {
            subscribersByType.set(type, new Set());
          }
          subscribersByType.get(type).add(callback);
          return () => {
            subscribersByType.get(type)?.delete(callback);
          };
        }),
      };

      lastClient = client;
      return client;
    },
  };
});

import { WebSocketProvider, useWebSocket } from '../../features/realtime/model/WebSocketContext';

function StatusConsumer() {
  const { isConnected, hasToken, lastClose } = useWebSocket();
  const closeText = lastClose?.code === undefined ? 'none' : `${String(lastClose.code)}:${lastClose.reason ?? ''}`;

  return (
    <div>
      <div data-testid="isConnected">{String(isConnected)}</div>
      <div data-testid="hasToken">{String(hasToken)}</div>
      <div data-testid="lastClose">{closeText}</div>
    </div>
  );
}

function SubscribeOnMount({ type, onMessage }) {
  const { subscribe } = useWebSocket();

  useEffect(() => subscribe(type, onMessage), [subscribe, type, onMessage]);

  return null;
}

describe('WebSocketContext', () => {
  beforeEach(() => {
    mockToken = 'test-token';
    lastClient = null;
    lastConnectOptions = null;
    subscribersByType = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connects on mount when token exists and exposes connection state', async () => {
    render(
      <WebSocketProvider>
        <StatusConsumer />
      </WebSocketProvider>,
    );

    expect(lastClient).not.toBeNull();
    expect(lastClient.connect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('hasToken')).toHaveTextContent('true');

    const url = lastConnectOptions.getUrl();
    expect(url).toContain('/ws/game');
    expect(url).toContain('token=');

    await act(() => lastConnectOptions.onConnectionChange(true));
    expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
  });

  it('disconnects when token is removed and disconnects on unmount', async () => {
    const { rerender, unmount } = render(
      <WebSocketProvider>
        <StatusConsumer />
      </WebSocketProvider>,
    );

    await act(() => lastConnectOptions.onConnectionChange(true));
    expect(screen.getByTestId('isConnected')).toHaveTextContent('true');

    mockToken = null;
    rerender(
      <WebSocketProvider>
        <StatusConsumer />
      </WebSocketProvider>,
    );

    expect(lastClient.disconnect).toHaveBeenCalled();
    expect(screen.getByTestId('hasToken')).toHaveTextContent('false');
    expect(screen.getByTestId('isConnected')).toHaveTextContent('false');

    unmount();
    expect(lastClient.disconnect).toHaveBeenCalled();
  });

  it('updates lastClose when client triggers onClose', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <WebSocketProvider>
        <StatusConsumer />
      </WebSocketProvider>,
    );

    expect(screen.getByTestId('lastClose')).toHaveTextContent('none');

    await act(() => lastConnectOptions.onClose({ code: 1000, reason: 'bye' }));
    expect(screen.getByTestId('lastClose')).toHaveTextContent('1000:bye');

    warnSpy.mockRestore();
  });

  it('subscribe passes through to wsClient and supports unsubscribe on unmount', async () => {
    const onMessage = vi.fn();
    const { unmount } = render(
      <WebSocketProvider>
        <SubscribeOnMount type="TEST_TYPE" onMessage={onMessage} />
      </WebSocketProvider>,
    );

    expect(lastClient.subscribe).toHaveBeenCalledWith('TEST_TYPE', onMessage);
    expect(subscribersByType.get('TEST_TYPE')?.size).toBe(1);

    // simulate message dispatch from ws client
    for (const cb of subscribersByType.get('TEST_TYPE')) cb({ ok: true });
    expect(onMessage).toHaveBeenCalledWith({ ok: true });

    unmount();
    expect(subscribersByType.get('TEST_TYPE')?.size ?? 0).toBe(0);
  });

  it('sendMessage warns when wsClient.send fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function Sender() {
      const { sendMessage } = useWebSocket();
      return (
        <button
          type="button"
          onClick={() => {
            sendMessage(['TEST', { hello: 'world' }]);
          }}
        >
          Send
        </button>
      );
    }

    render(
      <WebSocketProvider>
        <Sender />
      </WebSocketProvider>,
    );

    lastClient.send.mockReturnValueOnce({ ok: false, error: { type: 'state', message: 'not open' } });

    await act(async () => {
      screen.getByRole('button', { name: 'Send' }).click();
    });

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
