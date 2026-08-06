import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler, publicUser, sendData } from '../utils/api.js';
import { writeAudit } from '../services/audit.js';

const cookieName = 'dgd_refresh';
const refreshCookie = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function tokensFor(user) {
  const accessToken = jwt.sign({ role: user.role, login: user.login }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id), expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ type: 'refresh', nonce: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    subject: String(user.id), expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.adminUser.findUnique({ where: { login: req.body.login.toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
  }
  const tokens = tokensFor(user);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(jwt.decode(tokens.refreshToken).exp * 1000) } }),
  ]);
  req.user = user;
  await writeAudit(req, 'LOGIN', 'AdminUser', user.id, null, { login: user.login });
  res.cookie(cookieName, tokens.refreshToken, refreshCookie);
  sendData(res, { accessToken: tokens.accessToken, user: publicUser(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[cookieName];
  if (!token) throw new AppError(401, 'REFRESH_REQUIRED', 'Сеанс истёк');
  let payload;
  try { payload = jwt.verify(token, env.JWT_REFRESH_SECRET); } catch { throw new AppError(401, 'REFRESH_INVALID', 'Сеанс истёк'); }
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive || stored.userId !== Number(payload.sub)) {
    res.clearCookie(cookieName, refreshCookie);
    throw new AppError(401, 'REFRESH_REVOKED', 'Сеанс истёк');
  }
  const tokens = tokensFor(stored.user);
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({ data: { userId: stored.userId, tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(jwt.decode(tokens.refreshToken).exp * 1000) } }),
  ]);
  res.cookie(cookieName, tokens.refreshToken, refreshCookie);
  sendData(res, { accessToken: tokens.accessToken, user: publicUser(stored.user) });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[cookieName];
  if (token) await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  if (req.user) await writeAudit(req, 'LOGOUT', 'AdminUser', req.user.id);
  res.clearCookie(cookieName, refreshCookie);
  sendData(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => sendData(res, publicUser(req.user)));
