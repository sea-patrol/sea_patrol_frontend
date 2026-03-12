import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const logoutMock = vi.fn();
let mockLocation = { state: null };

let mockAuthState = {
  user: { username: 'alice' },
  logout: logoutMock,
  isAuthenticated: true,
};

let mockRoomSessionState = {
  phase: 'idle',
  room: null,
  joinResponse: null,
  spawn: null,
};

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

vi.mock('@/features/game/model/RoomSessionContext', () => ({
  useRoomSession: () => ({
    roomSession: mockRoomSessionState,
  }),
}));

vi.mock('@/features/auth/ui/Login', () => ({
  default: () => <div>Login form</div>,
}));

vi.mock('@/features/auth/ui/Signup', () => ({
  default: () => <div>Signup form</div>,
}));

import HomePage from '../../pages/HomePage';

describe('HomePage navigation flow', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    mockLocation = { state: null };
    mockAuthState = {
      user: { username: 'alice' },
      logout: logoutMock,
      isAuthenticated: true,
    };
    mockRoomSessionState = {
      phase: 'idle',
      room: null,
      joinResponse: null,
      spawn: null,
    };
  });

  it('sends an authenticated player to the lobby when there is no known room session', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(navigateMock).toHaveBeenCalledWith('/lobby');
  });

  it('uses Play CTA to send the player back into a known room session after reload', async () => {
    const user = userEvent.setup();

    mockRoomSessionState = {
      phase: 'active',
      room: { id: 'sandbox-7', name: 'Sandbox 7' },
      joinResponse: null,
      spawn: null,
    };

    render(<HomePage />);

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByText(/Sandbox 7/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(navigateMock).toHaveBeenCalledWith('/game');
  });

  it('shows access denied notice when duplicate session policy blocks room entry', async () => {
    mockLocation = {
      state: {
        accessDenied: {
          title: 'Access denied',
          body: 'Another browser tab already owns the active game session for alice.',
        },
      },
    };

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(screen.getByText('Another browser tab already owns the active game session for alice.')).toBeInTheDocument();
    });
  });

  it('opens login modal when the route explicitly requests auth', async () => {
    mockLocation = {
      state: {
        openAuth: 'login',
      },
    };
    mockAuthState = {
      user: null,
      logout: logoutMock,
      isAuthenticated: false,
    };

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Login form')).toBeInTheDocument();
    });
  });
});
