# TASK-1 — Настройка системы тестирования (Vitest + RTL + R3F Renderer)

## Метаданные
- **ID:** TASK-1
- **Ветка:** `feature/TASK-1`
- **Статус:** Todo
- **Дата создания:** 2026-02-27

## Описание задачи
Внедрить систему тестирования для frontend-приложения Sea Patrol. Настроить инфраструктуру для unit-, component- и integration-тестов с поддержкой:
- React-компонентов (формы аутентификации, UI)
- 3D-компонентов React Three Fiber (PlayerSailShip, Ocean, Buoys)
- REST API (аутентификация через MSW)
- WebSocket (игровое соединение через mock-socket)

## Acceptance Criteria
- [ ] Установлены все необходимые зависимости (vitest, RTL, R3F renderer, msw, mock-socket)
- [ ] Настроен `vite.config.js` с секцией test
- [ ] Создан `src/setupTests.js` с глобальной настройкой тестов
- [ ] Добавлены скрипты в `package.json` (`test`, `test:run`, `test:coverage`)
- [ ] Написаны тесты для AuthContext (unit)
- [ ] Написаны тесты для Login/Signup компонентов (component + MSW)
- [ ] Написаны тесты для WebSocketContext (unit + mock-socket)
- [ ] Написаны тесты для PlayerSailShip (R3F renderer + advanceFrames)
- [ ] Написан integration-тест auth-flow (Login → AuthContext → REST)
- [ ] Все тесты проходят (`npm run test:run`)
- [ ] `npm run build` выполняется без ошибок

## Scope
**Включает:**
- Настройка инфраструктуры тестирования
- Unit-тесты для Context-провайдеров
- Component-тесты для форм аутентификации
- Component-тесты для 3D-компонента PlayerSailShip
- Integration-тест потока аутентификации
- Мокирование REST API (MSW) и WebSocket (mock-socket)

**Не включает (out-of-scope):**
- Тесты для 3D-компонентов Ocean, Buoys, CameraFollower (отложено)
- Тесты для ChatBlock, ProfileBlock, GameStateInfo (отложено)
- Покрытие тестами NpcSailShip, OtherPlayerSailShip (отложено)
- Настройка CI/CD пайплайна (отдельная задача)
- E2E-тесты (Playwright/Cypress — отдельная задача)

## Технический план
**Подход:** Использовать Vitest как тест-раннер (интегрирован с Vite), React Testing Library для UI-компонентов, @react-three/test-renderer для 3D-компонентов, MSW для REST, mock-socket для WebSocket.

### Затрагиваемые файлы/модули
- `package.json` — новые devDependencies и скрипты
- `vite.config.js` — добавить test-секцию
- `src/setupTests.js` — новый файл глобальной настройки
- `src/mocks/handlers.js` — новый файл MSW-обработчиков
- `src/mocks/websocket.js` — новый файл мок-WebSocket
- `src/mocks/data.js` — новый файл тестовых данных
- `src/__tests__/components/Login.test.jsx` — новый тест
- `src/__tests__/components/Signup.test.jsx` — новый тест
- `src/__tests__/components/PlayerSailShip.test.jsx` — новый тест
- `src/__tests__/contexts/AuthContext.test.jsx` — новый тест
- `src/__tests__/contexts/WebSocketContext.test.jsx` — новый тест
- `src/__tests__/integration/auth-flow.test.jsx` — новый тест

### Риски и меры контроля
| Риск | Мера контроля |
|------|---------------|
| Конфликты версий зависимостей | Установить совместимые версии, проверить `npm install` |
| Проблемы с мокированием R3F | Использовать vi.mock() для useGLTF, useFrame |
| Проблемы с mock-socket | Убедиться, что URL WebSocket совпадает с реальным |
| Ложные срабатывания тестов | Использовать стабильные селекторы, избегать timing-dependent тестов |

## Реализация
### Шаг 1: Установка зависимостей
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @react-three/test-renderer msw mock-socket
```

### Шаг 2: Настройка vite.config.js
Добавить секцию test:
```javascript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.js',
  include: ['src/**/*.test.{js,jsx}'],
}
```

### Шаг 3: Создание setupTests.js
- Импортировать @testing-library/jest-dom матчеры
- Настроить MSW server (beforeAll, afterEach, afterAll)

### Шаг 4: Создание мок-обработчиков
- `src/mocks/handlers.js` — POST /api/v1/auth/login, /signup
- `src/mocks/websocket.js` — функция createMockWebSocket()
- `src/mocks/data.js` — тестовые пользователи, игровые состояния

### Шаг 5: Unit-тесты Context
- AuthContext.test.jsx — тест login(), signup(), logout()
- WebSocketContext.test.jsx — тест connect(), sendMessage(), subscribe()
- GameStateContext.test.jsx — тест useGameState()

### Шаг 6: Component-тесты
- Login.test.jsx — рендер, валидация, отправка формы, обработка ошибок
- Signup.test.jsx — рендер, валидация паролей, отправка формы
- PlayerSailShip.test.jsx — рендер 3D-модели, advanceFrames для интерполяции

### Шаг 7: Integration-тесты
- auth-flow.test.jsx — полный цикл: ввод данных → login() → MSW → AuthContext → редирект

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
- [ ] Все acceptance criteria проверены
- [ ] Ключевые сценарии работают
- [ ] Регресс не обнаружен
- [ ] Build и tests проходят

**Статус:** ⬜ Passed / ⬜ Failed

**Найденные проблемы:**
- ...

## Code Review
### Замечания
| Приоритет | Описание | Статус |
|-----------|----------|--------|
| | | |

**Решение:** ⬜ Approve / ⬜ Changes Requested

## Финализация
- [ ] PR создан (`gh pr create`)
- [ ] PR замержен
- [ ] Задача перенесена в `ai-docs/backlog/done/`
- [ ] Документация обновлена (ai-docs/PROJECT_INFO.md — раздел Testing Workflow)

---
**Ссылки:**
- PR: #<N>
- Commit: `<hash>`
