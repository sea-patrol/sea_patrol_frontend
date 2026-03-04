# Sea Patrol Frontend

## Обзор проекта

**Sea Patrol** — это многопользовательская 3D-браузерная игра про парусные корабли, построенная на **React**, **Three.js** и **React Three Fiber (R3F)**. Игроки могут регистрироваться/входить в систему, управлять парусными кораблями в 3D-океане и взаимодействовать с другими игроками в реальном времени через WebSocket-соединения.

📖 **Полная документация проекта** доступна в файле [`ai-docs/PROJECT_INFO.md`](ai-docs/PROJECT_INFO.md).
📡 **Описание текущего API (REST + WebSocket)**: [`ai-docs/API_INFO.md`](ai-docs/API_INFO.md).

### Технологический стек

| Категория | Технология |
|-----------|------------|
| **Фреймворк** | React 19 |
| **Инструмент сборки** | Vite 7 |
| **3D-графика** | Three.js + React Three Fiber + Drei |
| **Роутинг** | React Router DOM |
| **Управление состоянием** | React Context API |
| **Общение в реальном времени** | WebSocket |
| **Debug UI** | Leva |
| **Мониторинг производительности** | r3f-perf |
| **PWA** | vite-plugin-pwa |

---

## Правила работы

1. **Отвечай на русском** (технические артефакты — как есть)
2. **Делай только требуемое**, без рефакторинга «заодно»
3. **Не добавляй зависимости** без согласования
4. **Предпочитай редактирование** созданию новых абстракций
5. **Всегда проверяй** `npm run build` и `npm run test:run` после изменений
6. **Обновляй `ai-docs/PROJECT_INFO.md`** при изменении структуры/архитектуры/команд
7. **Обновляй `ai-docs/API_INFO.md`** при изменении REST/WS контрактов (эндпоинты, форматы сообщений, message types)

## Сборка и запуск

### Предварительные требования

- Node.js (рекомендуется последняя LTS-версия)
- npm

### Установка

```bash
npm install
```

### Сервер разработки

```bash
npm run dev
```

Приложение доступно по адресу `http://localhost:5173` (по умолчанию Vite).

### Продакшен-сборка

```bash
npm run build
```

Результат: директория `dist/`.

### Предпросмотр продакшен-сборки

```bash
npm run preview
```

### Линтинг

```bash
npm run lint
```

---

## Интеграция с бэкендом

Фронтенд ожидает backend-сервер по адресу `http://localhost:8080`:

| Endpoint | Протокол | Назначение |
|----------|----------|------------|
| `/api/v1/auth/login` | HTTP POST | Аутентификация пользователя |
| `/api/v1/auth/signup` | HTTP POST | Регистрация пользователя |
| `/ws/game` | WebSocket | Синхронизация состояния игры в реальном времени |

Подробности по контракту (форматы сообщений/ответов): [`ai-docs/API_INFO.md`](ai-docs/API_INFO.md).

---

## Где искать реализацию API на фронте

- REST auth: `src/shared/api/authApi.js`
- WebSocket provider (URL, reconnect, token query): `src/features/realtime/model/WebSocketContext.jsx`
- WebSocket client (connect/reconnect/subscribe/send): `src/shared/ws/wsClient.js`
- Формат сообщений (tuple/object): `src/shared/ws/messageAdapter.js`
- Список message types: `src/shared/constants/messageType.js`
- WS → game state (subscribe/reducer mapping): `src/features/game/model/useGameWsGameState.js`, `src/features/game/model/GameStateContext.jsx`

## Конвенции разработки

### Стиль кода

- **ESLint**: Настроен в `eslint.config.js`:
  - Рекомендуемые правила `@eslint/js`
  - `eslint-plugin-react-hooks` для лучших практик работы с хуками
  - `eslint-plugin-react-refresh` для Vite React Refresh
  - Неиспользуемые переменные, начинающиеся с `A-Z` или `_`, разрешены (для JSX-компонентов)

### Именование файлов

- Компоненты: **PascalCase** (например, `PlayerSailShip.jsx`)
- Утилиты/Константы: **camelCase** (например, `messageType.js`, `models.js`)
- Стили: **PascalCase** в соответствии с именем компонента (например, `HomePage.css`)

### Управление состоянием

- **Context API** для глобального состояния (Auth, WebSocket, GameState)
- `useRef` для изменяемого состояния игры, которое не требует перерендера
- Кастомные хуки: `useAuth()`, `useWebSocket()`, `useGameState()`

### 3D-ресурсы

- Модели хранятся в `src/shared/assets/` (формат `.glb`)
- Предзагрузка через `useGLTF.preload()` в `src/shared/assets/models.js`
- Vite настроен на обработку файлов `.glb`/`.gltf` через `assetsInclude`

---

## Ключевые файлы конфигурации

| Файл | Назначение |
|------|------------|
| `vite.config.js` | Конфигурация сборки Vite, PWA-плагин, обработка ресурсов |
| `eslint.config.js` | Правила ESLint для React/JSX |
| `package.json` | Зависимости и npm-скрипты |
| `index.html` | HTML-точка входа |

---
