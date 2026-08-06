import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler, pagination, sendData } from '../utils/api.js';

const categorySelect = {
  id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true,
  icon: true, sortOrder: true, _count: { select: { services: { where: { isPublished: true } } } },
};
const serviceInclude = { category: { select: { id: true, slug: true, titleRu: true, titleKz: true } } };

export const listCategories = asyncHandler(async (_req, res) => {
  const data = await prisma.category.findMany({ where: { isPublished: true }, select: categorySelect, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }] });
  sendData(res, data);
});

export const getCategory = asyncHandler(async (req, res) => {
  const data = await prisma.category.findFirst({
    where: { slug: req.params.slug, isPublished: true }, select: { ...categorySelect, services: { where: { isPublished: true }, include: serviceInclude, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }] } },
  });
  if (!data) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Категория не найдена');
  sendData(res, data);
});

export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const where = { isPublished: true, ...(req.query.category ? { category: { slug: req.query.category, isPublished: true } } : {}) };
  const [data, total] = await prisma.$transaction([
    prisma.service.findMany({ where, include: serviceInclude, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }], skip, take: limit }),
    prisma.service.count({ where }),
  ]);
  sendData(res, data, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const popularServices = asyncHandler(async (_req, res) => {
  const settings = await prisma.setting.findUnique({ where: { id: 1 }, select: { popularServicesCount: true } });
  const data = await prisma.service.findMany({ where: { isPublished: true, isPopular: true, category: { isPublished: true } }, include: serviceInclude, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }], take: settings?.popularServicesCount || 6 });
  sendData(res, data);
});

export const getService = asyncHandler(async (req, res) => {
  const data = await prisma.service.findFirst({ where: { slug: req.params.slug, isPublished: true, category: { isPublished: true } }, include: serviceInclude });
  if (!data) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Услуга не найдена');
  sendData(res, data);
});

export const searchServices = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const lang = req.query.lang === 'kz' ? 'kz' : 'ru';
  if (q.length < 2) return sendData(res, []);
  const fields = lang === 'kz'
    ? [{ titleKz: { contains: q, mode: 'insensitive' } }, { shortDescriptionKz: { contains: q, mode: 'insensitive' } }, { fullDescriptionKz: { contains: q, mode: 'insensitive' } }, { keywordsKz: { contains: q, mode: 'insensitive' } }, { category: { titleKz: { contains: q, mode: 'insensitive' } } }]
    : [{ titleRu: { contains: q, mode: 'insensitive' } }, { shortDescriptionRu: { contains: q, mode: 'insensitive' } }, { fullDescriptionRu: { contains: q, mode: 'insensitive' } }, { keywordsRu: { contains: q, mode: 'insensitive' } }, { category: { titleRu: { contains: q, mode: 'insensitive' } } }];
  const data = await prisma.service.findMany({ where: { isPublished: true, category: { isPublished: true }, OR: fields }, include: serviceInclude, orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }], take: 50 });
  sendData(res, data);
});

export const publicSettings = asyncHandler(async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!data) throw new AppError(503, 'SETTINGS_MISSING', 'Настройки системы недоступны');
  sendData(res, data);
});

export const createAnalyticsEvent = asyncHandler(async (req, res) => {
  const data = await prisma.analyticsEvent.create({ data: { ...req.body, searchQuery: req.body.searchQuery?.slice(0, 80) || null } });
  sendData(res, { id: data.id }, null, 201);
});
