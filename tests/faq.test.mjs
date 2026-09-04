import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { propertyTaxFaq } from '../client/src/data/propertyTaxFaq.js';
import { defaultCustomsQrCodes } from '../client/src/data/receptionContent.js';

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

test('reception page contains editable customs QR defaults', async () => {
  const [app, home, page] = await Promise.all([
    readFile(new URL('../client/src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/kiosk/HomePage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../client/src/pages/kiosk/InformationPage.jsx', import.meta.url), 'utf8'),
  ]);
  assert.equal(defaultCustomsQrCodes.length, 3);
  assert.deepEqual(defaultCustomsQrCodes.map((item) => item.id), ['almaty-cto', 'almaly-cto', 'zhetysu-customs']);
  const almaty = defaultCustomsQrCodes.find((item) => item.id === 'almaty-cto');
  const almaly = defaultCustomsQrCodes.find((item) => item.id === 'almaly-cto');
  assert.equal(almaly.targetUrl, almaty.targetUrl);
  assert.equal(almaly.image, almaty.image);
  assert.equal(almaly.addressRu, almaty.addressRu);
  for (const item of defaultCustomsQrCodes) {
    assert.match(item.targetUrl, /^https:\/\/2gis\.kz\/almaty\//);
    assert.match(item.image, /^\/qr\/customs\/.+\.png$/);
  }
  assert.match(app, /path="qr-tavojnya" element={<Navigate to="\/information\/reception-schedule" replace \/>}/);
  assert.match(home, /to="\/information\/reception-schedule"/);
  assert.match(page, /settings\?\.customsQrCodes/);
  assert.match(page, /customsQrCodes\.map/);
});
