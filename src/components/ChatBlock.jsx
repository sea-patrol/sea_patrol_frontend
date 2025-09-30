import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ChatBlock.css'

function ChatBlock() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const { token, user } = useAuth();
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const WS_URL = 'ws://localhost:8080/ws/chat';

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
            connectWebSocket();
        }

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            return; // Don't create new connection if already connected
        }
        
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            console.log('Connected to chat WebSocket');
        };

        ws.onmessage = (event) => {
            try {
                const messageData = JSON.parse(event.data);
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages, messageData];
                    return newMessages.slice(-30);
                });
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            setIsConnected(false);
            setTimeout(() => {
                if (token && user) {
                    connectWebSocket();
                }
            }, 3000);
        };
    };

    const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
    }

    try {
        const messageData = {
            content: newMessage.trim()
        };
        wsRef.current.send(JSON.stringify(messageData));
        setNewMessage('');
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