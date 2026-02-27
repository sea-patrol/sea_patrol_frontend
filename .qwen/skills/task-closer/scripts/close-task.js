import { rename } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Пути относительно корня проекта (scripts -> task-closer -> skills -> .qwen -> project root)
const PROJECT_ROOT = join(__dirname, '..', '..', '..', '..');
const TODO_DIR = join(PROJECT_ROOT, 'ai-docs', 'backlog', 'todo');
const DONE_DIR = join(PROJECT_ROOT, 'ai-docs', 'backlog', 'done');

/**
 * Парсит аргумент командной строки и возвращает нормализованный ID задачи
 * Поддерживает форматы: TASK-1, TASK-01, 1, 01
 */
function parseTaskId(arg) {
  if (!arg) {
    return null;
  }

  // Удаляем префикс TASK- если есть
  const normalized = arg.toUpperCase().replace(/^TASK-/, '');
  
  // Проверяем, что осталась только цифра
  if (/^\d+$/.test(normalized)) {
    return `TASK-${parseInt(normalized, 10)}`;
  }
  
  return null;
}

/**
 * Основная функция закрытия задачи
 */
async function closeTask() {
  try {
    // Получаем аргумент командной строки
    const arg = process.argv[2];
    
    if (!arg) {
      console.error('❌ Укажите номер задачи: node close-task.js TASK-1');
      console.error('   или: node close-task.js 1');
      process.exit(1);
    }

    const taskId = parseTaskId(arg);
    
    if (!taskId) {
      console.error(`❌ Неверный формат задачи: ${arg}`);
      console.error('   Используйте формат: TASK-1 или 1');
      process.exit(1);
    }

    const taskFileName = `${taskId}.md`;
    const sourcePath = join(TODO_DIR, taskFileName);
    const destPath = join(DONE_DIR, taskFileName);

    // Проверяем существование файла в todo
    try {
      await rename(sourcePath, destPath);
      console.log(`✅ Задача закрыта: ${taskFileName}`);
      console.log(`📁 Перемещена из: ${sourcePath}`);
      console.log(`📁 Перемещена в: ${destPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ Файл не найден: ${sourcePath}`);
        console.error('   Проверьте, что задача существует в ai-docs/backlog/todo/');
      } else if (error.code === 'EXDEV') {
        // Cross-device link error (редко на Windows, но возможно)
        console.error('❌ Ошибка перемещения между устройствами');
        console.error('   Попробуйте переместить файл вручную');
      } else {
        throw error;
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Ошибка при закрытии задачи:', error.message);
    process.exit(1);
  }
}

// Запуск
closeTask();
