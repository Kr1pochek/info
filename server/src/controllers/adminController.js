import bcrypt from 'bcrypt';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler, pagination, publicUser, sendData } from '../utils/api.js';
import { writeAudit } from '../services/audit.js';
import { uploadsRoot } from '../middleware/upload.js';
import { ANALYTICS_TIME_ZONE, addAnalyticsDays, analyticsDateString, analyticsPeriod } from '../utils/analytics.js';

export const systemStatus = asyncHandler(async (_req, res) => {
  const checkedAt = new Date();
  let database = { key: 'database', label: 'База данных PostgreSQL', status: 'ONLINE', detail: 'Соединение установлено' };
  let storage = { key: 'storage', label: 'Хранилище медиафайлов', status: 'ONLINE', detail: uploadsRoot };
  try { await prisma.$queryRaw`SELECT 1`; } catch (error) { database = { ...database, status: 'ERROR', detail: error.message }; }
  try { await access(uploadsRoot, constants.R_OK | constants.W_OK); } catch (error) { storage = { ...storage, status: 'ERROR', detail: error.message }; }
  const components = [
    { key: 'backend', label: 'Сервер приложения', status: 'ONLINE', detail: `Node.js ${process.version}` },
    database,
    storage,
    { key: 'tv1', label: 'Экран зала №1', status: 'NOT_CONFIGURED', detail: 'Канал связи не настроен' },
    { key: 'tv2', label: 'Экран зала №2', status: 'NOT_CONFIGURED', detail: 'Канал связи не настроен' },
  ];
  const healthy = components.filter((item) => item.status === 'ONLINE').length;
  sendData(res, {
    checkedAt,
    overall: components.some((item) => item.status === 'ERROR') ? 'DEGRADED' : 'ONLINE',
    process: { uptimeSeconds: Math.round(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024), environment: process.env.NODE_ENV || 'development' },
    summary: { healthy, total: components.length, pending: components.filter((item) => item.status === 'NOT_CONFIGURED').length },
    components,
  });
});

