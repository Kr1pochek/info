import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  announcementSegments,
  normalizeTicketNumber,
  numberSegmentCatalog,
  numberToSegmentValues,
  numberToWords,
  supportedLanguages,
} from '../scripts/tts/number-segments.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(projectRoot, 'client/public/audio/seo/voice-manifest.json'), 'utf8'));
const variantsManifest = JSON.parse(await readFile(path.join(projectRoot, 'client/public/audio/seo/voice-variants/manifest.json'), 'utf8'));
const matchedVoicesManifest = JSON.parse(await readFile(path.join(projectRoot, 'client/public/audio/seo/matched-voices/manifest.json'), 'utf8'));
const elevenLabsManifest = JSON.parse(await readFile(path.join(projectRoot, 'client/public/audio/seo/elevenlabs-voices/manifest.json'), 'utf8'));
const kazakhVariantsManifest = JSON.parse(await readFile(path.join(projectRoot, 'client/public/audio/seo/elevenlabs-kazakh-variants/manifest.json'), 'utf8'));

test('all supported languages cover every ticket number from 1 to 1000', () => {
  for (const language of supportedLanguages()) {
    for (let number = 1; number <= 1000; number += 1) {
      const segments = numberToSegmentValues(language, number);
      assert.ok(segments.length > 0, `${language} ${number}`);
      assert.equal(segments.reduce((sum, value) => sum + value, 0), number, `${language} ${number}`);
      assert.ok(numberToWords(language, number).length > 0, `${language} ${number}`);
    }
  }
});

test('representative compound numbers use the expected fragments', () => {
  assert.deepEqual(numberToSegmentValues('ru', 207), [200, 7]);
  assert.deepEqual(numberToSegmentValues('ru', 315), [300, 15]);
  assert.deepEqual(numberToSegmentValues('kk', 315), [300, 10, 5]);
  assert.deepEqual(numberToSegmentValues('en', 999), [900, 90, 9]);
  assert.equal(numberToWords('kk', 21), 'жиырма бір');
});

test('leading zeroes are omitted without changing the ticket value', () => {
  assert.equal(normalizeTicketNumber('015'), 15);
  assert.deepEqual(numberToSegmentValues('ru', '015'), [15]);
});

test('announcement order follows each language template', () => {
  assert.deepEqual(announcementSegments(manifest, 'ru', 'A', 207), [
    'static/before-number.wav', 'prefixes/A.wav', 'numbers/200.wav', 'numbers/7.wav', 'static/after-number.wav',
  ]);
  assert.deepEqual(announcementSegments(manifest, 'kk', 'B', 21), [
    'prefixes/B.wav', 'numbers/20.wav', 'numbers/1.wav', 'static/after-number.wav',
  ]);
});

test('invalid ticket identifiers are rejected', () => {
  assert.throws(() => normalizeTicketNumber(0));
  assert.throws(() => normalizeTicketNumber(1001));
  assert.throws(() => normalizeTicketNumber('12A'));
  assert.throws(() => announcementSegments(manifest, 'ru', 'E', 15));
});

test('generated package contains every declared audio segment', async () => {
  const templateRoot = path.join(projectRoot, 'client/public/audio/seo/announce-soon');
  const expectedFiles = [];
  for (const [language, config] of Object.entries(manifest.languages)) {
    for (const part of config.parts.filter((item) => item.kind === 'static')) {
      expectedFiles.push(path.join(templateRoot, language, 'static', `${part.id}.wav`));
    }
    for (const prefix of manifest.ticketPrefixes) {
      expectedFiles.push(path.join(templateRoot, language, 'prefixes', `${prefix}.wav`));
    }
    for (const { value } of numberSegmentCatalog(language)) {
      expectedFiles.push(path.join(templateRoot, language, 'numbers', `${value}.wav`));
    }
  }

  assert.equal(expectedFiles.length, 119);
  for (const filePath of expectedFiles) {
    const details = await stat(filePath);
    assert.ok(details.size > 44, path.relative(projectRoot, filePath));
  }
});

