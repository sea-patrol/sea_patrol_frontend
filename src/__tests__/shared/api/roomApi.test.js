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
});
