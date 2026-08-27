import { prisma } from '../config/prisma.js';
import { getNewsInformer } from '../services/newsInformerService.js';
import { AppError, asyncHandler, pagination, sendData } from '../utils/api.js';

const categorySelect = {
  id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true,
  icon: true, sortOrder: true, _count: { select: { services: { where: { isPublished: true } } } },
};
const serviceInclude = { category: { select: { id: true, slug: true, titleRu: true, titleKz: true } } };
const newsCategories = new Set(['GENERAL', 'IMPORTANT', 'ANNOUNCEMENT', 'EVENT']);

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

export const listServicePackages = asyncHandler(async (_req, res) => {
  const data = await prisma.servicePackage.findMany({
    where: { isPublished: true },
    select: { id: true, slug: true, titleRu: true, titleKz: true, targetAudienceRu: true, targetAudienceKz: true, descriptionRu: true, descriptionKz: true, serviceZoneRu: true, serviceZoneKz: true, noteRu: true, noteKz: true, icon: true, sortOrder: true, _count: { select: { services: { where: { isPublished: true } } } } },
    orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }],
  });
  sendData(res, data);
});

export const getServicePackage = asyncHandler(async (req, res) => {
  const data = await prisma.servicePackage.findFirst({
    where: { slug: req.params.slug, isPublished: true },
    include: { services: { where: { isPublished: true, category: { isPublished: true } }, include: serviceInclude, orderBy: [{ sortOrder: 'asc' }, { titleRu: 'asc' }] } },
  });
  if (!data) throw new AppError(404, 'SERVICE_PACKAGE_NOT_FOUND', 'Пакет обслуживания не найден');
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

export const listNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const category = String(req.query.category || '').toUpperCase();
  const search = String(req.query.search || '').trim().slice(0, 100);
  const now = new Date();
  const where = {
    published: true,
    publishedAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    ...(newsCategories.has(category) ? { category } : {}),
    ...(search ? { AND: [{ OR: ['titleRu', 'titleKz', 'descriptionRu', 'descriptionKz', 'contentRu', 'contentKz'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) }] } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.news.findMany({
      where,
      select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, image: true, category: true, isPriority: true, publishedAt: true, expiresAt: true, sortOrder: true, createdAt: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.news.count({ where }),
  ]);
  sendData(res, data, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getNews = asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await prisma.news.findFirst({
    where: { slug: req.params.slug, published: true, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, contentRu: true, contentKz: true, image: true, category: true, isPriority: true, publishedAt: true, expiresAt: true, sortOrder: true, createdAt: true, updatedAt: true },
  });
  if (!data) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  sendData(res, data);
});

export const listPriorityNews = asyncHandler(async (_req, res) => {
  const now = new Date();
  const data = await prisma.news.findMany({
    where: { isPriority: true, published: true, publishedAt: { lte: now }, expiresAt: { gt: now } },
    select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, image: true, category: true, isPriority: true, publishedAt: true, expiresAt: true, createdAt: true, updatedAt: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 5,
  });
  sendData(res, data);
});

export const getBroadcast = asyncHandler(async (_req, res) => {
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [settings, news, items] = await Promise.all([
    prisma.setting.findUnique({ where: { id: 1 }, select: {
      tickerTextRu: true, tickerTextKz: true, broadcastSlideSeconds: true, broadcastLanguageSeconds: true, broadcastIdleSeconds: true,
      panelQrCodes: true, onlineSpecialists: true,
    } }),
    prisma.news.findMany({
      where: { published: true, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, contentRu: true, contentKz: true, image: true, category: true, isPriority: true, publishedAt: true, expiresAt: true, sortOrder: true, createdAt: true, updatedAt: true },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.broadcastItem.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
  ]);
  const birthdays = items.filter((item) => item.type === 'BIRTHDAY' && item.eventDate && `${String(item.eventDate.getUTCMonth() + 1).padStart(2, '0')}-${String(item.eventDate.getUTCDate()).padStart(2, '0')}` === today)
    .map((item) => ({ ...item, id: `birthday-${item.id}`, kind: 'BIRTHDAY', eventDate: undefined, authorId: undefined }));
  const media = items.filter((item) => item.type === 'VIDEO' && item.mediaUrl)
    .map((item) => ({ ...item, id: `media-${item.id}`, kind: item.mediaKind === 'IMAGE' ? 'IMAGE' : 'VIDEO', eventDate: undefined, authorId: undefined }));
  const newsSlides = news.map((item) => ({ ...item, id: `news-${item.id}`, kind: 'NEWS' }));
  const slides = [...birthdays, ...media, ...newsSlides].sort((left, right) => left.sortOrder - right.sortOrder);
  sendData(res, { settings, slides });
});

export const newsInformer = asyncHandler(async (_req, res) => {
  try {
    sendData(res, await getNewsInformer());
  } catch (error) {
    throw new AppError(503, 'NEWS_INFORMER_UNAVAILABLE', 'Курсы валют и погода временно недоступны', error.message);
  }
});

export const usdKztRate = asyncHandler(async (_req, res) => {
  try {
    const informer = await getNewsInformer();
    const usd = informer.rates.find((item) => item.code === 'USD');
    if (!usd) throw new Error('USD rate is missing');
    sendData(res, { base: 'USD', quote: 'KZT', quantity: 1, ...usd, source: informer.source.rates, stale: informer.stale });
  } catch (error) {
    throw new AppError(503, 'EXCHANGE_RATE_UNAVAILABLE', 'Курс валют временно недоступен', error.message);
  }
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
