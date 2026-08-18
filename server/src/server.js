import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`DGD API запущен на всех сетевых интерфейсах: порт ${env.PORT}`);
});

let shuttingDown = false;
async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal}: завершение работы`);
  const forceExit = setTimeout(() => {
    console.error(`Сервер не завершился за ${env.SHUTDOWN_GRACE_MS} мс, соединения будут закрыты принудительно`);
    server.closeAllConnections?.();
    process.exit(exitCode || 1);
  }, env.SHUTDOWN_GRACE_MS);
  forceExit.unref();
  server.close(async (error) => {
    clearTimeout(forceExit);
    try { await prisma.$disconnect(); } finally { process.exit(error ? 1 : exitCode); }
  });
}

process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка процесса', error);
  void shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (error) => {
  console.error('Необработанное отклонение Promise', error);
  void shutdown('unhandledRejection', 1);
});
