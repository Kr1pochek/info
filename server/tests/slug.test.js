import assert from 'node:assert/strict';
import test from 'node:test';
import { createUniqueSlug, slugify } from '../src/utils/slug.js';

test('slugify transliterates Russian and Kazakh titles', () => {
  assert.equal(slugify('Получение справки о доходах'), 'poluchenie-spravki-o-dohodah');
  assert.equal(slugify('Мүлік салығы туралы анықтама'), 'mulik-salygy-turaly-anyqtama');
});

test('createUniqueSlug adds a numeric suffix for duplicates', async () => {
  const existing = new Set(['novaya-usluga', 'novaya-usluga-2']);
  const delegate = { findUnique: async ({ where }) => existing.has(where.slug) ? { id: 1 } : null };
  assert.equal(await createUniqueSlug(delegate, 'Новая услуга'), 'novaya-usluga-3');
});
