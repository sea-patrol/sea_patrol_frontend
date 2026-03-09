import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../features/auth/model/AuthContext';
import KeyPress from '../../features/player-controls/ui/KeyPress';
import { WebSocketProvider } from '../../features/realtime/model/WebSocketContext';
import { GameUiProvider, GAME_UI_MODE, useGameUi } from '../../features/ui-shell/model/GameUiContext';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';

let keyboardSubscriber = null;

const createJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${body}.signature`;
};

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

function SailingUiHarness({ children }) {
  const { setScreenMode } = useGameUi();

  useEffect(() => {
    setScreenMode(GAME_UI_MODE.SAILING);
  }, [setScreenMode]);

  return children;
}

const renderWithProviders = (route, ui) => {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <WebSocketProvider>
          <GameUiProvider>
            <SailingUiHarness>{ui}</SailingUiHarness>
          </GameUiProvider>
        </WebSocketProvider>
      </MemoryRouter>
    </AuthProvider>,
  );
};

describe('WebSocket send regressions (chat + keyboard)', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    keyboardSubscriber = null;
    localStorage.clear();
    localStorage.setItem('token', createJwt({ sub: 'alice', exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('auth-user', JSON.stringify({ username: 'alice' }));
    vi.stubGlobal('WebSocket', MockWebSocket);

    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {};
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ChatBlock: sends tuple message to WebSocket when connected', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders('/lobby', <ChatBlock />);

    const ws = MockWebSocket.instances[0];
    await act(() => {
      ws.open();
    });

    const input = screen.getByPlaceholderText('Message the lobby...');
    await waitFor(() => expect(input).not.toBeDisabled());

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(ws.sent).toContain(JSON.stringify(['CHAT_MESSAGE', { to: 'group:lobby', text: 'hello' }]));
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes('WebSocket send failed'))).toBe(false);

    warnSpy.mockRestore();
  });

  it('KeyPress: sends PLAYER_INPUT tuple to WebSocket when connected', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders('/game', <KeyPress />);

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
