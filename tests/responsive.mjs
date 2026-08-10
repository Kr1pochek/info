import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

process.env.NODE_ENV = 'production';

const candidates = [
  path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
].filter(Boolean);
const executablePath = candidates.find((item) => fs.existsSync(item));
assert.ok(executablePath, 'Для responsive-теста нужен установленный Chrome или Edge');
assert.ok(fs.existsSync(path.resolve('client/dist/index.html')), 'Сначала выполните npm run build');

const { app } = await import('../server/src/app.js');
const { prisma } = await import('../server/src/config/prisma.js');
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const broadcastResponse = await fetch(`${baseUrl}/api/broadcast`);
assert.equal(broadcastResponse.status, 200, `Broadcast API failed: ${await broadcastResponse.text()}`);
const browser = await chromium.launch({ executablePath, headless: true });

const viewports = [
  { name: 'Full HD', width: 1920, height: 1080, deviceScaleFactor: 1 },
  { name: 'QHD 125%', width: 2048, height: 1152, deviceScaleFactor: 1.25 },
  { name: '4K 150%', width: 2560, height: 1440, deviceScaleFactor: 1.5 },
];
const routes = ['/kiosk', '/packages', '/package/progress', '/news', '/admin/login'];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor });
    for (const route of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(response?.status(), 200, `${viewport.name} ${route}: HTTP status`);
      await page.waitForTimeout(1200);
      const layout = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        text: document.body.innerText,
      }));
      assert.ok(layout.text.trim().length > 20, `${viewport.name} ${route}: empty page`);
      assert.ok(layout.bodyWidth <= layout.viewportWidth + 2, `${viewport.name} ${route}: horizontal overflow ${layout.bodyWidth}/${layout.viewportWidth}`);
      assert.equal(pageErrors.length, 0, `${viewport.name} ${route}: ${pageErrors.join('; ')}`);
      if (route === '/news') {
        const broadcastVisible = await page.locator('.broadcast-progress').count();
        assert.equal(broadcastVisible, 1, `${viewport.name}: broadcast did not load at ${page.url()}: ${layout.text.slice(0, 240)}`);
        const animations = await page.evaluate(() => ({
          progress: getComputedStyle(document.querySelector('.broadcast-progress')).animationName,
          ticker: getComputedStyle(document.querySelector('.broadcast-ticker p')).animationName,
        }));
        assert.notEqual(animations.progress, 'none', `${viewport.name}: progress animation is disabled`);
        assert.notEqual(animations.ticker, 'none', `${viewport.name}: ticker animation is disabled`);
      }
      await page.close();
    }
    await context.close();
  }
  console.log(`Responsive QA: ${viewports.length} kiosk viewports × ${routes.length} routes passed`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
