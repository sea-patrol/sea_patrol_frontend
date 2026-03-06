# TASK-001 - Frontend часть: канонический auth contract для MVP

## Метаданные
- **ID:** `TASK-001`
- **Тип:** `docs`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-06`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 0 / M0 / TASK-001`
- **Трек:** `Frontend`
- **Связанные внешние задачи:** `sea_patrol_orchestration/TASK-001`, `TASK-002`, `TASK-003`

## Контекст
`TASK-001` в roadmap является shared-задачей, но для frontend репозитория нужна отдельная постановка только по зоне ответственности фронтенда. Здесь задача не в изменении backend contract, а в фиксации того, какой backend contract frontend должен считать каноническим для MVP и какие текущие frontend ожидания уже признаны устаревшими.

На момент постановки задачи canonical auth contract для frontend выглядит так:
- `POST /api/v1/auth/signup` -> `200 OK` + `{ username }`
- `POST /api/v1/auth/login` -> `{ username, token, issuedAt, expiresAt }`
- auth/security/validation errors -> `{ errors: [{ code, message }] }`

## Цель
Зафиксировать frontend-часть канонического auth contract в документации frontend-репозитория и явно обозначить, какие текущие frontend runtime-gap'ы должны закрываться в `TASK-003`.

## Source of Truth
- Frontend код:
  - `sea_patrol_frontend/src/shared/api/authApi.js`
  - `sea_patrol_frontend/src/features/auth/model/AuthContext.jsx`
- Внешние reference docs:
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/ROADMAP.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`
  - `sea_patrol_backend/ai-docs/API_INFO.md`
- Frontend docs:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`

## Acceptance Criteria
- [x] В frontend docs больше нет утверждений, что login обязан возвращать `userId`.
- [x] В frontend docs больше нет утверждений, что `signup` канонически возвращает `201 Created` и `{ id, username, email }`.
- [x] В frontend docs явно зафиксировано, что канонический auth error format для MVP — `{ errors: [{ code, message }] }`.
- [x] В frontend task явно отделена документарная фиксация от runtime-работы, которая должна идти в `TASK-003`.

## Scope
**Включает:**
- синхронизацию `sea_patrol_frontend/ai-docs/API_INFO.md` с каноническим backend contract;
- фиксацию для frontend команды, что `userId` не обязателен;
- явное описание runtime-gap'ов, которые должны закрываться в `TASK-003`.

**Не включает (out of scope):**
- изменение `authApi.js`;
- изменение `AuthContext.jsx`;
- изменение backend contract;
- изменение backend repo docs как primary deliverable frontend repo.

## Предпосылки и зависимости
- Frontend часть `TASK-001` нужна как baseline перед `TASK-003`.
- Backend часть shared-задачи оформлена отдельно в `sea_patrol_backend/ai-docs/todo/TASK-001.md`.

## Технический подход
Frontend docs должны описывать не исторические ожидания UI, а тот backend contract, который реально считается каноническим для MVP. После этого любые runtime-несовпадения должны закрываться отдельной frontend-задачей, а не маскироваться неточными docs.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Создать `ai-docs/todo/TASK-001.md`
- [ ] Обновить `ai-docs/PROJECT_INFO.md` при необходимости
- [ ] Добавить или обновить тесты

## Контракты и данные
### Frontend expected auth contract
- `POST /api/v1/auth/signup`
  - Request: `{ username, password, email }`
  - Expected response: `200 OK` + `{ username }`
- `POST /api/v1/auth/login`
  - Request: `{ username, password }`
  - Expected response: `{ username, token, issuedAt, expiresAt }`
- Ошибки auth/security/validation
  - Expected response: `{ errors: [{ code, message }] }`

### Frontend runtime gaps для следующей задачи
- `authApi.js` всё ещё читает `data.message || 'Request failed'`.
- `AuthContext.jsx` всё ещё пишет `userId` в state.
- Эти два пункта закрываются не здесь, а в `TASK-003`.

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Frontend docs снова начнут описывать старый `message` format | Это закрепит неверный клиентский контракт | Держать source of truth в orchestration + backend contract |
| Документация и runtime будут смешаны в одной задаче | Это размоет границы между `TASK-001` и `TASK-003` | Явно вынести runtime gaps в отдельную follow-up задачу |
| Команда frontend продолжит считать `userId` обязательным | Это создаст ложный dependency на backend | Зафиксировать optional/non-existent `userId` в docs |

## План реализации
1. Сверить frontend docs с orchestration и backend contract.
2. Убрать из frontend docs устаревшие ожидания про `userId`, `201 Created` и `message`-only errors.
3. Оставить runtime-gap'ы как вход для `TASK-003`.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить runtime после последующего изменения в `TASK-003` | `Not Run` |

### Ручная проверка
- [x] Frontend docs сверены с orchestration contract
- [x] Frontend docs сверены с backend contract
- [x] Runtime-gap'ы отделены от документарной фиксации

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/ai-docs/todo/TASK-001.md` - frontend-specific описание shared задачи
2. `sea_patrol_frontend/ai-docs/API_INFO.md` - frontend docs выровнены по каноническому auth contract

### Незапланированные находки
- `sea_patrol_frontend/src/shared/api/authApi.js` пока не умеет читать `errors[]` как канонический формат.
- `sea_patrol_frontend/src/features/auth/model/AuthContext.jsx` пока зависит от `userId`, которого backend не возвращает.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Критические сценарии пройдены
- [x] Регрессии не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | В `TASK-003` обновить parser ошибок с `message` на `errors[0].message` | `Open` |
| `Medium` | В `TASK-003` убрать dependency на `userId` в `AuthContext` | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Документация frontend синхронизирована
- [x] Следующие frontend follow-up задачи определены
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_orchestration/API.md`, `sea_patrol_backend/ai-docs/API_INFO.md`
