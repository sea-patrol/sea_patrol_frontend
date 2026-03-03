import { messageAdapter as defaultMessageAdapter } from './messageAdapter';

export const createWsClient = (options = {}) => {
  const { adapter = defaultMessageAdapter } = options;

  let socket = null;
  let reconnectTimerId = null;
  let shouldReconnect = true;
  let suppressReconnectOnce = false;

  const subscribersByType = new Map();

  const clearReconnectTimer = () => {
    if (reconnectTimerId) {
      clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
  };

  const unsubscribe = (type, callback) => {
    const set = subscribersByType.get(type);
    if (!set) return;
    set.delete(callback);
    if (set.size === 0) {
      subscribersByType.delete(type);
    }
  };

  const notifySubscribers = (type, payload) => {
    const set = subscribersByType.get(type);
    if (!set) return;
    set.forEach((callback) => callback(payload));
  };

  const safeCloseSocket = () => {
    if (!socket) return;
    try {
      socket.close();
    } catch {
      // ignore
    } finally {
      socket = null;
    }
  };

  const openSocket = (connectOptions) => {
    const { getUrl, onConnectionChange, onError, onMessageError } = connectOptions;
    const url = getUrl?.();
    if (!url) return;

    if (socket && socket.readyState === WebSocket.OPEN) return;

    if (socket) {
      suppressReconnectOnce = true;
      safeCloseSocket();
    }

    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => {
      onConnectionChange?.(true);
    };

    ws.onerror = (error) => {
      onError?.(error);
      onConnectionChange?.(false);
    };

    ws.onclose = () => {
      onConnectionChange?.(false);

      if (suppressReconnectOnce) {
        suppressReconnectOnce = false;
        return;
      }

      if (!shouldReconnect) return;

      clearReconnectTimer();
      reconnectTimerId = setTimeout(() => {
        openSocket(connectOptions);
      }, connectOptions.reconnectDelayMs ?? 3000);
    };

    ws.onmessage = (event) => {
      const parsed = adapter.parseMessage(event.data);
      if (!parsed.ok) {
        onMessageError?.(parsed.error);
        return;
      }

      notifySubscribers(parsed.message.type, parsed.message.payload);
    };
  };

  const connect = (connectOptions) => {
    shouldReconnect = true;
    clearReconnectTimer();
    openSocket(connectOptions);
  };

  const disconnect = () => {
    shouldReconnect = false;
    clearReconnectTimer();
    suppressReconnectOnce = true;
    safeCloseSocket();
  };

  const send = (messageData) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return { ok: false, error: { type: 'state', message: 'WebSocket is not open' } };
    }

    const serialized = adapter.serializeMessage(messageData);
    if (!serialized.ok) return serialized;

    try {
      socket.send(serialized.data);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: { type: 'send', message: 'Failed to send message', cause: error },
      };
    }
  };

  const subscribe = (type, callback) => {
    if (!subscribersByType.has(type)) {
      subscribersByType.set(type, new Set());
    }

    subscribersByType.get(type).add(callback);
    return () => unsubscribe(type, callback);
  };

  return {
    connect,
    disconnect,
    send,
    subscribe,
  };
};
