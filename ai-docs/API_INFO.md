# API_INFO.md

## 1. Назначение

Этот документ описывает текущее API, которое использует frontend Sea Patrol:

- REST (HTTP) для аутентификации и первичного lobby room catalog
- WebSocket для real-time синхронизации игры, чата и live lobby room updates

## 2. Base URLs и переменные окружения

Фронтенд поддерживает переопределение адресов через переменные окружения Vite:

- `VITE_API_BASE_URL` — базовый URL для HTTP (пример: `http://localhost:8080`)
- `VITE_WS_BASE_URL` — базовый URL для WebSocket (пример: `ws://localhost:8080`)

Если переменные не заданы:

- HTTP берётся из `window.location` + текущий hostname + порт `8080`
- WS берётся из `window.location` + текущий hostname + порт `8080`

## 3. REST API (HTTP)

### 3.1 Auth base path

Auth-префикс: `{{API_BASE_URL}}/api/v1/auth`

Канонический auth contract для MVP определяется фактической backend-реализацией и orchestration docs.

### 3.2 POST `/api/v1/auth/login`

Request JSON:
```json
{ "username": "alice", "password": "secret" }
```

Response `200 OK`:
```json
{ "username": "alice", "token": "<jwt>", "issuedAt": "...", "expiresAt": "..." }
```

Важно для frontend:
- `userId` не входит в текущий канонический login response;
- frontend не должен падать, если `userId` отсутствует;
- `token` обязателен для HTTP session и WebSocket подключения.

Ошибки:
- `400` — validation / bad request
- `401` — invalid credentials / unauthorized / invalid JWT

Канонический формат ошибки:
```json
{ "errors": [{ "code": "SEAPATROL_INVALID_PASSWORD", "message": "Invalid password" }] }
```

Важно:
- корневой `{ "message": "..." }` не является каноническим auth error contract;
- frontend parser извлекает сообщение из `errors[0].message`.

### 3.3 POST `/api/v1/auth/signup`

Request JSON:
```json
{ "username": "alice", "password": "secret", "email": "alice@example.com" }
```

Response `200 OK`:
```json
{ "username": "alice" }
```

Важно для frontend:
- `201 Created` c `{ id, username, email }` не является текущей каноникой MVP;
- duplicate username conflict (`409`) пока не зафиксирован как часть канонического contract.

### 3.4 GET `/api/v1/rooms`

Frontend `TASK-014` / `TASK-015` использует этот endpoint как первичный snapshot lobby room catalog перед live WS-обновлениями.

Требует заголовок:
- `Authorization: Bearer <jwt>`

Response `200 OK`:
```json
{
  "maxRooms": 5,
  "maxPlayersPerRoom": 100,
  "rooms": [
    {
      "id": "sandbox-1",
      "name": "Sandbox 1",
      "mapId": "caribbean-01",
      "mapName": "Caribbean Sea",
      "currentPlayers": 4,
      "maxPlayers": 100,
      "status": "OPEN"
    }
  ]
}
```

Важно для frontend:
- lobby screen делает rooms request при первом входе в `LOBBY` mode и по ручному refresh;
- `rooms` может быть пустым массивом, и UI должен показывать понятный empty state;
- error state должен читать `errors[0].message`, если backend вернул structured error;
- после первого REST snapshot lobby UI продолжает жить за счёт `ROOMS_SNAPSHOT` / `ROOMS_UPDATED` по тому же payload shape;
- ручной refresh остаётся fallback, если lobby WebSocket временно offline.

## 4. WebSocket API

Endpoint: `{{WS_BASE_URL}}/ws/game`

### 4.1 Авторизация

Фронтенд подключается с query-параметром:

`/ws/game?token=<jwt>`

### 4.2 Формат сообщений

Фронтенд умеет получать сообщения в двух эквивалентных форматах:

1. Tuple:
```json
["TYPE", { "any": "payload" }]
```

2. Object:
```json
{ "type": "TYPE", "payload": { "any": "payload" } }
```

Фронтенд отправляет сообщения в формате tuple.

### 4.3 Исходящие сообщения (frontend -> backend)

#### `CHAT_MESSAGE`
```json
["CHAT_MESSAGE", { "to": "global", "text": "hello" }]
```

#### `PLAYER_INPUT`
```json
["PLAYER_INPUT", { "up": true, "down": false, "left": false, "right": false }]
```

### 4.4 Входящие сообщения (backend -> frontend)

#### Используются текущим UI/runtime

`INIT_GAME_STATE`
```json
["INIT_GAME_STATE", { "players": [{ "name": "alice", "x": 0, "z": 0, "angle": 0 }] }]
```

`UPDATE_GAME_STATE`
```json
["UPDATE_GAME_STATE", { "players": [{ "name": "alice", "x": 10, "z": 5 }] }]
```

`PLAYER_JOIN`
```json
["PLAYER_JOIN", { "name": "bob", "x": 1, "z": 2, "angle": 0 }]
```

`PLAYER_LEAVE`
```json
["PLAYER_LEAVE", "bob"]
```
или
```json
["PLAYER_LEAVE", { "username": "bob" }]
```

`CHAT_MESSAGE`
```json
["CHAT_MESSAGE", { "from": "bob", "text": "hi" }]
```

#### Используются текущим lobby UI начиная с `TASK-015`

`ROOMS_SNAPSHOT`
```json
{ "maxRooms": 5, "maxPlayersPerRoom": 100, "rooms": [] }
```

`ROOMS_UPDATED`
```json
{ "maxRooms": 5, "maxPlayersPerRoom": 100, "rooms": [] }
```

Особенности для frontend:
- `ROOMS_SNAPSHOT` приходит автоматически после lobby WebSocket connect/reconnect;
- `ROOMS_UPDATED` трактуется как полный snapshot room catalog, а не delta-патч;
- lobby UI подписывается на эти сообщения отдельно от room gameplay state.

#### Уже согласованы в contract, но ещё не подключены в UI

`ROOM_JOINED`, `ROOM_JOIN_REJECTED`, `SPAWN_ASSIGNED` уже входят в согласованный room contract, но frontend runtime ещё не обрабатывает их в UI на этой стадии roadmap.

## 5. Список message types

### Активно используются на фронте сейчас
- Chat: `CHAT_MESSAGE`
- Lobby/rooms: `ROOMS_SNAPSHOT`, `ROOMS_UPDATED`
- Game: `INIT_GAME_STATE`, `UPDATE_GAME_STATE`, `PLAYER_JOIN`, `PLAYER_LEAVE`, `PLAYER_INPUT`

### Уже зафиксированы в contract, но не используются в UI после `TASK-015`
- Chat control: `CHAT_JOIN`, `CHAT_LEAVE`
- Room enter flow: `ROOM_JOINED`, `ROOM_JOIN_REJECTED`
- Spawn/game init: `SPAWN_ASSIGNED`
