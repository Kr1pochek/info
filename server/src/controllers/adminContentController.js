import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler, pagination, sendData } from '../utils/api.js';
import { writeAudit } from '../services/audit.js';

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
  const data = await prisma.service.create({ data: req.body, include: { category: true } });
  await writeAudit(req, 'CREATE_SERVICE', 'Service', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateService = asyncHandler(async (req, res) => {
  const oldData = await prisma.service.findUnique({ where: { id: Number(req.params.id) } });
  if (!oldData) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Услуга не найдена');
  const data = await prisma.service.update({ where: { id: oldData.id }, data: req.body, include: { category: true } });
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
  const data = await prisma.category.create({ data: req.body });
  await writeAudit(req, 'CREATE_CATEGORY', 'Category', data.id, null, data);
  sendData(res, data, null, 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const oldData = await prisma.category.findUnique({ where: { id: Number(req.params.id) } });
  if (!oldData) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Категория не найдена');
  const data = await prisma.category.update({ where: { id: oldData.id }, data: req.body });
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