export const dashboard = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayDay = analyticsDateString(now);
  const today = todayDay.slice(5);
  const since = analyticsPeriod({ from: addAnalyticsDays(todayDay, -6), to: todayDay }, 7).from;
  const verifiedAnalytics = { source: 'KIOSK' };
  const [services, categories, published, news, publishedNews, liveNews, broadcastItems, searches, opens, popular, daily] = await Promise.all([
    prisma.service.count(), prisma.category.count(), prisma.service.count({ where: { isPublished: true } }),
    prisma.news.count(), prisma.news.count({ where: { published: true } }),
    prisma.news.count({ where: { published: true, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
    prisma.broadcastItem.findMany({ where: { isActive: true }, select: { type: true, eventDate: true, mediaUrl: true } }),
    prisma.analyticsEvent.count({ where: { ...verifiedAnalytics, eventType: 'SEARCH' } }), prisma.analyticsEvent.count({ where: { ...verifiedAnalytics, eventType: 'SERVICE_OPEN' } }),
    prisma.analyticsEvent.groupBy({ by: ['serviceId'], where: { ...verifiedAnalytics, eventType: 'SERVICE_OPEN', serviceId: { not: null } }, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 5 }),
    prisma.$queryRaw(Prisma.sql`SELECT ("occurredAt" AT TIME ZONE ${ANALYTICS_TIME_ZONE})::date::text AS day, COUNT(*)::int AS count FROM "AnalyticsEvent" WHERE "source" = 'KIOSK' AND "occurredAt" >= ${since} GROUP BY 1 ORDER BY 1 ASC`),
  ]);
  const popularIds = popular.map((item) => item.serviceId).filter(Boolean);
  const popularRows = await prisma.service.findMany({ where: { id: { in: popularIds } }, select: { id: true, titleRu: true, titleKz: true } });
  const popularServices = popular.map((item) => ({ ...popularRows.find((row) => row.id === item.serviceId), count: item._count._all })).filter((item) => item.id);
  const liveBroadcastItems = broadcastItems.filter((item) => item.type === 'VIDEO' ? Boolean(item.mediaUrl) : item.eventDate && `${String(item.eventDate.getUTCMonth() + 1).padStart(2, '0')}-${String(item.eventDate.getUTCDate()).padStart(2, '0')}` === today).length;
  sendData(res, { counts: { services, categories, published, hidden: services - published, news, publishedNews, broadcastMaterials: liveNews + liveBroadcastItems, searches, opens }, popularServices, daily });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = String(req.query.search || '').trim().slice(0, 100);
  const where = search ? { OR: [{ login: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] } : {};
  const [rows, total] = await prisma.$transaction([prisma.adminUser.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }), prisma.adminUser.count({ where })]);
  sendData(res, rows.map(publicUser), { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.adminUser.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Администратор не найден');
  sendData(res, publicUser(user));
});

export const createUser = asyncHandler(async (req, res) => {
  const { password, ...input } = req.body;
  const user = await prisma.adminUser.create({ data: { ...input, login: input.login.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) } });
  await writeAudit(req, 'CREATE_ADMIN', 'AdminUser', user.id, null, publicUser(user));
  sendData(res, publicUser(user), null, 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.adminUser.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'USER_NOT_FOUND', 'Администратор не найден');
  if (id === req.user.id && (req.body.isActive === false || (req.body.role && req.body.role !== req.user.role))) throw new AppError(409, 'SELF_LOCKOUT', 'Нельзя заблокировать себя или изменить собственную роль');
  const { password, ...input } = req.body;
  if (input.login) input.login = input.login.toLowerCase();
  if (password) input.passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.update({ where: { id }, data: input });
  if (req.body.isActive === false) await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await writeAudit(req, 'UPDATE_ADMIN', 'AdminUser', id, publicUser(oldData), publicUser(user));
  sendData(res, publicUser(user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new AppError(409, 'SELF_DELETE', 'Нельзя удалить собственную учётную запись');
  const oldData = await prisma.adminUser.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'USER_NOT_FOUND', 'Администратор не найден');
  await prisma.$transaction([prisma.refreshToken.deleteMany({ where: { userId: id } }), prisma.adminUser.delete({ where: { id } })]);
  await writeAudit(req, 'DELETE_ADMIN', 'AdminUser', id, publicUser(oldData));
  sendData(res, { deleted: true });
});

export const getSettings = asyncHandler(async (_req, res) => sendData(res, await prisma.setting.findUnique({ where: { id: 1 } })));

export const updateSettings = asyncHandler(async (req, res) => {
  const oldData = await prisma.setting.findUnique({ where: { id: 1 } });
  if (req.user.role === 'ADMIN') {
    const critical = ['organizationNameRu', 'organizationNameKz', 'inactivitySeconds', 'warningSeconds', 'defaultLanguage', 'maintenanceMode'];
    if (critical.some((key) => oldData[key] !== req.body[key])) throw new AppError(403, 'CRITICAL_SETTINGS', 'Критические настройки может изменять только главный администратор');
  }
  const data = await prisma.setting.update({ where: { id: 1 }, data: req.body });
  await writeAudit(req, 'UPDATE_SETTINGS', 'Setting', 1, oldData, data);
  sendData(res, data);
});

const safetySettingsSelect = {
  ethicsOfficerNameRu: true, ethicsOfficerNameKz: true,
  ethicsOfficerContactsRu: true, ethicsOfficerContactsKz: true,
  ethicsOfficerPhoto: true, fireSafetyVideo: true, fireSafetyRules: true,
  fireSafetyWarningRu: true, fireSafetyWarningKz: true, updatedAt: true,
};
const receptionSettingsSelect = {
  receptionSchedule: true, districtQrCodes: true, customsQrCodes: true, updatedAt: true,
};

export const getSafetySettings = asyncHandler(async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: 1 }, select: safetySettingsSelect });
  sendData(res, data);
});

export const updateSafetySettings = asyncHandler(async (req, res) => {
  const oldData = await prisma.setting.findUnique({ where: { id: 1 }, select: safetySettingsSelect });
  const data = await prisma.setting.update({ where: { id: 1 }, data: req.body, select: safetySettingsSelect });
  await writeAudit(req, 'UPDATE_SAFETY', 'Setting', 1, oldData, data);
  sendData(res, data);
});

