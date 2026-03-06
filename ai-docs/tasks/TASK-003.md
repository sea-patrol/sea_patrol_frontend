# TASK-003 - Frontend часть: разбор backend auth errors и optional userId

## Метаданные
- **ID:** `TASK-003`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-06`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 0 / TASK-003`
- **Трек:** `Frontend`
- **Depends on:** `TASK-001`

## Контекст
После фиксации канонического auth contract в `TASK-001` frontend всё ещё жил на старых предположениях:
- `authApi` читал только корневой `message` и не умел извлекать ошибку из `errors[]`;
- `AuthContext` ожидал `userId` в login response;
- тестовые моки и auth tests были привязаны к устаревшему response format (`userId`, `201 Created`, `message`-only errors).

Это делало frontend хрупким относительно текущего backend contract из `TASK-002`.

## Цель
Научить frontend корректно разбирать backend auth errors и убрать зависимость от обязательного `userId` в login response, не меняя сам канонический backend contract.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/shared/api/authApi.js`
  - `sea_patrol_frontend/src/features/auth/model/AuthContext.jsx`
  - `sea_patrol_frontend/src/test/mocks/data.js`
  - `sea_patrol_frontend/src/test/mocks/handlers.js`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/shared/api/authApi.test.js`
  - `sea_patrol_frontend/src/__tests__/contexts/AuthContext.test.jsx`
  - `sea_patrol_frontend/src/__tests__/components/Login.test.jsx`
  - `sea_patrol_frontend/src/__tests__/components/Signup.test.jsx`
  - `sea_patrol_frontend/src/__tests__/integration/auth-flow.test.jsx`
- Внешний контракт:
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_backend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`

## Acceptance Criteria
- [x] Login/signup UI показывает содержательные ошибки из backend-format `{ errors: [{ code, message }] }`.
- [x] Нет падения или ложной зависимости из-за отсутствия `userId` в login response.
- [x] Есть frontend tests на parsing ошибок и auth flow под канонический backend contract.

## Scope
**Включает:**
- обновление `authApi` для извлечения сообщения и кода из `errors[]`;
- обновление `AuthContext` для login flow без обязательного `userId`;
- синхронизацию MSW mocks и auth-тестов с backend contract;
- создание frontend task artifact.

**Не включает (out of scope):**
- изменение backend contract;
- изменение orchestration docs;
- добавление новых auth endpoints или session restore flow;
- изменение визуального дизайна auth-форм.

## Технический подход
Frontend теперь нормализует HTTP errors через первый элемент `errors[]` с fallback на старый `message`, если structured payload отсутствует. Это делает клиент совместимым с текущим backend contract и при этом оставляет безопасный деградационный путь для нестандартизированных ответов.

В `AuthContext` user state теперь строится вокруг обязательного `username`, а `userId` добавляется только если реально присутствует в payload. За счёт этого `isAuthenticated` больше не зависит от поля, которого backend не отдаёт.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Обновить `src/shared/api/authApi.js`
- [x] Обновить `src/features/auth/model/AuthContext.jsx`
- [x] Синхронизировать `src/test/mocks/*` с backend contract
- [x] Обновить auth tests
- [x] Создать `ai-docs/tasks/TASK-003.md`

## Контракты и данные
### Frontend expected auth contract
- `POST /api/v1/auth/login` -> `{ username, token, issuedAt, expiresAt }`
- `POST /api/v1/auth/signup` -> `200 OK` + `{ username }`
- auth-related errors -> `{ errors: [{ code, message }] }`

### Frontend normalization rules
- `authApi` сначала пытается читать `data.errors[0].message`;
- затем fallback на `data.message`;
- `AuthContext` требует только `token` и `username` для успешного login state.

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| UI всё ещё будет ждать старый error format | Ошибки будут отображаться как `Request failed` | Тесты проверяют извлечение `message` и `code` из `errors[]` |
| Login сломается без `userId` | Пользователь не будет считаться аутентифицированным | `AuthContext` тестирует успешный login без `userId` |
| Тестовые моки останутся на старом contract | Тесты перестанут отражать реальный backend behavior | MSW responses переведены на канонический backend-format |

## План реализации
1. Обновить error parsing в `authApi`.
2. Убрать обязательность `userId` в `AuthContext`.
3. Синхронизировать MSW mocks и auth tests.
4. Прогнать `npm run test:run` и `npm run build`.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить auth parsing, AuthContext и UI flows | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после auth changes | `Passed` |

### Ручная проверка
- [x] Проверен success login без `userId`
- [x] Проверен разбор backend errors из `errors[]`
- [x] Проверен signup flow с backend-style error
- [x] Проверен integration auth flow

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/shared/api/authApi.js` - нормализация backend auth errors через `errors[]`
2. `sea_patrol_frontend/src/features/auth/model/AuthContext.jsx` - login state без обязательного `userId`
3. `sea_patrol_frontend/src/test/mocks/data.js` - canonical backend auth payloads для тестов
4. `sea_patrol_frontend/src/test/mocks/handlers.js` - MSW handlers приведены к structured backend-format
5. `sea_patrol_frontend/src/__tests__/shared/api/authApi.test.js` - tests на parsing canonical auth payload/errors
6. `sea_patrol_frontend/src/__tests__/contexts/AuthContext.test.jsx` - tests на login без `userId`
7. `sea_patrol_frontend/src/__tests__/components/Login.test.jsx` - UI expectations синхронизированы с backend messages
8. `sea_patrol_frontend/src/__tests__/components/Signup.test.jsx` - signup error expectations синхронизированы с backend-style errors
9. `sea_patrol_frontend/src/__tests__/integration/auth-flow.test.jsx` - integration flow синхронизирован с canonical auth contract
10. `sea_patrol_frontend/ai-docs/tasks/TASK-003.md` - frontend task artifact

### Незапланированные находки
- Основная проблема была не в UI-компонентах, а в устаревших test fixtures, которые маскировали несовместимость с backend contract.
- Для signup failure в тестах оставлен backend-style error scenario как проверка frontend parsing, хотя текущий backend не фиксирует отдельный canonical conflict flow.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Ключевые сценарии проходят
- [x] Регрессии по тестам и сборке не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Если backend позже введёт `409 USER_ALREADY_EXISTS`, стоит синхронизировать test fixtures под реальный code/status | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлён
- [x] Tests проходят
- [x] Build проходит
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_orchestration/API.md`, `sea_patrol_backend/ai-docs/API_INFO.md`

