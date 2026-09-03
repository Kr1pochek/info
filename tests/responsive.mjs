import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const requireFromServer = createRequire(path.resolve('server/package.json'));
const { parse: parseEnv } = requireFromServer('dotenv');
const seedEnvironment = parseEnv(fs.readFileSync(path.resolve('server/.env')));
Object.assign(process.env, seedEnvironment, { NODE_ENV: 'test', SERVE_CLIENT_DIST: 'true' });

const candidates = [
  process.env.CHROME_PATH,
  path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
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
const [servicesResponse, newsResponse, categoriesResponse] = await Promise.all([
  fetch(`${baseUrl}/api/services?limit=100`),
  fetch(`${baseUrl}/api/news?limit=100`),
  fetch(`${baseUrl}/api/categories?limit=100`),
]);
assert.equal(servicesResponse.status, 200, 'Services API failed');
assert.equal(newsResponse.status, 200, 'News API failed');
assert.equal(categoriesResponse.status, 200, 'Categories API failed');
const services = (await servicesResponse.json()).data;
const news = (await newsResponse.json()).data;
const categories = (await categoriesResponse.json()).data;
const serviceCandidate = services.find((item) => Array.from(item.titleKz).length >= 8);
const newsCandidate = news.find((item) => Array.from(item.titleKz).length >= 8);
const categoryCandidate = categories.find((item) => item.slug);
assert.ok(serviceCandidate && newsCandidate && categoryCandidate, 'User journey fixtures are missing');

function removeMiddleCharacter(value) {
  const words = value.split(/\s+/);
  const index = words.reduce((best, word, current) => Array.from(word).length > Array.from(words[best]).length ? current : best, 0);
  const characters = Array.from(words[index]);
  characters.splice(Math.floor(characters.length / 2), 1);
  words[index] = characters.join('');
  return words.join(' ');
}

const misspelledServiceTitle = removeMiddleCharacter(serviceCandidate.titleKz);
const misspelledNewsTitle = removeMiddleCharacter(newsCandidate.titleKz);
const browser = await chromium.launch({ executablePath, headless: true });
assert.ok(seedEnvironment.SEED_ADMIN_LOGIN && seedEnvironment.SEED_ADMIN_PASSWORD, 'В server/.env нужны тестовые данные администратора');

const viewports = [
  { name: 'Full HD', width: 1920, height: 1080, deviceScaleFactor: 1 },
  { name: 'Full HD portrait', width: 1080, height: 1920, deviceScaleFactor: 1 },
  { name: 'QHD 125%', width: 2048, height: 1152, deviceScaleFactor: 1.25 },
  { name: '4K 150%', width: 2560, height: 1440, deviceScaleFactor: 1.5 },
];
const routes = ['/kiosk', '/packages', '/package/progress', '/information/taxpayer-rights', '/information/ethics-fire-safety', '/qr-tavojnya', '/news', '/admin/login'];
const publicPageRoutes = [
  '/', '/kiosk', '/services', '/packages', '/package/progress',
  `/category/${categoryCandidate.slug}`, `/service/${serviceCandidate.slug}`,
  '/faq', '/qr-tavojnya', '/information/taxpayer-rights', '/information/ethics-fire-safety', '/information/reception-schedule',
  '/news', `/news/${newsCandidate.slug}`, '/missing-page-user-check',
];
const adminPageRoutes = [
  '/admin', '/admin/services', '/admin/categories', '/admin/packages', '/admin/news', '/admin/broadcast',
  '/admin/analytics', '/admin/users', '/admin/reception/schedule', '/admin/reception/qr', '/admin/settings', '/admin/ethics', '/admin/fire-safety', '/admin/audit-logs', '/admin/guide',
];

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
      if (route === '/kiosk') {
        const serviceSearch = page.locator('#service-search');
        assert.equal(await serviceSearch.count(), 1, `${viewport.name}: service search is missing: ${layout.text.slice(0, 400)}`);
        await serviceSearch.click();
        assert.equal(await page.locator('.virtual-keyboard').count(), 1, `${viewport.name}: service keyboard did not open`);
        await serviceSearch.pressSequentially(misspelledServiceTitle);
        await page.locator('.virtual-keyboard__done').click();
        const serviceSuggestion = page.locator('.search-suggestions__options button').first();
        await serviceSuggestion.waitFor({ timeout: 10000 });
        await serviceSuggestion.click();
        await page.locator('.service-grid .service-card').first().waitFor({ timeout: 10000 });
      }
      if (route === '/news') {
        const broadcastVisible = await page.locator('.broadcast-progress').count();
        assert.equal(broadcastVisible, 1, `${viewport.name}: broadcast did not load at ${page.url()}: ${layout.text.slice(0, 240)}`);
        const slideControls = page.locator('.broadcast-slide-controls button');
        assert.equal(await slideControls.count(), 2, `${viewport.name}: manual slide controls are missing`);
        const slideNumberBefore = await page.locator('.broadcast-corner strong').innerText();
        await slideControls.last().click();
        const slideNumberAfter = await page.locator('.broadcast-corner strong').innerText();
        assert.notEqual(slideNumberAfter, slideNumberBefore, `${viewport.name}: next slide button did not change the slide`);
        const animations = await page.evaluate(() => ({
          progress: getComputedStyle(document.querySelector('.broadcast-progress')).animationName,
          ticker: getComputedStyle(document.querySelector('.broadcast-ticker p')).animationName,
        }));
        assert.notEqual(animations.progress, 'none', `${viewport.name}: progress animation is disabled`);
        assert.notEqual(animations.ticker, 'none', `${viewport.name}: ticker animation is disabled`);
        assert.equal(await page.locator('.news-accessibility-float, .news-accessibility-button').count(), 0, `${viewport.name}: news accessibility control must be hidden`);
        await page.locator('.broadcast-open-button').click();
        const newsSearch = page.locator('.news-search input');
        await newsSearch.waitFor();
        assert.equal(await page.locator('.news-footer a[href="/admin/login"]').count(), 0, `${viewport.name}: administrator link is still visible in news`);
        assert.ok((await page.locator('.news-footer').innerText()).trim().length > 20, `${viewport.name}: news footer inscription is missing`);
        assert.equal(await newsSearch.getAttribute('inputmode'), 'none', `${viewport.name}: native keyboard is not suppressed`);
        await newsSearch.click();
        const virtualKeyboard = page.locator('.virtual-keyboard');
        assert.equal(await virtualKeyboard.count(), 1, `${viewport.name}: news keyboard did not open`);
        const firstKey = page.locator('.virtual-keyboard__key').first();
        const firstCharacter = await firstKey.textContent();
        await firstKey.click();
        assert.equal(await newsSearch.inputValue(), firstCharacter, `${viewport.name}: news keyboard did not enter text`);
        await page.locator('.virtual-keyboard__done').click();
        assert.equal(await virtualKeyboard.count(), 0, `${viewport.name}: news keyboard did not close`);
        await newsSearch.click();
        assert.equal(await virtualKeyboard.count(), 1, `${viewport.name}: news keyboard did not reopen`);
        await page.locator('.virtual-keyboard__actions button').first().click();
        assert.equal(await newsSearch.inputValue(), '', `${viewport.name}: news keyboard did not clear text`);
        await page.locator('.virtual-keyboard__done').click();
        await newsSearch.pressSequentially(misspelledNewsTitle);
        const newsSuggestion = page.locator('.search-suggestions__options button').first();
        await newsSuggestion.waitFor({ timeout: 10000 });
        await newsSuggestion.click();
        await page.locator('.featured-news').waitFor({ timeout: 10000 });
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

  const publicContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  for (const route of publicPageRoutes) {
    const page = await publicContext.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.equal(response?.status(), 200, `Public journey ${route}: HTTP status`);
    await page.waitForTimeout(700);
    if (route === '/') assert.match(page.url(), /\/kiosk$/, 'Root route did not redirect to the kiosk');
    const state = await page.evaluate(() => ({
      text: document.body.innerText.trim(),
      bodyWidth: document.body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    assert.ok(state.text.length > 20, `Public journey ${route}: empty page`);
    assert.ok(state.bodyWidth <= state.viewportWidth + 2, `Public journey ${route}: horizontal overflow ${state.bodyWidth}/${state.viewportWidth}`);
    assert.equal(errors.length, 0, `Public journey ${route}: ${errors.join('; ')}`);
    if (route === '/information/reception-schedule') {
      const tabs = page.locator('.reception-slides-nav button');
      assert.equal(await tabs.count(), 3, 'Reception page should have schedule, district QR and customs QR tabs');
      await tabs.nth(2).click();
      await page.locator('#customs-qr .district-qr-card--customs').first().waitFor({ timeout: 5000 });
      assert.equal(await page.locator('#customs-qr .district-qr-card--customs img').count(), 3, 'Customs QR cards are missing');
      await page.waitForFunction(() => [...document.querySelectorAll('#customs-qr img')].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 5000 });
    }
    await page.close();
  }
  await publicContext.close();

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
  assert.equal(await adminPage.locator('.admin-brand strong').innerText(), 'Контент орталығы', 'Kazakh admin brand is missing');
  assert.equal(await adminPage.locator('.admin-nav-group__heading').getByText('Инфокиоск', { exact: true }).count(), 1, 'Kiosk workspace navigation was not localized');
  assert.equal(await adminPage.locator('.admin-nav-group__heading').getByText('Жаңалықтар таспасы', { exact: true }).count(), 1, 'News workspace navigation was not localized');

  for (const route of adminPageRoutes) {
    const response = await adminPage.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.equal(response?.status(), 200, `Admin journey ${route}: HTTP status`);
    await adminPage.locator('.admin-main').waitFor({ timeout: 15000 });
    await adminPage.waitForTimeout(500);
    assert.ok((await adminPage.locator('.admin-main').innerText()).trim().length > 20, `Admin journey ${route}: empty page`);
    assert.ok(!adminPage.url().endsWith('/admin/login'), `Admin journey ${route}: session was lost`);
  }

  await adminPage.goto(`${baseUrl}/admin/fire-safety`, { waitUntil: 'domcontentloaded' });
  await adminPage.getByRole('heading', { name: 'Өрт қауіпсіздігі', exact: true }).waitFor({ timeout: 15000 });
  assert.ok(await adminPage.locator('.safety-rules-editor .settings-repeat-card').count() >= 5, 'Editable fire safety rules are missing');
  const safetyGroupButton = adminPage.locator('.admin-nav-group__heading').filter({ hasText: 'Әдеп және өрт қауіпсіздігі' });
  const newsGroupButton = adminPage.locator('.admin-nav-group__heading').filter({ hasText: 'Жаңалықтар таспасы' });
  assert.equal(await safetyGroupButton.getAttribute('aria-expanded'), 'true', 'Active safety navigation group is collapsed');
  await newsGroupButton.click();
  assert.equal(await newsGroupButton.getAttribute('aria-expanded'), 'true', 'News navigation group did not expand');
  assert.equal(await safetyGroupButton.getAttribute('aria-expanded'), 'false', 'Previous navigation group did not collapse');

  await adminPage.goto(`${baseUrl}/admin/guide`, { waitUntil: 'domcontentloaded' });
  await adminPage.getByRole('heading', { name: 'Панельмен жұмыс істеуге арналған түсінікті нұсқаулық' }).waitFor({ timeout: 15000 });
  assert.ok(await adminPage.locator('.admin-guide-steps article').count() >= 40, 'The administrator guide is missing detailed steps');
  assert.equal(await adminPage.locator('.admin-guide-problems details').count(), 9, 'The administrator guide is missing troubleshooting entries');

  await adminPage.goto(`${baseUrl}/admin/broadcast`, { waitUntil: 'domcontentloaded' });
  try {
    await adminPage.getByRole('heading', { name: 'Эфир баптаулары' }).waitFor({ timeout: 15000 });
  } catch (error) {
    const pageState = (await adminPage.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);
    throw new Error(`Broadcast admin did not load at ${adminPage.url()}: ${pageState}`, { cause: error });
  }
  assert.equal(await adminPage.getByText(/^\d+ слайд ротацияда$/).count(), 1, 'Broadcast statistics were not localized');
  await adminPage.locator('.broadcast-header-actions .admin-button--primary').click();
  await adminPage.locator('.broadcast-media-library').waitFor({ timeout: 10000 });
  assert.equal(await adminPage.locator('.broadcast-media-library button').count(), 14, 'Default broadcast image group is incomplete');
  await adminPage.locator('.broadcast-type-switch button').first().click();
  assert.equal(await adminPage.locator('.broadcast-media-library button').count(), 12, 'Birthday image group is incomplete');
  assert.equal(await adminPage.locator('.broadcast-media-library button.is-selected').count(), 1, 'Birthday background is not selected by default');
  assert.match(await adminPage.locator('.broadcast-media-library button.is-selected img').getAttribute('src'), /birthday-cake\.png$/);
  await adminPage.goto(`${baseUrl}/admin/news`, { waitUntil: 'domcontentloaded' });
  await adminPage.locator('.admin-page-header .admin-button--primary').click();
  await adminPage.locator('.media-library-picker').waitFor({ timeout: 10000 });
  assert.equal(await adminPage.locator('.media-library-filters button').count(), 11, 'News image category filters are incomplete');
  await adminPage.locator('.media-library-filters button').first().click();
  assert.equal(await adminPage.locator('.broadcast-media-library button').count(), 100, 'Bundled news image library is incomplete');
  await adminPage.locator('.broadcast-media-library button').nth(1).click();
  assert.match(await adminPage.locator('.news-editor__image img').getAttribute('src'), /birthday-flowers\.png$/);
  assert.equal(adminErrors.length, 0, `Authenticated admin: ${adminErrors.join('; ')}`);
  await adminContext.close();
  console.log(`Responsive QA: ${viewports.length} kiosk viewports × ${routes.length} routes passed`);
  console.log(`Public user journey: ${publicPageRoutes.length} routes passed`);
  console.log(`Administrator journey: ${adminPageRoutes.length} protected routes passed`);
  console.log('Authenticated admin QA: Kazakh UI and API errors passed');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
