import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../features/auth/model/AuthContext';
import KeyPress from '../../features/player-controls/ui/KeyPress';
import { WebSocketProvider } from '../../features/realtime/model/WebSocketContext';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';

let keyboardSubscriber = null;

vi.mock('@react-three/drei', () => {
  return {
    useKeyboardControls: () => {
      const subscribeKeys = (callback) => {
        keyboardSubscriber = callback;
        return () => {
          if (keyboardSubscriber === callback) keyboardSubscriber = null;
        };
      };
      return [subscribeKeys];
    },
  };
});

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

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  send(data) {
    this.sent.push(data);
  }
}

const renderWithProviders = (ui) => {
  return render(
    <AuthProvider>
      <WebSocketProvider>{ui}</WebSocketProvider>
    </AuthProvider>
  );
};

describe('WebSocket send regressions (chat + keyboard)', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    keyboardSubscriber = null;
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    vi.stubGlobal('WebSocket', MockWebSocket);

    if (!Element.prototype.scrollIntoView) {
      // jsdom может не реализовывать scrollIntoView
      Element.prototype.scrollIntoView = () => {};
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ChatBlock: sends tuple message to WebSocket when connected', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders(<ChatBlock />);

    const ws = MockWebSocket.instances[0];
    await act(() => {
      ws.open();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    await waitFor(() => expect(input).not.toBeDisabled());

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(ws.sent).toContain(JSON.stringify(['CHAT_MESSAGE', { to: 'global', text: 'hello' }]));
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes('WebSocket send failed'))).toBe(false);

    warnSpy.mockRestore();
  });

  it('KeyPress: sends PLAYER_INPUT tuple to WebSocket when connected', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders(<KeyPress />);

    const ws = MockWebSocket.instances[0];
    await act(() => {
      ws.open();
    });

    await waitFor(() => expect(typeof keyboardSubscriber).toBe('function'));

    await act(() => {
      keyboardSubscriber({ up: true, down: false, left: false, right: false });
    });

    expect(ws.sent).toContain(JSON.stringify(['PLAYER_INPUT', { up: true, down: false, right: false, left: false }]));
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes('WebSocket send failed'))).toBe(false);

    warnSpy.mockRestore();
  });
});
