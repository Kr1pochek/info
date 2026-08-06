import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`DGD API запущен на всех сетевых интерфейсах: порт ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal}: завершение работы`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
