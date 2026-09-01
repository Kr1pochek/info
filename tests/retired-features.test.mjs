import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['client/src', 'server/src'];
const retiredRuntimePatterns = [
  /ELEVENLABS_API_KEY/i,
  /speechSynthesis|SpeechRecognition|webkitSpeechRecognition/,
  /announcementLanguage|announcementVolume|announcementRepeatSeconds/,
  /accessibleAudioEnabled|accessibleAudioVolume/,
  /queueNumber|ticketNumber|electronicQueue/i,
];

async function sourceFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relativePath);
    return /\.(?:js|jsx|mjs|json)$/.test(entry.name) ? [relativePath] : [];
  }));
  return nested.flat();
}

async function allFiles(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? allFiles(relativePath) : [relativePath];
  }));
  return nested.flat();
}

test('retired queue and voice integrations cannot return to runtime source', async () => {
  const files = (await Promise.all(sourceRoots.map(sourceFiles))).flat();
  const violations = [];
  for (const relativePath of files) {
    const content = await readFile(path.join(root, relativePath), 'utf8');
    for (const pattern of retiredRuntimePatterns) {
      if (pattern.test(content)) violations.push(`${relativePath}: ${pattern}`);
    }
  }
  assert.deepEqual(violations, []);
});

test('retired queue audio assets and generators are absent', async () => {
  const retiredDocuments = ['docs/TTS_GUIDE.md', 'docs/ELEVENLABS_VOICE.md', 'docs/NOMAD_INTEGRATION.md'];
  const existing = [];
  for (const relativePath of retiredDocuments) {
    try {
      await readFile(path.join(root, relativePath));
      existing.push(relativePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const directory of ['client/public/audio', 'scripts/tts']) {
    try {
      const files = await allFiles(directory);
      existing.push(...files.filter((file) => /\.(?:js|jsx|mjs|json|py|html|mp3|wav|ogg)$/i.test(file)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  assert.deepEqual(existing, []);
});
