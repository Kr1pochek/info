import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { numberSegmentCatalog } from './number-segments.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const dockerfileDir = path.join(scriptDir, 'silero');
const outputDir = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'silero-kazakh');
const cacheDir = path.join(os.tmpdir(), 'info-kiosk-silero-cache');
const imageName = 'info-kiosk-silero-tts';
const finalMode = process.argv.includes('--final');
const packageRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo');
const packageManifest = JSON.parse(await readFile(path.join(packageRoot, 'voice-manifest.json'), 'utf8'));

await mkdir(outputDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });
await run('docker', ['build', '-t', imageName, dockerfileDir]);

const voices = [
  { id: 'kaz_zhadyra', name: 'Zhadyra', model: 'v5_cis_base_nostress', license: 'MIT', productionCandidate: true },
  { id: 'kaz_zhazira', name: 'Zhazira', model: 'v5_cis_base_nostress', license: 'MIT', productionCandidate: true },
  { id: 'kaz_aidana', name: 'Aidana', model: 'v5_cis_ext', license: 'CC-NC-BY', productionCandidate: false },
  { id: 'kaz_aisha', name: 'Aisha', model: 'v5_cis_ext', license: 'CC-NC-BY', productionCandidate: false },
  { id: 'kaz_danara', name: 'Danara', model: 'v5_cis_ext', license: 'CC-NC-BY', productionCandidate: false },
];
const sampleText = 'Ди төрт жүз жиырма сегіз нөмірлі қызмет алушы, сізді жақын арада шақырады. Күту аймағына өтіңіз.';

if (finalMode) {
  await generateFinalPackage();
} else {
  await generatePreviews();
}

async function generatePreviews() {
  await run('docker', [
    'run', '--rm',
    '-v', `${projectRoot}:/work`,
    '-v', `${cacheDir}:/cache`,
    imageName,
  ]);

  for (const voice of voices) {
    const speaker = voice.id;
    const rawPath = path.join(outputDir, `${speaker}.raw.wav`);
    const outputPath = path.join(outputDir, `${speaker}.mp3`);
    await run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', rawPath,
      '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', '24000', '-ac', '1',
      '-codec:a', 'libmp3lame', '-b:a', '128k', outputPath,
    ]);
    await rm(rawPath, { force: true });
  }

  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify({
    version: 1,
    provider: 'Silero TTS',
    language: 'kk-KZ',
    gender: 'female',
    sampleTicket: 'D-428',
    text: sampleText,
    voices,
  }, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputDir, 'index.html'), renderIndex(), 'utf8');
  console.log('Silero Kazakh voice previews generated successfully.');
}

async function generateFinalPackage() {
  const language = 'kk';
  const config = packageManifest.languages[language];
  if (config.provider !== 'silero-local') throw new Error('Kazakh provider must be silero-local');

  const descriptors = [
    ...config.parts.filter((part) => part.kind === 'static').map((part) => ({ relativePath: `static/${part.id}.wav`, text: part.text })),
    ...Object.entries(config.prefixes).map(([prefix, text]) => ({ relativePath: `prefixes/${prefix}.wav`, text })),
    ...numberSegmentCatalog(language).map(({ value, text }) => ({ relativePath: `numbers/${value}.wav`, text })),
  ];
  const finalRoot = path.join(packageRoot, packageManifest.templateCode.toLowerCase().replaceAll('_', '-'), language);
  const jobsFileName = 'info-kiosk-silero-final-jobs.json';
  const jobsPath = path.join(cacheDir, jobsFileName);
  const jobs = descriptors.map((job) => ({
    text: job.text,
    output: `/work/client/public/audio/seo/announce-soon/kk/${job.relativePath.replaceAll('\\', '/')}.source.wav`,
  }));
  await writeFile(jobsPath, `${JSON.stringify(jobs, null, 2)}\n`, 'utf8');

  try {
    await run('docker', [
      'run', '--rm',
      '-v', `${projectRoot}:/work`,
      '-v', `${cacheDir}:/cache`,
      imageName,
      '--jobs', `/cache/${jobsFileName}`,
      '--model', `${config.model}.pt`,
      '--voice', config.voice,
    ]);

    for (const job of descriptors) {
      const outputPath = path.join(finalRoot, job.relativePath);
      const rawPath = `${outputPath}.source.wav`;
      await mkdir(path.dirname(outputPath), { recursive: true });
      await run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-i', rawPath,
        '-af', 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.015:stop_periods=-1:stop_threshold=-50dB:stop_silence=0.015,loudnorm=I=-18:TP=-2:LRA=7',
        '-ar', '24000', '-ac', '1', outputPath,
      ]);
      await rm(rawPath, { force: true });
      console.log(`write\t${path.relative(projectRoot, outputPath)}`);
    }
  } finally {
    await rm(jobsPath, { force: true });
  }
  console.log(`Silero Kazakh final package generated with ${config.voice}.`);
}

function renderIndex() {
  const cards = voices.map((voice, index) => `
      <article>
        <h2>${index + 1}. ${voice.name}</h2>
        <p><code>${voice.id}</code> · ${voice.model}</p>
        <p class="license ${voice.productionCandidate ? 'ok' : 'warn'}">${voice.productionCandidate ? 'Можно рассматривать для проекта' : 'Только для сравнения до проверки лицензии'} · ${voice.license}</p>
        <audio controls preload="none" src="./${voice.id}.mp3"></audio>
      </article>`).join('');
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Казахские женские голоса Silero</title>
    <style>
      :root { font-family: Inter, Arial, sans-serif; color: #193743; background: #eef3f5; }
      body { max-width: 1000px; margin: 0 auto; padding: 36px 20px 60px; }
      .lead { color: #536d77; line-height: 1.55; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 14px; }
      article { padding: 18px; background: #fff; border: 1px solid #d7e2e6; border-radius: 14px; }
      h2 { margin: 0 0 8px; } code { word-break: break-word; } audio { width: 100%; margin-top: 8px; }
      .license { font-size: 13px; } .ok { color: #16734b; } .warn { color: #9a5b10; }
    </style>
  </head>
  <body>
    <h1>Казахские женские голоса — Silero TTS</h1>
    <p class="lead"><strong>Текст:</strong> ${sampleText}</p>
    <p class="lead">Это отдельные дикторы, а не изменения темпа Aigul.</p>
    <main class="grid">${cards}</main>
  </body>
</html>\n`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}
