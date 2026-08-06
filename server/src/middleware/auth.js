import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/api.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHORIZED', 'Требуется авторизация');
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) throw new AppError(401, 'TOKEN_INVALID', 'Сеанс авторизации истёк');
    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new AppError(401, 'ACCOUNT_INACTIVE', 'Учётная запись недоступна');
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'TOKEN_INVALID', 'Сеанс авторизации истёк');
  }
});

export const requireRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'FORBIDDEN', 'Недостаточно прав для этой операции'));
  next();
};
