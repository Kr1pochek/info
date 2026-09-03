import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler, pagination, sendData } from '../utils/api.js';
import { writeAudit } from '../services/audit.js';
import { createUniqueSlug } from '../utils/slug.js';

const orderFields = new Set(['createdAt', 'updatedAt', 'titleRu', 'sortOrder', 'isPublished']);
function listOptions(query, searchable) {
  const { page, limit, skip } = pagination(query);
  const search = String(query.search || '').trim().slice(0, 100);
  const sort = orderFields.has(query.sort) ? query.sort : 'updatedAt';
  const direction = query.direction === 'asc' ? 'asc' : 'desc';
  const where = {
    ...(query.published === 'true' ? { isPublished: true } : query.published === 'false' ? { isPublished: false } : {}),
    ...(search ? { OR: searchable.map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
  };
  return { page, limit, skip, where, orderBy: { [sort]: direction } };
}

export const listAdminServices = asyncHandler(async (req, res) => {
  const options = listOptions(req.query, ['titleRu', 'titleKz', 'slug', 'keywordsRu', 'keywordsKz']);
  if (req.query.categoryId) options.where.categoryId = Number(req.query.categoryId);
  const [data, total] = await prisma.$transaction([
    prisma.service.findMany({ where: options.where, include: { category: { select: { id: true, titleRu: true, titleKz: true } } }, orderBy: options.orderBy, skip: options.skip, take: options.limit }),
    prisma.service.count({ where: options.where }),
  ]);
  sendData(res, data, { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) });
});

export const getAdminService = asyncHandler(async (req, res) => {
  const data = await prisma.service.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } });
  if (!data) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Услуга не найдена');
  sendData(res, data);
});

export const createService = asyncHandler(async (req, res) => {
  const input = { ...req.body };
  if (!input.slug) input.slug = await createUniqueSlug(prisma.service, input.titleRu || input.titleKz, 140);
  const data = await prisma.service.create({ data: input, include: { category: true } });
  await writeAudit(req, 'CREATE_SERVICE', 'Service', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateService = asyncHandler(async (req, res) => {
  const oldData = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
  if (!oldData) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Услуга не найдена');
  const changes = { ...req.body }; delete changes.slug;
  const data = await prisma.service.update({ where: { id: oldData.id }, data: changes, include: { category: true } });
  await writeAudit(req, 'UPDATE_SERVICE', 'Service', data.id, oldData, data);
  sendData(res, data);
});

export const deleteService = asyncHandler(async (req, res) => {
  const oldData = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
  if (!oldData) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Услуга не найдена');
  await prisma.service.delete({ where: { id: oldData.id } });
  await writeAudit(req, 'DELETE_SERVICE', 'Service', oldData.id, oldData);
  sendData(res, { deleted: true });
});

export const listAdminCategories = asyncHandler(async (req, res) => {
  const options = listOptions(req.query, ['titleRu', 'titleKz', 'slug']);
  const [data, total] = await prisma.$transaction([
    prisma.category.findMany({ where: options.where, include: { _count: { select: { services: true } } }, orderBy: options.orderBy, skip: options.skip, take: options.limit }),
    prisma.category.count({ where: options.where }),
  ]);
  sendData(res, data, { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) });
});

export const getAdminCategory = asyncHandler(async (req, res) => {
  const data = await prisma.category.findUnique({ where: { id: Number(req.params.id) }, include: { _count: { select: { services: true } } } });
  if (!data) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Категория не найдена');
  sendData(res, data);
});

export const createCategory = asyncHandler(async (req, res) => {
  const input = { ...req.body };
  if (!input.slug) input.slug = await createUniqueSlug(prisma.category, input.titleRu || input.titleKz, 120);
  const data = await prisma.category.create({ data: input });
  await writeAudit(req, 'CREATE_CATEGORY', 'Category', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const oldData = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
  if (!oldData) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Категория не найдена');
  const changes = { ...req.body }; delete changes.slug;
  const data = await prisma.category.update({ where: { id: oldData.id }, data: changes });
  await writeAudit(req, 'UPDATE_CATEGORY', 'Category', data.id, oldData, data);
  sendData(res, data);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { services: true } } } });
  if (!oldData) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Категория не найдена');
  if (oldData._count.services > 0) throw new AppError(409, 'CATEGORY_NOT_EMPTY', 'Сначала перенесите или удалите услуги этой категории');
  await prisma.category.delete({ where: { id } });
  await writeAudit(req, 'DELETE_CATEGORY', 'Category', id, oldData);
  sendData(res, { deleted: true });
});

