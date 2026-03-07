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
      username: testUsers.validUser.username,
      issuedAt: '2026-03-06T10:00:00.000Z',
      expiresAt: '2026-03-06T11:00:00.000Z',
    },
    invalidPassword: {
      errors: [
        {
          code: 'SEAPATROL_INVALID_PASSWORD',
          message: 'Invalid password',
        },
      ],
    },
    validationError: {
      errors: [
        {
          code: 'SEAPATROL_VALIDATION_ERROR',
          message: 'username: must not be blank',
        },
      ],
    },
  },
  signup: {
    success: {
      username: 'newuser',
    },
    validationError: {
      errors: [
        {
          code: 'SEAPATROL_VALIDATION_ERROR',
          message: 'email: must be a well-formed email address',
        },
      ],
    },
  },
};

export const mockRoomCatalogResponses = {
  populated: {
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
        mapId: 'caribbean-01',
        mapName: 'Caribbean Sea',
        currentPlayers: 100,
        maxPlayers: 100,
        status: 'FULL',
      },
    ],
  },
  empty: {
    maxRooms: 5,
    maxPlayersPerRoom: 100,
    rooms: [],
  },
};

export const mockRoomCreateResponses = {
  success: {
    id: 'sandbox-3',
    name: 'Sandbox 3',
    mapId: 'caribbean-01',
    mapName: 'Caribbean Sea',
    currentPlayers: 0,
    maxPlayers: 100,
    status: 'OPEN',
  },
  invalidMapId: {
    errors: [
      {
        code: 'INVALID_MAP_ID',
        message: 'Unknown mapId',
      },
    ],
  },
};

export const mockRoomJoinResponses = {
  success: {
    roomId: 'sandbox-1',
    mapId: 'caribbean-01',
    mapName: 'Caribbean Sea',
    currentPlayers: 1,
    maxPlayers: 100,
    status: 'JOINED',
  },
  roomFull: {
    errors: [
      {
        code: 'ROOM_FULL',
        message: 'Room is full',
      },
    ],
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
