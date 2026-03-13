# TASK-033C - Frontend часть: отображение backend sailLevel

## Метаданные
- **ID:** `TASK-033C`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-12`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 4 / TASK-033C`
- **Трек:** `Frontend`
- **Depends on:** `TASK-033A`, `TASK-032`, `TASK-033B`

## Контекст
После `TASK-033B` backend уже начал присылать `sailLevel` в `INIT_GAME_STATE` и `UPDATE_GAME_STATE`, но frontend ещё не закреплял это поле как часть своего runtime state и не показывал его игроку в HUD.

## Цель
Поднять `sailLevel` в клиентский game state и показать игроку текущий уровень парусов без введения отдельной локальной authoritative модели.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx`
  - `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx`
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
- [x] Frontend получает `sailLevel` из backend `INIT_GAME_STATE`.
- [x] Frontend применяет `sailLevel` из backend `UPDATE_GAME_STATE`.
- [x] Игрок видит текущий уровень парусов в HUD/debug UI.
- [x] Клиент не вводит отдельную локальную authoritative модель `sailLevel`.
- [x] Тесты подтверждают хранение `sailLevel` в runtime state, а HUD-код читает его напрямую из того же state.

## Scope
**Включает:**
- закрепление `sailLevel` как части `playerStates` в client runtime;
- отображение `sailLevel` в основном HUD;
- тесты на reducer и WS flow;
- синхронизацию frontend/orchestration docs.

**Не включает (out of scope):**
- изменение формата `PLAYER_INPUT`;
- локальный расчёт уровней парусов на клиенте;
- новую отдельную HUD-панель управления парусами;
- backend изменения physics/runtime.

## Технический подход
- `GameStateContext` уже копировал неизвестные player fields из backend payload, поэтому для runtime было важно не добавлять новую клиентскую state machine, а просто зафиксировать это тестами.
- основной HUD читает `sailLevel` из текущего player state и показывает его как `Паруса: N/3`.
- Клиент по-прежнему отправляет только `PLAYER_INPUT` и считает backend единственным source of truth для уровня парусов.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить reducer/integration coverage после подъёма `sailLevel` | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production-сборку после HUD/runtime изменений | `Passed` |

### Ручная проверка
- [x] `INIT_GAME_STATE.players[*].sailLevel` появляется в client state
- [x] `UPDATE_GAME_STATE.players[*].sailLevel` обновляет client state
- [x] Основной HUD показывает уровень парусов без локального пересчёта

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Frontend tests проходят
- [x] Build проходит
- [x] Документация синхронизирована

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Отдельный interactive sail HUD остаётся будущей UX-задачей; текущий инкремент осознанно ограничен authoritative state + debug/HUD surfacing | `Resolved` |

**Review решение:** `Approve`

## Финализация
- [x] `sailLevel` поднят в frontend runtime state
- [x] Основной HUD показывает текущий уровень парусов
- [x] Tests и build проходят
- [x] Документация синхронизирована
- [x] Задача помечена как выполненная в roadmap
