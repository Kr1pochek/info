import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { numberSegmentCatalog, supportedLanguages } from './number-segments.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const packageRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo');
const manifestPath = path.join(packageRoot, 'voice-manifest.json');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');
const selectedLanguage = valueAfter('--language');
const concurrency = Number(valueAfter('--concurrency') || 3);

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
  throw new Error('--concurrency must be an integer between 1 and 8');
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const languages = selectedLanguage ? [selectedLanguage] : supportedLanguages();
for (const language of languages) {
  if (!manifest.languages[language]) throw new Error(`Unsupported language: ${language}`);
}

const jobs = languages.flatMap((language) => buildJobs(language, manifest.languages[language]));
console.log(`${dryRun ? 'Dry run:' : 'Generation:'} ${jobs.length} audio segments (${languages.join(', ')})`);

if (dryRun) {
  for (const job of jobs) console.log(`${job.language}\t${job.relativePath}\t${job.text}`);
  process.exit(0);
}

if (jobs.some((job) => job.provider === 'openai') && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Set it in the current shell and run the command again.');
}

await ensureGenerator(jobs);
await runPool(jobs.filter((job) => job.provider !== 'silero-local'), concurrency, generateJob);
for (const language of languages.filter((item) => manifest.languages[item].provider === 'silero-local')) {
  if (language !== 'kk') throw new Error(`Silero generation is not configured for language: ${language}`);
  await run(process.execPath, [path.join(scriptDir, 'generate-silero-kazakh.mjs'), '--final']);
}
await writeFile(path.join(packageRoot, 'generation-summary.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  provider: 'mixed',
  model: 'per-language',
  languages: Object.fromEntries(supportedLanguages().map((language) => [language, {
    provider: manifest.languages[language].provider || manifest.provider,
    model: manifest.languages[language].model || manifest.model,
    voice: manifest.languages[language].voice,
    segmentCount: buildJobs(language, manifest.languages[language]).length,
  }])),
  audio: manifest.audio,
}, null, 2)}\n`, 'utf8');
console.log('TTS package generated successfully.');

function buildJobs(language, config) {
  const staticJobs = config.parts
    .filter((part) => part.kind === 'static')
    .map((part) => createJob(language, config, `static/${part.id}.wav`, part.text, 'phrase fragment'));
  const prefixJobs = Object.entries(config.prefixes)
    .map(([prefix, text]) => createJob(language, config, `prefixes/${prefix}.wav`, text, 'ticket prefix'));
  const numberJobs = numberSegmentCatalog(language)
    .map(({ value, text }) => createJob(language, config, `numbers/${value}.wav`, text, 'cardinal number fragment'));
  return [...staticJobs, ...prefixJobs, ...numberJobs];
}

function createJob(language, config, relativePath, text, fragmentType) {
  return {
    language,
    provider: config.provider || manifest.provider,
    model: config.model || manifest.model,
    voice: config.voice,
    instructions: `${config.instructions} Read this as a ${fragmentType} that will be joined with adjacent audio. Avoid a terminal pause and avoid sentence-final intonation.`,
    relativePath,
    outputPath: path.join(packageRoot, manifest.templateCode.toLowerCase().replaceAll('_', '-'), language, relativePath),
    text,
  };
}

async function generateJob(job) {
  if (!force && await exists(job.outputPath)) {
    console.log(`skip\t${path.relative(projectRoot, job.outputPath)}`);
    return;
  }
  await mkdir(path.dirname(job.outputPath), { recursive: true });
  const rawPath = `${job.outputPath}.source.${job.provider === 'microsoft-edge-tts' ? 'mp3' : 'wav'}`;
  try {
    if (job.provider === 'microsoft-edge-tts') {
      await generateWithEdgeTts(job, rawPath);
    } else if (job.provider === 'openai') {
      await generateWithOpenAI(job, rawPath);
    } else {
      throw new Error(`Unsupported TTS provider: ${job.provider}`);
    }
    await normalizeAudio(rawPath, job.outputPath);
    console.log(`write\t${path.relative(projectRoot, job.outputPath)}`);
  } finally {
    await rm(rawPath, { force: true });
  }
}

async function generateWithEdgeTts(job, rawPath) {
  await run('py', [
    '-m', 'edge_tts',
    '--voice', job.voice,
    '--rate=+0%',
    '--volume=+0%',
    '--pitch=+0Hz',
    '--text', job.text,
    '--write-media', rawPath,
  ]);
}

async function generateWithOpenAI(job, rawPath) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: job.model,
      voice: job.voice,
      input: job.text,
      instructions: job.instructions,
      response_format: 'wav',
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI speech request failed (${response.status}): ${detail}`);
  }
  await writeFile(rawPath, Buffer.from(await response.arrayBuffer()));
}

async function normalizeAudio(inputPath, outputPath) {
  const audio = manifest.audio;
  const filter = [
    'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.015:stop_periods=-1:stop_threshold=-50dB:stop_silence=0.015',
    `aresample=${audio.sampleRateHz}`,
    'aformat=sample_fmts=s16:channel_layouts=mono',
    `loudnorm=I=${audio.loudnessLufs}:TP=${audio.truePeakDb}:LRA=7`,
  ].join(',');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath, '-af', filter, '-ar', String(audio.sampleRateHz), '-ac', String(audio.channels), outputPath]);
}

async function ensureGenerator(selectedJobs) {
  await run('ffmpeg', ['-version']);
  if (selectedJobs.some((job) => job.provider === 'microsoft-edge-tts')) {
    try {
      await run('py', ['-m', 'edge_tts', '--version']);
    } catch {
      throw new Error('edge-tts is required. Install it with: py -m pip install -r scripts/tts/requirements.txt');
    }
  }
}

async function runPool(items, size, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}: ${errorOutput}`)));
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}
