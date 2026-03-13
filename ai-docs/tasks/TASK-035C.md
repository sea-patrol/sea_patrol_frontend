# TASK-035C - Frontend часть: menu modal и выход в лобби

## Метаданные
- **ID:** `TASK-035C`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-13`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 4.5 / TASK-035C`
- **Трек:** `Frontend`
- **Depends on:** `TASK-035A`, `TASK-035B`, `TASK-036`

## Контекст
После `TASK-035B` backend уже умел возвращать игрока из комнаты обратно в `lobby` через `POST /api/v1/rooms/{roomId}/leave`, но room menu на фронте всё ещё оставался заглушкой без реального action flow.

## Цель
Довести menu modal до реального room-exit UX: пользователь должен нажать `Выйти` в меню, фронт должен выполнить authoritative leave-room request, очистить stale room state только после успешного ответа и перевести игрока на `/lobby` без logout.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/shared/api/roomApi.js`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.css`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js`
  - `sea_patrol_frontend/src/__tests__/pages/GamePage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/test/mocks/handlers.js`
  - `sea_patrol_frontend/src/test/mocks/data.js`
- Документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/PROJECTS_ORCESTRATION_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] В room menu есть кнопка `Выйти`.
- [x] Нажатие на `Выйти` вызывает `POST /api/v1/rooms/{roomId}/leave`.
- [x] После confirmed REST success frontend сразу очищает `GameState` и `RoomSession` и переводит игрока на `/lobby` без logout.
- [x] Ошибки leave-room показываются в menu modal и не маскируются под локальный success.
- [x] Есть tests на API client, menu action и navigation/cleanup flow.

## Scope
**Включает:**
- добавление `leaveRoom()` в `roomApi`;
- menu modal action для выхода из комнаты;
- coordinator в `GamePage` для leave-room request, cleanup и route transition;
- MSW mocks и frontend tests;
- синхронизацию docs и roadmap.

**Не включает (out of scope):**
- dev-only кнопку `Дебаг` (`TASK-035D`);
- новый WS message type `ROOM_LEFT`;
- owner/host room management.

## Технический подход
- `GameUiShell` остаётся UI-слоем: открывает menu modal, показывает кнопку `Выйти`, pending-state и inline error.
- `GamePage` выступает coordinator-слоем: делает `roomApi.leaveRoom(token, roomId)`, на `200 OK` сразу очищает `GameState` + `RoomSession` и выполняет `navigate('/lobby', { state: { roomExited: true } })`, а на `401` переводит пользователя в login flow.
- Cleanup намеренно выполняется только после подтверждённого REST success, чтобы фронт не «угадывал» leave-room локально.

## Контракты и данные
### REST
- `POST /api/v1/rooms/{roomId}/leave`

### UI / state
- menu modal показывает кнопку `Выйти`;
- pending label: `Выходим...`;
- после REST success используется немедленный route transition в `/lobby` без reconnect/countdown UX;
- `409` ошибки room leave остаются в меню как inline error;
- success path сохраняет текущую auth/WS session и переводит пользователя на `/lobby`.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить room leave API client, menu action и route cleanup flow | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после UI/state изменений | `Passed` |

### Ручная проверка
- [x] В меню комнаты видна кнопка `Выйти`
- [x] Successful leave возвращает пользователя в `/lobby`
- [x] Ошибка leave-room не закрывает комнату локально и остаётся в modal

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Frontend tests проходят
- [x] Production build проходит
- [x] Документация синхронизирована

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Пока menu modal содержит только `Выйти`; dev-only `Дебаг` toggle остаётся отдельным следующим шагом `TASK-035D` | `Resolved` |

**Review решение:** `Approve`

## Финализация
- [x] Frontend runtime обновлён
- [x] Tests проходят
- [x] Документация синхронизирована
- [x] Задача помечена как выполненная в roadmap
