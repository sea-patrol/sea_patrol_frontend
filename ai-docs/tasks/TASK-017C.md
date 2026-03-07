# TASK-017C - Frontend часть: отдельная HTML-first страница лобби

## Метаданные
- **ID:** `TASK-017C`
- **Тип:** `feature`
- **Статус:** `Review`
- **Приоритет:** `High`
- **Дата создания:** `2026-03-07`
- **Автор:** `Codex`
- **Связанный roadmap item:** `Wave 1 / TASK-017C`
- **Трек:** `Frontend`
- **Depends on:** `TASK-014`, `TASK-015`, `TASK-016`, `TASK-017`, `TASK-017B`

## Контекст
До `TASK-017C` лобби технически уже работало, но жило внутри `GameUiShell` поверх уже смонтированной 3D-сцены. Это противоречило желаемому UX: пользователь оказывался в лобби как будто бы уже "внутри игры", а `Canvas`/R3F поднимались слишком рано, хотя room/game flow ещё не начался.

## Цель
Вынести лобби в отдельную лёгкую страницу `/lobby` без `Canvas` и gameplay scene, сохранив на ней room list, create/join actions, connection status и lobby chat. 3D-сцена должна загружаться только после успешного room join flow.

## Source of Truth
- Код:
  - `sea_patrol_frontend/src/app/App.jsx`
  - `sea_patrol_frontend/src/pages/HomePage/index.jsx`
  - `sea_patrol_frontend/src/pages/LobbyPage/index.jsx`
  - `sea_patrol_frontend/src/pages/LobbyPage/LobbyPage.css`
  - `sea_patrol_frontend/src/pages/GamePage/index.jsx`
  - `sea_patrol_frontend/src/pages/GamePage/GamePage.css`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.jsx`
  - `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css`
  - `sea_patrol_frontend/src/features/game/model/GameRealtimeBridge.jsx`
  - `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx`
  - `sea_patrol_frontend/src/features/game/model/useGameWsGameState.js`
  - `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx`
  - `sea_patrol_frontend/src/scene/GameMainScene.jsx`
- Тесты:
  - `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx`
  - `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx`
  - `sea_patrol_frontend/src/__tests__/widgets/LobbyPanel.test.jsx`
- Внешняя документация:
  - `sea_patrol_frontend/ai-docs/API_INFO.md`
  - `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`
  - `sea_patrol_orchestration/ROADMAP-TASKS.md`

## Acceptance Criteria
- [x] При открытии лобби не монтируется 3D-сцена.
- [x] Lobby page остаётся простой и лаконичной HTML-страницей.
- [x] На экране лобби есть room list, create/join actions, connection status и lobby chat.
- [x] Переход в gameplay scene происходит только после успешного room join flow.

## Scope
**Включает:**
- новый маршрут `/lobby`;
- отдельную `LobbyPage` без `Canvas`/R3F;
- перенос room join orchestration с lobby route на отдельную страницу;
- явный переход `Home -> Lobby -> Game`;
- глобальный WS/game-state bridge, чтобы route transition не терял room init сообщения;
- guard для `/game`, который не монтирует scene без room context;
- tests на lobby route и room init shell.

**Не включает (out of scope):**
- полноценную navigation polish задачу `TASK-017D`;
- redesign стартовой страницы;
- backend contract changes;
- reconnect resume UX beyond текущий MVP flow.

## Технический подход
`App` теперь поднимает `WebSocketProvider`, `GameStateProvider` и `GameRealtimeBridge` выше маршрутов. Это сохраняет одну WS-сессию и одну game-state subscription chain при переходе между `/lobby` и `/game`, чтобы ранние room init сообщения не терялись в момент route transition.

`LobbyPage` стала отдельной HTML-first страницей: она рендерит `LobbyPanel`, standalone `ChatBlock` в scope `group:lobby` и сама оркестрирует room join. После REST `POST /api/v1/rooms/{roomId}/join` лобби не открывает 3D-сцену сразу, а остаётся на месте и ждёт `SPAWN_ASSIGNED`; только после этого пользователь переводится на `/game`.

`GamePage` теперь room-only маршрут. Он не рендерит `GameMainScene`, если у приложения нет room context. Когда room entry уже подтверждён, страница монтирует сцену и `GameUiShell`, а shell ждёт `INIT_GAME_STATE/current player` перед переходом в `SAILING`.

## Изменения по репозиторию
### `sea_patrol_frontend`
- [x] Добавить отдельную `LobbyPage`
- [x] Развести маршруты `/`, `/lobby`, `/game`
- [x] Перенести lobby join orchestration из game shell на lobby route
- [x] Поднять WS/game-state bridge выше роутов
- [x] Убрать `LobbyPanel` из `GameUiShell`
- [x] Не монтировать gameplay scene без room context
- [x] Обновить tests на новый flow
- [x] Обновить `ai-docs/API_INFO.md`
- [x] Обновить `ai-docs/PROJECT_INFO.md`

## Контракты и данные
### Route flow
1. `/` — Home page
2. `/lobby` — HTML-first harbor lobby
3. `/game` — room/game route with 3D scene

### Room entry flow
1. Lobby page вызывает `POST /api/v1/rooms/{roomId}/join`
2. Lobby page ждёт `SPAWN_ASSIGNED` по текущей WS-сессии
3. После `SPAWN_ASSIGNED` frontend навигирует на `/game`
4. `GameUiShell` ждёт `INIT_GAME_STATE/current player`
5. Только затем shell входит в `SAILING`

## Риски и меры контроля
| Риск | Почему это риск | Мера контроля |
|------|-----------------|---------------|
| Route transition потеряет ранние room init сообщения | Лобби и сцена теперь живут на разных страницах | `WebSocketProvider`, `GameStateProvider` и `GameRealtimeBridge` подняты выше роутов |
| `/game` откроется без room context и поднимет scene слишком рано | Пользователь может открыть room route напрямую | `GamePage` не монтирует сцену без room context и отправляет пользователя обратно в lobby flow |
| Join UX станет фрагментированным между страницами | REST и WS части flow разделены | Lobby route держит join orchestration до `SPAWN_ASSIGNED`, а room route продолжает только final init phase |

## План реализации
1. Добавить `LobbyPage` и новый маршрут `/lobby`.
2. Поднять realtime/game-state bridge выше роутов.
3. Перенести join orchestration на lobby route.
4. Перевести `GamePage`/`GameUiShell` в room-only режим.
5. Обновить tests и docs.

## Проверки
### Автоматические проверки
| Репозиторий | Команда | Зачем | Статус |
|-------------|---------|-------|--------|
| `sea_patrol_frontend` | `npm run test:run` | Проверить lobby route, room init shell и отсутствие regressions | `Passed` |
| `sea_patrol_frontend` | `npm run build` | Проверить production build после route split | `Passed` |

### Ручная проверка
- [x] `/lobby` открывается без canvas
- [x] Lobby page показывает room list/create/join/status/chat
- [x] `Join room` не открывает сцену до `SPAWN_ASSIGNED`
- [x] `/game` поднимает scene только при наличии room context

## Реализация
### Измененные файлы
1. `sea_patrol_frontend/src/app/App.jsx` - новый route split и глобальные realtime/game-state providers
2. `sea_patrol_frontend/src/pages/HomePage/index.jsx` - переход на `/lobby` вместо старого `/game`
3. `sea_patrol_frontend/src/pages/LobbyPage/index.jsx` - HTML-first lobby route, join orchestration и standalone lobby chat
4. `sea_patrol_frontend/src/pages/LobbyPage/LobbyPage.css` - layout новой lobby page
5. `sea_patrol_frontend/src/pages/GamePage/index.jsx` - room-only route guard и mount scene только при room context
6. `sea_patrol_frontend/src/pages/GamePage/GamePage.css` - guard state styling
7. `sea_patrol_frontend/src/features/game/model/GameRealtimeBridge.jsx` - глобальный WS -> game-state bridge above routes
8. `sea_patrol_frontend/src/features/game/model/GameStateContext.jsx` - reset action для game state
9. `sea_patrol_frontend/src/features/game/model/useGameWsGameState.js` - optional player-name sync для global bridge
10. `sea_patrol_frontend/src/scene/GameMainScene.jsx` - scene больше не владеет WS-subscriptions
11. `sea_patrol_frontend/src/features/ui-shell/ui/GameUiShell.jsx` - room-only shell без `LobbyPanel` и без REST join orchestration
12. `sea_patrol_frontend/src/widgets/LobbyPanel/LobbyPanel.css` - адаптация под standalone page layout
13. `sea_patrol_frontend/src/__tests__/pages/LobbyPage.test.jsx` - coverage на HTML-first lobby route и spawn-gated navigation
14. `sea_patrol_frontend/src/__tests__/features/ui-shell/GameUiShell.roomJoin.test.jsx` - room-only shell init flow tests
15. `sea_patrol_frontend/ai-docs/API_INFO.md` - documentation sync for route split and join flow
16. `sea_patrol_frontend/ai-docs/PROJECT_INFO.md` - documentation sync for structure/architecture/testing
17. `sea_patrol_frontend/ai-docs/tasks/TASK-017C.md` - frontend task artifact

### Незапланированные находки
- Для безопасного route split недостаточно было просто добавить страницу `/lobby`; пришлось поднять game-state subscriptions выше сцены, иначе `INIT_GAME_STATE` мог потеряться во время перехода между страницами.
- `SPAWN_ASSIGNED` оказался естественной границей между lobby route и gameplay route: до него пользователь ещё в harbor flow, после него можно безопасно монтировать room scene.

## QA / Review
### QA
- [x] Все acceptance criteria подтверждены
- [x] Lobby page не монтирует 3D-сцену
- [x] Регресс по frontend suite не обнаружен

**QA статус:** `Passed`

### Code Review
| Приоритет | Комментарий | Статус |
|-----------|-------------|--------|
| `Medium` | Следующий шаг (`TASK-017D`) стоит использовать для финального navigation polish: явные CTA между Home/Lobby/Game и более аккуратное поведение direct-open `/game` без room context | `Open` |

**Review решение:** `Approve`

## Финализация
- [x] Код frontend обновлен
- [x] Tests проходят
- [ ] Задача перенесена в выполненные / архив

## Ссылки
- Related docs: `sea_patrol_frontend/ai-docs/API_INFO.md`, `sea_patrol_frontend/ai-docs/PROJECT_INFO.md`, `sea_patrol_orchestration/ROADMAP-TASKS.md`
