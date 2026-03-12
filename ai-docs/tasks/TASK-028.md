# TASK-028 - Frontend часть: map metadata в лобби

## Метаданные
- **ID:** `TASK-028`
- **Тип:** `feature`
- **Статус:** `Done`
- **Приоритет:** `Medium`
- **Дата создания:** `2026-03-12`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 3 / TASK-028`
- **Трек:** `Frontend`
- **Depends on:** `TASK-024`, `TASK-014`

## Контекст
После `TASK-024` backend уже умел отдавать `mapId` и `mapName`, но само лобби всё ещё показывало комнаты почти без контекста карты. Пользователь видел только название комнаты и не понимал, какие воды он выбирает перед входом или созданием новой комнаты.

## Цель
Показать map context прямо в lobby UI: отображать `mapName`, `region` и простой preview placeholder в room list и в create form, не дожидаясь отдельного map-loading flow.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/shared/lib/mapMetadata.js`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
- Документация:
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] Пользователь видит, на какой карте создана комната.
- [x] Lobby UI не скрывает map context за общим названием комнаты.
- [x] Create form показывает map context до отправки `POST /api/v1/rooms`.

## Scope
**Включает:**
- локальный frontend registry известных карт для лобби;
- отображение `mapName`, `region` и preview placeholder в room cards;
- отображение preview для выбранной карты в create form;
- fallback metadata для неизвестных `mapId`;
- tests на room list, create form и live snapshot updates.

**Не включает (out of scope):**
- новый backend endpoint для карт;
- загрузку полноценных minimap assets;
- room loading summary перед входом в море;
- runtime map bootstrap внутри gameplay scene.

## Технический подход
Во фронтенде добавлен лёгкий `mapMetadata` registry, который знает lobby-friendly описание доступных карт: имя, регион, preview label, caption и визуальный tone. `LobbyPanel` использует этот registry и для списка комнат, и для формы создания комнаты.

Если `mapId` известен фронту, UI показывает расширенный контекст карты. Если backend вернул незнакомый `mapId`, лобби не падает: карточка получает fallback metadata на основе пришедшего `mapName` и нейтральный preview state.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить map metadata rendering, create form и live snapshot updates | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после lobby UI изменений | `Passed` |

### Ручная проверка
- [x] Room card показывает карту и регион
- [x] Create form показывает preview выбранной карты
- [x] Live `ROOMS_UPDATED` корректно меняет видимый map context в списке комнат
- [x] Неизвестный `mapId` не ломает lobby UI

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Лобби остаётся лаконичным HTML-first экраном
- [x] Регрессии по frontend build/test suite не обнаружены

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Low` | Список карт в `mapMetadata.js` пока поддерживается вручную и должен синхронизироваться с backend `MapTemplateRegistry`, пока не появится отдельный shared/read-only map catalog contract | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [x] Документация синхронизирована
- [x] Статус roadmap обновлен
