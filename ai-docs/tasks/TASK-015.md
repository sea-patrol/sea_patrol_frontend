# TASK-015 - Frontend часть: lobby WebSocket и live room catalog updates

## Метаданные
- **ID:** `TASK-015`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-015`
- **Трек:** `Frontend`
- **Depends on:** `TASK-014`

## Контекст
После `TASK-014` frontend уже умел рендерить lobby screen и загружать room catalog через `GET /api/v1/rooms`, но каталог оставался фактически snapshot-only до ручного refresh. Backend при этом уже публиковал `ROOMS_SNAPSHOT` при lobby WebSocket-connect и `ROOMS_UPDATED` после `create`, `join`, `leave`, cleanup.

`TASK-015` нужна, чтобы lobby UI перестал зависеть только от REST и начал жить на отдельном lobby WebSocket-потоке до входа пользователя в игровую комнату.

## Цель
Подключить live lobby updates на frontend: в `LOBBY` mode использовать уже открытую `/ws/game` session для чата и room catalog, подписаться на `ROOMS_SNAPSHOT` / `ROOMS_UPDATED` и показывать явный realtime/reconnect status в UI.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/shared/constants/messageType.js`
  - `sea_patrol_frontend/src/features/realtime/model/WebSocketContext.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
  - `sea_patrol_frontend/src/__tests__/contexts/WebSocketContext.test.jsx`
- Внешняя документация:
  - `sea_patrol_orchestration/ROADMAP.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`

## Acceptance Criteria
- [x] Лобби подключает WS отдельно от игровой комнаты.
- [x] Изменения списка комнат обновляют UI.
- [x] Есть reconnect/status UI.

## Scope
**Включает:**
- подписку lobby UI на `ROOMS_SNAPSHOT` и `ROOMS_UPDATED`;
- трактовку room messages как полного snapshot payload;
- hybrid flow: первый REST bootstrap + дальнейшие WS updates;
- отдельный lobby realtime status с online/offline/reconnecting copy;
- сохранение chat availability на той же lobby WS-session;
- tests на live room updates и reconnect-state отображение.

**Не включает (out of scope):**
- room join runtime;
- create room UI;
- spawn/game init flow;
- отдельный новый WebSocket endpoint;
- изменение backend protocol.

## Технический подход
`LobbyPanel` теперь использует текущий `WebSocketContext` как lobby transport layer: пока пользователь остаётся вне active room state, backend держит его WS-сессию в `lobby`, а frontend подписывается на `ROOMS_SNAPSHOT` и `ROOMS_UPDATED`. Эти сообщения применяются как полный snapshot каталога, без merge/delta-логики.

REST `GET /api/v1/rooms` остаётся первым bootstrap-источником для устойчивого initial render и manual refresh. После этого live room payload из WebSocket становится authoritative для lobby UI, а отдельный status block показывает, находится ли lobby realtime feed в `online`, `reconnecting` или `inactive` состоянии.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить room/lobby message types в frontend constants
- [x] Подписать `LobbyPanel` на `ROOMS_SNAPSHOT` и `ROOMS_UPDATED`
- [x] Перевести room catalog на hybrid `REST + WS` flow
- [x] Добавить lobby realtime status / reconnect copy
- [x] Расширить tests на live updates и reconnect UI
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### Lobby room messages
- `ROOMS_SNAPSHOT` — первый WS snapshot после connect/reconnect
- `ROOMS_UPDATED` — полный room catalog после `create`, `join`, `leave`, `cleanup`

Payload shape одинаков для REST и WS:
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

### Lobby realtime statuses
- `online` — lobby WS connected, chat и live room updates активны
- `reconnecting` — WS временно offline, UI ждёт reconnect и допускает manual refresh
- `inactive` — у пользователя нет token, lobby WS не активен

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| REST ответ может перетереть более свежий WS snapshot | `GET /api/v1/rooms` и lobby WS стартуют параллельно | `LobbyPanel` игнорирует REST результат, если после начала запроса уже пришёл более свежий live snapshot |
| Frontend ошибочно воспримет `ROOMS_UPDATED` как delta-патч | Backend публикует полный snapshot, а не diff | UI всегда делает полную замену каталога по входящему payload |
| Reconnect состояние будет видно только в общем shell status | Задача требует lobby-specific feedback | В `LobbyPanel` добавлен отдельный realtime status block с `lastClose` detail |

## План реализации
1. Добавить room/lobby message types в frontend constants.
2. Подписать `LobbyPanel` на lobby room messages.
3. Совместить REST bootstrap и live WS updates без конфликта snapshot sources.
4. Добавить lobby reconnect/status UI.
5. Обновить tests и docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить live lobby updates, reconnect UI и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после lobby WS integration | `Passed` |

### Ручная проверка
- [x] Lobby panel подписывается на `ROOMS_SNAPSHOT` и `ROOMS_UPDATED`
- [x] Полный live snapshot заменяет room list в UI
- [x] При offline/reconnect состоянии lobby показывает отдельный status block
- [x] Manual refresh остаётся рабочим fallback

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/shared/constants/messageType.js` - room/lobby message types добавлены в frontend contract surface
2. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx` - hybrid `REST + WS` room catalog flow и realtime status UI
3. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css` - стили lobby realtime status и disabled refresh state
4. `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx` - tests на subscriptions, live snapshots и reconnect UI
5. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for active lobby WS usage
6. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for architecture/testing
7. `sea_patrol_frontend/ai-docs/tasks/TASK-015.md` - frontend task artifact

### Незапланированные находки
- Для устойчивого hybrid flow пришлось защититься от гонки между первым REST response и более свежим `ROOMS_SNAPSHOT`, иначе lobby UI мог откатываться к устаревшему каталогу.
- Отдельный reconnect/status UI лучше держать прямо в `LobbyPanel`, а не только в общем shell topbar, потому что acceptance задачи относится именно к lobby screen.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Lobby room updates применяются без ручного reload
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Следующий frontend task должен подключить room join flow и начать реагировать на `ROOM_JOINED` / `SPAWN_ASSIGNED`, иначе lobby realtime останется конечной точкой без перехода в gameplay flow | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_orchestration/ROADMAP.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`, `sea_patrol_frontend/ai-docs/API_INFO.md`

