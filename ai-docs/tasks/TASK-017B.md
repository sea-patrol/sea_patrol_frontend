# TASK-017B - Frontend часть: scoped chat UI для lobby и room

## Метаданные
- **ID:** `TASK-017B`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-017B`
- **Трек:** `Frontend`
- **Depends on:** `TASK-016`, `TASK-017A`

## Контекст
После `TASK-017A` backend уже перестал доверять клиентскому public chat target и начал авторитативно маршрутизировать lobby/room сообщения по текущему session scope пользователя. На фронте при этом чат всё ещё выглядел как один общий канал: UI не показывал, в какой scope пишет пользователь, и не держал отдельные истории для lobby и room.

## Цель
Сделать на фронте явный scoped chat UI: пользователь должен видеть, пишет ли он в `Lobby` или в конкретную `Room`, а истории сообщений не должны смешиваться между лобби и комнатами.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.jsx`
  - `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.css`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/widgets/ChatBlock.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/__tests__/integration/ws-send-regression.test.jsx`
- Внешняя документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] В лобби chat UI явно показывает `Lobby` scope.
- [x] После room join chat UI явно показывает room scope.
- [x] Исходящие сообщения уходят в `group:lobby` или `group:room:<roomId>` в зависимости от текущего scope.
- [x] Истории lobby и room сообщений изолированы и не смешиваются в одном списке.

## Scope
**Включает:**
- вычисление current chat scope в `GameUiShell`;
- явную передачу scope в `ChatBlock`;
- scope-aware header/copy/placeholder в chat UI;
- раздельное хранение histories по `payload.to`;
- backward-compatible fallback для legacy inbound chat payload без `to`;
- tests на outgoing target, scope switch и isolated histories.

**Не включает (out of scope):**
- изменение backend chat routing;
- direct message UI;
- persist/history storage между reload страницы;
- отдельную страницу лобби без 3D-сцены (`TASK-017C`).

## Технический подход
`GameUiShell` теперь определяет chat scope из текущего UI/runtime состояния. Пока пользователь находится в лобби, `ChatBlock` получает scope `group:lobby`. Во время room join/loading и после входа в комнату shell переключает chat scope на `group:room:<roomId>` с room-specific caption.

`ChatBlock` перестал быть single-history виджетом. Теперь он группирует входящие `CHAT_MESSAGE` по scope key из `payload.to` и рендерит только историю текущего scope. Это гарантирует, что lobby chat не протекает в room chat и наоборот. Для legacy inbound payload без `to` сохранён fallback в текущий видимый scope, чтобы UI не ломался на старых сообщениях.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Передавать explicit chat scope из `GameUiShell` в `ChatBlock`
- [x] Показать текущий scope в chat header
- [x] Отправлять `CHAT_MESSAGE` в scope-specific target
- [x] Хранить отдельные histories для lobby и room scopes
- [x] Добавить tests на scoped chat behavior
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### Outgoing public chat
```json
["CHAT_MESSAGE", { "to": "group:lobby", "text": "hello" }]
```
или
```json
["CHAT_MESSAGE", { "to": "group:room:sandbox-1", "text": "ready" }]
```

### Incoming public chat
```json
["CHAT_MESSAGE", { "from": "bob", "to": "group:room:sandbox-1", "text": "hi" }]
```

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Lobby и room history будут визуально смешиваться | Один и тот же виджет живёт до и после room join | `ChatBlock` хранит messages в `messagesByScope` и рендерит только текущий scope |
| UI отправит message в неверный target во время room join | Join flow теперь имеет промежуточный `ROOM_LOADING` state | `GameUiShell` переключает scope уже на pending room и тесты проверяют этот переход |
| Legacy inbound payload без `to` пропадут из UI | Старые сообщения всё ещё могут приходить без scope | Для них сохранён fallback в current visible scope |

## План реализации
1. Вычислить current chat scope в `GameUiShell`.
2. Передать scope в `ChatBlock` и обновить chat header/copy.
3. Перевести outgoing/incoming chat handling на scope-aware model.
4. Добавить tests и синхронизировать docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить scoped chat UI и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после chat scope changes | `Passed` |

### Ручная проверка
- [x] В lobby chat header показывает `Lobby`
- [x] После room join chat header показывает room caption
- [x] Lobby и room сообщения отображаются в разных историях
- [x] Outgoing target меняется вместе с текущим scope

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - вычисление active chat scope для lobby/room states
2. `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.jsx` - scope-aware outgoing target, incoming history split, header state
3. `sea_patrol_frontend/src/widgets/ChatPanel/ChatBlock.css` - стили для current scope badge/caption
4. `sea_patrol_frontend/src/__tests__/widgets/ChatBlock.test.jsx` - tests на isolated histories и legacy fallback
5. `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx` - assertions на lobby/room chat scope switch
6. `sea_patrol_frontend/src/__tests__/integration/ws-send-regression.test.jsx` - regression на `group:lobby` target
7. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for scoped chat contract usage
8. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for scoped chat architecture/testing
9. `sea_patrol_frontend/ai-docs/tasks/TASK-017B.md` - frontend task artifact

### Незапланированные находки
- Для UI достаточно одного `ChatBlock`, если scope передаётся извне и history хранится по ключам; отдельные lobby/room компоненты пока не нужны.
- Во время `ROOM_LOADING` chat scope лучше переключать сразу на pending room, иначе пользователь может отправить сообщение в lobby в момент, когда уже проходит authoritative room entry flow.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Scoped chat behavior покрыт тестами
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Когда появится отдельная HTML-first страница лобби, `ChatBlock` стоит встроить в неё как standalone lobby chat widget, а не держать этот flow частью game shell | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`
