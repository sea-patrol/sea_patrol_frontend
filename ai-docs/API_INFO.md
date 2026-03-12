# API_INFO.md

## 1. Назначение

Этот документ описывает текущее API, которое использует frontend Sea Patrol:

- REST (HTTP) для аутентификации, room catalog, create room и room join
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

Frontend использует этот endpoint как первичный snapshot lobby room catalog перед live WS-обновлениями.

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
- отдельная `LobbyPage` на маршруте `/lobby` делает rooms request при первом входе и по ручному refresh, не монтируя gameplay scene;
- `rooms` может быть пустым массивом, и UI должен показывать понятный empty state;
- error state должен читать `errors[0].message`, если backend вернул structured error;
- после первого REST snapshot lobby UI продолжает жить за счёт `ROOMS_SNAPSHOT` / `ROOMS_UPDATED` по тому же payload shape;
- ручной refresh остаётся fallback, если lobby WebSocket временно offline.

### 3.5 POST `/api/v1/rooms`

Frontend `TASK-017` использует этот endpoint для create room flow в lobby.

Требует заголовок:
- `Authorization: Bearer <jwt>`

Request JSON:
```json
{ "name": "Sandbox 3", "mapId": "caribbean-01" }
```

Все поля опциональны, но для текущего frontend flow:
- `name` может быть пустым, тогда backend генерирует `Sandbox N`;
- default map mode отправляет `mapId = caribbean-01`;
- custom map mode отправляет пользовательский `mapId` и может получить validation error.

Response `201 Created`:
```json
{
  "id": "sandbox-3",
  "name": "Sandbox 3",
  "mapId": "caribbean-01",
  "mapName": "Caribbean Sea",
  "currentPlayers": 0,
  "maxPlayers": 100,
  "status": "OPEN"
}
```

Важно для frontend:
- create form живёт прямо в lobby UI;
- после success frontend обновляет локальный catalog и затем продолжает принимать `ROOMS_UPDATED` как authoritative source;
- backend валидирует `mapId` против своего in-memory `MapTemplateRegistry`; сейчас доступны `caribbean-01` и `test-sandbox-01`, поэтому custom `mapId` режим уже можно использовать и для реальной dev/debug комнаты, и для честного surfacing validation errors.

Ошибки:
- `400` -> `{ "errors": [{ "code": "INVALID_MAP_ID", "message": "Unknown mapId" }] }`
- `409` -> `{ "errors": [{ "code": "MAX_ROOMS_REACHED", "message": "Maximum number of rooms reached" }] }`

### 3.6 POST `/api/v1/rooms/{roomId}/join`

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
- `join` стартует из отдельной HTML-first lobby page кнопкой `Join room`;
- ошибки `404` / `409` показываются пользователю прямо на lobby route;
- после REST `200 OK` lobby page остаётся активной и ждёт полный authoritative init flow: `ROOM_JOINED` -> `SPAWN_ASSIGNED` -> `INIT_GAME_STATE/current player`;
- переход на `/game` и монтирование gameplay scene происходят только после появления current player snapshot, а не только после spawn assignment;
- metadata room entry хранится в `RoomSessionContext`, поэтому пользователь может безопасно вернуться на `/game` с домашней страницы, пока room session остаётся активной.

## 4. WebSocket API

Endpoint: `{{WS_BASE_URL}}/ws/game`

### 4.1 Авторизация

Фронтенд подключается с query-параметром:

`/ws/game?token=<jwt>`

Дополнение по текущей frontend архитектуре:
- `WebSocketProvider` живёт выше маршрутов, поэтому SPA-переходы `Home -> Lobby -> Game` не рвут WS-сессию;
- `RoomSessionProvider` хранит room metadata поверх маршрутов и в `localStorage`, поэтому после полного reload домашняя страница всё ещё знает текущий room resume target и может вести `Play` сразу в `/game`;
- room/game state подписки тоже подняты выше страницы сцены, чтобы не потерять ранние room init сообщения во время route transition.

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
["CHAT_MESSAGE", { "to": "group:lobby", "text": "hello" }]
```

Примечание: после `TASK-017B` frontend отправляет public chat только в явный active scope: `group:lobby` в лобби и `group:room:<roomId>` после входа в комнату. UI больше не использует `global` как штатный target и показывает пользователю текущий scope прямо в chat header.

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
- lobby UI подписывается на эти сообщения отдельно от room gameplay state;
- после create room frontend всё равно считает `ROOMS_UPDATED` authoritative update source.

#### Используются текущим room join / init flow

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
  "x": 12.5,
  "z": -8.0,
  "angle": 0.0
}
```

