import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const sourceRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'elevenlabs-voices');
const outputRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'matched-voices');
const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));

if (sourceManifest.provider !== 'ElevenLabs' || sourceManifest.model !== 'eleven_v3') {
  throw new Error('The ElevenLabs approval package is missing or has an unexpected format.');
}

await mkdir(outputRoot, { recursive: true });

const languages = {};
for (const language of ['kk', 'ru', 'en']) {
  const source = sourceManifest.languages[language];
  if (!source) throw new Error(`ElevenLabs language ${language} is missing.`);
  const sourcePath = path.join(sourceRoot, source.file);
  const outputPath = path.join(outputRoot, source.file);
  await access(sourcePath);
  await copyFile(sourcePath, outputPath);
  languages[language] = { ...source, provider: sourceManifest.provider, model: sourceManifest.model };
  console.log(`write\t${path.relative(projectRoot, outputPath)}\t${source.voiceName}`);
}

const manifest = {
  ...sourceManifest,
  version: 3,
  purpose: 'Approved realistic female ElevenLabs voice trio',
  selection: 'KZ, RU, and EN use the same ElevenLabs Sarah voice ID.',
  languages,
};

await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(path.join(outputRoot, 'index.html'), renderIndex(manifest), 'utf8');
console.log('Matched RU/KZ/EN page now uses the ElevenLabs voice trio.');

function renderIndex(config) {
  const cards = ['kk', 'ru', 'en'].map((language, index) => {
    const item = config.languages[language];
    return `<article>
      <div class="number">0${index + 1}</div>
      <div class="language">${escapeHtml(item.label)}</div>
      <h2>${escapeHtml(item.voiceName)}</h2>
      <p>${escapeHtml(item.text)}</p>
      <audio controls preload="metadata" src="./${escapeHtml(item.file)}?v=${config.version}-${escapeHtml(config.voice.id)}"></audio>
      <small>${escapeHtml(config.provider)} · ${escapeHtml(config.model)} · ${escapeHtml(item.languageCode)} · ${escapeHtml(item.voiceId)}</small>
    </article>`;
  }).join('');

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Голоса ElevenLabs KZ · RU · EN</title>
    <style>
      :root { color: #eaf3f5; background: #071d31; font-family: Inter, Arial, sans-serif; }
      * { box-sizing: border-box; }
      body { max-width: 1260px; margin: 0 auto; padding: 56px 24px 72px; }
      header { max-width: 820px; margin-bottom: 34px; }
      header span { color: #62d7d2; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
      h1 { margin: 12px 0 14px; font-size: clamp(36px, 5vw, 64px); line-height: 1; letter-spacing: -.05em; }
      header p { margin: 0; color: #abc0cc; font-size: 17px; line-height: 1.6; }
      main { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      article { min-width: 0; padding: 24px; background: #0d2d45; border: 1px solid #31536a; border-radius: 18px; box-shadow: 0 18px 45px rgba(0, 8, 16, .22); }
      .number { color: #6c8999; font-size: 12px; font-weight: 800; letter-spacing: .1em; }
      .language { width: max-content; margin-top: 20px; padding: 6px 10px; color: #06283f; background: #62d7d2; border-radius: 99px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
      h2 { margin: 16px 0 12px; color: #fff; font-size: 20px; word-break: break-word; }
      article p { min-height: 116px; color: #c4d4dc; line-height: 1.58; }
      audio { width: 100%; margin-top: 8px; }
      small { display: block; margin-top: 14px; color: #7f9aaa; line-height: 1.45; overflow-wrap: anywhere; }
      footer { margin-top: 24px; padding: 18px 20px; color: #a9bdc8; background: rgba(98, 215, 210, .08); border-left: 3px solid #62d7d2; border-radius: 0 12px 12px 0; line-height: 1.55; }
      @media (max-width: 820px) { main { grid-template-columns: 1fr; } article p { min-height: 0; } }
    </style>
  </head>
  <body>
    <header><span>Электронная очередь · D-428</span><h1>Один голос на трёх языках</h1><p>Новые образцы ElevenLabs: казахский, русский и английский озвучены одним женским голосом Sarah и используют единый voice_id.</p></header>
    <main>${cards}</main>
    <footer>Все образцы: MP3, 24 кГц, mono, 128 кбит/с, целевая громкость −18 LUFS.</footer>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
