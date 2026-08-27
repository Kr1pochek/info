import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test('health endpoint confirms database connection', async () => {
  const { response, body } = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal(body.data.database, 'connected');
  assert.match(response.headers.get('x-request-id'), /^[a-f0-9-]{36}$/);
});

test('live and ready health probes expose separate process and database status', async () => {
  const [live, ready] = await Promise.all([request('/api/health/live'), request('/api/health/ready')]);
  assert.equal(live.response.status, 200);
  assert.equal(live.body.data.service, 'available');
  assert.equal(ready.response.status, 200);
  assert.equal(ready.body.data.database, 'connected');
});

test('public settings expose configurable queue announcement parameters', async () => {
  const { response, body } = await request('/api/settings/public');
  assert.equal(response.status, 200);
  assert.ok(['ru', 'kz'].includes(body.data.announcementLanguage));
  assert.ok(Number.isInteger(body.data.announcementVolume) && body.data.announcementVolume >= 0 && body.data.announcementVolume <= 100);
  assert.ok(Number.isInteger(body.data.announcementRepeatSeconds) && body.data.announcementRepeatSeconds >= 1);
  assert.equal(typeof body.data.accessibleAudioEnabled, 'boolean');
  assert.ok(Number.isInteger(body.data.accessibleAudioVolume) && body.data.accessibleAudioVolume >= 0 && body.data.accessibleAudioVolume <= 100);
  assert.match(body.data.taxpayerRightsRu, /статье 36/i);
  assert.match(body.data.taxpayerRightsKz, /36-бабы/i);
  assert.match(body.data.ethicsOfficerContactsRu, /267-69-55/);
  assert.match(body.data.ethicsOfficerContactsKz, /267-69-55/);
});

test('super administrator can update and restore queue announcement parameters', async () => {
  const admin = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } });
  assert.ok(admin);
  const token = jwt.sign({ sub: String(admin.id) }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const current = await request('/api/admin/settings', { headers });
  assert.equal(current.response.status, 200);
  const { id, updatedAt, ...original } = current.body.data;
  const changed = {
    ...original,
    announcementLanguage: original.announcementLanguage === 'ru' ? 'kz' : 'ru',
    announcementVolume: original.announcementVolume === 74 ? 75 : 74,
    announcementRepeatSeconds: original.announcementRepeatSeconds === 9 ? 8 : 9,
    accessibleAudioEnabled: !original.accessibleAudioEnabled,
    accessibleAudioVolume: original.accessibleAudioVolume === 99 ? 100 : 99,
  };
  try {
    const updated = await request('/api/admin/settings', { method: 'PATCH', headers, body: JSON.stringify(changed) });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.announcementLanguage, changed.announcementLanguage);
    assert.equal(updated.body.data.announcementVolume, changed.announcementVolume);
    assert.equal(updated.body.data.announcementRepeatSeconds, changed.announcementRepeatSeconds);
    assert.equal(updated.body.data.accessibleAudioEnabled, changed.accessibleAudioEnabled);
    assert.equal(updated.body.data.accessibleAudioVolume, changed.accessibleAudioVolume);
  } finally {
    const restored = await request('/api/admin/settings', { method: 'PATCH', headers, body: JSON.stringify(original) });
    assert.equal(restored.response.status, 200);
  }
});

test('catalog exposes all 41 complete DGD services for the 2026 stand', async () => {
  const { response, body } = await request('/api/services?limit=100');
  assert.equal(response.status, 200);
  assert.equal(body.meta.total, 41);
  assert.equal(body.data.length, 41);
  assert.ok(body.data.some((item) => item.slug === 'petroleum-product-pin-code'));
  assert.ok(body.data.every((item) => !['tax-debt-information', 'withdraw-tax-reporting'].includes(item.slug)));
  for (const item of body.data) {
    assert.ok(item.titleRu && item.titleKz && item.fullDescriptionRu && item.fullDescriptionKz);
    assert.ok(Array.isArray(item.requiredDocumentsRu) && Array.isArray(item.requiredDocumentsKz));
    assert.ok(Array.isArray(item.stepsRu) && Array.isArray(item.stepsKz));
    assert.ok(item.category?.id && item.category?.titleRu && item.category?.titleKz);
  }
});

test('administrator catalog contains only the 41 current services', async () => {
  const admin = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } });
  assert.ok(admin);
  const token = jwt.sign({ sub: String(admin.id) }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
  const { response, body } = await request('/api/admin/services?limit=100', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.equal(body.meta.total, 41);
  assert.equal(body.data.length, 41);
});

test('catalog exposes five categories and five published service packages', async () => {
  const [categories, packages] = await Promise.all([request('/api/categories'), request('/api/service-packages')]);
  assert.equal(categories.response.status, 200);
  assert.equal(categories.body.data.length, 5);
  assert.equal(packages.response.status, 200);
  assert.equal(packages.body.data.length, 5);
  assert.deepEqual(packages.body.data.map((item) => item.slug), ['start', 'profi', 'progress', 'social', 'balapan']);
});

test('progress package contains all services and honorary package is hidden', async () => {
  const [progress, honorary] = await Promise.all([request('/api/service-packages/progress'), request('/api/service-packages/honorary')]);
  assert.equal(progress.body.data.services.length, 41);
  assert.equal(honorary.response.status, 404);
  assert.equal(honorary.body.error.code, 'SERVICE_PACKAGE_NOT_FOUND');
});

