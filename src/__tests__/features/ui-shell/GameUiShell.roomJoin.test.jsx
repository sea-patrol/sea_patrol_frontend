import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';


let mockAuthState = {
  user: { username: 'alice' },
  token: 'test-token',
  loading: false,
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

const markRoomActiveMock = vi.fn(() => {
  mockRoomSessionState = {
    ...mockRoomSessionState,
    phase: mockRoomSessionState.room ? 'active' : mockRoomSessionState.phase,
  };
});

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

let mockWsState = {
  hasToken: true,
  isConnected: true,
  lastClose: null,
  subscribe: subscribeMock,
};

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
    markRoomActive: markRoomActiveMock,
  }),
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => mockWsState,
}));

vi.mock('@/widgets/ChatPanel/ChatBlock', () => ({
  default: ({ chatScope }) => (
    <div data-testid="chat-block">
      {chatScope?.label} | {chatScope?.caption} | {chatScope?.target}
    </div>
  ),
}));

vi.mock('@/widgets/GameHud/ProfileBlock', () => ({
  default: () => <div data-testid="profile-block" />,
}));

import { GameUiProvider } from '../../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../../features/ui-shell/ui/GameUiShell';
import * as messageType from '../../../shared/constants/messageType';

import { DebugUiProvider } from '@/features/debug/model/DebugUiContext';

function emitWsMessage(type, payload) {
  const subscribers = wsSubscribers.get(type);
  if (!subscribers) {
    return;
  }

  subscribers.forEach((callback) => callback(payload));
}

describe('GameUiShell room init flow', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { username: 'alice' },
      token: 'test-token',
      loading: false,
    };
    mockGameState = {
      state: { playerStates: {} },
    };
    mockRoomSessionState = createInitialRoomSessionState();
    markRoomActiveMock.mockClear();
    mockWsState = {
      hasToken: true,
      isConnected: true,
      lastClose: null,
      subscribe: subscribeMock,
    };
    subscribeMock.mockClear();
    wsSubscribers.clear();
  });

  it('keeps room loading until current player snapshot arrives', async () => {
    const initialRoomEntry = {
      room: { id: 'sandbox-1', name: 'Sandbox 1' },
      joinResponse: {
        roomId: 'sandbox-1',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
    };

    const { rerender } = render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell initialRoomEntry={initialRoomEntry} />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    expect(screen.getByText('Assigning spawn')).toBeInTheDocument();
    expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 1 (sandbox-1) | group:room:sandbox-1');
    expect(screen.getAllByText('Caribbean Sea').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Caribbean').length).toBeGreaterThan(0);

    await act(async () => {
      emitWsMessage(messageType.SPAWN_ASSIGNED, {
        roomId: 'sandbox-1',
        reason: 'INITIAL',
        x: 0,
        z: 0,
        angle: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Initializing room state')).toBeInTheDocument();
      expect(screen.getByText(/Spawn is assigned/)).toBeInTheDocument();
      expect(screen.getByText(/Spawn coordinates/)).toBeInTheDocument();
    });

    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 0, z: 0, angle: 0 },
        },
      },
    };

    rerender(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell initialRoomEntry={initialRoomEntry} />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Initializing room state')).not.toBeInTheDocument();
      expect(screen.getByTestId('profile-block')).toBeInTheDocument();
      expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 1 (sandbox-1) | group:room:sandbox-1');
      expect(markRoomActiveMock).toHaveBeenCalled();
    });
  });

  it('shows room entry error if backend rejects the pending room session', async () => {
    const initialRoomEntry = {
      room: { id: 'sandbox-1', name: 'Sandbox 1' },
      joinResponse: {
        roomId: 'sandbox-1',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell initialRoomEntry={initialRoomEntry} />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await act(async () => {
      emitWsMessage(messageType.ROOM_JOIN_REJECTED, {
        roomId: 'sandbox-1',
        reason: 'FULL',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Room entry failed')).toBeInTheDocument();
      expect(screen.getByText('Room join rejected for sandbox-1: FULL')).toBeInTheDocument();
    });
  });

  it('uses persisted room session metadata when the room route is reopened without route state', async () => {
    mockRoomSessionState = {
      phase: 'spawned',
      room: { id: 'sandbox-2', name: 'Sandbox 2' },
      joinResponse: {
        roomId: 'sandbox-2',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
      spawn: {
        roomId: 'sandbox-2',
        reason: 'INITIAL',
        x: 4,
        z: 8,
        angle: 0,
      },
    };
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 4, z: 8, angle: 0 },
        },
      },
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-block')).toBeInTheDocument();
      expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 2 (sandbox-2) | group:room:sandbox-2');
      expect(markRoomActiveMock).toHaveBeenCalled();
    });
  });

  it('renders the base in-game HUD while sailing', async () => {
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 6, z: -3, angle: 0.25 },
        },
      },
    };
    mockRoomSessionState = {
      phase: 'active',
      room: { id: 'sandbox-6', name: 'Sandbox 6' },
      joinResponse: {
        roomId: 'sandbox-6',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
      spawn: null,
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-block')).toBeInTheDocument();
      expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 6 (sandbox-6) | group:room:sandbox-6');
      expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inventory' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Journal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });
  });

  it('shows dedicated reconnect progress copy while room resume is pending', async () => {
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 12, z: -4, angle: 0 },
        },
      },
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell
            initialRoomEntry={{
              room: { id: 'sandbox-4', name: 'Sandbox 4' },
            }}
            reconnectUiState={{
              active: true,
              status: 'waiting-room',
              roomId: 'sandbox-4',
              roomName: 'Sandbox 4',
              graceRemainingMs: 9000,
              wsPhase: 'open',
              attempt: 2,
              retryDelayMs: 4000,
              lastClose: { code: 1006, reason: 'abnormal' },
            }}
          />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Realtime link restored')).toBeInTheDocument();
      expect(screen.getByText(/Waiting for backend to rebind this client to Sandbox 4/)).toBeInTheDocument();
      expect(screen.getByText(/9s remaining/)).toBeInTheDocument();
      expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 4 (sandbox-4) | group:room:sandbox-4');
    });
  });

  it('opens menu modal and delegates room exit through the leave button', async () => {
    const user = userEvent.setup();
    const onLeaveRoom = vi.fn();
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 3, z: 4, angle: 0 },
        },
      },
    };
    mockRoomSessionState = {
      phase: 'active',
      room: { id: 'sandbox-3', name: 'Sandbox 3' },
      joinResponse: {
        roomId: 'sandbox-3',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
      spawn: null,
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell
            onLeaveRoom={onLeaveRoom}
            leaveRoomState={{ status: 'idle', error: null }}
          />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Дебаг: выкл' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(onLeaveRoom).toHaveBeenCalledTimes(1);
  });

  it('toggles debug UI from the room menu in dev mode', async () => {
    const user = userEvent.setup();
    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 1, z: 2, angle: 0 },
        },
      },
    };
    mockRoomSessionState = {
      phase: 'active',
      room: { id: 'sandbox-5', name: 'Sandbox 5' },
      joinResponse: {
        roomId: 'sandbox-5',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      },
      spawn: null,
    };

    render(
      <DebugUiProvider>
        <GameUiProvider>
          <GameUiShell
            onLeaveRoom={vi.fn()}
            leaveRoomState={{ status: 'idle', error: null }}
          />
        </GameUiProvider>
      </DebugUiProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const toggleButton = screen.getByRole('button', { name: 'Дебаг: выкл' });
    await user.click(toggleButton);

    expect(screen.getByRole('button', { name: 'Дебаг: вкл' })).toBeInTheDocument();
  });
});
