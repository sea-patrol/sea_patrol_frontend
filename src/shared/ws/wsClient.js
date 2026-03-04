import { messageAdapter as defaultMessageAdapter } from './messageAdapter';

export const createWsClient = (options = {}) => {
  const { adapter = defaultMessageAdapter } = options;

  let socket = null;
  let reconnectTimerId = null;
  let shouldReconnect = true;
  let suppressReconnectSocket = null;
  let reconnectAttempt = 0;
  let activeUrl = null;

  const subscribersByType = new Map();

  const clearReconnectTimer = () => {
    if (reconnectTimerId) {
      clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
  };

  const suppressReconnectForCurrentSocket = () => {
    if (socket) suppressReconnectSocket = socket;
  };

  const getReconnectConfig = (connectOptions) => {
    const defaults = {
      initialDelayMs: 1000,
      maxDelayMs: 8000,
      factor: 2,
      maxAttempts: 5,
      cooldownMs: 30000,
    };

    if (typeof connectOptions?.reconnectDelayMs === 'number') {
      return {
        ...defaults,
        initialDelayMs: connectOptions.reconnectDelayMs,
        maxDelayMs: connectOptions.reconnectDelayMs,
      };
    }

    return { ...defaults, ...(connectOptions?.reconnect || {}) };
  };

  const getReconnectDelayMs = (connectOptions, attemptIndex) => {
    const reconnect = getReconnectConfig(connectOptions);
    const delay = reconnect.initialDelayMs * Math.pow(reconnect.factor, attemptIndex);
    return Math.min(delay, reconnect.maxDelayMs);
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
      suppressReconnectForCurrentSocket();
      socket.close();
    } catch {
      // ignore
    } finally {
      socket = null;
      activeUrl = null;
    }
  };

  const openSocket = (connectOptions) => {
    const { getUrl, onConnectionChange, onError, onMessageError, onReconnectAttempt, onOpen, onClose } = connectOptions;
    const url = getUrl?.();
    if (!url) return;

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) && activeUrl === url) {
      return;
    }

    if (socket) {
      safeCloseSocket();
    }

    const ws = new WebSocket(url);
    socket = ws;
    activeUrl = url;

    ws.onopen = () => {
      if (socket !== ws) return;
      reconnectAttempt = 0;
      clearReconnectTimer();
      onOpen?.();
      onConnectionChange?.(true);
    };

    ws.onerror = (error) => {
      if (socket !== ws) return;
      onError?.(error);
    };

    ws.onclose = (event) => {
      const isSuppressed = suppressReconnectSocket === ws;
      if (isSuppressed) suppressReconnectSocket = null;

      if (socket !== ws) return;

      onConnectionChange?.(false);
      socket = null;
      activeUrl = null;

      onClose?.(event);

      if (isSuppressed) return;

      if (!shouldReconnect) return;

      const reconnect = getReconnectConfig(connectOptions);
      if (reconnectAttempt >= reconnect.maxAttempts) {
        // делаем паузу и начинаем новый цикл попыток
        clearReconnectTimer();
        reconnectAttempt = 0;
        reconnectTimerId = setTimeout(() => {
          openSocket(connectOptions);
        }, reconnect.cooldownMs);
        return;
      }

      clearReconnectTimer();
      const currentAttemptIndex = reconnectAttempt;
      const delayMs = getReconnectDelayMs(connectOptions, currentAttemptIndex);
      reconnectAttempt += 1;

      onReconnectAttempt?.({ attempt: reconnectAttempt, delayMs });
      reconnectTimerId = setTimeout(() => {
        openSocket(connectOptions);
      }, delayMs);
    };

    ws.onmessage = (event) => {
      if (socket !== ws) return;
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
    reconnectAttempt = 0;
    clearReconnectTimer();
    openSocket(connectOptions);
  };

  const disconnect = () => {
    shouldReconnect = false;
    reconnectAttempt = 0;
    clearReconnectTimer();
    suppressReconnectForCurrentSocket();
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
