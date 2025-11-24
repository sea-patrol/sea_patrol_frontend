import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import * as messageType from '../const/messageType';
import '../styles/ChatBlock.css';

function ChatBlock() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { sendMessage, isConnected, subscribe } = useWebSocket();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Подписка на сообщения типа "chat/message"
  useEffect(() => {
    const unsubscribe = subscribe(messageType.CHAT_MESSAGE, (payload) => {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, payload];
        return newMessages.slice(-30); // Ограничиваем количество сообщений
      });
    });

    return () => {
      unsubscribe(); // Отписываемся при размонтировании компонента
    };
  }, [subscribe]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = [messageType.CHAT_MESSAGE, { to: 'global', text: newMessage.trim() }];
    sendMessage(messageData);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  return (
    <div className="chat">
      <div className="board">
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.from === user.username ? 'own-message' : 'other-message'}`}>
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
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
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