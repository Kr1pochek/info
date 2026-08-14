import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const outputRoot = path.join(projectRoot, 'artifacts', 'seo-voiceovers-premium-openai');
const model = 'gpt-4o-mini-tts';
const force = process.argv.includes('--force');
const apiKey = process.env.OPENAI_API_KEY
  || await readEnvValue(path.join(projectRoot, '.env'), 'OPENAI_API_KEY')
  || await readEnvValue(path.join(projectRoot, 'server', '.env'), 'OPENAI_API_KEY');

const voiceovers = [
  {
    language: 'ru',
    file: '01-russian-d428.mp3',
    voice: 'marin',
    text: 'Услугополучатель номер ди четыреста двадцать восемь, вас скоро пригласят. Пожалуйста, пройдите в зону ожидания.',
    instructions: 'Говори только по-русски, с естественным произношением носителя языка. Женский голос профессионального диктора электронной очереди: тёплый, спокойный и доброжелательный. Средний темп, живая человеческая интонация, естественные короткие паузы. Без театральности, рекламы и роботизированной подачи. Произнеси только предоставленный текст.',
  },
  {
    language: 'kk',
    file: '02-kazakh-d428.mp3',
    voice: 'marin',
    text: 'Ди төрт жүз жиырма сегіз нөмірлі қызмет алушы, сізді жақын арада шақырады. Күту аймағына өтіңіз.',
    instructions: 'Тек қазақ тілінде, қазақ тілін ана тілі ретінде сөйлейтін адамның табиғи айтылымымен сөйле. Электрондық кезектің кәсіби әйел дикторы: жылы, сабырлы және сыпайы дауыс. Орташа қарқын, табиғи адам интонациясы және қысқа кідірістер. Театрлық, жарнамалық немесе роботтық мәнер болмасын. Тек берілген мәтінді айт.',
  },
  {
    language: 'en',
    file: '03-english-d428.mp3',
    voice: 'marin',
    text: 'Customer number D four hundred twenty-eight, you will be invited shortly. Please proceed to the waiting area.',
    instructions: 'Speak only in natural American English. Use a warm, calm, friendly female voice suitable for a professional public-service queue announcement. Medium pace, lifelike intonation, and brief natural pauses. Avoid theatrical, promotional, or robotic delivery. Say only the provided text.',
  },
];

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required for premium voice generation. Set it in the current shell or in the ignored root .env file and run this command again.');
}

await mkdir(outputRoot, { recursive: true });
await ensureFfmpeg();

for (const item of voiceovers) {
  const outputPath = path.join(outputRoot, item.file);
  const sourcePath = `${outputPath}.source.wav`;
  if (!force && await exists(outputPath)) {
    console.log(`skip\t${path.relative(projectRoot, outputPath)}`);
    continue;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice: item.voice,
        input: item.text,
        instructions: item.instructions,
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI speech request failed for ${item.language} (${response.status}): ${detail}`);
    }

    await writeFile(sourcePath, Buffer.from(await response.arrayBuffer()));
    await run('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', sourcePath,
      '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7',
      '-ar', '48000', '-ac', '1',
      '-codec:a', 'libmp3lame', '-b:a', '192k',
      outputPath,
    ]);
    console.log(`write\t${path.relative(projectRoot, outputPath)}\t${model}/${item.voice}`);
  } finally {
    await rm(sourcePath, { force: true });
  }
}

console.log('Three premium voiceovers generated successfully.');

async function ensureFfmpeg() {
  await run('ffmpeg', ['-version']);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readEnvValue(filePath, name) {
  try {
    const lines = (await readFile(filePath, 'utf8')).split(/\r?\n/);
    const line = lines.find((item) => item.trimStart().startsWith(`${name}=`));
    if (!line) return undefined;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
  } catch {
    return undefined;
  }
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
