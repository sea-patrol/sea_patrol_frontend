const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Конфигурация
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const TODO_DIR = path.join(PROJECT_ROOT, "ai-docs/backlog/todo");
const DONE_DIR = path.join(PROJECT_ROOT, "ai-docs/backlog/done");

/**
 * Нормализует номер задачи к формату TASK-{N}
 * @param {string} input - Входной аргумент (TASK-1, 1, TASK-01, 01)
 * @returns {string} - Нормализованный формат TASK-{N}
 */
function normalizeTaskId(input) {
  if (!input) {
    throw new Error("Не указан номер задачи. Используйте: TASK-1 или 1");
  }

  const match = input.match(/^TASK-(\d+)$/i) || input.match(/^(\d+)$/);
  if (!match) {
    throw new Error(
      `Неверный формат задачи: ${input}\nИспользуйте формат: TASK-1 или 1`,
    );
  }

  const taskNumber = parseInt(match[1] || match[2], 10);
  return `TASK-${taskNumber}`;
}

/**
 * Проверяет существование файла задачи
 * @param {string} taskId - ID задачи (TASK-1)
 * @returns {{exists: boolean, location: string|null, content: string|null}}
 */
function checkTaskExists(taskId) {
  const filename = `${taskId}.md`;

  const todoPath = path.join(TODO_DIR, filename);
  const donePath = path.join(DONE_DIR, filename);

  if (fs.existsSync(todoPath)) {
    return {
      exists: true,
      location: TODO_DIR,
      content: fs.readFileSync(todoPath, "utf-8"),
    };
  }

  if (fs.existsSync(donePath)) {
    return {
      exists: true,
      location: DONE_DIR,
      content: fs.readFileSync(donePath, "utf-8"),
    };
  }

  return { exists: false, location: null, content: null };
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
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout: stdout.trim(), stderr: "", success: true };
  } catch (error) {
    const stderr = error.stderr?.toString().trim() || error.message;
    if (silent) {
      return { stdout: "", stderr, success: false };
    }
    throw new Error(stderr);
  }
}

/**
 * Извлекает заголовок задачи из файла
 * @param {string} content - Содержимое файла задачи
 * @returns {string} - Заголовок задачи
 */
function extractTaskTitle(content) {
  if (!content) return "Задача";

  // Ищем первую строку, которая не пустая и не заголовок уровня 2+
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("##") && !trimmed.startsWith("###")) {
      // Очищаем от маркеров списка
      return trimmed.replace(/^[-*]\s*/, "").substring(0, 100);
    }
  }
  return "Задача";
}

/**
 * Основная функция создания PR
 */