const packageInclude = {
  services: { select: { id: true, slug: true, titleRu: true, titleKz: true, isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }] },
  _count: { select: { services: true } },
};

export const listAdminServicePackages = asyncHandler(async (req, res) => {
  const options = listOptions(req.query, ['titleRu', 'titleKz', 'slug', 'targetAudienceRu', 'targetAudienceKz']);
  const [data, total] = await prisma.$transaction([
    prisma.servicePackage.findMany({ where: options.where, include: packageInclude, orderBy: options.orderBy, skip: options.skip, take: options.limit }),
    prisma.servicePackage.count({ where: options.where }),
  ]);
  sendData(res, data, { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) });
});

export const getAdminServicePackage = asyncHandler(async (req, res) => {
  const data = await prisma.servicePackage.findUnique({ where: { id: Number(req.params.id) }, include: packageInclude });
  if (!data) throw new AppError(404, 'SERVICE_PACKAGE_NOT_FOUND', 'Пакет обслуживания не найден');
  sendData(res, data);
});

function packageData(body, relationOperation = 'set') {
  const { serviceIds, ...data } = body;
  if (serviceIds !== undefined) data.services = { [relationOperation]: serviceIds.map((id) => ({ id })) };
  return data;
}

export const createServicePackage = asyncHandler(async (req, res) => {
  const input = packageData(req.body, 'connect');
  if (!input.slug) input.slug = await createUniqueSlug(prisma.servicePackage, input.titleRu || input.titleKz, 120);
  const data = await prisma.servicePackage.create({ data: input, include: packageInclude });
  await writeAudit(req, 'CREATE_SERVICE_PACKAGE', 'ServicePackage', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateServicePackage = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.servicePackage.findUnique({ where: { id }, include: packageInclude });
  if (!oldData) throw new AppError(404, 'SERVICE_PACKAGE_NOT_FOUND', 'Пакет обслуживания не найден');
  const changes = packageData(req.body); delete changes.slug;
  const data = await prisma.servicePackage.update({ where: { id }, data: changes, include: packageInclude });
  await writeAudit(req, 'UPDATE_SERVICE_PACKAGE', 'ServicePackage', data.id, oldData, data);
  sendData(res, data);
});

export const deleteServicePackage = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.servicePackage.findUnique({ where: { id }, include: packageInclude });
  if (!oldData) throw new AppError(404, 'SERVICE_PACKAGE_NOT_FOUND', 'Пакет обслуживания не найден');
  await prisma.servicePackage.delete({ where: { id } });
  await writeAudit(req, 'DELETE_SERVICE_PACKAGE', 'ServicePackage', id, oldData);
  sendData(res, { deleted: true });
});

const newsOrderFields = new Set(['createdAt', 'updatedAt', 'publishedAt', 'expiresAt', 'sortOrder', 'titleRu', 'titleKz', 'published', 'isPriority']);

