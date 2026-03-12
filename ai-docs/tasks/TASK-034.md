# TASK-034 - Frontend часть: wind HUD и понятный feedback по движению

## Метаданные
- **ID:** `TASK-034`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-12`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 4 / TASK-034`
- **Трек:** `Frontend`
- **Depends on:** `TASK-032`, `TASK-033`

## Контекст
После `TASK-032` frontend уже хранил authoritative `wind` в `GameStateContext`, а после `TASK-033` игрок физически чувствовал зависимость хода корабля от ветра. Но в UI это всё ещё выглядело слишком "магически": игрок видел только числа и не получал понятной подсказки, почему судно сейчас идёт лучше или хуже.

## Цель
Показать игроку силу и направление ветра в HUD и дать простой, читаемый feedback о том, как текущий ветер соотносится с курсом корабля.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx`
  - `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.css`
  - `sea_patrol_frontend/src/widgets/GameHud/windFeedback.js`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/widgets/windFeedback.test.js`
  - `sea_patrol_frontend/src/__tests__/contexts/GameStateContext.reducer.test.js`
  - `sea_patrol_frontend/src/__tests__/integration/game-state-flow.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/PROJECTS_ORCESTRATION_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Игрок видит силу ветра.
- [x] Игрок видит направление ветра.
- [x] Игрок получает понятную подсказку, почему текущий ветер даёт сильный или слабый ход.
- [x] UI остаётся derived from backend state и не вводит отдельную authoritative wind simulation.

## Scope
**Включает:**
- HUD-представление wind strength и direction;
- derived feedback для текущего курса корабля (`Tailwind`, `Port beam`, `Headwind` и т.д.);
- короткую sail-drive подсказку в HUD;
- unit tests для wind feedback helpers;
- синхронизацию docs и roadmap.

**Не включает (out of scope):**
- изменение backend wind contract;
- сложную карту ветра или minimap overlay;
- локальную симуляцию ветра;
- изменение sailing physics.

## Технический подход
- `ProfileBlock` теперь является основным HUD-слоем над `GameStateContext`.
- Числа и UX-copy собираются через pure helpers в `windFeedback.js`, чтобы логику можно было тестировать отдельно от React UI.
- Derived feedback строится только из уже имеющихся authoritative данных: `wind.angle`, `wind.speed`, `player.angle`, `player.sailLevel`.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить suite после добавления wind HUD feedback | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production-сборку после UI изменений | `Passed` |

### Ручная проверка
- [x] В HUD видны сила и направление ветра
- [x] В HUD видна относительная подсказка по курсу (`Tailwind`, `Port beam`, `Headwind`)
- [x] UI-подсказка опирается на текущие `wind` и `sailLevel`, а не на локальную авторитетную модель

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
| `Low` | Feedback остаётся intentionally simple и текстовым; отдельный визуальный wind compass или minimap overlay можно развивать позже без изменения текущего contract | `Resolved` |

**Review решение:** `Approve`

## Финализация
- [x] Wind HUD перенесён в основной `ProfileBlock`
- [x] Feedback объясняет влияние ветра на ход корабля
- [x] Tests и build проходят
- [x] Документация синхронизирована
- [x] Задача помечена как выполненная в roadmap
