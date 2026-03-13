# TASK-036 - Frontend часть: базовый in-game HUD

## 1. Summary

- `ID`: `TASK-036`
- `Track`: `Frontend`
- `Priority`: `P0`
- `Status`: `Done`
- `Depends on`: `TASK-007`, `TASK-020`, `TASK-032`

## 2. Goal

Собрать понятный базовый игровой HUD поверх gameplay scene, чтобы в `SAILING` mode у игрока уже был минимально usable интерфейс без debug-инструментов и без открытия крупных окон.

## 3. Scope

- Разместить поверх canvas основной captain/status block.
- Оставить room-scoped chat как постоянный HUD-элемент в комнате.
- Собрать компактную панель быстрых действий с `Chat`, `Inventory`, `Journal`, `Map`, `Menu`.
- Использовать уже существующие authoritative runtime данные (`current player`, `wind`, `sailLevel`) вместо локальных HUD-плейсхолдеров.

## 4. Source of Truth

- [GameUiShell.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx)
- [GameUiShell.css](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.css)
- [ProfileBlock.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx)
- [ProfileBlock.css](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.css)
- [ChatBlock.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.jsx)

## 5. Acceptance

- HUD живёт поверх gameplay scene и не требует debug-layer для базовой навигации.
- В `SAILING` mode игрок видит captain/status block, room chat и quick-action кнопки.
- Wind и `sailLevel` показываются через основной HUD на базе backend-authoritative state.
- Меню комнаты открывается из HUD и остаётся частью того же room shell.

## 6. Tests

- [GameUiShell.roomJoin.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx)
- [ProfileBlock.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/widgets/ProfileBlock.test.jsx)

## 7. Docs

- [PROJECT_INFO.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/ai-docs/PROJECT_INFO.md)
- [ROADMAP-TASKS.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_orchestration/ROADMAP-TASKS.md)
