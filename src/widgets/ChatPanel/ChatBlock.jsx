import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import './ChatBlock.css';

const DEFAULT_CHAT_SCOPE = Object.freeze({
  key: 'group:lobby',
  target: 'group:lobby',
  label: 'Lobby',
  caption: 'Lobby chat',
  emptyState: 'No lobby messages yet. Start the conversation!',
  placeholder: 'Message the lobby...',
});

function normalizeChatScope(chatScope) {
  if (!chatScope?.target) {
    return DEFAULT_CHAT_SCOPE;
  }

  return {
    key: chatScope.key ?? chatScope.target,
    target: chatScope.target,
    label: chatScope.label ?? DEFAULT_CHAT_SCOPE.label,
    caption: chatScope.caption ?? DEFAULT_CHAT_SCOPE.caption,
    emptyState: chatScope.emptyState ?? DEFAULT_CHAT_SCOPE.emptyState,
    placeholder: chatScope.placeholder ?? DEFAULT_CHAT_SCOPE.placeholder,
  };
}

function resolveMessageScopeKey(message, fallbackScopeKey) {
  const target = typeof message?.to === 'string' ? message.to : '';

  if (target === 'group:lobby' || target === 'global') {
    return 'group:lobby';
  }

  if (target.startsWith('group:room:')) {
    return target;
  }

  if (target.startsWith('user:')) {
    return fallbackScopeKey;
  }

  return fallbackScopeKey;
}

function ChatBlock({
  inputRef,
  isChatFocused = false,
  onChatFocus,
  onChatBlur,
  chatScope = DEFAULT_CHAT_SCOPE,
}) {
  const [messagesByScope, setMessagesByScope] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const localInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentScopeKeyRef = useRef(DEFAULT_CHAT_SCOPE.key);
  const { user } = useAuth();
  const { sendMessage, isConnected, subscribe, hasToken, lastClose } = useWebSocket();

  const resolvedInputRef = inputRef ?? localInputRef;
  const resolvedChatScope = useMemo(() => normalizeChatScope(chatScope), [chatScope]);
  const messages = messagesByScope[resolvedChatScope.key] ?? [];

  currentScopeKeyRef.current = resolvedChatScope.key;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setNewMessage('');
  }, [resolvedChatScope.key]);

  useEffect(() => {
    const unsubscribe = subscribe(messageType.CHAT_MESSAGE, (payload) => {
      const scopeKey = resolveMessageScopeKey(payload, currentScopeKeyRef.current);

      setMessagesByScope((prevMessagesByScope) => ({
        ...prevMessagesByScope,
        [scopeKey]: [...(prevMessagesByScope[scopeKey] ?? []), payload].slice(-30),
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage([messageType.CHAT_MESSAGE, { to: resolvedChatScope.target, text: newMessage.trim() }]);
    setNewMessage('');
    onChatBlur?.();
    resolvedInputRef.current?.blur();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onChatBlur?.();
      resolvedInputRef.current?.blur();
    }
  };

  return (
    <div className={`chat ${isChatFocused ? 'chat--focused' : ''}`}>
      <div className="board">
        <div className="connection-status">
          <div className="connection-status__realtime">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
            {isConnected ? 'Connected' : hasToken ? 'Disconnected' : 'No token'}
            {!isConnected && lastClose?.code !== undefined && (
              <span className="connection-close-info">
                (close: {String(lastClose.code)}{lastClose.reason ? `, ${lastClose.reason}` : ''})
              </span>
            )}
          </div>
          <div className="chat-scope" aria-label="Current chat scope">
            <span className="chat-scope__badge">{resolvedChatScope.label}</span>
            <span className="chat-scope__caption">{resolvedChatScope.caption}</span>
          </div>
        </div>
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">{resolvedChatScope.emptyState}</div>
          ) : (
            messages.map((message, index) => (
              <div key={`${resolvedChatScope.key}-${message.from ?? 'unknown'}-${index}`} className={`message ${message.from === user?.username ? 'own-message' : 'other-message'}`}>
                <div className="message-header">
                  <span className="username">{message.from}:</span>
                </div>
                <div className="message-content">{message.text}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="input-container">
        <input
          ref={resolvedInputRef}
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          onFocus={onChatFocus}
          onBlur={onChatBlur}
          onKeyDown={handleKeyDown}
          placeholder={resolvedChatScope.placeholder}
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBlock;
