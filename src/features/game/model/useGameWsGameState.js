import { useEffect } from 'react';

import * as messageType from '../../../shared/constants/messageType';

import { wsMessageToGameAction } from './GameStateContext';

export function useGameWsGameState({
  subscribe,
  dispatch,
  setPlayerNames,
  currentPlayerName,
  acceptGameMessages = true,
}) {
  useEffect(() => {
    const unsubscribeInitGameInfo = subscribe(messageType.INIT_GAME_STATE, (payload) => {
      if (!acceptGameMessages) return;
      const action = wsMessageToGameAction(messageType.INIT_GAME_STATE, payload);
      if (action) dispatch(action);
      setPlayerNames?.(payload.players.map((player) => player.name));
    });

    const unsubscribeUpdateGameInfo = subscribe(messageType.UPDATE_GAME_STATE, (payload) => {
      if (!acceptGameMessages) return;
      const action = wsMessageToGameAction(messageType.UPDATE_GAME_STATE, payload);
      if (action) dispatch(action);
    });

    const unsubscribePlayerJoin = subscribe(messageType.PLAYER_JOIN, (payload) => {
      if (!acceptGameMessages) return;
      const action = wsMessageToGameAction(messageType.PLAYER_JOIN, payload);
      if (action) dispatch(action);

      setPlayerNames?.((prevNames) => [...prevNames, payload.name]);
    });

    const unsubscribePlayerLeave = subscribe(messageType.PLAYER_LEAVE, (payload) => {
      if (!acceptGameMessages) return;
      const action = wsMessageToGameAction(messageType.PLAYER_LEAVE, payload);
      if (action) dispatch(action);

      const username = typeof payload === 'string' ? payload : payload?.username ?? payload?.name;
      if (!username) return;
      setPlayerNames?.((prevNames) => prevNames.filter((name) => name !== username));
    });

    const unsubscribeSpawnAssigned = subscribe(messageType.SPAWN_ASSIGNED, (payload) => {
      if (!acceptGameMessages) return;
      if (!currentPlayerName) return;
      dispatch({
        type: messageType.SPAWN_ASSIGNED,
        payload: {
          currentPlayerName,
          spawn: payload,
        },
      });
    });

    return () => {
      unsubscribeInitGameInfo();
      unsubscribeUpdateGameInfo();
      unsubscribePlayerJoin();
      unsubscribePlayerLeave();
      unsubscribeSpawnAssigned();
    };
  }, [acceptGameMessages, currentPlayerName, dispatch, setPlayerNames, subscribe]);
}