test('Russian service search returns matching results', async () => {
  const { response, body } = await request(`/api/services/search?q=${encodeURIComponent('налог')}&lang=ru`);
  assert.equal(response.status, 200);
  assert.ok(body.data.length > 0);
});

test('editor can manage news but cannot access service administration', async () => {
  const login = `test-editor-${Date.now()}`;
  const editor = await prisma.adminUser.create({ data: { login, passwordHash: 'not-used-in-test', fullName: 'Test Editor', role: 'EDITOR' } });
  try {
    const token = jwt.sign({ sub: String(editor.id) }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
    const headers = { Authorization: `Bearer ${token}` };
    const news = await request('/api/admin/news?limit=1', { headers });
    const services = await request('/api/admin/services?limit=1', { headers });
    const dashboard = await request('/api/admin/dashboard', { headers });
    assert.equal(news.response.status, 200);
    assert.equal(services.response.status, 403);
    assert.equal(dashboard.response.status, 403);
  } finally {
    await prisma.adminUser.delete({ where: { id: editor.id } });
  }
});

test('priority news requires an end time and is exposed for modal display', async () => {
  const admin = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } });
  assert.ok(admin);
  const token = jwt.sign({ sub: String(admin.id) }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const suffix = Date.now();
  const publicationDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const expirationDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const common = {
    titleRu: 'Проверка приоритетной новости', titleKz: 'Басым жаңалықты тексеру',
    descriptionRu: 'Описание тестовой новости', descriptionKz: 'Сынақ жаңалығының сипаттамасы',
    contentRu: 'Полный текст тестовой новости', contentKz: 'Сынақ жаңалығының толық мәтіні',
    image: '', category: 'IMPORTANT', published: true,
    publishedAt: publicationDate, sortOrder: 9999,
  };

  const invalid = await request('/api/admin/news', { method: 'POST', headers, body: JSON.stringify({ ...common, slug: `priority-missing-period-${suffix}`, isPriority: true }) });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, 'PRIORITY_NEWS_PERIOD_REQUIRED');

  const slugs = [`ordinary-order-test-${suffix}`, `priority-order-test-${suffix}`];
  try {
    const ordinary = await request('/api/admin/news', { method: 'POST', headers, body: JSON.stringify({ ...common, slug: slugs[0], category: 'GENERAL', isPriority: false }) });
    const priority = await request('/api/admin/news', { method: 'POST', headers, body: JSON.stringify({ ...common, slug: slugs[1], isPriority: true, expiresAt: expirationDate }) });
    assert.equal(ordinary.response.status, 201);
    assert.equal(priority.response.status, 201);
    assert.equal(priority.body.data.image, '');

    const [modal, feed, broadcast] = await Promise.all([request('/api/news/priority'), request('/api/news?limit=100'), request('/api/broadcast')]);
    assert.equal(modal.response.status, 200);
    assert.ok(modal.body.data.some((item) => item.slug === slugs[1]));
    assert.ok(!modal.body.data.some((item) => item.slug === slugs[0]));
    assert.ok(feed.body.data.some((item) => item.slug === slugs[0]));
    assert.ok(feed.body.data.some((item) => item.slug === slugs[1]));
    const prioritySlide = broadcast.body.data.slides.find((item) => item.id === `news-${priority.body.data.id}`);
    assert.equal(prioritySlide?.isPriority, true);
  } finally {
    await prisma.news.deleteMany({ where: { slug: { in: slugs } } });
  }
});

test('administrator can create, update and delete a service package', async () => {
  const admin = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } });
  const serviceRows = await prisma.service.findMany({ take: 2, orderBy: { id: 'asc' }, select: { id: true } });
  assert.ok(admin && serviceRows.length === 2);
  const slug = `test-package-${Date.now()}`;
  const token = jwt.sign({ sub: String(admin.id) }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    const created = await request('/api/admin/service-packages', { method: 'POST', headers, body: JSON.stringify({
      slug, titleRu: 'Тестовый пакет', titleKz: 'Сынақ пакеті', targetAudienceRu: 'Тестовая аудитория', targetAudienceKz: 'Сынақ аудиториясы',
      descriptionRu: 'Проверка создания пакета.', descriptionKz: 'Пакет жасауды тексеру.', serviceZoneRu: 'Тестовая зона', serviceZoneKz: 'Сынақ аймағы',
      noteRu: null, noteKz: null, icon: 'Package', isPublished: false, sortOrder: 9999, serviceIds: serviceRows.map((item) => item.id),
    }) });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.data.services.length, 2);
    const updated = await request(`/api/admin/service-packages/${created.body.data.id}`, { method: 'PATCH', headers, body: JSON.stringify({ titleRu: 'Обновлённый тестовый пакет', serviceIds: [serviceRows[0].id] }) });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.services.length, 1);
    const removed = await request(`/api/admin/service-packages/${created.body.data.id}`, { method: 'DELETE', headers });
    assert.equal(removed.response.status, 200);
  } finally {
    await prisma.servicePackage.deleteMany({ where: { slug } });
  }
});