Особенности для frontend:
- canonical room enter flow: `POST /api/v1/rooms/{roomId}/join` -> `ROOM_JOINED` -> `SPAWN_ASSIGNED` -> `INIT_GAME_STATE`;
- frontend держит пользователя на `/lobby` после REST success и переключает маршрут на `/game` только после появления current player в game state;
- `SPAWN_ASSIGNED` используется как authoritative signal, что spawn уже назначен, но сам переход в room route и последующий `SAILING` происходят только после `INIT_GAME_STATE` / current player snapshot;
- backend вычисляет initial spawn сам из `MapTemplate.spawnPoints` + `spawnRules.playerSpawnRadius` и валидирует координаты по `MapTemplate.bounds`, поэтому клиент не должен рандомить spawn локально;
- тот же payload shape используется и для будущего respawn с `reason=RESPAWN`, поэтому frontend должен ориентироваться на `reason`, а не на предположение, что `SPAWN_ASSIGNED` бывает только один раз за room session.
- `INIT_GAME_STATE` теперь может содержать `roomMeta`; текущий frontend path не зависит от него для gameplay, но может использовать эти map/room данные для loading summary и room resume UX.
- reconnect в пределах `game.room.reconnect-grace-period` (MVP default: `15s`) теперь возвращает пользователя в ту же комнату: backend повторно шлёт `ROOM_JOINED` и `INIT_GAME_STATE`, но не делает новый `SPAWN_ASSIGNED`.
- после `TASK-022` frontend на `/game` входит в явный `RECONNECTING` flow, ждёт `ROOM_JOINED`, затем fresh `INIT_GAME_STATE` и только после этого считает room session восстановленной.
- если backend вместо room resume возвращает `ROOMS_SNAPSHOT` / `ROOMS_UPDATED`, frontend трактует это как lobby fallback, очищает stale room/game state и переводит пользователя обратно на `/lobby` с warning notice.
- если окно grace истекло и room resume так и не пришёл, frontend завершает reconnect flow через локальный `15s` timeout, очищает room/game state и переводит пользователя в новый lobby session flow.
- после `TASK-020` frontend применяет `SPAWN_ASSIGNED` к runtime state текущего игрока как authoritative spawn patch и при наличии active ship делает snap к новым координатам, а не плавный lerp из предыдущей позиции.
#### Используются текущим gameplay UI/runtime

`INIT_GAME_STATE`
```json
["INIT_GAME_STATE", { "room": "sandbox-1", "roomMeta": { "roomId": "sandbox-1", "mapId": "caribbean-01", "mapName": "Caribbean Sea" }, "players": [{ "name": "alice", "x": 0, "z": 0, "angle": 0 }] }]
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
["CHAT_MESSAGE", { "from": "bob", "to": "group:room:sandbox-1", "text": "hi" }]
```

Особенности для frontend:
- `payload.to` используется как authoritative scope key для разделения lobby и room histories внутри `ChatBlock`;
- при `to = group:lobby` сообщение попадает только в lobby chat history;
- при `to = group:room:<roomId>` сообщение попадает только в history соответствующей комнаты;
- если legacy payload пришёл без `to`, frontend временно относит его к текущему видимому scope, чтобы не ломать обратную совместимость в UI.

#### Уже согласованы в contract, но ещё не подключены в UI

`ROOM_JOIN_REJECTED` уже входит в согласованный room contract, но текущий backend runtime ещё не использует его как authoritative rejection channel; фронтенд поэтому опирается на REST error response.

## 5. Список message types

### Активно используются на фронте сейчас
- Chat: `CHAT_MESSAGE`
- Lobby/rooms: `ROOMS_SNAPSHOT`, `ROOMS_UPDATED`
- Room enter flow: `ROOM_JOINED`, `SPAWN_ASSIGNED`
- Game: `INIT_GAME_STATE`, `UPDATE_GAME_STATE`, `PLAYER_JOIN`, `PLAYER_LEAVE`, `PLAYER_INPUT`

### Уже зафиксированы в contract, но не используются в UI после `TASK-017`
- Chat control: `CHAT_JOIN`, `CHAT_LEAVE` (legacy compatibility only; lobby/room scope ими больше не переключается)
- Room rejection: `ROOM_JOIN_REJECTED`















