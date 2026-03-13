# TASK-037 - Frontend часть: `CHAT_FOCUS` и `WINDOW_FOCUS`

## 1. Summary

- `ID`: `TASK-037`
- `Track`: `Frontend`
- `Priority`: `P1`
- `Status`: `Done`
- `Depends on`: `TASK-036`

## 2. Goal

Довести поведение `CHAT_FOCUS` и `WINDOW_FOCUS`, чтобы ship controls, чат и крупные окна больше не конфликтовали между собой.

## 3. Scope

- Защитить глобальные hotkeys от срабатывания, пока клавиатурный фокус находится в editable элементе.
- При уходе из `CHAT_FOCUS` гарантированно снимать реальный DOM focus с chat input.
- Подтвердить регрессией, что открытие крупного окна сбрасывает активный `PLAYER_INPUT` и блокирует обычный sailing input.

## 4. Source of Truth

- [GameUiHotkeys.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiHotkeys.jsx)
- [GameUiShell.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx)
- [KeyPress.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/features/player-controls/ui/KeyPress.jsx)

## 5. Acceptance

- Chat input не конфликтует с глобальными hotkeys.
- При переключении из чата в меню или большое окно chat input не остаётся сфокусированным скрыто.
- Большие окна блокируют обычный sailing input и сбрасывают активный `PLAYER_INPUT`.

## 6. Tests

- [GameUiHotkeys.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiHotkeys.test.jsx)
- [ws-send-regression.test.jsx](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/src/__tests__/integration/ws-send-regression.test.jsx)

## 7. Docs

- [PROJECT_INFO.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_frontend/ai-docs/PROJECT_INFO.md)
- [ROADMAP-TASKS.md](C:/Users/ivvko/Documents/Projects/sea_patrol/sea_patrol_orchestration/ROADMAP-TASKS.md)
