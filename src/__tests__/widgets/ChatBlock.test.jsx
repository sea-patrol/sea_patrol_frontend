import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockAuthState = {
  user: { username: 'alice' },
};

const wsSubscribers = new Map();
const sendMessageMock = vi.fn();

let mockWsState = {
  sendMessage: sendMessageMock,
  isConnected: true,
  subscribe: (type, callback) => {
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
  },
  hasToken: true,
  lastClose: null,
};

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/features/realtime/model/WebSocketContext', () => ({
  useWebSocket: () => mockWsState,
}));

import * as messageType from '../../shared/constants/messageType';
import ChatBlock from '../../widgets/ChatPanel/ChatBlock';

function emitChatMessage(payload) {
  wsSubscribers.get(messageType.CHAT_MESSAGE)?.forEach((callback) => callback(payload));
}

const lobbyScope = {
  key: 'group:lobby',
  target: 'group:lobby',
  label: 'Lobby',
  caption: 'Lobby chat',
  emptyState: 'No lobby messages yet. Start the conversation!',
  placeholder: 'Message the lobby...',
};

const roomScope = {
  key: 'group:room:sandbox-1',
  target: 'group:room:sandbox-1',
  label: 'Room',
  caption: 'Sandbox 1 (sandbox-1)',
  emptyState: 'No messages in Sandbox 1 yet. Start with a room callout!',
  placeholder: 'Message Sandbox 1...',
};

describe('ChatBlock scoped chat UI', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView ??= vi.fn();
    mockAuthState = {
      user: { username: 'alice' },
    };
    mockWsState = {
      sendMessage: sendMessageMock,
      isConnected: true,
      subscribe: mockWsState.subscribe,
      hasToken: true,
      lastClose: null,
    };
    sendMessageMock.mockReset();
    wsSubscribers.clear();
  });

  it('shows the current chat scope and routes outgoing messages to the active target', () => {
    render(<ChatBlock chatScope={lobbyScope} />);

    expect(screen.getByLabelText('Current chat scope')).toHaveTextContent('Lobby');
    expect(screen.getByLabelText('Current chat scope')).toHaveTextContent('Lobby chat');

    fireEvent.change(screen.getByPlaceholderText('Message the lobby...'), { target: { value: 'Harbor call' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessageMock).toHaveBeenCalledWith(['CHAT_MESSAGE', { to: 'group:lobby', text: 'Harbor call' }]);
  });

  it('keeps lobby and room histories isolated when the visible scope changes', async () => {
    const { rerender } = render(<ChatBlock chatScope={lobbyScope} />);

    await act(async () => {
      emitChatMessage({ from: 'harbor-master', to: 'group:lobby', text: 'Welcome to the harbor' });
      emitChatMessage({ from: 'captain-bob', to: 'group:room:sandbox-1', text: 'Room briefing' });
    });

    expect(screen.getByText('Welcome to the harbor')).toBeInTheDocument();
    expect(screen.queryByText('Room briefing')).not.toBeInTheDocument();

    rerender(<ChatBlock chatScope={roomScope} />);

    expect(screen.getByLabelText('Current chat scope')).toHaveTextContent('Room');
    expect(screen.getByLabelText('Current chat scope')).toHaveTextContent('Sandbox 1 (sandbox-1)');
    expect(screen.getByText('Room briefing')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to the harbor')).not.toBeInTheDocument();
  });

  it('falls back to the current scope for legacy inbound chat payloads without `to`', async () => {
    render(<ChatBlock chatScope={lobbyScope} />);

    await act(async () => {
      emitChatMessage({ from: 'system', text: 'Legacy hello' });
    });

    expect(screen.getByText('Legacy hello')).toBeInTheDocument();
    expect(screen.queryByText('No lobby messages yet. Start the conversation!')).not.toBeInTheDocument();
  });
});
