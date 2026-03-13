import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DebugUiProvider } from '@/features/debug/model/DebugUiContext';

const mockAuthState = {
  user: { username: 'alice' },
};

const mockGameState = {
  playerStates: {
    alice: {
      name: 'alice',
      x: 12.5,
      z: -8,
      angle: 0.5,
      velocity: 4.25,
      sailLevel: 2,
    },
  },
  wind: {
    angle: Math.PI / 2,
    speed: 10,
  },
};

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/features/game/model/GameStateContext', () => ({
  useGameState: () => ({
    state: mockGameState,
  }),
  selectCurrentPlayerState: (state, currentPlayerName) => state?.playerStates?.[currentPlayerName],
  selectWindState: (state) => state?.wind ?? null,
}));

import ProfileBlock from '@/widgets/GameHud/ProfileBlock';

describe('ProfileBlock', () => {
  it('shows core player, sail and wind information in the main HUD', () => {
    render(
      <DebugUiProvider>
        <ProfileBlock />
      </DebugUiProvider>,
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Скорость')).toBeInTheDocument();
    expect(screen.getByText('4.25')).toBeInTheDocument();
    expect(screen.getByText('Паруса')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('Свежий ветер')).toBeInTheDocument();
    expect(screen.getByText('Ветер: 90° / С')).toBeInTheDocument();
    expect(screen.getByText('Курс и ветер: Левый галс бейдевинд')).toBeInTheDocument();
    expect(screen.getByText(/тяга будет умеренной/)).toBeInTheDocument();
    expect(screen.getByText('Debug')).toBeInTheDocument();
  });
});
