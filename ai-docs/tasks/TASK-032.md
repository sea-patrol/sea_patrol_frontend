# TASK-032 - Frontend часть: применение backend wind state

## Метаданные
- **ID:** `TASK-032`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-12`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 4 / TASK-032`
- **Трек:** `Frontend`
- **Depends on:** `TASK-031`

## Контекст
Backend уже стабильно присылает `wind` в `INIT_GAME_STATE` и `UPDATE_GAME_STATE`, но frontend runtime path это поле фактически терял: `GameStateContext` хранил только `playerStates`, а значит room wind state не доходил до клиентского состояния и UI.

## Цель
Научить frontend реально применять authoritative backend `wind` как часть game runtime state и убрать зависимость от неявных локальных placeholders в основном WS state path.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx`
  - `sea_patrol_frontend/src/features/game/model/useGameWsGameState.js`
  - `sea_patrol_frontend/src/widgets/GameHud/GameStateInfo.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/contexts/GameStateContext.reducer.test.js`
  - `sea_patrol_frontend/src/__tests__/integration/game-state-flow.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/PROJECTS_ORCESTRATION_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Frontend хранит `wind` в game state.
- [x] `INIT_GAME_STATE` и `UPDATE_GAME_STATE` обновляют это поле из backend payload.
- [x] Изменение ветра реально доходит до UI/runtime state и закреплено тестами.

## Scope
**Включает:**
- расширение `GameStateContext` полем `wind`;
- применение `UPDATE_GAME_STATE.wind` даже без `players[]` patch;
- surfacing wind в текущем debug/HUD слое;
- синхронизацию frontend/orchestration docs.

**Не включает (out of scope):**
- визуальный wind indicator для игрока как отдельный HUD widget;
- изменение sailing physics от ветра;
- clockwise wind policy.

## Технический подход
`GameStateContext` остаётся единым runtime store для gameplay state, поэтому `wind` добавлен туда рядом с `playerStates`. `INIT_GAME_STATE` полностью задаёт initial `wind`, а `UPDATE_GAME_STATE` патчит его независимо от наличия player updates, чтобы frontend не зависел от предположения «ветер меняется только вместе с игроками».

Для минимального UI feedback текущий `GameStateInfo` теперь читает и показывает `wind` из state. Это не финальный wind HUD, а техническое подтверждение, что authoritative transport уже реально доходит до клиентского runtime.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить reducer/integration flow после добавления `wind` в game state | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после runtime/doc изменений | `Passed` |

### Ручная проверка
- [x] `INIT_GAME_STATE.wind` попадает в frontend state
- [x] `UPDATE_GAME_STATE.wind` обновляет state даже без player patches
- [x] Текущее debug/HUD представление показывает wind из state

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Frontend tests проходят
- [x] Документация синхронизирована

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Это runtime-state groundwork; отдельный пользовательский wind indicator остаётся задачей `TASK-034` | `Resolved` |

**Review решение:** `Approve`

## Финализация
- [x] Frontend game state использует backend wind
- [x] Tests и build проходят
- [x] Документация синхронизирована
- [x] Задача помечена как выполненная в roadmap
