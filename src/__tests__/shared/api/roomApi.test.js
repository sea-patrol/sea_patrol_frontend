import { describe, expect, it } from 'vitest';

import { roomApi } from '../../../shared/api/roomApi';

describe('roomApi', () => {
  it('listRooms: returns canonical room catalog on success', async () => {
    const result = await roomApi.listRooms('test-jwt-token-valid-user');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
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
    });
  });

  it('listRooms: rejects missing token before fetch', async () => {
    const result = await roomApi.listRooms(null);

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'auth',
      message: 'Authorization token is required',
    });
  });

  it('createRoom: sends canonical room draft and returns room summary on success', async () => {
    const result = await roomApi.createRoom('test-jwt-token-valid-user', {
      name: 'Sandbox 3',
      mapId: 'caribbean-01',
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      id: 'sandbox-3',
      name: 'Sandbox 3',
      mapId: 'caribbean-01',
      mapName: 'Caribbean Sea',
      currentPlayers: 0,
      maxPlayers: 100,
      status: 'OPEN',
    });
  });

  it('createRoom: surfaces structured backend validation errors', async () => {
    const result = await roomApi.createRoom('test-jwt-token-valid-user', {
      name: 'Broken Map',
      mapId: 'atlantic-void',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'http',
      status: 400,
      code: 'INVALID_MAP_ID',
      message: 'Unknown mapId',
    });
  });

  it('joinRoom: returns canonical join response on success', async () => {
    const result = await roomApi.joinRoom('test-jwt-token-valid-user', 'sandbox-1');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      roomId: 'sandbox-1',
      mapId: 'caribbean-01',
      mapName: 'Caribbean Sea',
      currentPlayers: 1,
      maxPlayers: 100,
      status: 'JOINED',
    });
  });

  it('joinRoom: surfaces structured backend errors', async () => {
    const result = await roomApi.joinRoom('test-jwt-token-valid-user', 'regatta-night');

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'http',
      status: 409,
      code: 'ROOM_FULL',
      message: 'Room is full',
    });
  });

  it('leaveRoom: returns canonical leave response on success', async () => {
    const result = await roomApi.leaveRoom('test-jwt-token-valid-user', 'sandbox-1');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      roomId: 'sandbox-1',
      status: 'LEFT',
      nextState: 'LOBBY',
    });
  });

  it('leaveRoom: surfaces structured backend room-session errors', async () => {
    const result = await roomApi.leaveRoom('test-jwt-token-valid-user', 'missing-room-session');

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      type: 'http',
      status: 409,
      code: 'ROOM_SESSION_REQUIRED',
      message: 'Active room WebSocket session is required',
    });
  });
});
