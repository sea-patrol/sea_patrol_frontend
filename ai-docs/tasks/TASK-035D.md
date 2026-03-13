# TASK-035D - Frontend часть: dev-only toggle для debug UI

## 1. Summary

- `ID`: `TASK-035D`
- `Track`: `Frontend`
- `Priority`: `P1`
- `Status`: `Done`
- `Depends on`: `TASK-036`

## 2. Goal

Добавить в меню комнаты dev-only кнопку `Дебаг`, которая включает и выключает debug-layer runtime-переключателем без отдельной пересборки frontend.

## 3. Scope

- Ввести frontend runtime state для видимости debug UI.
- Поднять этот state выше room/game shell, чтобы им пользовались и 3D debug overlay, и HUD debug секция.
- Показать кнопку `Дебаг: вкл/выкл` только в dev/debug окружении внутри `MENU_OPEN`.
- Сохранить обычный gameplay HUD и production UI без изменений.

## 4. Source of Truth

- [DebugUiContext.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/debug/model/DebugUiContext.jsx)
- [App.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/app/App.jsx)
- [GameUiShell.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx)
- [GameUiShell.css](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.css)
- [GameDebugOverlay.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/scene/GameDebugOverlay.jsx)
- [ProfileBlock.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/widgets/GameHud/ProfileBlock.jsx)

## 5. Acceptance

- Кнопка `Дебаг` видна только в dev/debug режиме.
- Из меню комнаты можно включить и выключить debug-layer без перезагрузки страницы и без пересборки.
- Один toggle управляет и `Leva/r3f-perf`, и HUD debug секцией.
- В production UI кнопка и debug-layer не рендерятся.

## 6. Tests

- [GameUiShell.roomJoin.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx)
- [ProfileBlock.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/widgets/ProfileBlock.test.jsx)

## 7. Docs

- [PROJECT_INFO.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/ai-docs/PROJECT_INFO.md)
- [ROADMAP-TASKS.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_orchestration/ROADMAP-TASKS.md)
