## Sea Patrol Frontend

Фронтенд многопользовательской 3D-браузерной игры про парусные корабли.
Стек: React + Vite + Three.js + React Three Fiber (R3F).

Полная документация:
- `ai-docs/PROJECT_INFO.md`
- `ai-docs/API_INFO.md`

### Требования
- Node.js (рекомендуется LTS)
- npm

### Быстрый старт
```bash
npm install
npm run dev
```
По умолчанию: `http://localhost:5173`.

### Полезные команды
```bash
# продакшен-сборка
npm run build

# запуск тестов
npm run test:run

# линтинг
npm run lint
```

### Интеграция с бэкендом (локально)
Ожидается backend на `http://localhost:8080` (REST) и WebSocket на `/ws/game`.