export const listAdminNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = String(req.query.search || '').trim().slice(0, 100);
  const sort = newsOrderFields.has(req.query.sort) ? req.query.sort : 'updatedAt';
  const direction = req.query.direction === 'asc' ? 'asc' : 'desc';
  const now = new Date();
  const where = {
    ...(req.query.publication === 'scheduled' ? { published: true, publishedAt: { gt: now } }
      : req.query.publication === 'live' ? { published: true, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
        : req.query.publication === 'expired' ? { published: true, expiresAt: { lte: now } }
        : req.query.publication === 'draft' ? { published: false }
          : req.query.published === 'true' ? { published: true }
            : req.query.published === 'false' ? { published: false } : {}),
    ...(['GENERAL', 'IMPORTANT', 'ANNOUNCEMENT', 'EVENT'].includes(req.query.category) ? { category: req.query.category } : {}),
    ...(req.query.priority === 'true' ? { isPriority: true } : req.query.priority === 'false' ? { isPriority: false } : {}),
    ...(search ? { AND: [{ OR: ['titleRu', 'titleKz', 'descriptionRu', 'descriptionKz', 'slug'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) }] } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.news.findMany({
      where,
      include: { author: { select: { id: true, fullName: true, login: true } } },
      orderBy: { [sort]: direction },
      skip,
      take: limit,
    }),
    prisma.news.count({ where }),
  ]);
  sendData(res, data, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getAdminNews = asyncHandler(async (req, res) => {
  const data = await prisma.news.findUnique({
    where: { id: Number(req.params.id) },
    include: { author: { select: { id: true, fullName: true, login: true } } },
  });
  if (!data) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  sendData(res, data);
});

export const saveNewsImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Выберите изображение для загрузки');
  sendData(res, { path: `/uploads/news/${req.file.filename}` }, null, 201);
});

export const createNews = asyncHandler(async (req, res) => {
  const { publishedAt, expiresAt, ...input } = req.body;
  if (!input.slug) input.slug = await createUniqueSlug(prisma.news, input.titleRu || input.titleKz, 180);
  if (input.isPriority) {
    input.showInBroadcast = false;
    input.sortOrder = 0;
  }
  const publicationDate = req.body.published ? publishedAt ? new Date(publishedAt) : new Date() : null;
  const expirationDate = expiresAt ? new Date(expiresAt) : null;
  if (input.isPriority && req.body.published && !expirationDate) {
    throw new AppError(400, 'PRIORITY_NEWS_PERIOD_REQUIRED', 'Для приоритетной новости укажите время окончания показа');
  }
  if (publicationDate && expirationDate && expirationDate <= publicationDate) {
    throw new AppError(400, 'INVALID_NEWS_PERIOD', 'Дата окончания должна быть позже даты публикации');
  }
  const data = await prisma.news.create({
    data: {
      ...input,
      authorId: req.user.id,
      publishedAt: publicationDate,
      expiresAt: expirationDate,
    },
  });
  await writeAudit(req, 'CREATE_NEWS', 'News', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateNews = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.news.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  const changes = { ...req.body };
  delete changes.slug;
  const hasPublishedAt = Object.hasOwn(changes, 'publishedAt');
  if (changes.published === true) changes.publishedAt = hasPublishedAt ? changes.publishedAt ? new Date(changes.publishedAt) : new Date() : oldData.published ? oldData.publishedAt || new Date() : new Date();
  if (changes.published === false) changes.publishedAt = null;
  if (changes.published === undefined && changes.publishedAt) changes.publishedAt = new Date(changes.publishedAt);
  if (Object.hasOwn(changes, 'expiresAt')) changes.expiresAt = changes.expiresAt ? new Date(changes.expiresAt) : null;
  const resultingPublishedAt = changes.publishedAt === undefined ? oldData.publishedAt : changes.publishedAt;
  const resultingExpiresAt = changes.expiresAt === undefined ? oldData.expiresAt : changes.expiresAt;
  const resultingPublished = changes.published === undefined ? oldData.published : changes.published;
  const resultingPriority = changes.isPriority === undefined ? oldData.isPriority : changes.isPriority;
  if (resultingPriority) {
    changes.showInBroadcast = false;
    changes.sortOrder = 0;
  }
  if (resultingPriority && resultingPublished && !resultingExpiresAt) {
    throw new AppError(400, 'PRIORITY_NEWS_PERIOD_REQUIRED', 'Для приоритетной новости укажите время окончания показа');
  }
  if (resultingPublishedAt && resultingExpiresAt && resultingExpiresAt <= resultingPublishedAt) {
    throw new AppError(400, 'INVALID_NEWS_PERIOD', 'Дата окончания должна быть позже даты публикации');
  }
  const data = await prisma.news.update({ where: { id }, data: changes });
  await writeAudit(req, 'UPDATE_NEWS', 'News', data.id, oldData, data);
  sendData(res, data);
});

export const updateNewsPublication = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.news.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  if (req.body.published && oldData.isPriority && (!oldData.expiresAt || oldData.expiresAt <= new Date())) {
    throw new AppError(400, 'PRIORITY_NEWS_PERIOD_REQUIRED', 'Сначала укажите новый период показа приоритетной новости');
  }
  const data = await prisma.news.update({
    where: { id },
    data: {
      published: req.body.published,
      publishedAt: req.body.published ? req.body.publishedAt ? new Date(req.body.publishedAt) : new Date() : null,
      ...(req.body.published && oldData.expiresAt && oldData.expiresAt <= new Date() ? { expiresAt: null } : {}),
    },
  });
  await writeAudit(req, req.body.published ? 'PUBLISH_NEWS' : 'UNPUBLISH_NEWS', 'News', data.id, oldData, data);
  sendData(res, data);
});

