import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    joinRoom: vi.fn(),
  },
}));

vi.mock('@/widgets/LobbyPanel/LobbyPanel', () => ({
  default: ({ onJoinRoom, joiningRoomId, joinError }) => (
    <section>
      <button type="button" onClick={() => onJoinRoom?.({ id: 'sandbox-1', name: 'Sandbox 1' })}>Join sandbox</button>
      <div data-testid="joining-room">{joiningRoomId ?? 'none'}</div>
      {joinError && <div data-testid="join-error">{joinError}</div>}
    </section>
  ),
}));

vi.mock('@/widgets/ChatPanel/ChatBlock', () => ({
  default: () => <div data-testid="chat-block" />,
}));

vi.mock('@/widgets/GameHud/GameStateInfo', () => ({
  default: () => <div data-testid="game-state-info" />,
}));

vi.mock('@/widgets/GameHud/ProfileBlock', () => ({
  default: () => <div data-testid="profile-block" />,
}));

import { GameUiProvider } from '../../../features/ui-shell/model/GameUiContext';
import GameUiShell from '../../../features/ui-shell/ui/GameUiShell';
import { roomApi } from '../../../shared/api/roomApi';
import * as messageType from '../../../shared/constants/messageType';

function emitWsMessage(type, payload) {
  const subscribers = wsSubscribers.get(type);
  if (!subscribers) {
    return;
  }

  subscribers.forEach((callback) => callback(payload));
}

describe('GameUiShell room join flow', () => {
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
    roomApi.joinRoom.mockReset();
    subscribeMock.mockClear();
    wsSubscribers.clear();
  });

  it('moves from lobby join into room loading and then sailing after room init arrives', async () => {
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

    const { rerender } = render(
      <GameUiProvider>
        <GameUiShell />
      </GameUiProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Join sandbox' }));

    await waitFor(() => {
      expect(roomApi.joinRoom).toHaveBeenCalledWith('test-token', 'sandbox-1');
    });

    expect(screen.getByText('Room admitted')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for ROOM_JOINED/)).toBeInTheDocument();

    await act(async () => {
      emitWsMessage(messageType.ROOM_JOINED, {
        roomId: 'sandbox-1',
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 1,
        maxPlayers: 100,
        status: 'JOINED',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Assigning spawn')).toBeInTheDocument();
    });

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
        <GameUiShell />
      </GameUiProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Initializing room state')).not.toBeInTheDocument();
      expect(screen.getByTestId('profile-block')).toBeInTheDocument();
    });
  });

  it('returns join errors back to lobby UI', async () => {
    roomApi.joinRoom.mockResolvedValueOnce({
      ok: false,
      error: {
        type: 'http',
        status: 409,
        code: 'ROOM_FULL',
        message: 'Room is full',
      },
    });

    render(
      <GameUiProvider>
        <GameUiShell />
      </GameUiProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Join sandbox' }));

    await waitFor(() => {
      expect(screen.getByTestId('join-error')).toHaveTextContent('Room is full');
    });

    expect(screen.queryByText('Joining room')).not.toBeInTheDocument();
  });
});
