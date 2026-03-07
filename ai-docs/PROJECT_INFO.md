# PROJECT_INFO.md

## 1. Business Overview

### 1.1 Project Name
**Sea Patrol** — многопользовательская 3D-браузерная игра про парусные корабли.

### 1.2 Project Type
- **Жанр**: Морская приключенческая игра (sailing simulator)
- **Формат**: Браузерная PWA (Progressive Web App)
- **Режим**: Многопользовательский онлайн (real-time multiplayer)

### 1.3 Primary Goal
Создать доступную браузерную игру с реалистичной физикой парусных кораблей, где игроки могут исследовать океан, взаимодействовать друг с другом и участвовать в морских приключениях.

### 1.4 Target Audience
- Любители морских приключений и парусных симуляторов
- Игроки, предпочитающие браузерные игры без установки клиента
- Аудитория, интересующаяся многопользовательскими онлайн-играми

### 1.5 Expected Business Outcome
- Запуск работающего прототипа (MVP) с базовой игровой механикой
- Привлечение сообщества игроков для тестирования и обратной связи
- Возможность масштабирования функционала на основе пользовательского фидбека

## 2. Product Scope (MVP)

### 2.1 In Scope
- **Аутентификация**: Регистрация/вход пользователей с JWT-токенами
- **Игровой процесс**: Управление парусным кораблём в 3D-океане (WASD/стрелки)
- **Многопользовательский режим**: Синхронизация позиций игроков через WebSocket в реальном времени
- **Чат**: Текстовый чат для общения между игроками
- **NPC**: Корабли с искусственным интеллектом
- **PWA**: Офлайн-кэширование ресурсов (3D-модели, текстуры)
- **Debug UI**: Инструменты отладки (Leva) и мониторинг производительности (r3f-perf)

### 2.2 Out of Scope (для MVP)
- Боевая система и сражения
- Система квестов и заданий
- Торговля и экономика
- Кастомизация кораблей
- Мобильные платформы (только десктопные браузеры)

## 3. Technical Overview

### 3.1 Tech Stack
- **Frontend**: React 19
- **Инструмент сборки**: Vite 7
- **3D-графика**: Three.js + React Three Fiber + Drei
- **Роутинг**: React Router DOM
- **Управление состоянием**: React Context API
- **Общение в реальном времени**: WebSocket
- **Стилизация**: CSS (PascalCase имена файлов)
- **Debug UI**: Leva
- **Мониторинг производительности**: r3f-perf
- **PWA**: vite-plugin-pwa
- **Язык**: JavaScript (ES2020+)
- **Linting**: ESLint (@eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-testing-library)
- **Pre-commit хуки**: Husky + lint-staged
- **Абсолютные импорты**: Vite alias (`@/` → `src/`)
- **Package manager**: `npm`

### 3.2 Current Repository Structure

```
src/
├── app/                  # Точка входа и корневой App
│   ├── App.jsx
│   └── main.jsx
├── pages/                # Страницы
│   ├── HomePage/
│   └── GamePage/
├── widgets/              # UI-виджеты (сборки UI)
│   ├── ChatPanel/
│   ├── GameHud/
│   └── LobbyPanel/
├── features/             # Фичи (ui + model)
│   ├── auth/             # AuthContext + формы
│   ├── realtime/         # WebSocketContext
│   ├── game/             # GameStateContext + ws→dispatch hook
│   ├── player-controls/  # KeyPress c проверкой UI mode
│   ├── ui-shell/         # GameUiContext + GameUiShell + централизованные hotkeys
│   └── ships/            # Ship UI + interpolation
├── scene/                # 3D-сцена (Canvas + океан + камера + debug)
│   ├── ocean/
│   └── camera/
├── shared/               # Переиспользуемое: api/ws/constants/assets/styles
│   ├── api/
│   ├── ws/
│   ├── constants/
│   ├── assets/
│   └── styles/
├── test/                 # test setup + msw mocks (setupFiles)
│   ├── setup/
│   └── mocks/
└── __tests__/            # Vitest тесты (unit/integration)
```

### 3.3 Architecture Decisions

- **Минимум зависимостей**: Только необходимые библиотеки для React/Vite/R3F
- **Context API для глобального состояния**: Auth, WebSocket, GameState и GameUi — без Redux/Zustand
- **UI shell отдельно от 3D-сцены**: `GamePage` оркестрирует providers, scene и `GameUiShell`, а HUD/окна/notice overlays больше не живут внутри canvas
- **Единая UI mode model**: `GameUiContext` задаёт состояния `LOADING`, `LOBBY`, `SAILING`, `CHAT_FOCUS`, `WINDOW_FOCUS`, `MENU_OPEN`, `RECONNECTING`, `RESPAWN`
- **Lobby-first `/game` flow**: пока у текущего пользователя нет active room state, `GameUiShell` остаётся в `LOBBY`, рендерит `LobbyPanel` и загружает room catalog через `GET /api/v1/rooms`; переход в `SAILING` происходит только после появления текущего игрока в game state
- **Централизованные UI hotkeys**: `Enter`, `Esc`, `I`, `J`, `M` обрабатываются в одном слое (`GameUiHotkeys`), а gameplay input учитывает текущий UI mode
- **Client-side prediction**: Интерполяция позиций кораблей между обновлениями сервера для плавности
- **WebSocket reconnect**: экспоненциальный backoff (1s/2s/4s/8s), лимит попыток, cleanup таймеров при logout/unmount
- **PWA для офлайн-кэширования**: 3D-модели (.glb) кэшируются через Service Worker
- **Слоистая структура `src/`**: app/pages/widgets/features/scene/shared для контроля зависимостей и упрощения роста проекта
- **Модульная загрузка моделей**: Централизованная предзагрузка через `useGLTF.preload()`

