# TASK-020 - Frontend часть: authoritative SPAWN_ASSIGNED application

## Метаданные
- **ID:** `TASK-020`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-09`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 2 / TASK-020`
- **Трек:** `Frontend`
- **Depends on:** `TASK-019`, `TASK-016`

## Контекст
До этой задачи frontend уже умел ждать `SPAWN_ASSIGNED` как часть room enter flow, но сам gameplay runtime не применял authoritative spawn к state текущего игрока. Это было безопасно для initial join только потому, что route switch происходил после `INIT_GAME_STATE`, но при повторных `SPAWN_ASSIGNED` вроде respawn локальный корабль продолжал бы жить на старой позиции и доползал бы до новой точки только через обычную interpolation logic.

## Цель
Сделать `SPAWN_ASSIGNED` реальным authoritative source для координат локального корабля: frontend не вычисляет spawn сам, обновляет runtime state current player по payload backend'а и при respawn/повторном spawn делает мгновенный snap на новые координаты вместо плавного перелёта.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx`
  - `sea_patrol_frontend/src/features/game/model/useGameWsGameState.js`
  - `sea_patrol_frontend/src/features/game/model/GameRealtimeBridge.jsx`
  - `sea_patrol_frontend/src/features/ships/model/useShipInterpolation.js`
  - `sea_patrol_frontend/src/features/ships/ui/PlayerSailShip.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/contexts/GameStateContext.reducer.test.js`
  - `sea_patrol_frontend/src/__tests__/integration/game-state-flow.test.jsx`
  - `sea_patrol_frontend/src/__tests__/components/PlayerSailShip.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Клиент не рандомит spawn самостоятельно.
- [x] Initial spawn и respawn применяются корректно.
- [x] Локальный корабль snap'ается к authoritative spawn, а не плавно долетает из старой позиции.

## Scope
**Включает:**
- подписку game runtime на `SPAWN_ASSIGNED`;
- reducer patch только для current player;
- `spawnRevision`-based snap в interpolation слое;
- tests на reducer, realtime flow и визуальное применение respawn coordinates.

**Не включает (out of scope):**
- новый backend contract;
- death/combat respawn trigger;
- отдельный respawn UI mode/panel.

## Технический подход
`useGameWsGameState` теперь слушает `SPAWN_ASSIGNED` и диспатчит его в `GameStateContext` как authoritative patch для current player. Reducer обновляет `x/z/angle`, сбрасывает `velocity` и инкрементирует `spawnRevision`, но не создаёт player state с нуля до `INIT_GAME_STATE`, чтобы не сломать существующий lobby -> game route gate.

`useShipInterpolation` отслеживает смену `spawnRevision` и при таком событии мгновенно синхронизирует `currentRef`, `targetRef` и transform ship group с authoritative spawn coordinates. Благодаря этому respawn не выглядит как обычный lerp от старой позиции к новой.

## Контракты и данные
### `SPAWN_ASSIGNED`
```json
{
  "roomId": "sandbox-1",
  "reason": "INITIAL | RESPAWN",
  "x": 12.5,
  "z": -8.0,
  "angle": 0.0
}
```

### Правила текущей реализации
- до первого `INIT_GAME_STATE` frontend не создаёт current player state только по одному `SPAWN_ASSIGNED`;
- после появления current player в game state любой следующий `SPAWN_ASSIGNED` становится authoritative patch для локального корабля;
- `reason=RESPAWN` не требует отдельного client-side randomization или guesswork.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить reducer/runtime flow/interpolation под authoritative spawn | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после game-state изменений | `Passed` |

### Ручная проверка
- [x] `SPAWN_ASSIGNED` не переводит пользователя в `/game` раньше `INIT_GAME_STATE`
- [x] После появления current player повторный `SPAWN_ASSIGNED` патчит локальное состояние
- [x] Локальный корабль snap'ается к новым координатам вместо lerp из старой позиции

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Reducer и realtime flow покрыты тестами
- [x] Регрессии по frontend build/test suite не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Frontend уже готов к repeated `SPAWN_ASSIGNED`, но отдельный respawn UX/state (`RESPAWN` copy, fade, countdown) ещё не реализован и остаётся задачей следующих wave'ов | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [x] Документация синхронизирована
- [ ] Задача перенесена в выполненные / архив
