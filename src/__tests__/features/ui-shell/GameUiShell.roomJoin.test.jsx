import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockAuthState = {
  user: { username: 'alice' },
  token: 'test-token',
  loading: false,
};

let mockGameState = {
  state: { playerStates: {} },
};

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

vi.mock('@/widgets/GameHud/GameStateInfo', () => ({
  default: () => <div data-testid="game-state-info" />,
}));

vi.mock('@/widgets/GameHud/ProfileBlock', () => ({
  default: () => <div data-testid="profile-block" />,
}));

import { GameUiProvider } from '../../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../../features/ui-shell/ui/GameUiShell';
import * as messageType from '../../../shared/constants/messageType';

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
      <GameUiProvider>
        <GameUiShell initialRoomEntry={initialRoomEntry} />
      </GameUiProvider>,
    );

    expect(screen.getByText('Assigning spawn')).toBeInTheDocument();
    expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 1 (sandbox-1) | group:room:sandbox-1');

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
    });

    mockGameState = {
      state: {
        playerStates: {
          alice: { name: 'alice', x: 0, z: 0, angle: 0 },
        },
      },
    };

    rerender(
      <GameUiProvider>
        <GameUiShell initialRoomEntry={initialRoomEntry} />
      </GameUiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Initializing room state')).not.toBeInTheDocument();
      expect(screen.getByTestId('profile-block')).toBeInTheDocument();
      expect(screen.getByTestId('chat-block')).toHaveTextContent('Room | Sandbox 1 (sandbox-1) | group:room:sandbox-1');
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
      <GameUiProvider>
        <GameUiShell initialRoomEntry={initialRoomEntry} />
      </GameUiProvider>,
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
});
