import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Пути относительно корня проекта (scripts -> task-creator -> skills -> .qwen -> project root)
const PROJECT_ROOT = join(__dirname, '..', '..', '..', '..');
const COUNTER_FILE = join(PROJECT_ROOT, 'ai-docs', 'backlog', '.task-counter.json');
const TEMPLATE_FILE = join(PROJECT_ROOT, 'ai-docs', 'backlog', 'TASK-TEMPLATE.md');
const TODO_DIR = join(PROJECT_ROOT, 'ai-docs', 'backlog', 'todo');

/**
 * Получает текущий номер задачи и инкрементирует его
 */
async function getNextTaskId() {
  try {
    const data = await readFile(COUNTER_FILE, 'utf-8');
    const counter = JSON.parse(data);
    const nextId = counter.nextId;
    
    // Инкрементируем и сохраняем
    counter.nextId += 1;
    await writeFile(COUNTER_FILE, JSON.stringify(counter, null, 2) + '\n');
    
    return nextId;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл не существует, создаём с 1
      await writeFile(COUNTER_FILE, JSON.stringify({ nextId: 2 }, null, 2) + '\n');
      return 1;
    }
    throw error;
  }
}

/**
 * Генерирует содержимое файла задачи на основе шаблона
 */
function generateTaskContent(taskId) {
  const id = `TASK-${taskId}`;
  const date = new Date().toISOString().split('T')[0];
  
  return `# ${id} — Шаблон задачи

## Метаданные
- **ID:** ${id}
- **Ветка:** \`feature/${id}\` или \`bugfix/${id}\`
- **Статус:** Todo / In Progress / Review / Done
- **Дата создания:** ${date}

## Описание задачи
<!-- Product Manager: сформулируй цель и ожидаемый результат -->

## Acceptance Criteria
<!-- Product Manager: перечисли измеримые критерии приемки -->
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Критерий 3

## Scope
**Включает:**
- ...

**Не включает (out-of-scope):**
- ...

## Технический план
<!-- Tech Lead: опиши подход, затрагиваемые модули, риски -->

### Затрагиваемые файлы/модули
- \`src/...\`
- \`ai-docs/...\`

### Риски и меры контроля
| Риск | Мера контроля |
|------|---------------|
| ... | ... |

## Реализация
<!-- Frontend Developer: список изменений -->

### Измененные файлы
1. \`path/to/file.js\` — описание изменения
2. \`path/to/file.css\` — описание изменения

## Проверки
### Build
\`\`\`bash
npm run build
\`\`\`
Статус: ✅ / ❌

### Tests
\`\`\`bash
npm run test:run
\`\`\`
Статус: ✅ / ❌

## QA Report
<!-- QA Engineer: результаты проверки -->
- [ ] Все acceptance criteria проверены
- [ ] Ключевые сценарии работают
- [ ] Регресс не обнаружен
- [ ] Build и tests прошли

**Статус:** Passed / Failed

**Найденные проблемы:**
- ...

## Code Review
<!-- Code Reviewer: замечания и решение -->

### Замечания
| Приоритет | Описание | Статус |
|-----------|----------|--------|
| High/Medium/Low | ... | Resolved / Pending |

**Решение:** Approve / Changes Requested

## Финализация
- [ ] PR создан (\`gh pr create\`)
- [ ] PR замержен
- [ ] Задача перенесена в \`ai-docs/backlog/done/\`
- [ ] Документация обновлена (если нужно)

---
**Ссылки:**
- PR: #<N>
- Commit: \`<hash>\`
`;
}

/**
 * Основная функция создания задачи
 */
async function createTask() {
  try {
    // Получаем следующий номер задачи
    const taskId = await getNextTaskId();
    const taskIdStr = taskId.toString();
    
    // Генерируем содержимое
    const content = generateTaskContent(taskIdStr);
    
    // Формируем путь к файлу
    const taskFileName = `TASK-${taskIdStr}.md`;
    const taskFilePath = join(TODO_DIR, taskFileName);
    
    // Создаём директорию todo, если не существует
    await mkdir(TODO_DIR, { recursive: true });
    
    // Записываем файл
    await writeFile(taskFilePath, content, 'utf-8');
    
    console.log(`✅ Создана задача: ${taskFileName}`);
    console.log(`📁 Путь: ${taskFilePath}`);
    console.log(`🔢 ID: TASK-${taskIdStr}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании задачи:', error.message);
    process.exit(1);
  }
}

// Запуск
createTask();
