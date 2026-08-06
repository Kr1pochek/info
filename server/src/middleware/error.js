import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Маршрут ${req.method} ${req.path} не найден` } });
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Внутренняя ошибка сервера';
  let details = error.details;

  if (error instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Проверьте заполненные поля';
    details = error.flatten();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      status = 409; code = 'DUPLICATE_VALUE'; message = 'Запись с таким уникальным значением уже существует';
    } else if (error.code === 'P2025') {
      status = 404; code = 'NOT_FOUND'; message = 'Запись не найдена';
    } else if (error.code === 'P2003') {
      status = 409; code = 'RELATION_CONFLICT'; message = 'Операция невозможна из-за связанных записей';
    }
  }

  if (status >= 500) console.error(error);
  const payload = { success: false, error: { code, message } };
  if (details) payload.error.details = details;
  if (env.NODE_ENV !== 'production' && status >= 500) payload.error.debug = error.message;
  res.status(status).json(payload);
}
