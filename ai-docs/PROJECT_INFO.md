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
│   ├── LobbyPage/
│   └── GamePage/
├── widgets/              # UI-виджеты (сборки UI)
│   ├── ChatPanel/
│   ├── GameHud/
│   ├── LobbyPanel/
│   └── RoomLoadingSummary/
├── features/             # Фичи (ui + model)
│   ├── auth/             # AuthContext + формы
│   ├── realtime/         # WebSocketContext
│   ├── game/             # GameStateContext + RoomSessionContext + global realtime bridge
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
│   ├── lib/
│   └── styles/
├── test/                 # test setup + msw mocks (setupFiles)
│   ├── setup/
│   └── mocks/
└── __tests__/            # Vitest тесты (unit/integration)
```

### 3.3 Architecture Decisions

- **Минимум зависимостей**: Только необходимые библиотеки для React/Vite/R3F
- **Context API для глобального состояния**: Auth, WebSocket, GameState и RoomSession подняты выше роутов, а route-local `GameUi` управляет только room/game shell without Redux/Zustand
- **Auth bootstrap восстанавливает persisted session целиком**: `AuthContext` поднимает пользователя из `localStorage` (`token` + `auth-user`), может восстановить `username` из JWT `sub` и сразу отбрасывает просроченный/битый JWT, поэтому home/lobby UI не показывает ложный logged-in state при expired token
- **UI shell отдельно от 3D-сцены**: `LobbyPage` теперь HTML-first и вообще не монтирует `Canvas`, а `GamePage` поднимает 3D-сцену только когда у маршрута уже есть room context; внутри room route `GameUiShell` продолжает жить отдельно от canvas
- **Lobby map metadata дополняется на фронте**: `LobbyPanel` использует локальный registry `src/shared/lib/mapMetadata.js`, чтобы по `mapId` показывать в списке комнат и в create form не только `mapName`, но и `region` с простым chart preview; для неизвестных `mapId` UI откатывается к fallback metadata без поломки room catalog
- **`ROOM_LOADING` теперь показывает структурированный summary**: общий widget `RoomLoadingSummary` используется и в `LobbyPage`, и в `GameUiShell`, поэтому до старта плавания игрок видит room name, map context, region, server status и spawn metadata из REST/WS contract, а `GamePage` не монтирует 3D-сцену, пока ещё нет authoritative current player snapshot
- **Единая UI mode model**: `GameUiContext` задаёт состояния `LOADING`, `LOBBY`, `ROOM_LOADING`, `SAILING`, `CHAT_FOCUS`, `WINDOW_FOCUS`, `MENU_OPEN`, `RECONNECTING`, `RESPAWN`
- **Явный navigation flow `Home -> Lobby -> Game` с room resume-first входом**: домашняя страница снова использует CTA `Play`; если у пользователя уже есть сохранённая room session, `Play` ведёт сразу на `/game`, где стартует reconnect/resume flow, а если room session нет или backend её уже не восстановил, пользователь попадает в обычный `/lobby`; `Join room` по-прежнему стартует на lobby route, проходит через REST `POST /api/v1/rooms/{roomId}/join`, WS `ROOM_JOINED`, `SPAWN_ASSIGNED` и финальный `INIT_GAME_STATE/current player`, и только после полного init flow переводит пользователя в `/game`
- **Room exit contract уже доступен на backend, но UI ещё не подключён**: backend теперь поддерживает `POST /api/v1/rooms/{roomId}/leave` с возвратом той же WS-сессии в `lobby` и первым `ROOMS_SNAPSHOT`, поэтому следующий frontend шаг может реализовывать menu-driven `Exit to lobby` без logout и без повторного login flow
- **Room menu уже умеет штатный `Exit to lobby`**: `GamePage` теперь запускает `POST /api/v1/rooms/{roomId}/leave`, очищает stale `GameState` + `RoomSession` только после подтверждённого REST success и переводит пользователя обратно на `/lobby` без logout, сохраняя ту же auth и WS session; сам `GameUiShell` показывает кнопку `Выйти` в menu modal и inline error state для room-leave ошибок
- **Глобальный realtime bridge и room session поверх роутов**: `WebSocketProvider`, `GameStateProvider`, `RoomSessionProvider` и `GameRealtimeBridge` живут выше страниц, поэтому переходы `Home -> Lobby -> Game` не рвут WS-сессию, не теряют ранние room init сообщения и позволяют безопасно открыть `/game` повторно после возврата на домашний экран; `RoomSessionProvider` дополнительно сохраняет room metadata в `localStorage` и синхронизирует её через `storage` events между вкладками, чтобы full page reload или повторный вход с домашней страницы не лишали пользователя room resume target в пределах backend reconnect grace
- **Scoped chat UI**: `LobbyPage` использует `ChatBlock` как standalone lobby chat widget для `group:lobby`, а `GameUiShell` держит room-scoped chat для `group:room:<roomId>`; истории lobby/room сообщений по-прежнему разделены по `payload.to`, без смешивания между комнатами
- **Централизованные UI hotkeys**: `Enter`, `Esc`, `I`, `J`, `M` обрабатываются в одном слое (`GameUiHotkeys`), а gameplay input учитывает текущий UI mode
- **Authoritative spawn snap поверх interpolation**: `GameStateContext` принимает `SPAWN_ASSIGNED` для current player как authoritative patch, а `useShipInterpolation` мгновенно snap'ает локальный корабль при смене `spawnRevision`, чтобы respawn не выглядел как медленный перелёт из старой точки
- **Authoritative wind state тоже живёт в `GameStateContext`**: frontend хранит `wind` рядом с `playerStates`, заполняет его из `INIT_GAME_STATE`, обновляет из `UPDATE_GAME_STATE` даже без player patches и больше не опирается на локальные wind placeholders в основном runtime path
- **`sailLevel` тоже остаётся чисто backend-authoritative**: frontend хранит `sailLevel` прямо внутри `playerStates`, обновляет его только из `INIT_GAME_STATE` / `UPDATE_GAME_STATE` и показывает в основном HUD через `ProfileBlock`, не создавая отдельной локальной модели парусов
- **Wind HUD встроен в `ProfileBlock`**: сила и направление ветра, относительное положение ветра к текущему курсу (`Tailwind`, `Port beam`, `Headwind` и т.д.) и короткая подсказка по sail drive теперь живут в captain card, а координаты и угол поворота показываются только в dev-only debug секции
- **Client-side prediction**: Интерполяция позиций кораблей между обновлениями сервера для плавности
- **WebSocket reconnect + room resume**: `WebSocketProvider` хранит phase/attempt metadata (`connecting`, `reconnecting`, retry delay), открывает `/ws/game` только на маршрутах `/lobby` и `/game` и не держит realtime-сессию на домашней странице; `GamePage` поверх этого реализует явный room reconnect flow с `RECONNECTING` mode, локальным 15-секундным grace timeout, ожиданием `ROOM_JOINED` + fresh `INIT_GAME_STATE` и fallback-навигацией обратно в `/lobby`, если backend вернул пользователя в lobby scope; отдельный close path `1008 / SEAPATROL_DUPLICATE_SESSION` не считается reconnect-кандидатом и сразу возвращает клиента на домашнюю страницу с access-denied notice
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
- 25 тестовых файлов
- 136 тестов (все проходят ✅)
- Протестированы: AuthContext, RoomSessionContext, WebSocketContext, GameStateContext (reducer), GameUi reducer/hotkeys, GameUiShell room init/reconnect flow и menu leave action, room loading summary и reopen-from-session flow, HomePage navigation flow, LobbyPage route join/navigation и room entry summary, отдельный GamePage reconnect flow и room-leave flow, ChatBlock scoped chat UI, ProfileBlock HUD widget, Login, Signup, PlayerSailShip, LobbyPanel (REST bootstrap + map metadata previews + create room + live WS updates + join UI), auth-flow, game-state-flow, authApi, roomApi, wsClient, messageAdapter, ws-send-regression, shipInterpolation utils, wind feedback helpers

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

**Текущее покрытие**: 25 файлов, 136 тестов (AuthContext, RoomSessionContext, WebSocketContext, GameStateContext reducer, GameUi reducer/hotkeys, GameUiShell room init/reconnect flow и menu leave action, HomePage navigation flow, LobbyPage route join/navigation, отдельный GamePage reconnect flow и room-leave flow, ChatBlock scoped chat UI, ProfileBlock HUD widget, Login, Signup, PlayerSailShip, LobbyPanel с REST bootstrap, create room, live WS updates и join UI, auth-flow, game-state-flow, authApi, roomApi, wsClient, messageAdapter, ws-send-regression, shipInterpolation utils, wind feedback helpers).

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


























