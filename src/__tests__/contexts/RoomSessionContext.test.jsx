import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockToken = 'test-token';

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => ({ token: mockToken }),
}));

import { RoomSessionProvider, useRoomSession } from '../../features/game/model/RoomSessionContext';

function RoomSessionConsumer() {
  const { roomSession, markRoomActive, clearRoomSession } = useRoomSession();

  return (
    <div>
      <div data-testid="phase">{roomSession.phase}</div>
      <div data-testid="room-id">{roomSession.room?.id ?? 'none'}</div>
      <button type="button" onClick={markRoomActive}>Mark active</button>
      <button type="button" onClick={clearRoomSession}>Clear</button>
    </div>
  );
}

describe('RoomSessionContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockToken = 'test-token';
  });

  it('hydrates persisted room session from localStorage on provider mount', async () => {
    localStorage.setItem('room-session', JSON.stringify({
      phase: 'active',
      room: { id: 'sandbox-3', name: 'Sandbox 3' },
      joinResponse: { roomId: 'sandbox-3' },
      spawn: { roomId: 'sandbox-3', reason: 'INITIAL', x: 0, z: 0, angle: 0 },
    }));

    render(
      <RoomSessionProvider>
        <RoomSessionConsumer />
      </RoomSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('active');
      expect(screen.getByTestId('room-id')).toHaveTextContent('sandbox-3');
    });
  });

  it('clears persisted room session when context is cleared', async () => {
    localStorage.setItem('room-session', JSON.stringify({
      phase: 'active',
      room: { id: 'sandbox-3', name: 'Sandbox 3' },
    }));

    const user = userEvent.setup();

    render(
      <RoomSessionProvider>
        <RoomSessionConsumer />
      </RoomSessionProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('phase')).toHaveTextContent('idle');
    expect(screen.getByTestId('room-id')).toHaveTextContent('none');
    expect(localStorage.getItem('room-session')).toBeNull();
  });

  it('drops persisted room session when auth token disappears', async () => {
    localStorage.setItem('room-session', JSON.stringify({
      phase: 'active',
      room: { id: 'sandbox-5', name: 'Sandbox 5' },
    }));

    const { rerender } = render(
      <RoomSessionProvider>
        <RoomSessionConsumer />
      </RoomSessionProvider>,
    );

    mockToken = null;

    rerender(
      <RoomSessionProvider>
        <RoomSessionConsumer />
      </RoomSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
      expect(localStorage.getItem('room-session')).toBeNull();
    });
  });
});
