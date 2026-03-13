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
let mockLocation = { state: null };

let mockWsState = {
  lastClose: null,
  subscribe: subscribeMock,
};

let authState = {
  user: { username: 'alice' },
  token: 'test-token',
  loading: false,
  logout: logoutMock,
};

let mockGameState = {
  state: { playerStates: {} },
};

function createInitialRoomSessionState() {
  return {
    phase: 'idle',
    room: null,
    joinResponse: null,
    spawn: null,
  };
}

let mockRoomSessionState = createInitialRoomSessionState();

const startRoomJoinMock = vi.fn((room) => {
  mockRoomSessionState = {
    phase: 'joining',
    room: room ? { id: room.id, name: room.name ?? room.id } : null,
    joinResponse: null,
    spawn: null,
  };
});

const applyRoomJoinedMock = vi.fn((payload, fallbackRoom = null) => {
  mockRoomSessionState = {
    phase: 'joined',
    room: fallbackRoom ?? mockRoomSessionState.room,
    joinResponse: payload,
    spawn: mockRoomSessionState.spawn,
  };
});

const applySpawnAssignedMock = vi.fn((payload, fallbackRoom = null) => {
  mockRoomSessionState = {
    phase: 'spawned',
    room: fallbackRoom ?? mockRoomSessionState.room,
    joinResponse: mockRoomSessionState.joinResponse,
    spawn: payload,
  };
});

const clearRoomSessionMock = vi.fn(() => {
  mockRoomSessionState = createInitialRoomSessionState();
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => mockLocation,
  };
});

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/game/model/GameStateContext', () => ({
  useGameState: () => mockGameState,
  selectCurrentPlayerState: (state, currentPlayerName) => state?.playerStates?.[currentPlayerName],
}));

vi.mock('@/features/game/model/RoomSessionContext', () => ({
  useRoomSession: () => ({
    roomSession: mockRoomSessionState,
    startRoomJoin: startRoomJoinMock,
    applyRoomJoined: applyRoomJoinedMock,
    applySpawnAssigned: applySpawnAssignedMock,
    clearRoomSession: clearRoomSessionMock,
  }),
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => mockWsState,
}));

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    joinRoom: vi.fn(),
  },
}));

vi.mock('@/widgets/LobbyPanel/LobbyPanel', () => ({
  default: ({ onJoinRoom, joiningRoomId, joinError }) => (
    <section>
      <button
        type="button"
        onClick={() => onJoinRoom?.({
          id: 'sandbox-1',
          name: 'Sandbox 1',
          mapId: 'caribbean-01',
          mapName: 'Caribbean Sea',
          currentPlayers: 1,
          maxPlayers: 100,
          status: 'OPEN',
        })}
      >
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
    startRoomJoinMock.mockClear();
    applyRoomJoinedMock.mockClear();
    applySpawnAssignedMock.mockClear();
    clearRoomSessionMock.mockClear();
    authState = {
      user: { username: 'alice' },
      token: 'test-token',
      loading: false,
      logout: logoutMock,
    };
    mockLocation = { state: null };
    mockWsState = {
      lastClose: null,
      subscribe: subscribeMock,
    };
    mockGameState = {
      state: { playerStates: {} },
    };
    mockRoomSessionState = createInitialRoomSessionState();
    roomApi.joinRoom.mockReset();
  });

  it('renders a html-first lobby and moves to /game only after current player init is ready', async () => {
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

    const { container, rerender } = render(
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
      expect(screen.getAllByText('Caribbean Sea').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Caribbean').length).toBeGreaterThan(0);
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

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText('Waiting for room initialization')).toBeInTheDocument();
    expect(screen.getByText(/Spawn coordinates/)).toBeInTheDocument();

    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 0, z: 0, angle: 0 },
        },
      },
    };

    rerender(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/game', {
        replace: true,
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

  it('returns the player to home when websocket access is denied by duplicate session policy', async () => {
    mockRoomSessionState = {
      phase: 'active',
      room: { id: 'sandbox-1', name: 'Sandbox 1' },
      joinResponse: null,
      spawn: null,
    };
    mockWsState = {
      lastClose: { code: 1008, reason: 'SEAPATROL_DUPLICATE_SESSION' },
      subscribe: subscribeMock,
    };

    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(clearRoomSessionMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/', {
        replace: true,
        state: {
          accessDenied: {
            title: 'Access denied',
            body: 'Another browser tab already owns the active game session for alice. Close that tab or wait until it disconnects, then press Play again.',
          },
        },
      });
    });
  });

  it('shows reconnect warning when the room session was dropped back to lobby', () => {
    mockLocation = {
      state: {
        reconnectNotice: {
          title: 'Reconnect window expired',
          body: 'The room session was not restored within the reconnect grace window.',
        },
      },
    };

    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Reconnect window expired')).toBeInTheDocument();
    expect(screen.getByText('The room session was not restored within the reconnect grace window.')).toBeInTheDocument();
  });

  it('does not auto-resume the room after explicit exit to lobby', async () => {
    mockLocation = {
      state: {
        roomExited: true,
      },
    };
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 0, z: 0, angle: 0 },
        },
      },
    };
    mockRoomSessionState = {
      phase: 'active',
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
    };

    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(clearRoomSessionMock).toHaveBeenCalled();
    });

    expect(navigateMock).not.toHaveBeenCalledWith('/game', expect.anything());
    expect(screen.getByText('Harbor Lobby')).toBeInTheDocument();
  });
});