export const deleteNews = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.news.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  await prisma.news.delete({ where: { id } });
  await writeAudit(req, 'DELETE_NEWS', 'News', id, oldData);
  sendData(res, { deleted: true });
});

export const listBroadcastItems = asyncHandler(async (_req, res) => {
  const data = await prisma.broadcastItem.findMany({
    include: { author: { select: { id: true, fullName: true, login: true } } },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  sendData(res, data);
});

export const saveBroadcastMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'MEDIA_REQUIRED', 'Выберите фото или видео для загрузки');
  sendData(res, { path: `/uploads/broadcast/${req.file.filename}`, mediaKind: req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO' }, null, 201);
});

export const saveReceptionQrImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Выберите изображение QR-кода');
  sendData(res, { path: `/uploads/reception/${req.file.filename}` }, null, 201);
});

function broadcastData(body, authorId) {
  return {
    ...body,
    authorId,
    eventDate: body.type === 'BIRTHDAY' && body.eventDate ? new Date(`${body.eventDate}T00:00:00.000Z`) : null,
    mediaUrl: body.type === 'VIDEO' ? body.mediaUrl : null,
    mediaKind: body.type === 'VIDEO' ? body.mediaKind || 'VIDEO' : null,
  };
}

export const createBroadcastItem = asyncHandler(async (req, res) => {
  const data = await prisma.broadcastItem.create({ data: broadcastData(req.body, req.user.id) });
  await writeAudit(req, 'CREATE_BROADCAST_ITEM', 'BroadcastItem', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateBroadcastItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.broadcastItem.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'BROADCAST_ITEM_NOT_FOUND', 'Элемент эфира не найден');
  const data = await prisma.broadcastItem.update({ where: { id }, data: broadcastData(req.body, oldData.authorId) });
  await writeAudit(req, 'UPDATE_BROADCAST_ITEM', 'BroadcastItem', id, oldData, data);
  sendData(res, data);
});

export const deleteBroadcastItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const oldData = await prisma.broadcastItem.findUnique({ where: { id } });
  if (!oldData) throw new AppError(404, 'BROADCAST_ITEM_NOT_FOUND', 'Элемент эфира не найден');
  await prisma.broadcastItem.delete({ where: { id } });
  await writeAudit(req, 'DELETE_BROADCAST_ITEM', 'BroadcastItem', id, oldData);
  sendData(res, { deleted: true });
});

export const getBroadcastSettings = asyncHandler(async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: 1 }, select: { tickerTextRu: true, tickerTextKz: true, broadcastSlideSeconds: true, broadcastLanguageSeconds: true, broadcastIdleSeconds: true } });
  sendData(res, data);
});

export const updateBroadcastSettings = asyncHandler(async (req, res) => {
  const oldData = await prisma.setting.findUnique({ where: { id: 1 } });
  const data = await prisma.setting.update({ where: { id: 1 }, data: req.body });
  await writeAudit(req, 'UPDATE_BROADCAST_SETTINGS', 'Setting', 1, oldData, data);
  sendData(res, data);
});