### 3.4 Quality & Standards

- **Небольшие, точечные изменения**: Избегать избыточных рефакторингов
- **Читаемость кода важнее избыточной абстракции**: Простые решения предпочтительнее
- **Семантическая HTML-разметка**: Базовая доступность (a11y)
- **Именование файлов**:
  - Компоненты: **PascalCase** (`PlayerSailShip.jsx`)
  - Утилиты/Константы: **camelCase** (`messageType.js`, `models.js`)
  - Стили: **PascalCase** в соответствии с компонентом (`HomePage.css`)
- **ESLint правила**:
  - `no-unused-vars`: разрешены переменные, начинающиеся с `A-Z` или `_` (для JSX)
  - React Hooks: рекомендованные правила
  - Vite React Refresh: для горячей перезагрузки
  - `import/order`: сортировка импортов по группам с алфавитным порядком
  - `jsx-a11y`: правила доступности для JSX элементов
  - `testing-library`: лучшие практики для тестов React Testing Library
- **Абсолютные импорты**: Использовать `@/` для импортов из `src/` (например, `@/components/PlayerSailShip`)

### 3.5 Testing Workflow

**Текущее состояние**: Тесты настроены и работают (TASK-1 ✅).

**Стек тестирования**:
- **Тест-раннер**: Vitest (интегрирован с Vite)
- **React-компоненты**: @testing-library/react + @testing-library/jest-dom
- **3D-компоненты**: @react-three/test-renderer
- **REST API моки**: MSW (Mock Service Worker)
- **WebSocket моки**: mock-socket

**Структура тестов**:
```
 src/
 ├── __tests__/
 │   ├── components/       # Login, Signup, PlayerSailShip
 │   ├── contexts/         # AuthContext, WebSocketContext
 │   ├── features/         # ui-shell reducer/hotkeys
 │   └── integration/      # auth-flow + ws-send-regression + game-state-flow
 └── test/
     ├── mocks/            # MSW обработчики + тестовые данные
     │   ├── handlers.js
     │   ├── websocket.js
     │   └── data.js
     └── setup/
         └── setupTests.js # Глобальная настройка тестов (Vitest setupFiles)
```

**Запуск тестов**:
- `npm run test` — запуск в режиме watch (dev)
- `npm run test:run` — однократный запуск (CI/CD)
- `npm run test:coverage` — запуск с отчётом о покрытии

**Текущее покрытие**:
- 17 тестовых файлов
- 88 тестов (все проходят ✅)
- Протестированы: AuthContext, WebSocketContext, GameStateContext (reducer), GameUi reducer/hotkeys, Login, Signup, PlayerSailShip, LobbyPanel, auth-flow, game-state-flow, authApi, roomApi, wsClient, messageAdapter, ws-send-regression, shipInterpolation utils

## 4. Working Commands

### 4.1 Initial Setup
- `npm install` — установка зависимостей.

### 4.2 Development
- `npm run dev` — запуск dev-сервера (http://localhost:5173).
- `npm run lint` — проверка линтером ESLint.
- `npm run build` — production-сборка в директорию `dist/`.
- `npm run preview` — локальный preview production-сборки.
- `npm run prepare` — установка Husky хуков (автоматически после `npm install`).

### 4.3 Testing
- `npm run test` — запуск в режиме watch (dev).
- `npm run test:run` — однократный запуск (CI/CD).
- `npm run test:coverage` — запуск с отчётом о покрытии.

**Текущее покрытие**: 17 файлов, 88 тестов (AuthContext, WebSocketContext, GameStateContext reducer, GameUi reducer/hotkeys, Login, Signup, PlayerSailShip, LobbyPanel, auth-flow, game-state-flow, authApi, roomApi, wsClient, messageAdapter, ws-send-regression, shipInterpolation utils).

### 4.4 Environment Variables
Фронтенд читает переменные окружения только с префиксом `VITE_` (стандарт Vite). Пример конфигурации — `.env.example`.

- `VITE_API_BASE_URL` — базовый URL HTTP backend (например, `http://localhost:8080`), далее фронтенд добавляет `/api/v1/auth/*`.
- `VITE_WS_BASE_URL` — базовый URL WebSocket backend (например, `ws://localhost:8080`), далее фронтенд добавляет `/ws/game`.

📡 Подробное описание текущего REST/WS API: [`ai-docs/API_INFO.md`](ai-docs/API_INFO.md).

### 4.5 Git Workflow
- `git fetch` — получить актуальное состояние удаленных веток.
- `git checkout main` — перейти на `main` перед стартом новой задачи.
- `git pull --ff-only` — обновить локальный `main` без merge-коммита.
  - Если ошибка: выполнить `git stash` (сохранить изменения) или `git reset --hard origin/main` (отменить локальные изменения).
- `git checkout -b feature/TASK-<N>` — создать ветку для новой фичи.
- `git checkout -b bugfix/TASK-<N>` — создать ветку для исправления бага.
- `git push -u origin feature/TASK-<N>` — запушить ветку перед созданием PR.
- `gh pr create` — создать Pull Request через GitHub CLI (альтернатива: через веб-интерфейс GitHub).

## 5. Deployment

### 5.1 Deployment Notes
- Для публикации требуется корректный `base` в `vite.config.js` (под имя репозитория).
- Основная команда проверки перед деплоем: `npm run build`.
- PWA-функциональность включается только в production-режиме (devOptions: { enabled: false }).