function createPR() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ Не указан номер задачи");
    console.error("   Использование: node create-pr.js TASK-1");
    process.exit(1);
  }

  const taskId = normalizeTaskId(args[0]);
  const branchName = `feature/${taskId}`;

  console.log(`🔍 Проверка задачи: ${taskId}...`);

  // Проверяем существование задачи
  const taskCheck = checkTaskExists(taskId);
  if (!taskCheck.exists) {
    console.error(`❌ Задача не найдена: ${taskId}`);
    console.error(
      `   Проверьте, что файл ${taskId}.md существует в ai-docs/backlog/todo/ или ai-docs/backlog/done/`,
    );
    process.exit(1);
  }

  console.log(`✅ Задача найдена в: ${taskCheck.location}`);

  // Шаг 1: Проверка текущей ветки
  console.log("\n📊 Проверка текущей ветки...");
  const currentBranch = exec("git rev-parse --abbrev-ref HEAD").stdout;

  if (currentBranch !== branchName) {
    console.error(`❌ Вы находитесь в ветке: ${currentBranch}`);
    console.error(
      `   Переключитесь на ветку ${branchName} перед созданием PR.`,
    );
    console.error(`   Используйте: git checkout ${branchName}`);
    process.exit(1);
  }
  console.log(`✅ Текущая ветка: ${branchName}`);

  // Шаг 2: Git status
  console.log("\n📊 Проверка состояния Git...");
  const statusResult = exec("git status --porcelain", true);

  if (statusResult.stdout && statusResult.stdout.length > 0) {
    console.log("⚠️  Обнаружены изменения в working tree:");
    console.log(statusResult.stdout);
    console.log("\n📝 Коммит изменений...");
    exec("git add .");
    exec('git commit -m "feat: изменения по задаче ' + taskId + '"');
    console.log("✅ Изменения закоммичены");
  } else {
    console.log("✅ Working tree чиста");
  }

  // Шаг 3: Проверка наличия изменений для коммита
  console.log("\n📊 Проверка истории коммитов в ветке...");
  const diffResult = exec(
    "git rev-list --count HEAD..origin/" + branchName,
    true,
  );

  if (!diffResult.success || diffResult.stdout === "0") {
    // Проверяем локальные коммиты
    const localCommits = exec(
      "git rev-list --count origin/" + branchName + "..HEAD",
      true,
    );
    if (!localCommits.success || localCommits.stdout === "0") {
      console.error("⚠️  В ветке нет новых коммитов.");
      console.error(
        "   Внесите изменения и закоммитьте их перед созданием PR.",
      );
      process.exit(1);
    }
  }

  // Шаг 4: Push ветки
  console.log("\n🚀 Push ветки на GitHub...");
  const pushResult = exec(`git push -u origin ${branchName}`, true);

  if (!pushResult.success) {
    console.error("❌ Ошибка при push:");
    console.error(pushResult.stderr);
    process.exit(1);
  }
  console.log(`✅ Ветка запушена: origin/${branchName}`);

  // Шаг 5: Проверка GitHub CLI
  console.log("\n🔍 Проверка GitHub CLI...");
  const ghVersion = exec("gh --version", true);

  if (!ghVersion.success) {
    console.log("⚠️  GitHub CLI не найден.");
    console.log("\n📋 Для создания PR используйте веб-интерфейс:");
    console.log(
      `https://github.com/sea-patrol/sea_patrol_frontend/compare/${branchName}?expand=1`,
    );

    const taskTitle = extractTaskTitle(taskCheck.content);
    console.log("\n📝 Рекомендуемое название PR:");
    console.log(`   ${taskId}: ${taskTitle}`);

    process.exit(0);
  }
  console.log("✅ GitHub CLI доступен");

  // Шаг 6: Создание PR через gh
  console.log("\n📝 Создание Pull Request...");

  const taskTitle = extractTaskTitle(taskCheck.content);
  const prTitle = `${taskId}: ${taskTitle}`;

  // Формируем тело PR
  const prBody = `## Описание
Реализация задачи ${taskId}

## Изменения
- [ ] Добавить описание изменений

## Checklist
- [ ] \`npm run build\` - сборка прошла успешно
- [ ] \`npm run lint\` - линтинг пройден
- [ ] Тесты пройдены

## Скриншоты (если применимо)
<!-- Добавьте скриншоты изменений -->

## Related Issues
Closes #${taskId.replace("TASK-", "")}
`;

  // Создаем файл с телом PR
  const prBodyFile = path.join(PROJECT_ROOT, ".pr-body.md");
  fs.writeFileSync(prBodyFile, prBody, "utf-8");

  try {
    const prResult = exec(
      `gh pr create --title "${prTitle}" --body-file "${prBodyFile}" --base master --head ${branchName}`,
    );

    // Удаляем временный файл
    fs.unlinkSync(prBodyFile);

    console.log("\n" + "=".repeat(50));
    console.log("✅ Pull Request успешно создан!");
    console.log("=".repeat(50));
    console.log(`📝 PR: ${prTitle}`);
    console.log(`🌿 Ветка: ${branchName}`);
    console.log(`📎 URL: ${prResult.stdout}`);
    console.log("\nТеперь можно запросить code review.");
  } catch (error) {
    // Удаляем временный файл в случае ошибки
    if (fs.existsSync(prBodyFile)) {
      fs.unlinkSync(prBodyFile);
    }

    // Если PR уже существует, сообщаем об этом
    if (error.message.includes("already exists")) {
      console.log("\n" + "=".repeat(50));
      console.log("⚠️  Pull Request уже существует!");
      console.log("=".repeat(50));
      console.log(`🌿 Ветка: ${branchName}`);
      console.log("\n📋 Откройте PR в веб-интерфейсе:");
      console.log(`https://github.com/sea-patrol/sea_patrol_frontend/pulls`);
    } else {
      console.error("❌ Ошибка при создании PR:");
      console.error(error.message);
      console.log("\n📋 Создайте PR через веб-интерфейс:");
      console.log(
        `https://github.com/sea-patrol/sea_patrol_frontend/compare/${branchName}?expand=1`,
      );
    }
  }
}

// Запуск
createPR();
