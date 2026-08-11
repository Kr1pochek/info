import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const variantsRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'voice-variants');
const manifest = JSON.parse(await readFile(path.join(variantsRoot, 'manifest.json'), 'utf8'));
const force = process.argv.includes('--force');
const selectedLanguage = valueAfter('--language');
const concurrency = Number(valueAfter('--concurrency') || 3);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6) throw new Error('--concurrency must be between 1 and 6');
if (selectedLanguage && !manifest.languages[selectedLanguage]) throw new Error(`Unsupported language: ${selectedLanguage}`);

await run('ffmpeg', ['-version']);
try {
  await run('py', ['-m', 'edge_tts', '--version']);
} catch {
  throw new Error('edge-tts is required. Run: npm run tts:install');
}

const jobs = Object.entries(manifest.languages)
  .filter(([language]) => !selectedLanguage || language === selectedLanguage)
  .flatMap(([language, config]) => config.variants.map((variant) => ({
  language,
  text: config.text,
  ...variant,
  outputPath: path.join(variantsRoot, language, `${variant.id}.mp3`),
})));
console.log(`Generating ${jobs.length} female voice variants...`);
await runPool(jobs, concurrency, generate);
await writeFile(path.join(variantsRoot, 'index.html'), renderIndex(manifest), 'utf8');
console.log('Voice variants generated successfully.');

async function generate(job) {
  if (!force && await exists(job.outputPath)) {
    console.log(`skip\t${job.language}/${job.id}.mp3`);
    return;
  }
  await mkdir(path.dirname(job.outputPath), { recursive: true });
  const sourcePath = `${job.outputPath}.source.mp3`;
  try {
    await run('py', ['-m', 'edge_tts', '--voice', job.voice, `--rate=${job.rate}`, '--volume=+0%', `--pitch=${job.pitch}`, '--text', job.text, '--write-media', sourcePath]);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', sourcePath, '-af', `loudnorm=I=${manifest.audio.loudnessLufs}:TP=${manifest.audio.truePeakDb}:LRA=7`, '-ar', String(manifest.audio.sampleRateHz), '-ac', String(manifest.audio.channels), '-codec:a', 'libmp3lame', '-b:a', '128k', job.outputPath]);
    console.log(`write\t${job.language}/${job.id}.mp3\t${job.voice}`);
  } finally {
    await rm(sourcePath, { force: true });
  }
}

async function runPool(items, size, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  }));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}: ${stderr}`)));
  });
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function renderIndex(config) {
  const sections = Object.entries(config.languages).map(([language, languageConfig]) => {
    const cards = languageConfig.variants.map((variant) => `
      <article>
        <h3>Вариант ${escapeHtml(variant.id)}</h3>
        <small>${escapeHtml(variant.voice)}<br>${escapeHtml(variant.profile)}, rate ${escapeHtml(variant.rate)}, pitch ${escapeHtml(variant.pitch)}</small>
        <audio controls preload="none" src="./${escapeHtml(language)}/${escapeHtml(variant.id)}.mp3"></audio>
      </article>`).join('');
    return `<section>
      <h2>${escapeHtml(languageConfig.label)}</h2>
      <p class="sample"><strong>Текст:</strong> ${escapeHtml(languageConfig.text)}</p>
      <div class="grid">${cards}</div>
    </section>`;
  }).join('');

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Выбор женских голосов СЭО</title>
    <style>
      :root { font-family: Inter, Arial, sans-serif; color: #193743; background: #eef3f5; }
      body { max-width: 1180px; margin: 0 auto; padding: 36px 20px 60px; }
      h1 { margin-bottom: 8px; } .lead { color: #647d87; margin: 0 0 30px; }
      section { margin-top: 34px; } .sample { color: #3e5963; line-height: 1.5; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
      article { padding: 18px; background: #fff; border: 1px solid #d7e2e6; border-radius: 14px; box-shadow: 0 6px 20px rgba(25,55,67,.06); }
      h3 { margin: 0 0 6px; } small { display: block; min-height: 36px; color: #6c8189; word-break: break-word; }
      audio { width: 100%; margin-top: 12px; }
    </style>
  </head>
  <body>
    <h1>30 женских вариантов</h1>
    <p class="lead">По 10 вариантов на каждый язык. Во всех записях используется талон D-428.</p>
    <main>${sections}</main>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
