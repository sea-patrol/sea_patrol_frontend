/**
 * @file useChat - Хук для работы с чатом
 * @description Логика чата: отправка, получение и хранение сообщений
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import * as messageType from '../const/messageType';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';

/**
 * @typedef {Object} ChatMessage
 * @property {string} from - Отправитель сообщения
 * @property {string} text - Текст сообщения
 * @property {number} [timestamp] - Временная метка
 */

/**
 * Хук для управления чатом
 * @param {Object} options - Опции хука
 * @param {number} [options.maxMessages=30] - Максимальное количество хранимых сообщений
 * @returns {Object} Объект с методами и состоянием чата
 * @returns {ChatMessage[]} returns.messages - Массив сообщений
 * @returns {string} returns.newMessage - Текущее введённое сообщение
 * @returns {boolean} returns.isConnected - Статус подключения WebSocket
 * @returns {Function} returns.sendMessage - Отправить сообщение
 * @returns {Function} returns.setNewMessage - Установить текст нового сообщения
 * @returns {Function} returns.clearMessages - Очистить все сообщения
 * @returns {Function} returns.handleKeyPress - Обработка нажатий клавиш
 *
 * @example
 * const { messages, newMessage, sendMessage, handleKeyPress } = useChat();
 *
 * @example
 * // Отправка сообщения
 * sendMessage('Hello, world!');
 *
 * @example
 * // Обработка Enter
 * <input onKeyPress={handleKeyPress} />
 */
export function useChat(options = {}) {
  const { maxMessages = 30 } = options;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const { user } = useAuth();
  const { sendMessage, isConnected, subscribe } = useWebSocket();

  // Подписка на входящие сообщения чата
  useEffect(() => {
    const unsubscribe = subscribe(messageType.CHAT_MESSAGE, (payload) => {
      setMessages((prevMessages) => {
        const newMessages = [
          ...prevMessages,
          {
            ...payload,
            timestamp: payload.timestamp || Date.now()
          }
        ];
        // Ограничиваем количество сообщений
        return newMessages.slice(-maxMessages);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, maxMessages]);

  /**
   * Отправляет сообщение в чат
   * @param {string} [text] - Текст сообщения (если не указан, используется newMessage)
   */
  const handleSendMessage = useCallback((text) => {
    const messageText = (text ?? newMessage).trim();
    if (!messageText || !isConnected) return;

    const messageData = [messageType.CHAT_MESSAGE, { to: 'global', text: messageText }];
    sendMessage(messageData);
    setNewMessage('');
  }, [newMessage, isConnected, sendMessage]);

  /**
   * Обработчик нажатия клавиш для отправки сообщения по Enter
   * @param {KeyboardEvent} e - Событие клавиатуры
   */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Очищает все сообщения
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Статистика сообщений для UI
   */
  const stats = useMemo(() => ({
    total: messages.length,
    isFull: messages.length >= maxMessages,
    hasMessages: messages.length > 0
  }), [messages.length, maxMessages]);

  return {
    messages,
    newMessage,
    isConnected,
    sendMessage: handleSendMessage,
    setNewMessage,
    clearMessages,
    handleKeyPress,
    stats
  };
}

export default useChat;
