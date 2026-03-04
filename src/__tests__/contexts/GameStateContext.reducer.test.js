import { describe, expect, it } from 'vitest';

import {
  gameStateReducer,
  initialGameState,
  selectCurrentPlayerState,
  selectPlayerNames,
  selectPlayerState,
  wsMessageToGameAction,
} from '../../features/game/model/GameStateContext';
import * as messageType from '../../shared/constants/messageType';

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    deepFreeze(value);
  }

  return obj;
}

describe('gameStateReducer', () => {
  it('INIT_GAME_STATE: нормализует players в playerStates[name]', () => {
    const action = {
      type: messageType.INIT_GAME_STATE,
      payload: {
        players: [
          { name: 'alice', x: 1, z: 2 },
          { name: 'bob', x: 3, z: 4 },
        ],
      },
    };

    const nextState = gameStateReducer(initialGameState, action);

    expect(nextState).toEqual({
      playerStates: {
        alice: { name: 'alice', x: 1, z: 2 },
        bob: { name: 'bob', x: 3, z: 4 },
      },
    });
  });

  it('UPDATE_GAME_STATE: обновляет только определённые поля иммутабельно', () => {
    const prevState = deepFreeze({
      playerStates: {
        alice: { name: 'alice', x: 0, z: 0, angle: 10, health: 100 },
      },
    });

    const action = {
      type: messageType.UPDATE_GAME_STATE,
      payload: {
        players: [{ name: 'alice', x: 5, z: undefined }],
      },
    };

    const nextState = gameStateReducer(prevState, action);

    expect(nextState).not.toBe(prevState);
    expect(nextState.playerStates).not.toBe(prevState.playerStates);
    expect(nextState.playerStates.alice).not.toBe(prevState.playerStates.alice);

    expect(prevState.playerStates.alice.x).toBe(0);
    expect(nextState.playerStates.alice).toEqual({
      name: 'alice',
      x: 5,
      z: 0,
      angle: 10,
      health: 100,
    });
  });

  it('PLAYER_JOIN: добавляет игрока по имени', () => {
    const prevState = deepFreeze({ playerStates: {} });

    const action = {
      type: messageType.PLAYER_JOIN,
      payload: { name: 'alice', x: 1 },
    };

    const nextState = gameStateReducer(prevState, action);

    expect(nextState.playerStates.alice).toEqual({ name: 'alice', x: 1 });
  });

  it('PLAYER_LEAVE: удаляет игрока по имени', () => {
    const prevState = deepFreeze({
      playerStates: {
        alice: { name: 'alice', x: 1 },
        bob: { name: 'bob', x: 2 },
      },
    });

    const action = {
      type: messageType.PLAYER_LEAVE,
      payload: 'alice',
    };

    const nextState = gameStateReducer(prevState, action);

    expect(nextState.playerStates).toEqual({ bob: { name: 'bob', x: 2 } });
  });

  it('selectors: возвращают список игроков и игрока по имени', () => {
    const state = deepFreeze({
      playerStates: {
        alice: { name: 'alice', x: 1 },
        bob: { name: 'bob', x: 2 },
      },
    });

    expect(selectPlayerNames(state).sort()).toEqual(['alice', 'bob']);
    expect(selectPlayerState(state, 'alice')).toEqual({ name: 'alice', x: 1 });
    expect(selectCurrentPlayerState(state, 'bob')).toEqual({ name: 'bob', x: 2 });
  });

  it('wsMessageToGameAction: маппит WS-сообщения в reducer actions', () => {
    expect(wsMessageToGameAction(messageType.INIT_GAME_STATE, { players: [] })).toEqual({
      type: messageType.INIT_GAME_STATE,
      payload: { players: [] },
    });

    expect(wsMessageToGameAction(messageType.PLAYER_LEAVE, 'alice')).toEqual({
      type: messageType.PLAYER_LEAVE,
      payload: 'alice',
    });

    expect(wsMessageToGameAction(messageType.PLAYER_LEAVE, { username: 'bob' })).toEqual({
      type: messageType.PLAYER_LEAVE,
      payload: 'bob',
    });

    expect(wsMessageToGameAction('SOME_UNKNOWN', {})).toBe(null);
  });
});
