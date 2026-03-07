# API_INFO.md

## 1. Назначение

Этот документ описывает текущее API, которое использует frontend Sea Patrol:

- REST (HTTP) для аутентификации, первичного lobby room catalog и room join
- WebSocket для real-time синхронизации игры, чата, live lobby room updates и room init flow

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

### 3.5 POST `/api/v1/rooms/{roomId}/join`

Frontend `TASK-016` использует этот endpoint как единственный authoritative room join trigger.

Требует заголовок:
- `Authorization: Bearer <jwt>`

Request JSON:
```json
{}
```

Response `200 OK`:
```json
{
  "roomId": "sandbox-1",
  "mapId": "caribbean-01",
  "mapName": "Caribbean Sea",
  "currentPlayers": 1,
  "maxPlayers": 100,
  "status": "JOINED"
}
```

Важно для frontend:
- `join` стартует из lobby UI кнопкой `Join room`;
- ошибки `404` / `409` показываются пользователю через join error block в lobby;
- после REST `200 OK` frontend переводит shell в `ROOM_LOADING` и ждёт room init flow по WebSocket;
- клиент не должен считать room entry завершённым только по REST success.

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

#### Используются текущим lobby UI

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

#### Используются текущим room join / init flow начиная с `TASK-016`

`ROOM_JOINED`
```json
{
  "roomId": "sandbox-1",
  "mapId": "caribbean-01",
  "mapName": "Caribbean Sea",
  "currentPlayers": 1,
  "maxPlayers": 100,
  "status": "JOINED"
}
```

`SPAWN_ASSIGNED`
```json
{
  "roomId": "sandbox-1",
  "reason": "INITIAL",
  "x": 0.0,
  "z": 0.0,
  "angle": 0.0
}
```

Особенности для frontend:
- canonical room enter flow: `POST /api/v1/rooms/{roomId}/join` -> `ROOM_JOINED` -> `SPAWN_ASSIGNED` -> `INIT_GAME_STATE`;
- frontend переводит shell в `ROOM_LOADING` после REST success и держит его там до появления current player в game state;
- `SPAWN_ASSIGNED` используется как authoritative signal, что spawn уже назначен, но сам переход в `SAILING` происходит только после `INIT_GAME_STATE` / current player snapshot.

#### Используются текущим gameplay UI/runtime

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

#### Уже согласованы в contract, но ещё не подключены в UI

`ROOM_JOIN_REJECTED` уже входит в согласованный room contract, но текущий backend runtime ещё не использует его как authoritative rejection channel; фронтенд поэтому опирается на REST error response.

## 5. Список message types

### Активно используются на фронте сейчас
- Chat: `CHAT_MESSAGE`
- Lobby/rooms: `ROOMS_SNAPSHOT`, `ROOMS_UPDATED`
- Room enter flow: `ROOM_JOINED`, `SPAWN_ASSIGNED`
- Game: `INIT_GAME_STATE`, `UPDATE_GAME_STATE`, `PLAYER_JOIN`, `PLAYER_LEAVE`, `PLAYER_INPUT`

### Уже зафиксированы в contract, но не используются в UI после `TASK-016`
- Chat control: `CHAT_JOIN`, `CHAT_LEAVE`
- Room rejection: `ROOM_JOIN_REJECTED`
