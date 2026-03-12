# TASK-029 - Frontend часть: room loading summary перед входом в море

## Метаданные
- **ID:** `TASK-029`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `Medium`
- **Дата создания:** `2026-03-12`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 3 / TASK-029`
- **Трек:** `Frontend`
- **Depends on:** `TASK-026`, `TASK-016`, `TASK-028`

## Контекст
До этой задачи room init flow был технически корректным, но визуально бедным: пользователь видел только текстовые статусы `Room admitted` / `Initializing room state`, без явного room/map context. При этом `/game` мог поднимать canvas даже если authoritative player state ещё не был восстановлен.

## Цель
Показать перед входом в море понятный room loading summary с room name, map context и базовой metadata из backend contract, а также не монтировать gameplay scene до появления authoritative current player snapshot.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/pages/LobbyPage/index.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/widgets/RoomLoadingSummary/RoomLoadingSummary.jsx`
  - `sea_patrol_frontend/src/widgets/RoomLoadingSummary/RoomLoadingSummary.css`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/GamePage.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] При входе в комнату пользователь видит понятный loading summary.
- [x] Room loading screen использует map/room metadata из backend contract.
- [x] Canvas не монтируется на `/game`, пока ещё нет authoritative current player snapshot.

## Scope
**Включает:**
- общий summary-widget для `LobbyPage` и `GameUiShell`;
- отображение room name, map name, region, room status, captain slots и spawn coordinates;
- использование frontend map metadata registry для preview/context;
- задержку монтирования `GameMainScene` до появления authoritative player snapshot;
- tests на lobby join summary, game room loading summary и `GamePage` scene gate.

**Не включает (out of scope):**
- новый backend room-init contract;
- wind HUD;
- полноценный loading art/minimap assets;
- изменения reconnect grace policy.

## Технический подход
Добавлен отдельный widget `RoomLoadingSummary`, который собирает данные из `room`, `joinResponse`, `spawn` и локального `mapMetadata` registry. Этот widget используется в двух местах: на lobby route во время `join-init` и внутри `GameUiShell`, если room session уже открыта, но authoritative gameplay state ещё не готов.

Дополнительно `GamePage` теперь не монтирует `GameMainScene`, пока у клиента нет `currentPlayerState`. Это убирает визуальный переход в пустую/раннюю сцену и делает loading stage действительно предсценовым.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить room loading summary и scene gate на `/game` | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после room loading UI изменений | `Passed` |

### Ручная проверка
- [x] Во время room join в лобби виден summary с room/map metadata
- [x] После `SPAWN_ASSIGNED` summary показывает spawn coordinates
- [x] На `/game` без current player snapshot canvas ещё не монтируется
- [x] После появления player snapshot UI переходит в обычный room/game flow

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Room loading больше не выглядит как абстрактный текстовый статус
- [x] Регрессии по frontend build/test suite не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | `RoomLoadingSummary` использует локальный frontend map registry и должен оставаться синхронизированным с backend `MapTemplateRegistry`, пока не появится shared map catalog contract | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [x] Документация синхронизирована
- [x] Статус roadmap обновлен
