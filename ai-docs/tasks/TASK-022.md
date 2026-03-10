# TASK-022 - Frontend часть: reconnect UI flow

## Метаданные
- **ID:** `TASK-022`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-09`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 2 / TASK-022`
- **Трек:** `Frontend`
- **Depends on:** `TASK-021`, `TASK-020`

## Контекст
После `TASK-021` backend уже умел удерживать room session в reconnect grace и восстанавливать ту же комнату, но frontend всё ещё воспринимал потерю сокета слишком грубо: `RECONNECTING` оставался почти пустым режимом, stale room/game state не очищался, а пользователь не получал явного возврата в лобби, если backend уже не восстановил прежнюю комнату.

## Цель
Сделать reconnect flow на фронте явным и предсказуемым: показывать пользователю progress восстановления, ждать room resume в пределах grace window и переводить его обратно в lobby/new session flow, если backend вернул его в лобби или локальный reconnect timeout истёк.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/realtime/model/WebSocketContext.jsx`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/pages/LobbyPage/index.jsx`
  - `sea_patrol_frontend/src/pages/LobbyPage/LobbyPage.css`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/contexts/WebSocketContext.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/GamePage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Пользователь видит reconnect status.
- [x] После success происходит возврат в room.
- [x] После fail UI переходит в lobby/new session flow.

## Scope
**Включает:**
- reconnect metadata (`phase`, `attempt`, `delayMs`) из `WebSocketProvider`;
- route-level reconnect coordinator на `/game` с локальным `15s` timeout;
- ожидание `ROOM_JOINED` и fresh `INIT_GAME_STATE` как признаков успешного room resume;
- lobby fallback при `ROOMS_SNAPSHOT` / `ROOMS_UPDATED` вместо room resume;
- warning banner на `/lobby` после reconnect fail;
- tests на reconnect metadata, room reconnect UI и route fallback.

**Не включает (out of scope):**
- backend contract changes;
- новый resume API;
- save/persistence logic;
- отдельный combat respawn flow.

## Технический подход
`WebSocketContext` теперь поднимает не только `isConnected`, но и reconnect metadata: текущую phase (`connecting`, `reconnecting`, `open`), номер retry attempt и задержку до следующей попытки. Это даёт UI достаточно данных, чтобы показывать progress reconnect без знания деталей `wsClient`.

`GamePage` стал route-level координатором reconnect flow. Когда активная room session теряет сокет, страница переводит shell в `RECONNECTING`, запускает локальный `15s` таймер и ждёт authoritative room resume sequence: сначала `ROOM_JOINED`, затем fresh `INIT_GAME_STATE`. Если вместо этого backend уже вернул клиента в lobby scope и прислал `ROOMS_SNAPSHOT` / `ROOMS_UPDATED`, либо если локальный timeout истёк, frontend очищает stale room/game state и переводит пользователя обратно на `/lobby` с warning notice.

`GameUiShell` больше не показывает заглушку для reconnect. Он получает явный reconnect view model и отображает фазу восстановления комнаты, оставшееся время grace window и последнюю информацию о закрытии сокета. Это делает `RECONNECTING` полноценным UI mode, а не текстом «на будущее».

## Контракты и данные
### Room reconnect success path
1. Активная room session теряет WebSocket.
2. Frontend входит в `RECONNECTING` и ждёт reconnect в пределах `15s`.
3. После восстановления сокета backend повторно шлёт `ROOM_JOINED` и `INIT_GAME_STATE`.
4. Frontend снимает reconnect mode и оставляет пользователя в той же комнате.

### Room reconnect fail path
1. Активная room session теряет WebSocket.
2. Frontend входит в `RECONNECTING` и ждёт reconnect в пределах `15s`.
3. Если backend возвращает lobby snapshot (`ROOMS_SNAPSHOT` / `ROOMS_UPDATED`) или local timeout истекает, frontend очищает room/game state.
4. Пользователь перенаправляется на `/lobby` и видит warning notice с причиной reconnect failure.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить reconnect metadata, room reconnect flow и fallback в lobby | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после route/socket state changes | `Passed` |

### Ручная проверка
- [x] При потере room socket UI переходит в `RECONNECTING`
- [x] На reconnect screen видны статус восстановления и countdown grace window
- [x] Если backend возвращает lobby snapshot вместо room resume, frontend очищает stale room state и переводит пользователя в лобби
- [x] Если reconnect timeout истекает, frontend переводит пользователя в лобби без зависания в `/game`

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Reconnect flow покрыт route-level и shell-level тестами
- [x] Регрессии по frontend build/test suite не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Текущий reconnect UI опирается на локальный `15s` grace timeout. Если backend default будет изменён, frontend timeout тоже нужно синхронизировать через конфиг или contract note | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [x] Документация синхронизирована
- [ ] Задача перенесена в выполненные / архив
