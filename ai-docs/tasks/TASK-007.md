# TASK-007 - Frontend часть: GameUiShell и базовая UI mode model

## Метаданные
- **ID:** `TASK-007`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-06`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 0 / TASK-007`
- **Трек:** `Frontend`
- **Depends on:** `TASK-004`

## Контекст
До этой задачи frontend рендерил игровые UI-элементы фрагментарно: `GamePage` отдельно подключал чат, `GameMainScene` рендерил `GameStateInfo` внутри игрового контура, а модели режимов интерфейса вообще не существовало. Это делало дальнейшие задачи по лобби, in-game HUD и hotkeys рискованными: UI зависел от расположения компонентов, а не от явного shell/state model.

`TASK-007` нужна как каркас под следующие frontend задачи roadmap: лобби (`TASK-014`/`TASK-015`), HUD (`TASK-030`), chat/window focus (`TASK-031`), reconnect/respawn states (`TASK-022`, `TASK-037`).

## Цель
Подготовить отдельный `GameUiShell` поверх сцены и ввести базовую единицу управления UI modes, чтобы интерфейс, hotkeys и будущие окна развивались поверх одного source of truth, а не были размазаны между `GamePage`, chat и 3D-компонентами.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js`
  - `sea_patrol_frontend/src/features/ui-shell/model/GameUiContext.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiHotkeys.jsx`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/scene/GameMainScene.jsx`
  - `sea_patrol_frontend/src/features/player-controls/ui/KeyPress.jsx`