export const getReceptionSettings = asyncHandler(async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: 1 }, select: receptionSettingsSelect });
  sendData(res, data);
});

export const updateReceptionSettings = asyncHandler(async (req, res) => {
  const oldData = await prisma.setting.findUnique({ where: { id: 1 }, select: receptionSettingsSelect });
  const data = await prisma.setting.update({ where: { id: 1 }, data: req.body, select: receptionSettingsSelect });
  await writeAudit(req, 'UPDATE_SETTINGS', 'Setting', 1, oldData, data);
  sendData(res, data);
});

export const analytics = asyncHandler(async (req, res) => {
  const { from, to, fromDay, toDay } = analyticsPeriod(req.validatedQuery || req.query);
  const where = { source: 'KIOSK', occurredAt: { gte: from, lte: to } };
  const [byType, serviceGroups, categoryGroups, searchGroups, recent, daily, timeouts, sessionRows, firstCaptured] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ['eventType'], where, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({ by: ['serviceId'], where: { ...where, eventType: 'SERVICE_OPEN', serviceId: { not: null } }, _count: { _all: true }, orderBy: { _count: { serviceId: 'desc' } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ['categoryId'], where: { ...where, eventType: 'CATEGORY_OPEN', categoryId: { not: null } }, _count: { _all: true }, orderBy: { _count: { categoryId: 'desc' } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ['searchQuery'], where: { ...where, eventType: 'SEARCH', searchQuery: { not: null } }, _count: { _all: true }, orderBy: { _count: { searchQuery: 'desc' } }, take: 10 }),
    prisma.analyticsEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, take: 50, include: { service: { select: { titleRu: true, titleKz: true } }, category: { select: { titleRu: true, titleKz: true } } } }),
    prisma.$queryRaw(Prisma.sql`SELECT ("occurredAt" AT TIME ZONE ${ANALYTICS_TIME_ZONE})::date::text AS day, COUNT(*)::int AS count FROM "AnalyticsEvent" WHERE "source" = 'KIOSK' AND "occurredAt" BETWEEN ${from} AND ${to} GROUP BY 1 ORDER BY 1 ASC`),
    prisma.analyticsEvent.count({ where: { ...where, eventType: 'SESSION_TIMEOUT' } }),
    prisma.$queryRaw(Prisma.sql`SELECT COUNT(DISTINCT "sessionId")::int AS count FROM "AnalyticsEvent" WHERE "source" = 'KIOSK' AND "occurredAt" BETWEEN ${from} AND ${to}`),
    prisma.analyticsEvent.aggregate({ where: { source: 'KIOSK' }, _min: { occurredAt: true } }),
  ]);
  const services = await prisma.service.findMany({ where: { id: { in: serviceGroups.map((x) => x.serviceId).filter(Boolean) } }, select: { id: true, titleRu: true, titleKz: true } });
  const categories = await prisma.category.findMany({ where: { id: { in: categoryGroups.map((x) => x.categoryId).filter(Boolean) } }, select: { id: true, titleRu: true, titleKz: true } });
  sendData(res, {
    period: { from: fromDay, to: toDay, timeZone: ANALYTICS_TIME_ZONE },
    byType, timeouts, sessions: sessionRows[0]?.count || 0, firstCapturedAt: firstCaptured._min.occurredAt, daily, recent,
    popularServices: serviceGroups.map((x) => ({ ...services.find((s) => s.id === x.serviceId), count: x._count._all })).filter((x) => x.id),
    popularCategories: categoryGroups.map((x) => ({ ...categories.find((c) => c.id === x.categoryId), count: x._count._all })).filter((x) => x.id),
    popularSearches: searchGroups.map((x) => ({ query: x.searchQuery, count: x._count._all })),
  });
});

export const auditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const where = req.query.action ? { action: req.query.action } : {};
  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ where, include: { adminUser: { select: { id: true, login: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.auditLog.count({ where }),
  ]);
  const data = rows.map(({ oldData, newData, ...item }) => {
    const object = newData || oldData || {};
    const objectName = object.titleRu || object.fullName || object.organizationNameRu || object.login || null;
    return { ...item, objectName };
  });
  sendData(res, data, { page, limit, total, pages: Math.ceil(total / limit) });
});
