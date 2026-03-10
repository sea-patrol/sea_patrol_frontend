# TASK-022A - Frontend часть: Play и room-resume-first entry flow

## Метаданные
- **ID:** `TASK-022A`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-09`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 2 / TASK-022A`
- **Трек:** `Frontend`
- **Depends on:** `TASK-022`, `TASK-017D`

## Контекст
После `TASK-022` frontend уже умел восстанавливать room session на маршруте `/game`, но после полного закрытия вкладки эта возможность почти терялась: `RoomSessionContext` жил только в памяти SPA, домашняя страница показывала CTA `Enter lobby`, а при повторном открытии приложения пользователь сначала уходил в лобби, даже если backend ещё держал его старую room session в reconnect grace.

## Цель
Сделать домашнюю страницу room-resume-first: вернуть CTA `Play`, сохранять room metadata между полными reload'ами и при наличии живой room session вести пользователя сразу в `/game`, где уже стартует reconnect/resume flow.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/game/model/RoomSessionContext.jsx`
  - `sea_patrol_frontend/src/pages/HomePage/index.jsx`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/contexts/RoomSessionContext.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/HomePage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/pages/GamePage.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Кнопка на домашней странице снова называется `Play`.
- [x] После закрытия вкладки и повторного открытия приложения пользователь с ещё живой room session может через `Play` вернуться сразу в room flow, а не только в lobby.
- [x] Если активной room session уже нет, `Play` не ломает сценарий и приводит пользователя в обычный lobby/new session flow.

## Scope
**Включает:**
- persistence для `RoomSessionContext` через `localStorage`;
- hydration room metadata после полного reload;
- `Play` вместо `Enter lobby` на домашней странице;
- `Play -> /game` при наличии сохранённой room session;
- запуск reconnect flow на `/game`, даже если после reload есть только room metadata, но ещё нет local current player state;
- tests на persistence и fresh room resume.

**Не включает (out of scope):**
- backend contract changes;
- empty-room cleanup policy;
- create-and-join UX;
- новый resume API.

## Технический подход
`RoomSessionProvider` теперь хранит room metadata не только в памяти, но и в `localStorage`. Это позволяет после полного reload восстановить `roomId`, `roomName`, `joinResponse` и `spawn` как resume target, пока JWT остаётся валидным.

`HomePage` перестала быть lobby-first entry point. Главный CTA снова называется `Play`; если у пользователя уже есть сохранённая room session, этот CTA ведёт сразу на `/game`, а не на `/lobby`. Если room session нет, поведение остаётся прежним и пользователь попадает в harbor lobby.

`GamePage` теперь умеет стартовать reconnect flow не только после live disconnect из уже открытой комнаты, но и после fresh reload, когда есть только persisted room metadata без in-memory `currentPlayerState`. Это закрывает gap между backend reconnect grace и frontend entry flow.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить home CTA, room session persistence и fresh room resume flow | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после entry-flow/persistence изменений | `Passed` |

### Ручная проверка
- [x] Home CTA снова называется `Play`
- [x] При наличии сохранённой room session `Play` ведёт на `/game`
- [x] После полного reload `/game` входит в reconnect flow даже без local `currentPlayerState`
- [x] При отсутствии room session `Play` по-прежнему ведёт в `/lobby`

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Persistence и resume path покрыты тестами
- [x] Регрессии по frontend build/test suite не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Room resume target сейчас живёт в `localStorage` без серверной валидации до открытия `/game`. Если в будущем появится отдельный resume API или сохранение нескольких room/profile контекстов, storage-модель нужно будет пересмотреть | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [x] Документация синхронизирована
- [ ] Задача перенесена в выполненные / архив