test('voice comparison package contains ten female variants per language', async () => {
  const allowedFemaleVoices = new Set([
    'de-DE-SeraphinaMultilingualNeural', 'en-US-AnaNeural', 'en-US-AriaNeural',
    'en-US-AvaNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaNeural',
    'en-US-EmmaMultilingualNeural', 'en-US-MichelleNeural',
    'fr-FR-VivienneMultilingualNeural', 'kaz_zhadyra', 'kaz_zhazira',
    'kaz_aidana', 'kaz_aisha', 'kaz_danara',
    'pt-BR-ThalitaMultilingualNeural',
  ]);
  assert.equal(variantsManifest.gender, 'female');
  for (const [language, config] of Object.entries(variantsManifest.languages)) {
    assert.equal(config.variants.length, 10, language);
    assert.deepEqual(config.variants.map((variant) => variant.id), ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
    for (const variant of config.variants) {
      assert.ok(allowedFemaleVoices.has(variant.voice), `${language} ${variant.voice}`);
      const details = await stat(path.join(projectRoot, 'client/public/audio/seo/voice-variants', language, `${variant.id}.mp3`));
      assert.ok(details.size > 1000, `${language}/${variant.id}.mp3`);
    }
  }
});

test('Kazakh final package uses Silero instead of Aigul', () => {
  assert.equal(manifest.languages.kk.provider, 'silero-local');
  assert.equal(manifest.languages.kk.model, 'v5_cis_base_nostress');
  assert.equal(manifest.languages.kk.voice, 'kaz_zhazira');
  assert.ok(variantsManifest.languages.kk.variants.every((variant) => variant.provider === 'silero-local'));
  assert.equal(new Set(variantsManifest.languages.kk.variants.map((variant) => variant.voice)).size, 5);
});

test('matched approval package contains one similar realistic voice per language', async () => {
  assert.deepEqual(Object.keys(matchedVoicesManifest.languages).sort(), ['en', 'kk', 'ru']);
  assert.equal(matchedVoicesManifest.provider, 'ElevenLabs');
  assert.equal(matchedVoicesManifest.model, 'eleven_v3');
  assert.deepEqual(
    new Set(Object.values(matchedVoicesManifest.languages).map((item) => item.voiceId)),
    new Set([matchedVoicesManifest.voice.id]),
  );
  assert.deepEqual(matchedVoicesManifest.audio, elevenLabsManifest.audio);

  for (const [language, config] of Object.entries(matchedVoicesManifest.languages)) {
    const details = await stat(path.join(projectRoot, 'client/public/audio/seo/matched-voices', config.file));
    assert.ok(details.size > 1000, `${language}/${config.file}`);
  }
});

test('ElevenLabs dry-run plans one v3 voice for Kazakh, Russian, and English', () => {
  const scriptPath = path.join(projectRoot, 'scripts/tts/generate-elevenlabs-voice-trio.mjs');
  const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.provider, 'ElevenLabs');
  assert.equal(plan.model, 'eleven_v3');
  assert.equal(plan.designModel, 'eleven_ttv_v3');
  assert.deepEqual(plan.samples.map((sample) => sample.language), ['kk', 'ru', 'en']);
  assert.equal(new Set(plan.samples.map(() => plan.voice)).size, 1);
});

test('ElevenLabs approval package uses one voice ID for all three languages', async () => {
  assert.equal(elevenLabsManifest.provider, 'ElevenLabs');
  assert.equal(elevenLabsManifest.model, 'eleven_v3');
  assert.deepEqual(Object.keys(elevenLabsManifest.languages), ['kk', 'ru', 'en']);
  assert.deepEqual(
    new Set(Object.values(elevenLabsManifest.languages).map((item) => item.voiceId)),
    new Set([elevenLabsManifest.voice.id]),
  );

  for (const config of Object.values(elevenLabsManifest.languages)) {
    const details = await stat(path.join(projectRoot, 'client/public/audio/seo/elevenlabs-voices', config.file));
    assert.ok(details.size > 1000, config.file);
  }
});

test('ElevenLabs Kazakh comparison contains five distinct female voices', async () => {
  assert.equal(kazakhVariantsManifest.language, 'kk');
  assert.equal(kazakhVariantsManifest.model, 'eleven_v3');
  assert.equal(kazakhVariantsManifest.variants.length, 5);
  assert.equal(new Set(kazakhVariantsManifest.variants.map((item) => item.voiceId)).size, 5);
  for (const variant of kazakhVariantsManifest.variants) {
    const details = await stat(path.join(projectRoot, 'client/public/audio/seo/elevenlabs-kazakh-variants', variant.file));
    assert.ok(details.size > 1000, variant.file);
  }
});
