import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const wsSubscribers = new Map();
const subscribeMock = vi.fn((type, callback) => {
  if (!wsSubscribers.has(type)) {
    wsSubscribers.set(type, new Set());
  }

  wsSubscribers.get(type).add(callback);
  return () => {
    wsSubscribers.get(type)?.delete(callback);
    if (wsSubscribers.get(type)?.size === 0) {
      wsSubscribers.delete(type);
    }
  };
});

const logoutMock = vi.fn();

let authState = {
  user: { username: 'alice' },
  token: 'test-token',
  loading: false,
  logout: logoutMock,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => ({ subscribe: subscribeMock }),
}));

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    joinRoom: vi.fn(),
  },
}));

vi.mock('@/widgets/LobbyPanel/LobbyPanel', () => ({
  default: ({ onJoinRoom, joiningRoomId, joinError }) => (
    <section>
      <button type="button" onClick={() => onJoinRoom?.({ id: 'sandbox-1', name: 'Sandbox 1' })}>
        Join sandbox
      </button>
      <div data-testid="joining-room">{joiningRoomId ?? 'none'}</div>
      {joinError && <div data-testid="join-error">{joinError}</div>}
    </section>
  ),
}));

vi.mock('@/widgets/ChatPanel/ChatBlock', () => ({
  default: ({ chatScope }) => <div data-testid="chat-block">{chatScope?.target}</div>,
}));

import LobbyPage from '../../pages/LobbyPage';
import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';

function emitWsMessage(type, payload) {
  const subscribers = wsSubscribers.get(type);
  if (!subscribers) {
    return;
  }

  subscribers.forEach((callback) => callback(payload));
}

describe('LobbyPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    subscribeMock.mockClear();
    wsSubscribers.clear();
    authState = {
      user: { username: 'alice' },
      token: 'test-token',
      loading: false,
      logout: logoutMock,
    };
    roomApi.joinRoom.mockReset();
  });

  it('renders a html-first lobby and moves to /game only after spawn assignment', async () => {
    const user = userEvent.setup();

    roomApi.joinRoom.mockResolvedValueOnce({
      ok: true,
      data: {
        roomId: 'sandbox-1',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
    });

    const { container } = render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByText('Harbor Lobby')).toBeInTheDocument();
    expect(screen.getByTestId('chat-block')).toHaveTextContent('group:lobby');

    await user.click(screen.getByRole('button', { name: 'Join sandbox' }));

    await waitFor(() => {
      expect(roomApi.joinRoom).toHaveBeenCalledWith('test-token', 'sandbox-1');
      expect(screen.getByText('Room admitted')).toBeInTheDocument();
    });

    await act(async () => {
      emitWsMessage(messageType.ROOM_JOINED, {
        roomId: 'sandbox-1',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      });
      emitWsMessage(messageType.SPAWN_ASSIGNED, {
        roomId: 'sandbox-1',
        reason: 'INITIAL',
        x: 0,
        z: 0,
        angle: 0,
      });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/game', {
        state: {
          roomEntry: {
            room: { id: 'sandbox-1', name: 'Sandbox 1' },
            joinResponse: {
              roomId: 'sandbox-1',
              mapId: 'caribbean-01',
              mapName: 'Caribbean Sea',
              currentPlayers: 1,
              maxPlayers: 100,
              status: 'JOINED',
            },
            spawn: {
              roomId: 'sandbox-1',
              reason: 'INITIAL',
              x: 0,
              z: 0,
              angle: 0,
            },
          },
        },
      });
    });
  });
});
