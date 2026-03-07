# TASK-014 - Frontend часть: lobby screen и первичная загрузка room catalog

## Метаданные
- **ID:** `TASK-014`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-014`
- **Трек:** `Frontend`
- **Depends on:** `TASK-004`, `TASK-007`

## Контекст
После `TASK-007` frontend уже имел `GameUiShell` и отдельный `LOBBY` mode, но сам экран лобби ещё не существовал. При открытии `/game` пользователь видел shell без room catalog и без явного состояния загрузки/пустого списка/ошибки.

`TASK-014` нужна как первый честный frontend шаг в lobby flow: страница должна уметь загрузить `GET /api/v1/rooms`, показать текущий room catalog и подготовить UI к следующим задачам по live updates и join flow.

## Цель
Сделать отдельный lobby screen внутри `GameUiShell`, который при открытии `/game` запрашивает backend room catalog через REST и отображает понятные `loading`, `error`, `empty` и `list` состояния.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/shared/api/roomApi.js`
  - `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js`
  - `sea_patrol_frontend/src/test/mocks/handlers.js`
  - `sea_patrol_frontend/src/test/mocks/data.js`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js`
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
- Внешняя документация:
  - `sea_patrol_orchestration/ROADMAP.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`

## Acceptance Criteria
- [x] При открытии lobby screen выполняется `GET /api/v1/rooms`.
- [x] Room catalog отображается списком.
- [x] Empty state читаем и понятен.
- [x] Есть явные loading и error состояния.

## Scope
**Включает:**
- отдельный `LobbyPanel` внутри `GameUiShell`;
- REST-клиент `roomApi.listRooms()` для `GET /api/v1/rooms`;
- определение lobby mode по отсутствию active player state;
- UI состояния `loading`, `error`, `empty`, `rooms list`;
- кнопку ручного refresh без live subscription;
- unit/integration coverage для REST-клиента и lobby widget.

**Не включает (out of scope):**
- live lobby updates по `ROOMS_SNAPSHOT` / `ROOMS_UPDATED`;
- create room flow;
- join room flow;
- обработку `ROOM_JOINED`, `ROOM_JOIN_REJECTED`, `SPAWN_ASSIGNED`;
- изменение backend contract.

## Технический подход
`GameUiShell` теперь определяет `LOBBY` как основной screen mode, если у текущего пользователя ещё нет active player state в `GameStateContext`. В этом режиме shell рендерит `LobbyPanel`, а HUD/gameplay actions остаются скрытыми.

`LobbyPanel` на mount вызывает `roomApi.listRooms(token)` и показывает один из четырёх сценариев: загрузка каталога, ошибка запроса, пустой список или список комнат. REST-клиент нормализует bearer auth, safe JSON parsing и backend error envelope через `errors[0]`, чтобы UI не зависел от сырого `fetch` и не размазывал HTTP parsing по компоненту.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить REST-клиент room catalog (`GET /api/v1/rooms`)
- [x] Добавить `LobbyPanel` с `loading/error/empty/list` состояниями
- [x] Подключить lobby screen в `GameUiShell`
- [x] Уточнить переход `LOBBY <-> SAILING/RECONNECTING` через наличие active player state
- [x] Добавить MSW mocks для room catalog
- [x] Добавить tests для `roomApi` и `LobbyPanel`
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### REST
- `GET /api/v1/rooms`
- Header: `Authorization: Bearer <jwt>`
- Response shape:
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

### UI states
- `loading` — первый запрос room catalog в процессе
- `error` — backend/network/auth ошибка при загрузке
- `empty` — `rooms.length === 0`
- `list` — one or more rooms доступны для отображения

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Shell может преждевременно перейти в `SAILING` | UI теперь зависит не только от auth, но и от game state presence | `GameUiShell` читает `selectCurrentPlayerState()` и считает sailing только при наличии active player state |
| Lobby UI начнёт ожидать live updates раньше времени | Backend уже умеет `ROOMS_SNAPSHOT` / `ROOMS_UPDATED`, но frontend ещё нет | В scope задачи оставлен только REST bootstrap и явный copy про следующий task |
| Error handling станет хрупким | Backend errors приходят в structured envelope | `roomApi` извлекает `errors[0].message` и даёт единый result shape для компонента |

## План реализации
1. Добавить frontend REST-клиент для room catalog.
2. Собрать `LobbyPanel` с базовыми состояниями и ручным refresh.
3. Подключить lobby panel в `GameUiShell` и уточнить mode inference.
4. Обновить MSW mocks и покрыть новый flow тестами.
5. Синхронизировать frontend docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить room REST client, lobby panel и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после подключения lobby screen | `Passed` |

### Ручная проверка
- [x] При входе в `/game` lobby panel делает rooms request
- [x] При пустом каталоге отображается читаемый empty state
- [x] При наличии комнат показывается room list с основными metadata
- [x] При ошибке запроса отображается error state
- [x] При отсутствии token lobby panel не падает и показывает auth-related error

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/shared/api/roomApi.js` - REST-клиент для `GET /api/v1/rooms`
2. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx` - lobby screen с room catalog states
3. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css` - стили lobby panel
4. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - подключение lobby panel и уточнение mode inference
5. `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx` - контекст теперь явно отдаёт `state` для shell selectors
6. `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js` - возврат из lobby корректно очищает overlay state
7. `sea_patrol_frontend/src/test/mocks/data.js` - mock room catalog responses
8. `sea_patrol_frontend/src/test/mocks/handlers.js` - MSW handler для `GET /api/v1/rooms`
9. `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js` - tests на success/error/abort contract
10. `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx` - tests на loading/empty/error/list states
11. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for lobby REST bootstrap
12. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for lobby architecture/testing
13. `sea_patrol_frontend/ai-docs/tasks/TASK-014.md` - frontend task artifact

### Незапланированные находки
- Для честного lobby mode shell потребовалось отдать текущее `state` из `GameStateContext`, иначе `GameUiShell` не мог надёжно определить, появился ли уже current player в runtime state.
- Возвратные переходы из `LOBBY` пришлось подчистить в reducer, чтобы UI не сохранял старый overlay state при смене screen mode.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Ключевые lobby сценарии проходят
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Следующий frontend task должен переключить lobby catalog с poll/refresh-only поведения на backend-driven `ROOMS_SNAPSHOT` / `ROOMS_UPDATED`, чтобы REST bootstrap не оставался единственным источником обновлений | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_orchestration/ROADMAP.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`, `sea_patrol_frontend/ai-docs/API_INFO.md`
