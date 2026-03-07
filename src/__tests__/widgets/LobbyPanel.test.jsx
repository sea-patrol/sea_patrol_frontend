import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/roomApi', () => ({
  roomApi: {
    listRooms: vi.fn(),
  },
}));

import { roomApi } from '../../shared/api/roomApi';
import LobbyPanel from '../../widgets/LobbyPanel/LobbyPanel';

describe('LobbyPanel', () => {
  it('renders room cards after initial REST load', async () => {
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

    render(<LobbyPanel token="test-token" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading room catalog');

    await waitFor(() => {
      expect(screen.getByText('Sandbox 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Caribbean Sea')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('4/100')).toBeInTheDocument();
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

    render(<LobbyPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
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

    render(<LobbyPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load rooms')).toBeInTheDocument();
    });
    expect(screen.getByText('Backend unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh rooms' }));

    await waitFor(() => {
      expect(screen.getByText('No rooms yet')).toBeInTheDocument();
    });
  });
});
