// Тестовые данные для MSW и тестов

export const testUsers = {
  validUser: {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  },
  anotherUser: {
    id: 'test-user-2',
    username: 'anotheruser',
    email: 'another@example.com',
    password: 'password456',
  },
};

export const testTokens = {
  validUser: 'test-jwt-token-valid-user',
  anotherUser: 'test-jwt-token-another-user',
};

export const mockAuthResponses = {
  login: {
    success: {
      token: testTokens.validUser,
      userId: testUsers.validUser.id,
      username: testUsers.validUser.username,
    },
  },
  signup: {
    success: {
      id: testUsers.validUser.id,
      username: testUsers.validUser.username,
      email: testUsers.validUser.email,
    },
  },
};

export const mockGameStates = {
  initial: {
    playerStates: {
      testuser: {
        id: testUsers.validUser.id,
        name: testUsers.validUser.username,
        x: 0,
        z: 0,
        angle: 0,
        delta: 0.1,
        width: 10,
        height: 15,
        length: 30,
      },
    },
  },
};

export const mockWebSocketMessages = {
  gameStateUpdate: {
    type: 'GAME_STATE_UPDATE',
    payload: mockGameStates.initial,
  },
  playerJoined: {
    type: 'PLAYER_JOINED',
    payload: { playerId: testUsers.validUser.id, username: testUsers.validUser.username },
  },
  chatMessage: {
    type: 'CHAT_MESSAGE',
    payload: { sender: testUsers.validUser.username, message: 'Hello!' },
  },
};
