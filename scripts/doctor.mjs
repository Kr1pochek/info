import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEnvPath = path.join(root, 'server', '.env');
const productionMode = process.argv.includes('--production');
const results = [];

function report(level, title, detail) {
  results.push({ level, title, detail });
}

function parseEnvironment(content) {
  return Object.fromEntries(content.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) return [];
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return [[match[1], value]];
  }));
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
report(nodeMajor >= 20 ? 'ok' : 'error', 'Node.js', process.versions.node);

const requiredEnvironment = ['DATABASE_URL', 'CLIENT_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
let environment = {};
if (!fs.existsSync(serverEnvPath)) {
  environment = process.env;
  const suppliedByRuntime = requiredEnvironment.every((key) => environment[key]);
  report(suppliedByRuntime ? 'ok' : 'error', 'Конфигурация', suppliedByRuntime
    ? 'получена из переменных окружения'
    : 'server/.env отсутствует и обязательные переменные окружения не заданы');
} else {
  const fileEnvironment = parseEnvironment(fs.readFileSync(serverEnvPath, 'utf8'));
  environment = { ...fileEnvironment, ...process.env };
  report('ok', 'server/.env', 'найден');
  for (const [key, value] of Object.entries(fileEnvironment)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

for (const key of requiredEnvironment) {
  report(environment[key] ? 'ok' : 'error', key, environment[key] ? 'задан' : 'не задан');
}

const placeholders = new Set([
  'development_access_secret_change_123456',
  'development_refresh_secret_change_12345',
  'replace_with_at_least_32_random_characters',
]);
for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  if (environment[key] && (environment[key].length < 32 || placeholders.has(environment[key]) || /^replace_/i.test(environment[key]))) {
    report(productionMode ? 'error' : 'warning', key, 'нужно заменить на уникальный production-секрет');
  }
}
if (environment.JWT_ACCESS_SECRET && environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
  report('error', 'JWT-секреты', 'access и refresh секреты совпадают');
}
if (productionMode && (!environment.SEED_ADMIN_PASSWORD || environment.SEED_ADMIN_PASSWORD.length < 12 || /^(change_me|replace_)/i.test(environment.SEED_ADMIN_PASSWORD))) {
  report('error', 'SEED_ADMIN_PASSWORD', 'задайте уникальный пароль длиной не менее 12 символов');
}
if (productionMode && environment.NODE_ENV !== 'production') {
  report('error', 'NODE_ENV', `ожидалось production, указано ${environment.NODE_ENV || 'пусто'}`);
} else {
  report('ok', 'NODE_ENV', environment.NODE_ENV || 'development');
}

if (environment.DATABASE_URL) {
  try {
    const databaseUrl = new URL(environment.DATABASE_URL);
    const databasePassword = decodeURIComponent(databaseUrl.password).toLowerCase();
    if (productionMode && (['password', 'postgres', 'dgd_dev_password', 'change_me'].includes(databasePassword) || /^replace_/i.test(databasePassword))) {
      report('warning', 'Пароль PostgreSQL', 'используется известный тестовый пароль; замените его перед установкой на объекте');
    }
    if (productionMode && decodeURIComponent(databaseUrl.username).toLowerCase() === 'postgres') {
      report('warning', 'Пользователь PostgreSQL', 'для эксплуатации рекомендуется отдельная роль без прав суперпользователя');
    }
  } catch {
    report('error', 'DATABASE_URL', 'некорректный URL подключения');
  }
}

const distIndex = path.join(root, 'client', 'dist', 'index.html');
report(fs.existsSync(distIndex) ? 'ok' : (productionMode ? 'error' : 'warning'), 'Frontend build', fs.existsSync(distIndex) ? 'готов' : 'выполните npm run build');

const uploadsDirectory = path.join(root, 'server', 'uploads');
try {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  fs.accessSync(uploadsDirectory, fs.constants.R_OK | fs.constants.W_OK);
  report('ok', 'Хранилище uploads', 'доступно для чтения и записи');
} catch {
  report('error', 'Хранилище uploads', 'нет доступа для чтения и записи');
}

if (environment.DATABASE_URL) {
  try {
    const { prisma } = await import('../server/src/config/prisma.js');
    await prisma.$queryRawUnsafe('SELECT 1');
    const applied = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL');
    const migrationDirectory = path.join(root, 'server', 'prisma', 'migrations');
    const expectedMigrations = fs.readdirSync(migrationDirectory, { withFileTypes: true }).filter((item) => item.isDirectory()).length;
    const appliedMigrations = applied[0]?.count ?? 0;
    report(appliedMigrations === expectedMigrations ? 'ok' : 'error', 'PostgreSQL', `подключена, миграций применено: ${appliedMigrations}/${expectedMigrations}`);
    await prisma.$disconnect();
  } catch (error) {
    report('error', 'PostgreSQL', error.code || 'подключение не установлено');
  }
}

const symbols = { ok: '✓', warning: '!', error: '✗' };
for (const item of results) console.log(`${symbols[item.level]} ${item.title}: ${item.detail}`);
const errors = results.filter((item) => item.level === 'error').length;
const warnings = results.filter((item) => item.level === 'warning').length;
console.log(`\nИтог: ${errors ? `${errors} ошибок` : 'критических ошибок нет'}, предупреждений: ${warnings}.`);
if (errors) process.exitCode = 1;