- Виджеты / UI integration:
  - `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.jsx`
  - `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx`
  - `sea_patrol_frontend/src/widgets/GameHud/GameStateInfo.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/gameUiState.test.js`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiHotkeys.test.jsx`
  - `sea_patrol_frontend/src/__tests__/integration/ws-send-regression.test.jsx`
- Внешняя документация:
  - `sea_patrol_orchestration/ROADMAP.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`

## Acceptance Criteria
- [x] UI-слой отделён от 3D canvas.
- [x] Есть единая модель режимов UI.
- [x] Hotkeys не размазаны по разным компонентам.

## Scope
**Включает:**
- введение `GameUiContext` и reducer/selectors для базовой UI mode model;
- вынос page-level HUD/chat/panel orchestration в `GameUiShell` поверх сцены;
- централизованную обработку `Enter`, `Esc`, `I`, `J`, `M` через `GameUiHotkeys`;
- привязку gameplay input к активному UI mode;
- placeholder panels для `Inventory` / `Journal` / `Map` / `Menu` как shell anchors под следующие задачи.

**Не включает (out of scope):**
- реальную страницу лобби и room list;
- полноценные inventory/journal/map windows;
- reconnect resume flow;
- respawn UI flow;
- изменение REST/WS API contracts.

## Технический подход
Frontend получил отдельный слой `features/ui-shell`, где reducer `gameUiState` хранит `screenMode`, `overlayMode` и `activeWindow`, а `GameUiContext` предоставляет единый runtime API для shell и hotkeys. `GamePage` теперь оркестрирует providers и рендерит сцену и shell как два разных слоя: canvas остаётся в `GameMainScene`, а `GameUiShell` берёт на себя HUD, chat, notices и placeholder windows.

UI hotkeys вынесены в `GameUiHotkeys`, так что переходы между `SAILING`, `CHAT_FOCUS`, `WINDOW_FOCUS`, `MENU_OPEN` больше не размазаны по разным компонентам. Дополнительно `KeyPress` теперь проверяет `isGameplayInputAllowed`, чтобы ship input подчинялся UI mode model уже на этом этапе, до полноценного `TASK-031`.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить `GameUiContext` и reducer/selectors для UI modes
- [x] Ввести отдельный `GameUiShell` поверх сцены
- [x] Централизовать UI hotkeys в `GameUiHotkeys`
- [x] Подвязать gameplay input к UI modes
- [x] Адаптировать chat/HUD widgets под shell layout
- [x] Добавить tests на reducer и hotkeys
- [x] Обновить `ai-docs/PROJECT_INFO.md`
- [ ] Обновить `ai-docs/API_INFO.md` при изменении внешнего контракта

## Контракты и данные
### UI modes
- `LOADING`
- `LOBBY`
- `SAILING`
- `CHAT_FOCUS`
- `WINDOW_FOCUS`
- `MENU_OPEN`
- `RECONNECTING`
- `RESPAWN`

### Hotkeys
- `Enter` -> `CHAT_FOCUS`
- `Esc` -> закрытие `CHAT_FOCUS` / `WINDOW_FOCUS` / `MENU_OPEN`, либо открытие menu из `SAILING`
- `I` / `J` / `M` -> `WINDOW_FOCUS` c переключением активного placeholder window

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| UI mode model начнет расходиться с реальным поведением будущих экранов | Лобби, reconnect и respawn ещё не реализованы целиком | В shell уже заведены канонические mode ids и отдельные placeholder states под следующие задачи |
| Hotkeys shell будут конфликтовать с ship controls | До этого UI вообще не ограничивал gameplay input | `KeyPress` теперь читает `isGameplayInputAllowed` из `GameUiContext` |
| Shell снова начнет протекать внутрь canvas | Исторически HUD уже рендерился из `GameMainScene` | `GamePage` теперь разводит scene и shell как разные визуальные слои |

## План реализации
1. Ввести reducer/selectors для `GameUiContext`.
2. Собрать `GameUiShell` как page-level overlay поверх сцены.
3. Централизовать UI hotkeys и связать chat focus/window/menu transitions с одним state model.
4. Подчинить gameplay input текущему UI mode.
5. Добавить tests на reducer/hotkeys и прогнать frontend suite/build.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить shell reducer, hotkeys и отсутствие frontend regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после перестройки GamePage/shell | `Passed` |

### Ручная проверка
- [x] Проверено, что shell живёт отдельным слоем поверх canvas
- [x] Проверено, что `Enter`, `Esc`, `I`, `J`, `M` централизованы в одном месте
- [x] Проверено, что placeholder windows/menu не рендерятся внутри `GameMainScene`
- [x] Проверено, что gameplay input ограничивается UI mode model

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/features/ui-shell/model/gameUiState.js` - reducer/selectors для UI mode model
2. `sea_patrol_frontend/src/features/ui-shell/model/GameUiContext.jsx` - provider и runtime API для shell/hotkeys
3. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiHotkeys.jsx` - централизованная обработка UI hotkeys
4. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - page-level shell поверх сцены
5. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.css` - новый shell layout/style layer
6. `sea_patrol_frontend/src/pages/GamePage/index.jsx` - page orchestration переведена на scene + shell
7. `sea_patrol_frontend/src/pages/GamePage/GamePage.css` - viewport layout под overlay shell
8. `sea_patrol_frontend/src/scene/GameMainScene.jsx` - HUD убран из scene-level rendering
9. `sea_patrol_frontend/src/features/player-controls/ui/KeyPress.jsx` - gameplay input учитывает UI mode
10. `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.jsx` - chat интегрирован с shell focus callbacks
11. `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.css` - shell-friendly chat style
12. `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx` - profile widget подключен к auth user
13. `sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.css` - shell-friendly profile style
14. `sea_patrol_frontend/src/widgets/GameHud/GameStateInfo.jsx` - game state widget синхронизирован для shell
15. `sea_patrol_frontend/src/widgets/GameHud/GameStateInfo.css` - shell-friendly state card style
16. `sea_patrol_frontend/src/__tests__/features/ui-shell/gameUiState.test.js` - tests на reducer/selectors
17. `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiHotkeys.test.jsx` - tests на centralized hotkeys
18. `sea_patrol_frontend/src/__tests__/integration/ws-send-regression.test.jsx` - integration harness обновлён под `GameUiProvider`
19. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for shell architecture
20. `sea_patrol_frontend/ai-docs/tasks/TASK-007.md` - frontend task artifact

### Незапланированные находки
- Для централизованных hotkeys пришлось явно связать gameplay input и UI shell уже в `TASK-007`, иначе `Enter`/`Esc`/window states не влияли бы на ship controls вообще.
- Старый `ws-send-regression` test implicitly предполагал, что `KeyPress` живёт без UI provider; после ввода shell это предположение стало неверным и тест пришлось обновить.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Ключевые сценарии проходят
- [x] Регресс по frontend test suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Когда начнётся `TASK-014`/`TASK-015`, стоит решить, остаётся ли `LOBBY` отдельным page mode внутри текущего shell или потребуется отдельный route-level shell branch | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_orchestration/ROADMAP.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
