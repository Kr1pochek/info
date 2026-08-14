import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
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
const requireFromServer = createRequire(path.resolve('server/package.json'));
const { parse: parseEnv } = requireFromServer('dotenv');
const seedEnvironment = parseEnv(fs.readFileSync(path.resolve('server/.env')));
assert.ok(seedEnvironment.SEED_ADMIN_LOGIN && seedEnvironment.SEED_ADMIN_PASSWORD, 'В server/.env нужны тестовые данные администратора');

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
        const accessibility = page.locator('.news-accessibility-float');
        assert.equal(await accessibility.count(), 1, `${viewport.name}: news accessibility control is missing`);
        await accessibility.click();
        assert.equal(await page.locator('.news-broadcast-entry.vision-mode').count(), 1, `${viewport.name}: news high-contrast mode did not activate`);
        assert.equal(await accessibility.getAttribute('aria-pressed'), 'true', `${viewport.name}: accessibility state is not announced`);
        const contrast = await page.evaluate(() => ({
          background: getComputedStyle(document.querySelector('.broadcast-screen')).backgroundColor,
          tickerColor: getComputedStyle(document.querySelector('.broadcast-ticker p')).color,
        }));
        assert.equal(contrast.background, 'rgb(0, 0, 0)', `${viewport.name}: broadcast background is not high contrast`);
        assert.equal(contrast.tickerColor, 'rgb(255, 229, 0)', `${viewport.name}: ticker is not high contrast`);
      }
      if (route === '/admin/login') {
        const languageSwitch = page.locator('.login-language-switch');
        assert.equal(await languageSwitch.count(), 1, `${viewport.name}: admin language switch is missing`);
        const titleBefore = await page.locator('.login-panel__intro h1').innerText();
        await languageSwitch.click();
        const titleAfter = await page.locator('.login-panel__intro h1').innerText();
        assert.notEqual(titleAfter, titleBefore, `${viewport.name}: admin language did not change`);
      }
      await page.close();
    }
    await context.close();
  }

  const adminContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const adminPage = await adminContext.newPage();
  const adminErrors = [];
  adminPage.on('pageerror', (error) => adminErrors.push(error.message));
  await adminPage.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' });
  const loginLanguageSwitch = adminPage.locator('.login-language-switch');
  if ((await loginLanguageSwitch.innerText()).includes('Қазақша')) await loginLanguageSwitch.click();
  await adminPage.locator('input[autocomplete="username"]').fill('__invalid_admin__');
  await adminPage.locator('input[autocomplete="current-password"]').fill('incorrect-password');
  await adminPage.locator('.login-form .admin-button').click();
  await adminPage.locator('.form-error').waitFor();
  assert.match(await adminPage.locator('.form-error').innerText(), /Логин немесе құпиясөз қате/, 'Admin API error was not localized');

  await adminPage.locator('input[autocomplete="username"]').fill(seedEnvironment.SEED_ADMIN_LOGIN);
  await adminPage.locator('input[autocomplete="current-password"]').fill(seedEnvironment.SEED_ADMIN_PASSWORD);
  await adminPage.locator('.login-form .admin-button').click();
  await adminPage.waitForURL(/\/admin\/?$/, { timeout: 15000 });
  assert.equal(await adminPage.locator('.admin-brand > span').innerText(), 'МКД', 'Kazakh admin brand is missing');
  assert.equal(await adminPage.getByText('Баптаулар', { exact: true }).count(), 1, 'Authenticated navigation was not localized');

  await adminPage.goto(`${baseUrl}/admin/settings`, { waitUntil: 'domcontentloaded' });
  await adminPage.getByRole('heading', { name: 'Электрондық кезекті дыбыстау' }).waitFor();
  assert.equal(await adminPage.getByText('Дыбыстау тілі', { exact: true }).count(), 1, 'Audio language control is missing');
  assert.equal(await adminPage.getByText('Қайталаулар аралығы, секунд', { exact: true }).count(), 1, 'Audio repeat control is missing');
  assert.equal(await adminPage.getByText('Жоғары дыбыс деңгейі, %', { exact: true }).count(), 1, 'Accessible audio volume is missing');

  await adminPage.goto(`${baseUrl}/admin/broadcast`, { waitUntil: 'domcontentloaded' });
  await adminPage.getByRole('heading', { name: 'Эфир баптаулары' }).waitFor();
  assert.equal(await adminPage.getByText(/^\d+ слайд ротацияда$/).count(), 1, 'Broadcast statistics were not localized');
  assert.equal(adminErrors.length, 0, `Authenticated admin: ${adminErrors.join('; ')}`);
  await adminContext.close();
  console.log(`Responsive QA: ${viewports.length} kiosk viewports × ${routes.length} routes passed`);
  console.log('Authenticated admin QA: Kazakh UI, API errors and audio settings passed');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
