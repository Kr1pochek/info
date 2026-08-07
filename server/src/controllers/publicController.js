import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler, pagination, sendData } from '../utils/api.js';

const categorySelect = {
  id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true,
  icon: true, sortOrder: true, _count: { select: { services: { where: { isPublished: true } } } },
};
const serviceInclude = { category: { select: { id: true, slug: true, titleRu: true, titleKz: true } } };
const newsCategories = new Set(['GENERAL', 'IMPORTANT', 'ANNOUNCEMENT', 'EVENT']);
const exchangeRateCache = { data: null, expiresAt: 0 };

function xmlValue(xml, tag) {
  return xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim();
}

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

export const listNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const category = String(req.query.category || '').toUpperCase();
  const search = String(req.query.search || '').trim().slice(0, 100);
  const where = {
    published: true,
    publishedAt: { lte: new Date() },
    ...(newsCategories.has(category) ? { category } : {}),
    ...(search ? { OR: ['titleRu', 'titleKz', 'descriptionRu', 'descriptionKz', 'contentRu', 'contentKz'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.news.findMany({
      where,
      select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, image: true, category: true, publishedAt: true, createdAt: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.news.count({ where }),
  ]);
  sendData(res, data, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getNews = asyncHandler(async (req, res) => {
  const data = await prisma.news.findFirst({
    where: { slug: req.params.slug, published: true, publishedAt: { lte: new Date() } },
    select: { id: true, slug: true, titleRu: true, titleKz: true, descriptionRu: true, descriptionKz: true, contentRu: true, contentKz: true, image: true, category: true, publishedAt: true, createdAt: true, updatedAt: true },
  });
  if (!data) throw new AppError(404, 'NEWS_NOT_FOUND', 'Новость не найдена');
  sendData(res, data);
});

export const usdKztRate = asyncHandler(async (_req, res) => {
  const now = Date.now();
  if (exchangeRateCache.data && exchangeRateCache.expiresAt > now) return sendData(res, exchangeRateCache.data);

  try {
    const response = await fetch('https://nationalbank.kz/rss/rates_all.xml', {
      headers: { accept: 'application/xml,text/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`National Bank responded with ${response.status}`);
    const xml = await response.text();
    const item = xml.match(/<item>\s*<title>USD<\/title>[\s\S]*?<\/item>/)?.[0];
    if (!item) throw new Error('USD rate is missing');
    const rawDate = xmlValue(item, 'pubDate');
    const [day, month, year] = rawDate?.split('.') || [];
    const quantity = Number(xmlValue(item, 'quant')) || 1;
    const rate = Number(xmlValue(item, 'description')) / quantity;
    if (!Number.isFinite(rate)) throw new Error('USD rate is invalid');

    exchangeRateCache.data = {
      base: 'USD', quote: 'KZT', rate, quantity: 1,
      change: Number(xmlValue(item, 'change')) || 0,
      direction: xmlValue(item, 'index') || 'UNCHANGED',
      date: year && month && day ? `${year}-${month}-${day}` : new Date().toISOString().slice(0, 10),
      source: 'Национальный Банк Республики Казахстан',
      stale: false,
    };
    exchangeRateCache.expiresAt = now + 60 * 60 * 1000;
    sendData(res, exchangeRateCache.data);
  } catch (error) {
    if (exchangeRateCache.data) return sendData(res, { ...exchangeRateCache.data, stale: true });
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
