import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ChatBlock.css'

function ChatBlock() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const { token, user } = useAuth();
    const eventSourceRef = useRef(null);
    const messagesEndRef = useRef(null);
    const API_BASE_URL = 'http://localhost:8080/api/v1/chat';

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize SSE connection when component mounts and user is authenticated
    useEffect(() => {
        if (token && user) {
            connectToEventStream();
        }

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [token, user]);

    const connectToEventStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`${API_BASE_URL}/messages/stream`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            console.log('Connected to chat stream');
        };

        eventSource.onmessage = (event) => {
            try {
                const messageData = JSON.parse(event.data);
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages, messageData];
                    // Keep only the last 30 messages
                    return newMessages.slice(-30);
                });
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            setIsConnected(false);
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                if (token && user) {
                    connectToEventStream();
                }
            }, 3000);
        };
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !token) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMessage.trim())
            });

            if (response.ok) {
                setNewMessage('');
            } else {
                console.error('Failed to send message:', response.statusText);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
    };

    // Don't render chat if user is not authenticated
    if (!token || !user) {
        return (
            <div className="chat">
                <div className='board'>
                    <div className="auth-message">Please log in to use chat</div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat">
            <div className='board'>
                <div className="connection-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
                    {isConnected ? 'Connected' : 'Connecting...'}
                </div>
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="no-messages">No messages yet. Start the conversation!</div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index} className={`message ${message.username === user.username ? 'own-message' : 'other-message'}`}>
                                <div className="message-header">
                                    <span className="username">{message.username}</span>
                                </div>
                                <div className="message-content">{message.message}</div>
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
                    onClick={sendMessage} 
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