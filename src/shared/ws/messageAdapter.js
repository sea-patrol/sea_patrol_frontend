const isPlainObject = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isMessageTuple = (value) => {
  return Array.isArray(value) && typeof value[0] === 'string';
};

export const messageAdapter = {
  parseMessage: (rawData) => {
    if (typeof rawData !== 'string') {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: 'WebSocket message must be a string',
        },
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch (error) {
      return {
        ok: false,
        error: {
          type: 'parse',
          message: 'Invalid JSON message',
          cause: error,
        },
      };
    }

    if (isMessageTuple(parsed)) {
      return {
        ok: true,
        message: {
          type: parsed[0],
          payload: parsed[1],
        },
      };
    }

    if (!isPlainObject(parsed) || typeof parsed.type !== 'string') {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: 'Invalid message shape',
          data: parsed,
        },
      };
    }

    return {
      ok: true,
      message: {
        type: parsed.type,
        payload: parsed.payload,
      },
    };
  },

  serializeMessage: (messageData) => {
    if (isMessageTuple(messageData)) {
      try {
        return { ok: true, data: JSON.stringify(messageData) };
      } catch (error) {
        return {
          ok: false,
          error: {
            type: 'serialize',
            message: 'Failed to serialize message',
            cause: error,
          },
        };
      }
    }

    if (!isPlainObject(messageData) || typeof messageData.type !== 'string') {
      return {
        ok: false,
        error: {
          type: 'validation',
          message: 'Outgoing message must be an object with string "type"',
          data: messageData,
        },
      };
    }

    try {
      return { ok: true, data: JSON.stringify(messageData) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: 'serialize',
          message: 'Failed to serialize message',
          cause: error,
        },
      };
    }
  },
};
