# API_INFO.md

## 1. Назначение

Этот документ описывает **текущее API**, которое использует фронтенд Sea Patrol:

- **REST (HTTP)** для аутентификации
- **WebSocket** для real-time синхронизации и чата

## 2. Base URLs и переменные окружения

Фронтенд поддерживает переопределение адресов через переменные окружения (Vite):

- `VITE_API_BASE_URL` — базовый URL для HTTP (пример: `http://localhost:8080`)
- `VITE_WS_BASE_URL` — базовый URL для WebSocket (пример: `ws://localhost:8080`)

Если переменные не заданы:

- HTTP берётся из `window.location` (http/https) + текущий hostname + порт `8080`
- WS берётся из `window.location` (ws/wss) + текущий hostname + порт `8080`

## 3. REST API (HTTP)

Базовый префикс: `{{API_BASE_URL}}/api/v1/auth`

### 3.1 POST `/login`

**Request JSON**
```json
{ "username": "alice", "password": "secret" }
```

**Response 200 JSON**
```json
{ "token": "<jwt>", "userId": "user-1", "username": "alice" }
```

**Ошибки**
- `400` — невалидный запрос (ожидается JSON с `message`)
- `401` — неверные креды (ожидается JSON с `message`)

Минимальный формат ошибки, который читает фронтенд:
```json
{ "message": "Some error message" }
```

### 3.2 POST `/signup`

**Request JSON**
```json
{ "username": "alice", "password": "secret", "email": "alice@example.com" }
```

**Response 201 JSON**
```json
{ "id": "user-1", "username": "alice", "email": "alice@example.com" }
```

**Ошибки**
- `400` — валидация (ожидается JSON с `message`)
- `409` — пользователь уже существует (ожидается JSON с `message`)

## 4. WebSocket API

Endpoint: `{{WS_BASE_URL}}/ws/game`

### 4.1 Авторизация

Фронтенд подключается с query-параметром:

`/ws/game?token=<jwt>`

### 4.2 Формат сообщений

Фронтенд умеет **получать** сообщения в двух эквивалентных форматах (оба — JSON-строка):

1) Tuple:
```json
["TYPE", { "any": "payload" }]
```

2) Object:
```json
{ "type": "TYPE", "payload": { "any": "payload" } }
```

Фронтенд **отправляет** сообщения в формате tuple (см. примеры ниже).

### 4.3 Исходящие сообщения (frontend → backend)

#### `CHAT_MESSAGE`

Отправка сообщения в чат (сейчас используется глобальный чат):
```json
["CHAT_MESSAGE", { "to": "global", "text": "hello" }]
```

#### `PLAYER_INPUT`

Состояние клавиш управления кораблём:
```json
["PLAYER_INPUT", { "up": true, "down": false, "left": false, "right": false }]
```

### 4.4 Входящие сообщения (backend → frontend)

#### `INIT_GAME_STATE`

Первичная инициализация состояния (ожидается массив игроков):
```json
["INIT_GAME_STATE", { "players": [{ "name": "alice", "x": 0, "z": 0, "angle": 0 }] }]
```

#### `UPDATE_GAME_STATE`

Инкрементальные обновления (фронтенд применяет patch только по определённым полям игрока; отсутствующие поля не перезаписываются):
```json
["UPDATE_GAME_STATE", { "players": [{ "name": "alice", "x": 10, "z": 5 }] }]
```

#### `PLAYER_JOIN`

Подключение игрока (payload должен содержать `name`):
```json
["PLAYER_JOIN", { "name": "bob", "x": 1, "z": 2, "angle": 0 }]
```

#### `PLAYER_LEAVE`

Отключение игрока (принимается как строка или объект):
```json
["PLAYER_LEAVE", "bob"]
```
или
```json
["PLAYER_LEAVE", { "username": "bob" }]
```

#### `CHAT_MESSAGE`

Сообщение чата, которое рисует UI (минимум: `from` и `text`):
```json
["CHAT_MESSAGE", { "from": "bob", "text": "hi" }]
```

## 5. Список message types (текущее использование на фронте)

- Chat: `CHAT_MESSAGE`
- Game: `INIT_GAME_STATE`, `UPDATE_GAME_STATE`, `PLAYER_JOIN`, `PLAYER_LEAVE`, `PLAYER_INPUT`
- Зарезервировано/не используется в UI сейчас: `CHAT_JOIN`, `CHAT_LEAVE`

