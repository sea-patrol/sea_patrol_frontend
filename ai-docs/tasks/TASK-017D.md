# TASK-017D - Frontend часть: явный navigation flow Home -> Lobby -> Room

## Метаданные
- **ID:** `TASK-017D`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-017D`
- **Трек:** `Frontend`
- **Depends on:** `TASK-016`, `TASK-017C`

## Контекст
После `TASK-017C` лобби уже стало отдельной HTML-first страницей, но navigation polish ещё оставался неполным: пользователю нужно было ещё яснее показать границы между `Home`, `Lobby` и `Room`, а frontend должен был хранить room context между маршрутами так, чтобы переходы не зависели только от `location.state`.

## Цель
Сделать navigation flow `Home -> Lobby -> Room` однозначным: домашняя страница должна вести в лобби, активная room session должна позволять вернуться в комнату, а переход в `/game` должен происходить только после полного room join/init flow.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/app/App.jsx`
  - `sea_patrol_frontend/src/pages/HomePage/index.jsx`
  - `sea_patrol_frontend/src/pages/LobbyPage/index.jsx`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/features/game/model/RoomSessionContext.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/pages/HomePage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
- Внешняя документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Переход на lobby не поднимает gameplay scene.
- [x] Переход в room/game происходит только после завершения join/init flow.
- [x] Пользователю понятны состояния `Home`, `Lobby`, `Room` и переходы между ними.

## Scope
**Включает:**
- явный CTA `Enter lobby` / `Return to room` на `HomePage`;
- хранение room metadata в `RoomSessionContext` поверх роутов;
- навигацию с `/lobby` на `/game` только после `INIT_GAME_STATE/current player`;
- guard и hydration logic для `/game`, чтобы route не зависел только от `location.state`;
- tests на `HomePage`, `LobbyPage` и room shell reopen flow;
- sync frontend docs.

**Не включает (out of scope):**
- backend contract changes;
- redesign стартовой страницы;
- reconnect resume beyond текущий MVP policy;
- пометку roadmap item как `done` в orchestration backlog.

## Технический подход
`RoomSessionContext` стал явным мостом между route-level состояниями. Он живёт выше страниц и хранит room metadata, join response и spawn assignment, чтобы frontend не терял active room context при возврате на `HomePage` или при повторном открытии `/game`.

`LobbyPage` теперь не переводит пользователя на `/game` сразу после `SPAWN_ASSIGNED`. Она остаётся на HTML-first lobby route до тех пор, пока глобальный `GameStateContext` не увидит `INIT_GAME_STATE/current player`. Только после этого route меняется на `/game`, а room scene монтируется уже в fully initialized state.

`HomePage` получила явные состояния навигации: без активной room session главный CTA ведёт в harbor lobby, а при уже активной комнате меняется на `Return to room`. `GameUiShell` умеет восстановить room-scoped UI даже если `/game` открыт повторно без свежего route state, используя persisted room session metadata.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Подтянуть `RoomSessionContext` в navigation flow между `Home`, `Lobby` и `Game`
- [x] Перевести lobby navigation на full init gating
- [x] Убрать state update during render в `GamePage`
- [x] Поддержать reopen `/game` через persisted room metadata
- [x] Добавить route-level tests на `HomePage` и обновить существующие tests
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### Navigation flow
1. `/` — Home page
2. `/lobby` — HTML-first harbor lobby without gameplay scene
3. `/game` — room route with 3D scene and room-scoped shell

### Room entry flow
1. `LobbyPage` вызывает `POST /api/v1/rooms/{roomId}/join`
2. Lobby route получает `ROOM_JOINED` и `SPAWN_ASSIGNED`, но остаётся на `/lobby`
3. Глобальный `GameStateContext` ждёт `INIT_GAME_STATE/current player`
4. Только после этого frontend навигирует на `/game`
5. `GameUiShell` входит в `SAILING` уже с активным player snapshot и persisted room metadata

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| `/game` потеряет room context после возврата на `Home` | route state краткоживущий и зависит от последней навигации | room metadata хранится в `RoomSessionContext` поверх роутов |
| Лобби переведёт пользователя в gameplay слишком рано | `SPAWN_ASSIGNED` ещё не гарантирует готовность full current player snapshot | переход на `/game` происходит только после `INIT_GAME_STATE/current player` |
| `GamePage` будет обновлять state во время render | hydration из `location.state` может вызвать лишние render side effects | room-entry hydration перенесён в `useEffect` |

## План реализации
1. Поднять `RoomSessionContext` в явный navigation bridge.
2. Перевести home CTA на явные состояния `Enter lobby` / `Return to room`.
3. Ужесточить lobby-to-game transition до полного init flow.
4. Защитить `/game` от потери room metadata и обновить room shell fallback.
5. Обновить tests и docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить navigation flow, room session persistence и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после route/session изменений | `Passed` |

### Ручная проверка
- [x] `HomePage` показывает `Enter lobby`, если активной комнаты нет
- [x] `HomePage` показывает `Return to room`, если комната уже активна
- [x] `/lobby` остаётся без canvas и не открывает `/game` до полного init flow
- [x] `/game` умеет использовать persisted room metadata поверх route state

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/pages/GamePage/index.jsx` - room-entry hydration перенесён в `useEffect`
2. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - fallback на `RoomSessionContext` для room-scoped shell и reopen flow
3. `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx` - navigation на `/game` теперь проверяется только после появления current player snapshot
4. `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx` - добавлен coverage на reopen `/game` через persisted room session
5. `sea_patrol_frontend/src/__tests__/pages/HomePage.test.jsx` - tests на `Enter lobby` / `Return to room` CTA
6. `sea_patrol_frontend/ai-docs/API_INFO.md` - документация обновлена под full init gating и room session persistence
7. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - архитектура и test coverage синхронизированы
8. `sea_patrol_frontend/ai-docs/tasks/TASK-017D.md` - frontend task artifact

### Незапланированные находки
- Для navigation polish оказалось недостаточно просто развести маршруты: понадобился отдельный route-agnostic room session layer, иначе возврат на `Home` делал `/game` слишком зависимым от последнего `navigate(..., state)` вызова.
- `SPAWN_ASSIGNED` хорошо описывает прогресс room join, но для реального route switch слишком ранний. Более надёжной границей оказался `INIT_GAME_STATE/current player`.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Navigation states `Home`, `Lobby`, `Room` разделены явно
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Следующий связанный шаг можно направить в reconnect polish, чтобы после timeout room session также явно сбрасывалась в `Home/Lobby` flow (`TASK-022`) | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`
