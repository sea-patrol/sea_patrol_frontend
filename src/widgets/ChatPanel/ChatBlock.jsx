import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/model/AuthContext';
import { useWebSocket } from '@/features/realtime/model/WebSocketContext';
import * as messageType from '@/shared/constants/messageType';
import './ChatBlock.css';

function ChatBlock({ inputRef, isChatFocused = false, onChatFocus, onChatBlur }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const localInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { sendMessage, isConnected, subscribe, hasToken, lastClose } = useWebSocket();

  const resolvedInputRef = inputRef ?? localInputRef;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const unsubscribe = subscribe(messageType.CHAT_MESSAGE, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload].slice(-30));
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage([messageType.CHAT_MESSAGE, { to: 'global', text: newMessage.trim() }]);
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
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : hasToken ? 'Disconnected' : 'No token'}
          {!isConnected && lastClose?.code !== undefined && (
            <span className="connection-close-info">
              (close: {String(lastClose.code)}{lastClose.reason ? `, ${lastClose.reason}` : ''})
            </span>
          )}
        </div>
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.from === user?.username ? 'own-message' : 'other-message'}`}>
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
          placeholder="Type your message..."
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
