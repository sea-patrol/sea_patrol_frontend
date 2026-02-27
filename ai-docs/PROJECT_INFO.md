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
- **Linting**: ESLint (@eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh)
- **Package manager**: `npm`

### 3.2 Current Repository Structure

```
src/
├── assets/           # 3D-модели (.glb), текстуры
│   └── sail_ship.glb
├── components/       # React-компоненты
│   ├── Buoys.jsx           # Буи в океане
│   ├── CameraFollower.jsx  # Камера, следующая за кораблём
│   ├── ChatBlock.jsx       # UI чата
│   ├── GameMainScene.jsx   # Основная 3D-сцена
│   ├── GameStateInfo.jsx   # UI отображения состояния игры
│   ├── KeyPress.jsx        # Обработка нажатий клавиш
│   ├── LoadingScreen.jsx   # Экран загрузки
│   ├── Login.jsx           # Форма входа
│   ├── NpcSailShip.jsx     # Корабль NPC
│   ├── Ocean.jsx           # Рендеринг океана
│   ├── OtherPlayerSailShip.jsx  # Корабль другого игрока
│   ├── PlayerSailShip.jsx  # Корабль игрока с интерполяцией
│   ├── ProfileBlock.jsx    # UI профиля игрока
│   └── Signup.jsx          # Форма регистрации
├── const/            # Константы
│   └── messageType.js        # Типы WebSocket-сообщений
├── contexts/         # React Context провайдеры
│   ├── AuthContext.jsx       # Состояние аутентификации
│   ├── GameStateContext.jsx  # Глобальное состояние игры
│   └── WebSocketContext.jsx  # WebSocket-соединение и pub/sub
├── images/           # Изображения (иконки, текстуры UI)
├── pages/            # Страницы приложения
│   ├── GamePage.jsx          # Игровая страница
│   └── HomePage.jsx          # Главная страница с аутентификацией
├── styles/           # CSS-стили
│   ├── App.css
│   ├── ChatBlock.css
│   ├── GameStateInfo.css
│   ├── HomePage.css
│   ├── LoadingScreen.css
│   ├── Login.css
│   └── Signup.css
├── utils/            # Вспомогательные функции
│   └── models.js             # Утилиты загрузки 3D-моделей
├── App.jsx           # Корневой компонент с роутингом
├── index.css         # Глобальные стили
└── main.jsx          # Точка входа приложения
```

### 3.3 Architecture Decisions

- **Минимум зависимостей**: Только необходимые библиотеки для React/Vite/R3F
- **Context API для глобального состояния**: Auth, WebSocket, GameState — без Redux/Zustand
- **Client-side prediction**: Интерполяция позиций кораблей между обновлениями сервера для плавности
- **PWA для офлайн-кэширования**: 3D-модели (.glb) кэшируются через Service Worker
- **Простая структура**: Плоская иерархия компонентов, расширяемая по мере роста
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
│   └── integration/      # auth-flow
├── mocks/
│   ├── handlers.js       # MSW обработчики REST API
│   ├── websocket.js      # Мок WebSocket
│   └── data.js           # Тестовые данные
└── setupTests.js         # Глобальная настройка тестов
```

**Запуск тестов**:
- `npm run test` — запуск в режиме watch (dev)
- `npm run test:run` — однократный запуск (CI/CD)
- `npm run test:coverage` — запуск с отчётом о покрытии

**Покрытие (TASK-1)**:
- 6 тестовых файлов
- 53 теста (все проходят ✅)
- Протестированы: AuthContext, WebSocketContext, Login, Signup, PlayerSailShip, auth-flow

## 4. Working Commands

### 4.1 Initial Setup
- `npm install` — установка зависимостей.

### 4.2 Development
- `npm run dev` — запуск dev-сервера (http://localhost:5173).
- `npm run lint` — проверка линтером ESLint.
- `npm run build` — production-сборка в директорию `dist/`.
- `npm run preview` — локальный preview production-сборки.

### 4.3 Testing
- `npm run test` — запуск в режиме watch (dev).
- `npm run test:run` — однократный запуск (CI/CD).
- `npm run test:coverage` — запуск с отчётом о покрытии.

**Текущее покрытие**: 6 файлов, 53 теста (AuthContext, WebSocketContext, Login, Signup, PlayerSailShip, auth-flow).

### 4.4 Git Workflow
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
