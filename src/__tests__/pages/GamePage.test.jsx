import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const dispatchMock = vi.fn();
const hydrateRoomEntryMock = vi.fn();
const clearRoomSessionMock = vi.fn();
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

let mockLocation = { state: null };
let mockAuthState = {
  user: { username: 'alice' },
  token: 'test-token',
  loading: false,
  logout: vi.fn(),
};
let mockGameState = {
  state: {
    playerStates: {
      alice: { name: 'alice', x: 0, z: 0, angle: 0 },
    },
  },
  dispatch: dispatchMock,
};
let mockRoomSessionState = {
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
let mockWsState = {
  isConnected: true,
  lastClose: null,
  reconnectState: { phase: 'open', attempt: 0, delayMs: null },
  subscribe: subscribeMock,
};

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    leaveRoom: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => mockLocation,
  };
});

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/features/game/model/GameStateContext', () => ({
  useGameState: () => mockGameState,
  selectCurrentPlayerState: (state, currentPlayerName) => state?.playerStates?.[currentPlayerName],
}));

vi.mock('@/features/game/model/RoomSessionContext', () => ({
  useRoomSession: () => ({
    roomSession: mockRoomSessionState,
    hydrateRoomEntry: hydrateRoomEntryMock,
    clearRoomSession: clearRoomSessionMock,
  }),
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => mockWsState,
}));

vi.mock('@/features/ui-shell/ui/GameUiShell', () => ({
  default: ({ reconnectUiState, onLeaveRoom, leaveRoomState }) => (
    <div data-testid="game-ui-shell">
      {reconnectUiState ? `${reconnectUiState.status}:${reconnectUiState.roomId}:${Math.ceil(reconnectUiState.graceRemainingMs / 1000)}` : 'idle'}
      <button type="button" onClick={onLeaveRoom}>Leave room</button>
      <span data-testid="leave-room-status">{leaveRoomState?.status ?? 'idle'}</span>
      {leaveRoomState?.error && <span data-testid="leave-room-error">{leaveRoomState.error}</span>}
    </div>
  ),
}));

vi.mock('@/scene/GameMainScene', () => ({
  default: () => <div data-testid="game-scene" />,
}));

import GamePage from '../../pages/GamePage';
import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';

function emitWsMessage(type, payload) {
  const subscribers = wsSubscribers.get(type);
  if (!subscribers) {
    return;
  }

  subscribers.forEach((callback) => callback(payload));
}

describe('GamePage reconnect flow', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    dispatchMock.mockReset();
    hydrateRoomEntryMock.mockReset();
    clearRoomSessionMock.mockReset();
    subscribeMock.mockClear();
    wsSubscribers.clear();
    mockLocation = { state: null };
    mockAuthState = {
      user: { username: 'alice' },
      token: 'test-token',
      loading: false,
      logout: vi.fn(),
    };
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 0, z: 0, angle: 0 },
        },
      },
      dispatch: dispatchMock,
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
    mockWsState = {
      isConnected: true,
      lastClose: null,
      reconnectState: { phase: 'open', attempt: 0, delayMs: null },
      subscribe: subscribeMock,
    };
    roomApi.leaveRoom.mockReset();
  });

  it('shows reconnect state after the live room connection drops', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('game-ui-shell')).toHaveTextContent('idle');

    mockWsState = {
      ...mockWsState,
      isConnected: false,
      lastClose: { code: 1006, reason: 'abnormal' },
      reconnectState: { phase: 'reconnecting', attempt: 1, delayMs: 1000 },
    };

    rerender(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('game-ui-shell')).toHaveTextContent('waiting-socket:sandbox-1');
    });
  });

  it('starts reconnect flow immediately on fresh room resume when only persisted room metadata exists', async () => {
    mockGameState = {
      state: { playerStates: {} },
      dispatch: dispatchMock,
    };
    mockWsState = {
      isConnected: false,
      lastClose: null,
      reconnectState: { phase: 'connecting', attempt: 0, delayMs: null },
      subscribe: subscribeMock,
    };

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('game-ui-shell')).toHaveTextContent('waiting-socket:sandbox-1');
      expect(screen.queryByTestId('game-scene')).not.toBeInTheDocument();
    });
  });

  it('returns the player to home when websocket access is denied by duplicate session policy', async () => {
    mockWsState = {
      ...mockWsState,
      isConnected: false,
      lastClose: { code: 1008, reason: 'SEAPATROL_DUPLICATE_SESSION' },
      reconnectState: { phase: 'reconnecting', attempt: 1, delayMs: 1000 },
    };

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(clearRoomSessionMock).toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'RESET_STATE' });
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

  it('leaves the active room and navigates back to lobby without logout', async () => {
    const user = userEvent.setup();
    roomApi.leaveRoom.mockResolvedValueOnce({
      ok: true,
      data: {
        roomId: 'sandbox-1',
        status: 'LEFT',
        nextState: 'LOBBY',
      },
    });

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Leave room' }));

    await waitFor(() => {
      expect(roomApi.leaveRoom).toHaveBeenCalledWith('test-token', 'sandbox-1');
      expect(clearRoomSessionMock).toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'RESET_STATE' });
      expect(navigateMock).toHaveBeenCalledWith('/lobby', {
        replace: true,
        state: {
          roomExited: true,
        },
      });
    });
  });

  it('keeps the player in room and surfaces leave error when backend rejects exit', async () => {
    const user = userEvent.setup();
    roomApi.leaveRoom.mockResolvedValueOnce({
      ok: false,
      error: {
        type: 'http',
        status: 409,
        code: 'ROOM_SESSION_MISMATCH',
        message: 'Player is not bound to this room',
      },
    });

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Leave room' }));

    await waitFor(() => {
      expect(roomApi.leaveRoom).toHaveBeenCalledWith('test-token', 'sandbox-1');
      expect(screen.getByTestId('leave-room-status')).toHaveTextContent('error');
      expect(screen.getByTestId('leave-room-error')).toHaveTextContent('Player is not bound to this room');
      expect(clearRoomSessionMock).not.toHaveBeenCalled();
    });
  });

  it('returns the player to lobby when backend resumes the ws in lobby scope instead of the room', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    mockWsState = {
      ...mockWsState,
      isConnected: false,
      lastClose: { code: 1006, reason: 'abnormal' },
      reconnectState: { phase: 'reconnecting', attempt: 1, delayMs: 1000 },
    };

    rerender(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await act(async () => {
      emitWsMessage(messageType.ROOMS_SNAPSHOT, {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [],
      });
    });

    await waitFor(() => {
      expect(clearRoomSessionMock).toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'RESET_STATE' });
      expect(navigateMock).toHaveBeenCalledWith('/lobby', expect.objectContaining({ replace: true }));
    });
  });

  it('returns the player to lobby after the reconnect grace timeout expires', async () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(
        <MemoryRouter>
          <GamePage />
        </MemoryRouter>,
      );

      mockWsState = {
        ...mockWsState,
        isConnected: false,
        lastClose: { code: 1006, reason: 'abnormal' },
        reconnectState: { phase: 'reconnecting', attempt: 1, delayMs: 1000 },
      };

      rerender(
        <MemoryRouter>
          <GamePage />
        </MemoryRouter>,
      );

      await act(async () => {
        vi.advanceTimersByTime(15_100);
        vi.runOnlyPendingTimers();
      });

      expect(clearRoomSessionMock).toHaveBeenCalled();
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'RESET_STATE' });
      expect(navigateMock).toHaveBeenCalledWith('/lobby', expect.objectContaining({ replace: true }));
    } finally {
      vi.useRealTimers();
    }
  });
});
