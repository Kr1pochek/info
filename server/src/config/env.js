import 'dotenv/config';
import { z } from 'zod';

const developmentSecrets = new Set([
  'development_access_secret_change_123456',
  'development_refresh_secret_change_12345',
  'replace_with_at_least_32_random_characters',
]);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().startsWith('postgresql://').default('postgresql://postgres:password@localhost:5432/dgd_infokiosk'),
  CLIENT_URL: z.string().url().default('http://localhost:5174'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development_access_secret_change_123456'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development_refresh_secret_change_12345'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  SHUTDOWN_GRACE_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  PUBLIC_RATE_LIMIT: z.coerce.number().int().min(60).max(10000).default(1200),
  ADMIN_RATE_LIMIT: z.coerce.number().int().min(20).max(5000).default(300),
  AUTH_RATE_LIMIT: z.coerce.number().int().min(5).max(1000).default(30),
  INFORMER_PROVIDER: z.enum(['official', 'api-ninjas']).default('official'),
  API_NINJAS_KEY: z.preprocess((value) => value || undefined, z.string().trim().min(1).optional()),
}).superRefine((value, context) => {
  if (value.INFORMER_PROVIDER === 'api-ninjas' && !value.API_NINJAS_KEY) {
    context.addIssue({ code: 'custom', path: ['API_NINJAS_KEY'], message: 'Для провайдера api-ninjas укажите API-ключ' });
  }
  if (value.NODE_ENV !== 'production') return;
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (developmentSecrets.has(value[key]) || /^replace_/i.test(value[key])) {
      context.addIssue({ code: 'custom', path: [key], message: 'Для production задайте уникальный секрет' });
    }
  }
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    context.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Access и refresh секреты должны отличаться' });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Некорректные переменные окружения', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
