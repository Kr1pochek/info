import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const requireFromServer = createRequire(path.resolve('server/package.json'));
const { parse: parseEnv } = requireFromServer('dotenv');
const seedEnvironment = parseEnv(fs.readFileSync(path.resolve('server/.env')));
Object.assign(process.env, seedEnvironment, { NODE_ENV: 'production' });

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
const [servicesResponse, newsResponse] = await Promise.all([
  fetch(`${baseUrl}/api/services?limit=100`),
  fetch(`${baseUrl}/api/news?limit=100`),
]);
assert.equal(servicesResponse.status, 200, 'Services API failed');
assert.equal(newsResponse.status, 200, 'News API failed');
const serviceCandidate = (await servicesResponse.json()).data.find((item) => Array.from(item.titleKz).length >= 8);
const newsCandidate = (await newsResponse.json()).data.find((item) => Array.from(item.titleKz).length >= 8);
assert.ok(serviceCandidate && newsCandidate, 'Search suggestion fixtures are missing');

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
const routes = ['/kiosk', '/packages', '/package/progress', '/information/taxpayer-rights', '/information/ethics-officer', '/news', '/admin/login'];

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

  const voiceContext = await browser.newContext({ viewport: { width: viewports[0].width, height: viewports[0].height } });
  const comparisonPages = [
    { slug: 'matched-voices', audioCount: 3 },
    { slug: 'elevenlabs-voices', audioCount: 3 },
    { slug: 'elevenlabs-kazakh-variants', audioCount: 5 },
  ];
  for (const { slug: comparisonPage, audioCount } of comparisonPages) {
    const voicePage = await voiceContext.newPage();
    const voiceResponse = await voicePage.goto(`${baseUrl}/audio/seo/${comparisonPage}/index.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(voiceResponse?.status(), 200, `${comparisonPage}: HTTP status`);
    assert.equal(await voicePage.locator('audio').count(), audioCount, `${comparisonPage}: voice comparison is incomplete`);
    for (const viewport of viewports) {
      await voicePage.setViewportSize({ width: viewport.width, height: viewport.height });
      const voiceLayout = await voicePage.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: document.documentElement.clientWidth }));
      assert.ok(voiceLayout.bodyWidth <= voiceLayout.viewportWidth + 2, `${viewport.name}: ${comparisonPage} has horizontal overflow`);
    }
    await voicePage.close();
  }
  await voiceContext.close();

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
  try {
    await adminPage.getByRole('heading', { name: 'Эфир баптаулары' }).waitFor({ timeout: 15000 });
  } catch (error) {
    const pageState = (await adminPage.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);
    throw new Error(`Broadcast admin did not load at ${adminPage.url()}: ${pageState}`, { cause: error });
  }
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
