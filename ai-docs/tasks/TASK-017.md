# TASK-017 - Frontend часть: create room flow в lobby UI

## Метаданные
- **ID:** `TASK-017`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `Medium`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-017`
- **Трек:** `Frontend`
- **Depends on:** `TASK-015`

## Контекст
После `TASK-015` frontend уже умел читать актуальный room catalog и поддерживать live lobby updates, но лобби оставалось потребителем только существующих комнат. Backend `POST /api/v1/rooms` уже был реализован, включая `ROOMS_UPDATED` после success, однако frontend не давал пользователю способ открыть новую комнату и не умел честно surfacing validation errors по `mapId`.

## Цель
Реализовать create room flow на фронте: добавить форму создания комнаты в lobby UI, вызвать backend endpoint с выбором default map или custom `mapId`, а после success обновить room catalog без перезагрузки страницы.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/shared/api/roomApi.js`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/test/mocks/data.js`
  - `sea_patrol_frontend/src/test/mocks/handlers.js`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js`
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
- Внешняя документация:
  - `sea_patrol_orchestration/API.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`

## Acceptance Criteria
- [x] Create room вызывает backend endpoint.
- [x] UI обновляет room catalog после success.

## Scope
**Включает:**
- форму создания комнаты в `LobbyPanel`;
- REST-клиент `roomApi.createRoom()` для `POST /api/v1/rooms`;
- default map mode (`caribbean-01`) и custom `mapId` mode;
- surfacing backend validation errors прямо в lobby UI;
- обновление room catalog после success без ручного reload;
- tests на create room REST contract и lobby create flow.

**Не включает (out of scope):**
- map registry с несколькими реальными картами;
- create room вне lobby страницы;
- room settings beyond `name` и `mapId`;
- изменение backend create contract.

## Технический подход
Create flow добавлен локально в `LobbyPanel`, потому что это чисто lobby interaction и не требует отдельного shell mode. Форма отправляет `name` и выбранный map strategy в `roomApi.createRoom()`: default mode жёстко использует `caribbean-01`, а custom mode позволяет вручную передать `mapId` и получить backend validation error, если он не поддерживается текущим MVP.

После успешного `POST /api/v1/rooms` frontend сразу upsert-ит новый room summary в локальный catalog, а затем продолжает считать `ROOMS_UPDATED` authoritative source of truth. Это даёт быстрый UI feedback и не ломает уже согласованный full-snapshot contract для lobby updates.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить REST `createRoom()` в room API client
- [x] Добавить create room form в `LobbyPanel`
- [x] Поддержать default map и custom `mapId`
- [x] Показать create room validation/runtime errors в UI
- [x] Обновлять room catalog после success
- [x] Расширить MSW mocks и frontend tests
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### REST create request
```json
{ "name": "Sandbox 3", "mapId": "caribbean-01" }
```

### REST create response
```json
{
  "id": "sandbox-3",
  "name": "Sandbox 3",
  "mapId": "caribbean-01",
  "mapName": "Caribbean Sea",
  "currentPlayers": 0,
  "maxPlayers": 100,
  "status": "OPEN"
}
```

### Ошибки
- `400 INVALID_MAP_ID` — custom `mapId` не поддержан backend
- `409 MAX_ROOMS_REACHED` — достигнут room limit

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Frontend будет ждать только WS и не покажет новую комнату сразу | `ROOMS_UPDATED` может прийти с небольшой задержкой | После REST success lobby делает локальный upsert room summary и затем продолжает слушать authoritative full snapshots |
| Custom map mode создаст ложное ожидание множественных карт | Backend пока принимает только `caribbean-01` | В UI прямо указано, что custom `mapId` нужен для честного surfacing contract/validation errors |
| Ошибки create room потеряются на фоне room catalog | В lobby уже есть loading/error/join states | Для create flow добавлен отдельный form-level error block |

## План реализации
1. Добавить `createRoom()` в room API.
2. Собрать create form в `LobbyPanel`.
3. Поддержать default/custom map mode.
4. Обновить catalog после success и показать create errors.
5. Добавить tests и синхронизировать docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить create room contract, lobby form и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после lobby create flow | `Passed` |

### Ручная проверка
- [x] Create form доступна в lobby UI
- [x] Default map mode создаёт комнату через backend endpoint
- [x] Custom invalid `mapId` показывает backend validation error
- [x] Room catalog обновляется после successful create

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/shared/api/roomApi.js` - добавлен `createRoom()`
2. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx` - create room form, error handling, catalog upsert after success
3. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css` - стили под create form и create error state
4. `sea_patrol_frontend/src/test/mocks/data.js` - create room fixtures
5. `sea_patrol_frontend/src/test/mocks/handlers.js` - MSW handler для `POST /api/v1/rooms`
6. `sea_patrol_frontend/src/__tests__/shared/api/roomApi.test.js` - tests на create success/error contract
7. `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx` - tests на create flow в lobby UI
8. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for active create flow
9. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for architecture/testing
10. `sea_patrol_frontend/ai-docs/tasks/TASK-017.md` - frontend task artifact

### Незапланированные находки
- Для комфортного UX достаточно local upsert после REST success; отдельный shell state для create room здесь не нужен.
- Даже после optimistic update frontend всё равно должен считать `ROOMS_UPDATED` full snapshot authoritative, иначе catalog и backend registry могут разойтись.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Create flow работает через backend endpoint
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Когда появится настоящий `MapTemplateRegistry`, create form нужно будет перевести с default/custom text mode на реальный map picker, чтобы убрать технический contract-first UX | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_orchestration/API.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`, `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
