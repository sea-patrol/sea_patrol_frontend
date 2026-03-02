/**
 * @file usePlayerControls - Хук для управления игроком
 * @description Обработка клавиш управления и отправка состояний на сервер
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import * as messageType from '../const/messageType';
import { useWebSocket } from './useWebSocket';

/**
 * @typedef {Object} PlayerInput
 * @property {boolean} up - Клавиша вверх
 * @property {boolean} down - Клавиша вниз
 * @property {boolean} left - Клавиша влево
 * @property {boolean} right - Клавиша вправо
 */

/**
 * @typedef {Object} UsePlayerControlsOptions
 * @property {boolean} [enabled=true] - Включено ли управление
 * @property {Function} [onInputChange] - Callback при изменении ввода
 */

/**
 * Хук для управления игроком с клавиатуры
 * @param {UsePlayerControlsOptions} options - Опции хука
 * @returns {Object} Объект с методами и состоянием управления
 * @returns {PlayerInput} returns.pressedKeys - Текущее состояние клавиш
 * @returns {boolean} returns.isEnabled - Статус включения управления
 * @returns {Function} returns.setEnabled - Установить статус включения
 * @returns {Function} returns.resetKeys - Сбросить все клавиши
 *
 * @example
 * const { pressedKeys, isEnabled, setEnabled } = usePlayerControls();
 *
 * @example
 * // С кастомным callback
 * usePlayerControls({
 *   onInputChange: (keys) => console.log('Input changed:', keys)
 * });
 */
export function usePlayerControls(options = {}) {
  const { enabled = true, onInputChange } = options;
  const [pressedKeys, setPressedKeys] = useState({
    up: false,
    down: false,
    right: false,
    left: false
  });

  const { sendMessage, isConnected } = useWebSocket();
  const previousKeysRef = useRef(pressedKeys);

  /**
   * Обработчик нажатия клавиш
   * @param {KeyboardEvent} e - Событие клавиатуры
   */
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    const keyMap = {
      'ArrowUp': 'up',
      'KeyW': 'up',
      'w': 'up',
      'W': 'up',
      'ArrowDown': 'down',
      'KeyS': 'down',
      's': 'down',
      'S': 'down',
      'ArrowLeft': 'left',
      'KeyA': 'left',
      'a': 'left',
      'A': 'left',
      'ArrowRight': 'right',
      'KeyD': 'right',
      'd': 'right',
      'D': 'right'
    };

    const action = keyMap[e.code] || keyMap[e.key];
    if (action) {
      e.preventDefault();
      setPressedKeys((prev) => ({
        ...prev,
        [action]: true
      }));
    }
  }, [enabled]);

  /**
   * Обработчик отпускания клавиш
   * @param {KeyboardEvent} e - Событие клавиатуры
   */
  const handleKeyUp = useCallback((e) => {
    const keyMap = {
      'ArrowUp': 'up',
      'KeyW': 'up',
      'w': 'up',
      'W': 'up',
      'ArrowDown': 'down',
      'KeyS': 'down',
      's': 'down',
      'S': 'down',
      'ArrowLeft': 'left',
      'KeyA': 'left',
      'a': 'left',
      'A': 'left',
      'ArrowRight': 'right',
      'KeyD': 'right',
      'd': 'right',
      'D': 'right'
    };

    const action = keyMap[e.code] || keyMap[e.key];
    if (action) {
      e.preventDefault();
      setPressedKeys((prev) => ({
        ...prev,
        [action]: false
      }));
    }
  }, []);

  // Отправка изменений состояния клавиш через WebSocket
  useEffect(() => {
    if (!enabled || !isConnected) return;

    // Проверяем, изменилось ли состояние
    const hasChanged = Object.keys(pressedKeys).some(
      (key) => pressedKeys[key] !== previousKeysRef.current[key]
    );

    if (hasChanged) {
      previousKeysRef.current = { ...pressedKeys };
      sendMessage([messageType.PLAYER_INPUT, pressedKeys]);

      if (onInputChange) {
        onInputChange(pressedKeys);
      }
    }
  }, [pressedKeys, enabled, isConnected, sendMessage, onInputChange]);

  // Подписка на глобальные события клавиатуры
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  /**
   * Устанавливает статус включения управления
   * @param {boolean} value - Статус включения
   */
  const setEnabled = useCallback((value) => {
    if (!value) {
      // При отключении сбрасываем все клавиши
      setPressedKeys({ up: false, down: false, left: false, right: false });
    }
  }, []);

  /**
   * Сбрасывает все клавиши в неактивное состояние
   */
  const resetKeys = useCallback(() => {
    setPressedKeys({ up: false, down: false, left: false, right: false });
  }, []);

  return {
    pressedKeys,
    isEnabled: enabled && isConnected,
    setEnabled,
    resetKeys
  };
}

export default usePlayerControls;
