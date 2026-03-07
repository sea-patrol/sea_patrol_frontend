# TASK-016 - Frontend часть: room join flow и room loading state

## Метаданные
- **ID:** `TASK-016`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-016`
- **Трек:** `Frontend`
- **Depends on:** `TASK-014`, `TASK-015`, `TASK-011`

## Контекст
После `TASK-015` frontend уже умел показывать актуальный room catalog в lobby, но сам room join flow отсутствовал: пользователь не мог инициировать `POST /api/v1/rooms/{roomId}/join`, а shell не имел явного состояния между лобби и первой authoritative room snapshot/init sequence.

`TASK-016` нужна, чтобы frontend перестал быть read-only lobby-клиентом и начал проходить canonical backend flow входа в комнату: REST join -> `ROOM_JOINED` -> `SPAWN_ASSIGNED` -> `INIT_GAME_STATE`.

## Цель
Реализовать room join flow на фронте: запускать join из lobby UI, показывать backend ошибки пользователю и переводить shell в `ROOM_LOADING` до завершения room init flow.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/shared/api/roomApi.js`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js`
  - `sea_patrol_frontend/src/shared/constants/messageType.js`
  - `sea_patrol_frontend/src/test/mocks/handlers.js`
  - `sea_patrol_frontend/src/test/mocks/data.js`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js`
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/gameUiState.test.js`
- Внешняя документация:
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/ROADMAP.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`

## Acceptance Criteria
- [x] Join работает из lobby UI.
- [x] Ошибки join показываются пользователю.
- [x] После success UI переходит к room init flow.

## Scope
**Включает:**
- `Join room` кнопку в `LobbyPanel`;
- REST-клиент `roomApi.joinRoom()` для `POST /api/v1/rooms/{roomId}/join`;
- shell mode `ROOM_LOADING` между lobby и sailing;
- ожидание `ROOM_JOINED` / `SPAWN_ASSIGNED` / `INIT_GAME_STATE` как canonical room init sequence;
- join error block в lobby UI;
- tests на REST join contract, lobby join UI и shell room loading flow.

**Не включает (out of scope):**
- create room UI;
- полноценное spawn placement logic;
- обработку `ROOM_JOIN_REJECTED` как реального runtime rejection channel на backend;
- reconnect resume внутрь комнаты;
- новые backend endpoints.

## Технический подход
`LobbyPanel` теперь не только читает room catalog, но и даёт `Join room` action для `OPEN` комнат. Кнопка стартует REST `POST /api/v1/rooms/{roomId}/join` через `roomApi.joinRoom()`, а при ошибке возвращает structured backend message в lobby error block.

`GameUiShell` владеет room entry state machine: после REST success shell переходит в `ROOM_LOADING`, затем слушает `ROOM_JOINED` и `SPAWN_ASSIGNED`, а в `SAILING` переключается только после появления current player в `GameStateContext`. Это фиксирует frontend на каноническом MVP flow и не позволяет считать join завершённым раньше `INIT_GAME_STATE/current player snapshot`.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить REST `joinRoom()` в room API client
- [x] Добавить `Join room` action в lobby cards
- [x] Показать backend join errors в lobby UI
- [x] Ввести `ROOM_LOADING` mode в shell state model
- [x] Подписать shell на `ROOM_JOINED` и `SPAWN_ASSIGNED`
- [x] Добавить tests на join contract и room init flow
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### REST join response
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

### Join error handling
- frontend читает message из `errors[0].message`;
- текущие backend `404` / `409` ошибки отображаются пользователю в lobby shell;
- отдельный `ROOM_JOIN_REJECTED` пока не является основным каналом отказа.

### Room init sequence
1. `POST /api/v1/rooms/{roomId}/join`
2. `ROOM_JOINED`
3. `SPAWN_ASSIGNED`
4. `INIT_GAME_STATE` / current player snapshot
5. `SAILING`

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Frontend переключится в sailing слишком рано | REST success сам по себе не означает готовую room scene | Shell ждёт current player в `GameStateContext`, а между шагами держит `ROOM_LOADING` |
| Join errors останутся скрытыми | Backend rejection сейчас приходит главным образом через REST | `LobbyPanel` показывает join error block с structured backend message |
| Room buttons будут дублировать join requests | Пользователь может кликнуть несколько комнат подряд | Пока room entry pending, join buttons disabled и активная карточка показывает `Joining...` |

## План реализации
1. Добавить `joinRoom()` в REST room API.
2. Встроить `Join room` в `LobbyPanel`.
3. Ввести `ROOM_LOADING` mode и room entry state machine в shell.
4. Подписать shell на `ROOM_JOINED` / `SPAWN_ASSIGNED`.
5. Обновить mocks, tests и docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить join contract, lobby join UI и room loading flow | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после room join integration | `Passed` |

### Ручная проверка
- [x] `Join room` доступен для `OPEN` rooms
- [x] Ошибка backend join видна пользователю в lobby
- [x] После REST success shell входит в `ROOM_LOADING`
- [x] `ROOM_JOINED` и `SPAWN_ASSIGNED` двигают room init copy вперёд
- [x] Переход в `SAILING` происходит только после current player state

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/shared/api/roomApi.js` - `joinRoom()` и общий authorized request path
2. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx` - join action, join error block, disabled join states
3. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css` - стили под join controls/errors
4. `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js` - новый `ROOM_LOADING` mode
5. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - room entry state machine и room loading notice
6. `sea_patrol_frontend/src/test/mocks/data.js` - room join test fixtures
7. `sea_patrol_frontend/src/test/mocks/handlers.js` - MSW join handler
8. `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js` - tests на join success/error contract
9. `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx` - tests на join controls/error UI
10. `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx` - shell-level room join/init flow test
11. `sea_patrol_frontend/src/__tests__/features/ui-shell/gameUiState.test.js` - reducer coverage for `ROOM_LOADING`
12. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for active join flow
13. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for architecture/testing
14. `sea_patrol_frontend/ai-docs/tasks/TASK-016.md` - frontend task artifact

### Незапланированные находки
- Для корректного frontend room entry пришлось явно ввести промежуточный shell mode `ROOM_LOADING`, иначе UI сразу откатывался бы обратно в lobby до появления current player state.
- REST success и room init нельзя сводить в один шаг: backend уже после `200 OK` продолжает authoritative sequence через `ROOM_JOINED` и `SPAWN_ASSIGNED`.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Join flow проходит через canonical backend sequence
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Следующий frontend task должен собрать create room UI и потом довести room shell до полноценного in-room bootstrap/polish, чтобы `ROOM_LOADING` не оставался только текстовым переходным состоянием | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_orchestration/API.md`, `sea_patrol_orchestration/ROADMAP.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`, `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
