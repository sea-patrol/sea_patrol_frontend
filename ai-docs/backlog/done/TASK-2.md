# TASK-2 — Рефакторинг организации кодовой базы

## Метаданные
- **ID:** TASK-2
- **Ветка:** `feature/TASK-2`
- **Статус:** Todo
- **Дата создания:** 2026-03-02

## Описание задачи
Провести рефакторинг кодовой базы frontend-приложения для улучшения организации кода, наименования и расположения файлов согласно best practices React/R3F проектов.

**Проблема:** Текущая версия проекта написана без соблюдения профессиональных стандартов организации кода:
- Все компоненты в одной папке без разделения по назначению
- Отсутствуют централизованные экспорты (index.js)
- Смешана логика 3D-сцены, UI и игровой логики
- Перегруженные компоненты без разделения ответственности
- Несогласованное именование файлов

## Acceptance Criteria
- [ ] Компоненты разделены по папкам: `ui/`, `scene/`, `game/`, `shared/`
- [ ] Все контексты имеют `index.js` для централизованных экспортов
- [ ] `PlayerSailShip.jsx` рефакторен: логика интерполяции вынесена в хук
- [ ] `WireframeBox` вынесен в отдельный компонент в `shared/`
- [ ] `GamePage.jsx` использует отдельный `GameLayout` компонент
- [ ] `messageType.js` использует `const` объект вместо отдельных экспортов
- [ ] Все компоненты имеют JSDoc комментарии для пропсов
- [ ] `npm run build` проходит без ошибок
- [ ] `npm run test:run` — все тесты проходят (53 теста)
- [ ] `npm run lint` — нет новых ошибок

## Scope
**Включает:**
- Реорганизация структуры папок `src/components/`
- Рефакторинг контекстов и создание `index.js` экспортов
- Разделение логики в `PlayerSailShip.jsx`
- Улучшение `messageType.js`
- Создание `GameLayout` для `GamePage`
- Добавление JSDoc документации

**Не включает (out-of-scope):**
- Изменение бизнес-логики игры
- Добавление новых зависимостей
- Изменение API контрактов
- Рефакторинг стилей (CSS)
- Изменение конфигурации Vite/ESLint

## Технический план

### Этапы реализации с назначением субагентов

| Этап | Задача | Субагент |
|------|--------|----------|
| 1 | Анализ текущей архитектуры, оценка рисков | `tech-lead` |
| 2 | Реорганизация структуры компонентов | `frontend-developer` |
| 3 | Рефакторинг `PlayerSailShip.jsx`, создание хуков | `frontend-developer` |
| 4 | Рефакторинг контекстов, создание `GameLayout` | `frontend-developer` |
| 5 | Проверка тестов, обновление импортов в тестах | `qa-engineer` |
| 6 | Code review, проверка best practices | `code-reviewer` |

### Затрагиваемые файлы/модули
- `src/components/` → реорганизация в `ui/`, `scene/`, `game/`, `shared/`
- `src/contexts/` → добавление `index.js`
- `src/const/messageType.js` → изменение формата экспорта
- `src/pages/GamePage.jsx` → использование `GameLayout`
- `src/utils/models.js` → добавление хука `useShipModel()`
- `src/__tests__/` → обновление импортов

### Риски и меры контроля
| Риск | Мера контроля |
|------|---------------|
| Сломанные импорты в тестах | QA Engineer проверит все тесты после рефакторинга |
| Потеря функциональности интерполяции | Поэтапный рефакторинг с проверкой после каждого этапа |
| Конфликты при merge | Работа в отдельной ветке, частые sync с master |

## Реализация

### Измененные файлы

1. **Структура папок:**
```
src/components/
├── ui/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── ChatBlock.jsx
│   ├── ProfileBlock.jsx
│   └── LoadingScreen.jsx
├── scene/
│   ├── Ocean.jsx
│   ├── PlayerSailShip.jsx
│   ├── NpcSailShip.jsx
│   ├── CameraFollower.jsx
│   ├── Buoys.jsx
│   └── WireframeBox.jsx (новый)
├── game/
│   ├── KeyPress.jsx
│   └── GameStateInfo.jsx
└── index.js (новый - централизованные экспорты)
```

2. **`src/contexts/index.js`** (новый файл):
```javascript
export { AuthProvider, useAuth } from './AuthContext';
export { WebSocketProvider, useWebSocket } from './WebSocketContext';
export { GameStateProvider, useGameState } from './GameStateContext';
```

3. **`src/const/messageType.js`**:
```javascript
export const MessageType = {
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  CHAT_JOIN: 'CHAT_JOIN',
  CHAT_LEAVE: 'CHAT_LEAVE',
  PLAYER_INPUT: 'PLAYER_INPUT',
  PLAYER_JOIN: 'PLAYER_JOIN',
  PLAYER_LEAVE: 'PLAYER_LEAVE',
  INIT_GAME_STATE: 'INIT_GAME_STATE',
  UPDATE_GAME_STATE: 'UPDATE_GAME_STATE',
} as const;
```

4. **`src/components/scene/WireframeBox.jsx`** (новый):
```javascript
// Вынесен из PlayerSailShip.jsx
```

5. **`src/hooks/useShipInterpolation.js`** (новый хук):
```javascript
// Логика интерполяции позиций кораблей
```

6. **`src/pages/GameLayout.jsx`** (новый):
```javascript
// Обёртка с провайдерами для GamePage
```

## Проверки
### Build
```bash
npm run build
```
Статус: ⬜

### Tests
```bash
npm run test:run
```
Статус: ⬜

### Lint
```bash
npm run lint
```
Статус: ⬜

## QA Report
<!-- QA Engineer: результаты проверки -->
- [ ] Все acceptance criteria проверены
- [ ] Ключевые сценарии работают
- [ ] Регресс не обнаружен
- [ ] Build и tests проходят

**Статус:** Not Started

**Найденные проблемы:**
- 

## Code Review
<!-- Code Reviewer: замечания и решение -->

### Замечания
| Приоритет | Описание | Статус |
|-----------|----------|--------|
| | | |

**Решение:** Not Started

## Финализация
- [ ] PR создан (`gh pr create`)
- [ ] PR замержен
- [ ] Задача перенесена в `ai-docs/backlog/done/`
- [ ] `ai-docs/PROJECT_INFO.md` обновлён

---
**Ссылки:**
- PR: #<N>
- Commit: `<hash>`
