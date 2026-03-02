# TASK-3 — Этап 2: Рефакторинг контекстов и хуков

## Метаданные
- **ID:** TASK-3
- **Ветка:** `feature/TASK-3`
- **Статус:** Done
- **Дата создания:** 2026-03-02
- **Дата завершения:** 2026-03-02

## Описание задачи
Рефакторинг контекстов и создание выделенных хуков для чистой архитектуры: AuthContext, WebSocketContext, GameStateContext без мутаций, кастомные хуки для переиспользования.

## Acceptance Criteria
- [x] AuthContext рефакторинг: API-вызовы вынесены в `api/auth.js`, централизована обработка ошибок, добавлен JSDoc
- [x] WebSocketContext рефакторинг: `useRef` заменён на `useReducer`, типизированы сообщения, добавлено переподключение с экспоненциальной задержкой
- [x] GameStateContext рефакторинг: иммутабельные обновления через `useReducer`, добавлены селекторы (`usePlayerState`, `useOtherPlayers`), убраны прямые мутации
- [x] Создана директория `hooks/` с хуками: `useAuth.js`, `useWebSocket.js`, `useGameState.js`, `useChat.js`, `usePlayerControls.js`
- [x] Добавить тесты — 162 теста проходят
- [x] Сборка проходит без ошибок (`npm run build`)
- [x] Тесты проходят (`npm run test:run`)

## Scope
**Включает:**
- Рефакторинг AuthContext с выносом API в `api/auth.js`
- Рефакторинг WebSocketContext с useReducer
- Рефакторинг GameStateContext с иммутабельными обновлениями
- Создание 5 кастомных хуков в `hooks/`
- Обновление компонентов для использования новых хуков
- Обновление тестов для контекстов

**Не включает (out-of-scope):**
- Рефакторинг компонентов (Этап 3)
- Миграция на TypeScript
- Изменение WebSocket-протокола

## Технический план
### Затрагиваемые файлы/модули
- `src/contexts/AuthContext.jsx` — рефакторинг
- `src/contexts/WebSocketContext.jsx` — рефакторинг
- `src/contexts/GameStateContext.jsx` — рефакторинг
- `src/api/auth.js` — новый файл (API-сервис)
- `src/hooks/useAuth.js` — новый хук
- `src/hooks/useWebSocket.js` — новый хук
- `src/hooks/useGameState.js` — новый хук
- `src/hooks/useChat.js` — новый хук
- `src/hooks/usePlayerControls.js` — новый хук
- `src/components/*` — обновление импортов

### Риски и меры контроля
| Риск | Мера контроля |
|------|---------------|
| Поломка игровой логики | Поэтапный рефакторинг, тесты после каждого контекста |
| Конфликты в Git | Короткоживущая ветка, частые мержи в main |
| Регрессия в WebSocket | Тестирование подключения/переподключения |
| Мутации состояния | Строгая проверка на code review |

## Рефакторинг контекстов

### 2.1 AuthContext
**Проблемы:**
- API-вызовы внутри компонента
- Нет обработки refresh-токенов
- Ошибки не централизованы

**Решение:**
- Вынести API в `api/auth.js`
- Добавить обработку ошибок
- JSDoc для всех функций

### 2.2 WebSocketContext
**Проблемы:**
- Мутации через `useRef` для подписчиков
- Нет типов сообщений
- Нет переподключения

**Решение:**
- Заменить на `useReducer`
- Типизировать сообщения (messageType.js)
- Добавить переподключение с экспоненциальной задержкой

### 2.3 GameStateContext
**Проблемы:**
- Прямые мутации `gameState.current`
- Нет селекторов для подвыборок

**Решение:**
- Иммутабельные обновления через `useReducer`
- Добавить селекторы: `usePlayerState(name)`, `useOtherPlayers()`
- Убрать прямые мутации

## Реализация

### Измененные файлы
1. `src/api/auth.js` — новый API-сервис для аутентификации
2. `src/contexts/AuthContext.jsx` — рефакторинг с использованием api/auth.js
3. `src/contexts/WebSocketContext.jsx` — useReducer вместо useRef
4. `src/contexts/GameStateContext.jsx` — иммутабельные обновления
5. `src/hooks/useAuth.js` — обёртка над AuthContext
6. `src/hooks/useWebSocket.js` — обёртка над WebSocketContext
7. `src/hooks/useGameState.js` — обёртка над GameStateContext с селекторами
8. `src/hooks/useChat.js` — логика чата
9. `src/hooks/usePlayerControls.js` — обработка клавиш
10. Компоненты — обновление импортов

## Проверки
### Build
```bash
npm run build
```
Статус: ✅

### Tests
```bash
npm run test:run
```
Статус: ✅ 162 теста

## QA Report
<!-- QA Engineer: результаты проверки -->
- [x] Все acceptance criteria проверены
- [x] Ключевые сценарии работают (логин, WebSocket подключение, игра)
- [x] Регресс не обнаружен
- [x] Build и tests проходят

**Статус:** Passed

**Найденные проблемы:**
- Нет критических проблем

## Code Review
<!-- Code Reviewer: замечания и решение -->

### Замечания
| Приоритет | Описание | Статус |
|-----------|----------|--------|
| Low | ESLint ошибки import/order в legacy коде | Pending (требует рефакторинга) |

**Решение:** Approve (архитектурные улучшения не влияют на логику)

## Финализация
- [ ] PR создан (`gh pr create`)
- [ ] PR замержен
- [ ] Задача перенесена в `ai-docs/backlog/done/`
- [ ] Документация обновлена (если нужно)

---
**Ссылки:**
- PR: #<N>
- Commit: `<hash>`
