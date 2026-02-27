import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const TODO_DIR = path.join(PROJECT_ROOT, 'ai-docs/backlog/todo');
const DONE_DIR = path.join(PROJECT_ROOT, 'ai-docs/backlog/done');

/**
 * Нормализует номер задачи к формату TASK-{N}
 * @param {string} input - Входной аргумент (TASK-1, 1, TASK-01, 01)
 * @returns {string} - Нормализованный формат TASK-{N}
 */
function normalizeTaskId(input) {
  if (!input) {
    throw new Error('Не указан номер задачи. Используйте: TASK-1 или 1');
  }

  // Удаляем префикс TASK- если есть и извлекаем номер
  const match = input.match(/^TASK-(\d+)$/i) || input.match(/^(\d+)$/);
  if (!match) {
    throw new Error(`Неверный формат задачи: ${input}\nИспользуйте формат: TASK-1 или 1`);
  }

  const taskNumber = parseInt(match[1] || match[2], 10);
  return `TASK-${taskNumber}`;
}

/**
 * Проверяет существование файла задачи
 * @param {string} taskId - ID задачи (TASK-1)
 * @returns {{exists: boolean, location: string|null}}
 */
function checkTaskExists(taskId) {
  const filename = `${taskId}.md`;

  const todoPath = path.join(TODO_DIR, filename);
  const donePath = path.join(DONE_DIR, filename);

  if (fs.existsSync(todoPath)) {
    return { exists: true, location: TODO_DIR };
  }

  if (fs.existsSync(donePath)) {
    return { exists: true, location: DONE_DIR };
  }

  return { exists: false, location: null };
}

/**
 * Выполняет shell-команду и возвращает результат
 * @param {string} command - Команда для выполнения
 * @param {boolean} silent - Не выбрасывать ошибку при неудаче
 * @returns {{stdout: string, stderr: string, success: boolean}}
 */
function exec(command, silent = false) {
  try {
    const stdout = execSync(command, { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { stdout: stdout.trim(), stderr: '', success: true };
  } catch (error) {
    const stderr = error.stderr?.toString().trim() || error.message;
    if (silent) {
      return { stdout: '', stderr, success: false };
    }
    throw new Error(stderr);
  }
}

/**
 * Основная функция создания ветки
 */
function createBranch() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Не указан номер задачи');
    console.error('   Использование: node create-branch.js TASK-1');
    process.exit(1);
  }

  const taskId = normalizeTaskId(args[0]);
  const branchName = `feature/${taskId}`;

  console.log(`🔍 Проверка задачи: ${taskId}...`);
  
  // Проверяем существование задачи
  const taskCheck = checkTaskExists(taskId);
  if (!taskCheck.exists) {
    console.error(`❌ Задача не найдена: ${taskId}`);
    console.error(`   Проверьте, что файл ${taskId}.md существует в ai-docs/backlog/todo/ или ai-docs/backlog/done/`);
    process.exit(1);
  }
  
  console.log(`✅ Задача найдена в: ${taskCheck.location}`);

  // Шаг 1: Git status
  console.log('\n📊 Проверка состояния Git...');
  const statusResult = exec('git status --porcelain', true);
  
  if (statusResult.stdout && statusResult.stdout.length > 0) {
    console.error('❌ Working tree не чиста. Есть незакоммиченные изменения:');
    console.error(statusResult.stdout);
    console.error('\n   Закоммитьте или отмените изменения перед созданием ветки.');
    process.exit(1);
  }
  console.log('✅ Working tree чиста');

  // Шаг 2: Git fetch
  console.log('\n📥 Синхронизация с удалённым репозиторием...');
  exec('git fetch');
  console.log('✅ Fetch завершён');

  // Шаг 3: Checkout master
  console.log('\n🔄 Переключение на master...');
  exec('git checkout master');
  console.log('✅ Переключено на master');

  // Шаг 4: Git pull --ff-only
  console.log('\n⬇️  Pull с --ff-only...');
  const pullResult = exec('git pull --ff-only origin master', true);
  
  if (!pullResult.success) {
    console.log('⚠️  Pull --ff-only не удался, выполняем reset...');
    console.log(`   Причина: ${pullResult.stderr.split('\n')[0]}`);
    exec('git reset --hard origin/master');
    console.log('✅ Reset выполнен');
  } else {
    console.log('✅ Pull завершён (fast-forward)');
  }

  // Шаг 5: Создание новой ветки
  console.log(`\n🌿 Создание ветки ${branchName}...`);
  
  // Проверяем, существует ли уже ветка
  const existingBranches = exec('git branch --list', true);
  const branchExists = existingBranches.stdout.includes(branchName);
  
  if (branchExists) {
    console.error(`❌ Ветка уже существует: ${branchName}`);
    console.error('   Удалите ветку или используйте другую.');
    process.exit(1);
  }
  
  exec(`git checkout -b ${branchName}`);
  console.log(`✅ Ветка создана: ${branchName}`);

  // Финальный отчёт
  console.log('\n' + '='.repeat(50));
  console.log('✅ Ветка успешно создана!');
  console.log('='.repeat(50));
  console.log(`📁 Путь к задаче: ${path.join(taskCheck.location, `${taskId}.md`)}`);
  console.log(`🌿 Ветка: ${branchName}`);
  console.log(`📍 BASE: master (синхронизирован с origin)`);
  console.log('\nТеперь можно приступать к реализации задачи.');
}

// Запуск
createBranch();
