import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { propertyTaxFaq } from '../client/src/data/propertyTaxFaq.js';

test('property tax FAQ contains all document questions in both languages', () => {
  assert.equal(propertyTaxFaq.length, 9);
  assert.equal(new Set(propertyTaxFaq.map((item) => item.id)).size, 9);
  for (const item of propertyTaxFaq) {
    assert.ok(item.questionRu?.length > 10);
    assert.ok(item.questionKz?.length > 10);
    assert.ok(item.answerRu?.length > 20);
    assert.ok(item.answerKz?.length > 20);
  }
  const exemptions = propertyTaxFaq.find((item) => item.id === 3);
  assert.equal(exemptions.detailsRu.length, 7);
  assert.equal(exemptions.detailsKz.length, 7);
});

test('FAQ is available from the kiosk home page and has its own route', async () => {
  const [app, home] = await Promise.all([
    readFile(new URL('../client/src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/kiosk/HomePage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /path="faq" element={<FaqPage \/>}/);
  assert.match(home, /to="\/faq"/);
});
