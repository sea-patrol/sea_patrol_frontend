import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

let wsState = {
  hasToken: true,
  isConnected: true,
  lastClose: null,
  subscribe: subscribeMock,
};

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    listRooms: vi.fn(),
    createRoom: vi.fn(),
  },
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => wsState,
}));

import { roomApi } from '../../shared/api/roomApi';
import * as messageType from '../../shared/constants/messageType';
import LobbyPanel from '../../widgets/LobbyPanel/LobbyPanel';

function emitWsMessage(type, payload) {
  const subscribers = wsSubscribers.get(type);
  if (!subscribers) {
    return;
  }

  subscribers.forEach((callback) => callback(payload));
}

describe('LobbyPanel', () => {
  beforeEach(() => {
    roomApi.listRooms.mockReset();
    roomApi.createRoom.mockReset();
    subscribeMock.mockClear();
    wsSubscribers.clear();
    wsState = {
      hasToken: true,
      isConnected: true,
      lastClose: null,
      subscribe: subscribeMock,
    };
  });

  it('renders room cards with map metadata after initial REST load and subscribes to lobby room messages', async () => {
    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [
          {
            id: 'sandbox-1',
            name: 'Sandbox 1',
            mapId: 'caribbean-01',
            mapName: 'Caribbean Sea',
            currentPlayers: 4,
            maxPlayers: 100,
            status: 'OPEN',
          },
        ],
      },
    });

    render(<LobbyPanel token="test-token" onJoinRoom={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading room catalog');

    await waitFor(() => {
      expect(screen.getByText('Sandbox 1')).toBeInTheDocument();
    });

    expect(subscribeMock).toHaveBeenCalledWith(messageType.ROOMS_SNAPSHOT, expect.any(Function));
    expect(subscribeMock).toHaveBeenCalledWith(messageType.ROOMS_UPDATED, expect.any(Function));
    expect(screen.getByText('Lobby realtime online')).toBeInTheDocument();
    expect(screen.getAllByText('Caribbean Sea').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Caribbean').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tropical Archipelago').length).toBeGreaterThan(0);
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('4/100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join room' })).toBeEnabled();
  });

  it('creates a room, auto-joins it and updates the catalog', async () => {
    const user = userEvent.setup();
    const onJoinRoom = vi.fn();

    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [],
      },
    });

    roomApi.createRoom.mockResolvedValueOnce({
      ok: true,
      data: {
        id: 'storm-run',
        name: 'Storm Run',
        mapId: 'test-sandbox-01',
        mapName: 'Test Sandbox',
        currentPlayers: 0,
        maxPlayers: 100,
        status: 'OPEN',
      },
    });

    render(<LobbyPanel token="test-token" onJoinRoom={onJoinRoom} />);

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Room name'), 'Storm Run');
    await user.selectOptions(screen.getByLabelText('Map'), 'test-sandbox-01');

    expect(screen.getByText('Debug Sandbox')).toBeInTheDocument();
    expect(screen.getByText('Dev Waters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create and join' }));

    await waitFor(() => {
      expect(roomApi.createRoom).toHaveBeenCalledWith('test-token', {
        name: 'Storm Run',
        mapId: 'test-sandbox-01',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Storm Run')).toBeInTheDocument();
      expect(screen.getAllByText('Test Sandbox').length).toBeGreaterThan(0);
      expect(screen.getByText('OPEN')).toBeInTheDocument();
      expect(onJoinRoom).toHaveBeenCalledWith({
        id: 'storm-run',
        name: 'Storm Run',
        mapId: 'test-sandbox-01',
        mapName: 'Test Sandbox',
        currentPlayers: 0,
        maxPlayers: 100,
        status: 'OPEN',
      });
    });
  });

  it('shows create error when backend rejects custom mapId', async () => {
    const user = userEvent.setup();

    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [],
      },
    });

    roomApi.createRoom.mockResolvedValueOnce({
      ok: false,
      error: {
        message: 'Unknown mapId',
      },
    });

    render(<LobbyPanel token="test-token" onJoinRoom={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Map'), '__custom__');
    await user.type(screen.getByLabelText('Custom mapId'), 'atlantic-void');
    await user.click(screen.getByRole('button', { name: 'Create and join' }));

    await waitFor(() => {
      expect(screen.getByText('Room creation failed')).toBeInTheDocument();
      expect(screen.getByText('Unknown mapId')).toBeInTheDocument();
    });
  });

  it('renders readable empty state when backend returns no rooms', async () => {
    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [],
      },
    });

    render(<LobbyPanel token="test-token" onJoinRoom={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });
  });

  it('applies ROOMS_SNAPSHOT and ROOMS_UPDATED as full live snapshots', async () => {
    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [],
      },
    });

    render(<LobbyPanel token="test-token" onJoinRoom={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });

    await act(() => {
      emitWsMessage(messageType.ROOMS_SNAPSHOT, {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [
          {
            id: 'sandbox-1',
            name: 'Sandbox 1',
            mapId: 'caribbean-01',
            mapName: 'Caribbean Sea',
            currentPlayers: 4,
            maxPlayers: 100,
            status: 'OPEN',
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Sandbox 1')).toBeInTheDocument();
    });

    await act(() => {
      emitWsMessage(messageType.ROOMS_UPDATED, {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [
          {
            id: 'fresh-harbor',
            name: 'Fresh Harbor',
            mapId: 'test-sandbox-01',
            mapName: 'Test Sandbox',
            currentPlayers: 1,
            maxPlayers: 100,
            status: 'OPEN',
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Fresh Harbor')).toBeInTheDocument();
      expect(screen.getAllByText('Dev Waters').length).toBeGreaterThan(0);
      expect(screen.queryByText('Sandbox 1')).not.toBeInTheDocument();
    });
  });

  it('renders error state and retries on refresh', async () => {
    const user = userEvent.setup();
    roomApi.listRooms
      .mockResolvedValueOnce({
        ok: false,
        error: {
          message: 'Backend unavailable',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          maxRooms: 5,
          maxPlayersPerRoom: 100,
          rooms: [],
        },
      });

    render(<LobbyPanel token="test-token" onJoinRoom={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load rooms')).toBeInTheDocument();
    });
    expect(screen.getByText('Backend unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh rooms' }));

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });
  });

  it('redirects auth flow when backend responds with unauthorized', async () => {
    const onUnauthorized = vi.fn();

    roomApi.listRooms.mockResolvedValueOnce({
      ok: false,
      error: {
        status: 401,
        message: 'Unauthorized',
      },
    });

    render(<LobbyPanel token="expired-token" onJoinRoom={() => {}} onUnauthorized={onUnauthorized} />);

    await waitFor(() => {
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('Unable to load rooms')).not.toBeInTheDocument();
  });

  it('shows join error and disables other cards while room entry is pending', async () => {
    const onJoinRoom = vi.fn();

    roomApi.listRooms.mockResolvedValueOnce({
      ok: true,
      data: {
        maxRooms: 5,
        maxPlayersPerRoom: 100,
        rooms: [
          {
            id: 'sandbox-1',
            name: 'Sandbox 1',
            mapId: 'caribbean-01',
            mapName: 'Caribbean Sea',
            currentPlayers: 4,
            maxPlayers: 100,
            status: 'OPEN',
          },
          {
            id: 'regatta-night',
            name: 'Regatta Night',
            mapId: 'test-sandbox-01',
            mapName: 'Test Sandbox',
            currentPlayers: 100,
            maxPlayers: 100,
            status: 'FULL',
          },
        ],
      },
    });

    render(
      <LobbyPanel
        token="test-token"
        onJoinRoom={onJoinRoom}
        joiningRoomId="sandbox-1"
        joinError="Room is full"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Sandbox 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Room join failed')).toBeInTheDocument();
    expect(screen.getByText('Room is full')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Joining...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Room full' })).toBeDisabled();
  });
});
