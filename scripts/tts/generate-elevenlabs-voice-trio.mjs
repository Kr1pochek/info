import { spawn } from 'node:child_process';
import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const outputRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'elevenlabs-voices');
const kazakhVariantsRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo', 'elevenlabs-kazakh-variants');
const designRoot = path.join(projectRoot, 'artifacts', 'elevenlabs-voice-design');
const designManifestPath = path.join(designRoot, 'manifest.json');
const selectedVoicePath = path.join(designRoot, 'selected-voice.json');
const model = 'eleven_v3';
const designModel = 'eleven_ttv_v3';
const outputFormat = 'mp3_44100_128';
const defaultVoice = {
  id: 'EXAVITQu4vr4xnSDxMaL',
  name: 'Sarah - Mature, Reassuring, Confident',
  source: 'ElevenLabs default premade voice',
};
const designDescription = [
  'A warm, calm, natural female public-service announcer in her early thirties.',
  'Clear neutral international diction and a consistent identity when speaking Kazakh, Russian, and English.',
  'Medium-low pitch, measured pace, reassuring and polite, with lifelike restrained emotion.',
  'Studio-clean sound; never theatrical, breathy, seductive, promotional, or robotic.',
].join(' ');
const designPreviewText = [
  '[calmly] Welcome. Your appointment is almost ready.',
  'Please proceed to the waiting area and listen for your ticket number.',
  'Thank you for your patience. We will invite you shortly.',
].join(' ');
const samples = [
  {
    language: 'kk',
    label: 'Қазақша',
    file: 'kk.mp3',
    text: 'Д төрт жүз жиырма сегіз нөмірлі талоны бар қызмет алушы, сізді жақын арада шақырады. Күту аймағына өтіңіз.',
  },
  {
    language: 'ru',
    label: 'Русский',
    file: 'ru.mp3',
    text: 'Услугополучатель с талоном Д четыреста двадцать восемь, вас скоро пригласят. Пожалуйста, пройдите в зону ожидания.',
  },
  {
    language: 'en',
    label: 'English',
    file: 'en.mp3',
    text: 'Customer holding ticket D four hundred twenty-eight, you will be invited shortly. Please proceed to the waiting area.',
  },
];
const kazakhCandidates = [
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Профессиональный мягкий альт' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', description: 'Тёплый голос с чёткой дикцией' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: 'Спокойный и хорошо различимый голос' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Бархатный голос с мягкой подачей' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Молодой тёплый голос' },
];

const args = parseArgs(process.argv.slice(2));

if (args.dryRun) {
  const savedVoice = await readSavedVoice();
  console.log(JSON.stringify({
    provider: 'ElevenLabs',
    model,
    designModel,
    voice: args.voiceId || process.env.ELEVENLABS_VOICE_ID || savedVoice?.voiceId || defaultVoice.id,
    outputFormat,
    outputDirectory: path.relative(projectRoot, outputRoot),
    samples,
  }, null, 2));
  process.exit(0);
}

const apiKey = process.env.ELEVENLABS_API_KEY
  || process.env.XI_API_KEY
  || await readEnvValue(path.join(projectRoot, '.env'), 'ELEVENLABS_API_KEY')
  || await readEnvValue(path.join(projectRoot, '.env'), 'XI_API_KEY')
  || await readEnvValue(path.join(projectRoot, 'server', '.env'), 'ELEVENLABS_API_KEY')
  || await readEnvValue(path.join(projectRoot, 'server', '.env'), 'XI_API_KEY');

if (!apiKey) {
  throw new Error('ELEVENLABS_API_KEY is required. Set it in the current shell or in the ignored root .env file. The key is never written to generated files.');
}

if (args.design) {
  await designVoice(apiKey);
  process.exit(0);
}

if (args.kazakhVariants) {
  await generateKazakhVariants(apiKey);
  process.exit(0);
}

let selectedVoice;
if (args.select !== undefined) {
  selectedVoice = await saveDesignedVoice(apiKey, args.select);
} else {
  selectedVoice = await resolveVoice(apiKey, args.voiceId);
}

await generateTrio(apiKey, selectedVoice);

async function designVoice(key) {
  const response = await apiJson('https://api.elevenlabs.io/v1/text-to-voice/design?output_format=mp3_44100_128', key, {
    method: 'POST',
    body: {
      model_id: designModel,
      voice_description: designDescription,
      text: designPreviewText,
      loudness: 0.25,
      quality: 0.95,
      guidance_scale: 4,
      seed: 428,
    },
  });

  if (!Array.isArray(response.previews) || response.previews.length === 0) {
    throw new Error('ElevenLabs Voice Design returned no previews.');
  }

  await mkdir(designRoot, { recursive: true });
  const previews = [];
  for (const [index, preview] of response.previews.entries()) {
    const file = `preview-${index + 1}.mp3`;
    const audio = Buffer.from(preview.audio_base_64 || '', 'base64');
    if (!isMp3(audio)) throw new Error(`Voice Design preview ${index + 1} is not a valid MP3 response.`);
    await writeFile(path.join(designRoot, file), audio);
    previews.push({
      number: index + 1,
      file,
      generatedVoiceId: preview.generated_voice_id,
      durationSeconds: preview.duration_secs,
      mediaType: preview.media_type,
    });
  }

  const manifest = {
    version: 2,
    provider: 'ElevenLabs Voice Design',
    model: designModel,
    description: designDescription,
    previewText: response.text || designPreviewText,
    previews,
  };
  await writeFile(designManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(designRoot, 'index.html'), renderDesignIndex(manifest), 'utf8');

  console.log(`Created ${previews.length} candidates in ${path.relative(projectRoot, designRoot)}.`);
  console.log('Open artifacts/elevenlabs-voice-design/index.html, then run:');
  console.log('npm run tts:elevenlabs -- --select=1');
}

async function saveDesignedVoice(key, selection) {
  const manifest = JSON.parse(await readFile(designManifestPath, 'utf8'));
  const preview = manifest.previews.find((item) => item.number === selection);
  if (!preview) throw new Error(`Voice Design candidate ${selection} does not exist. Choose 1-${manifest.previews.length}.`);

  if (await exists(selectedVoicePath)) {
    const saved = JSON.parse(await readFile(selectedVoicePath, 'utf8'));
    if (saved.generatedVoiceId === preview.generatedVoiceId && saved.voiceId) {
      return { id: saved.voiceId, name: saved.name, source: `Voice Design candidate ${selection}` };
    }
    throw new Error('A different designed voice is already saved locally. Use its voice ID or remove the ignored Voice Design workspace before intentionally creating another voice.');
  }

  const voiceName = args.voiceName || 'Info Kiosk Trilingual Female';
  const voice = await apiJson('https://api.elevenlabs.io/v1/text-to-voice', key, {
    method: 'POST',
    body: {
      voice_name: voiceName,
      voice_description: manifest.description,
      generated_voice_id: preview.generatedVoiceId,
      labels: {
        gender: 'female',
        use_case: 'public service kiosk',
      },
      played_not_selected_voice_ids: manifest.previews
        .filter((item) => item.generatedVoiceId !== preview.generatedVoiceId)
        .map((item) => item.generatedVoiceId),
    },
  });

  const saved = {
    voiceId: voice.voice_id,
    name: voice.name || voiceName,
    generatedVoiceId: preview.generatedVoiceId,
    selectedCandidate: selection,
  };
  await writeFile(selectedVoicePath, `${JSON.stringify(saved, null, 2)}\n`, 'utf8');
  return { id: saved.voiceId, name: saved.name, source: `Voice Design candidate ${selection}` };
}

async function resolveVoice(key, explicitVoiceId) {
  const saved = await readSavedVoice();
  const requestedId = explicitVoiceId
    || process.env.ELEVENLABS_VOICE_ID
    || saved?.voiceId
    || defaultVoice.id;
  let metadata = {};
  try {
    metadata = await apiJson(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(requestedId)}`, key);
  } catch (error) {
    if (!String(error.message).includes('voices_read')) throw error;
    console.warn('ElevenLabs key has no voices_read permission; continuing with the configured voice ID.');
  }
  return {
    id: metadata.voice_id || requestedId,
    name: metadata.name || (requestedId === defaultVoice.id ? defaultVoice.name : requestedId),
    source: saved?.voiceId === requestedId ? 'saved Voice Design selection' : requestedId === defaultVoice.id ? defaultVoice.source : 'configured voice',
  };
}

async function generateTrio(key, voice) {
  await mkdir(outputRoot, { recursive: true });
  await ensureFfmpeg();
  const existingManifest = await readJson(path.join(outputRoot, 'manifest.json'));
  const reusableVoice = existingManifest?.provider === 'ElevenLabs'
    && existingManifest?.model === model
    && existingManifest?.voice?.id === voice.id;

  const generated = {};
  for (const sample of samples) {
    const outputPath = path.join(outputRoot, sample.file);
    if (!args.force && await exists(outputPath)) {
      if (!reusableVoice) {
        throw new Error(`Existing ${sample.file} belongs to another or unknown voice. Add --force to replace the local audio trio.`);
      }
      await assertAudio(outputPath);
      generated[sample.language] = languageManifest(sample, voice);
      console.log(`skip\t${path.relative(projectRoot, outputPath)}`);
      continue;
    }

    const sourcePath = path.join(outputRoot, `.${sample.language}.elevenlabs.source.mp3`);
    const normalizedPath = path.join(outputRoot, `.${sample.language}.normalized.mp3`);
    try {
      const audio = await apiAudio(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.id)}?output_format=${outputFormat}`,
        key,
        {
          text: sample.text,
          model_id: model,
          language_code: sample.language,
          voice_settings: { stability: 0.65 },
          seed: 428,
        },
      );
      await writeFile(sourcePath, audio);
      await run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', sourcePath,
        '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7',
        '-ar', '24000', '-ac', '1',
        '-codec:a', 'libmp3lame', '-b:a', '128k',
        normalizedPath,
      ]);
      await assertAudio(normalizedPath);
      await copyFile(normalizedPath, outputPath);
      console.log(`write\t${path.relative(projectRoot, outputPath)}\t${model}/${voice.name}`);
    } finally {
      await rm(sourcePath, { force: true });
      await rm(normalizedPath, { force: true });
    }
    generated[sample.language] = languageManifest(sample, voice);
  }

  const manifest = {
    version: 2,
    purpose: 'One realistic ElevenLabs voice speaking Kazakh, Russian, and English',
    sampleTicket: 'D-428',
    provider: 'ElevenLabs',
    model,
    voice: voice,
    audio: {
      format: 'mp3',
      sampleRateHz: 24000,
      channels: 1,
      bitrateKbps: 128,
      targetLoudnessLufs: -18,
    },
    languages: generated,
  };
  await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputRoot, 'index.html'), renderTrioIndex(manifest), 'utf8');
  console.log(`ElevenLabs trio is ready: ${path.relative(projectRoot, path.join(outputRoot, 'index.html'))}`);
}

async function generateKazakhVariants(key) {
  const text = 'Д төрт жүз жиырма сегіз нөмірлі талоны бар қызмет алушы, сізді жақын арада шақырады. Күту аймағына өтіңіз.';
  await mkdir(kazakhVariantsRoot, { recursive: true });
  await ensureFfmpeg();

  const variants = [];
  for (const [index, candidate] of kazakhCandidates.entries()) {
    const file = `${String(index + 1).padStart(2, '0')}-${candidate.name.toLowerCase()}.mp3`;
    const outputPath = path.join(kazakhVariantsRoot, file);
    const sourcePath = path.join(kazakhVariantsRoot, `.${candidate.id}.source.mp3`);
    const normalizedPath = path.join(kazakhVariantsRoot, `.${candidate.id}.normalized.mp3`);
    try {
      const audio = await apiAudio(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(candidate.id)}?output_format=${outputFormat}`,
        key,
        {
          text,
          model_id: model,
          language_code: 'kk',
          voice_settings: { stability: 0.75 },
          seed: 428,
        },
      );
      await writeFile(sourcePath, audio);
      await run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', sourcePath,
        '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7',
        '-ar', '24000', '-ac', '1',
        '-codec:a', 'libmp3lame', '-b:a', '128k',
        normalizedPath,
      ]);
      await assertAudio(normalizedPath);
      await copyFile(normalizedPath, outputPath);
      console.log(`write\t${path.relative(projectRoot, outputPath)}\t${candidate.name}`);
    } finally {
      await rm(sourcePath, { force: true });
      await rm(normalizedPath, { force: true });
    }
    variants.push({ number: index + 1, file, voiceId: candidate.id, name: candidate.name, description: candidate.description });
  }

  const manifest = {
    version: 2,
    purpose: 'Kazakh pronunciation comparison for ElevenLabs default female voices',
    provider: 'ElevenLabs',
    model,
    language: 'kk',
    text,
    audio: { format: 'mp3', sampleRateHz: 24000, channels: 1, bitrateKbps: 128, targetLoudnessLufs: -18 },
    variants,
  };
  await writeFile(path.join(kazakhVariantsRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(kazakhVariantsRoot, 'index.html'), renderKazakhVariantsIndex(manifest), 'utf8');
  console.log(`Kazakh variants are ready: ${path.relative(projectRoot, path.join(kazakhVariantsRoot, 'index.html'))}`);
}

function languageManifest(sample, voice) {
  return {
    label: sample.label,
    file: sample.file,
    text: sample.text,
    languageCode: sample.language,
    voiceId: voice.id,
    voiceName: voice.name,
  };
}

async function apiJson(url, key, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'xi-api-key': key,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

async function apiAudio(url, key, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await apiError(response);
  const contentType = response.headers.get('content-type') || '';
  const audio = Buffer.from(await response.arrayBuffer());
  if (!contentType.startsWith('audio/') || !isMp3(audio)) {
    throw new Error(`ElevenLabs returned an unexpected audio response (${contentType || 'unknown content type'}).`);
  }
  return audio;
}

async function apiError(response) {
  const detail = (await response.text()).replace(/\s+/g, ' ').slice(0, 800);
  return new Error(`ElevenLabs API request failed (${response.status}): ${detail || response.statusText}`);
}

async function assertAudio(filePath) {
  await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name,sample_rate,channels',
    '-of', 'default=noprint_wrappers=1',
    filePath,
  ]);
}

async function ensureFfmpeg() {
  await run('ffmpeg', ['-version']);
  await run('ffprobe', ['-version']);
}

async function readSavedVoice() {
  try {
    return JSON.parse(await readFile(selectedVoicePath, 'utf8'));
  } catch {
    return undefined;
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return undefined;
  }
}

async function readEnvValue(filePath, name) {
  try {
    const lines = (await readFile(filePath, 'utf8')).split(/\r?\n/);
    const expression = new RegExp(`^\\s*${escapeRegExp(name)}\\s*=\\s*(.*)$`);
    for (const line of lines) {
      const match = line.match(expression);
      if (match) return match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function parseArgs(values) {
  const result = {
    design: values.includes('--design'),
    dryRun: values.includes('--dry-run'),
    force: values.includes('--force'),
    kazakhVariants: values.includes('--kazakh-variants'),
  };
  for (const value of values) {
    if (value.startsWith('--select=')) result.select = parsePositiveInteger(value.slice('--select='.length), '--select');
    if (value.startsWith('--voice-id=')) result.voiceId = requiredValue(value.slice('--voice-id='.length), '--voice-id');
    if (value.startsWith('--voice-name=')) result.voiceName = requiredValue(value.slice('--voice-name='.length), '--voice-name');
  }
  if ((result.design || result.kazakhVariants) && result.select !== undefined) throw new Error('--design/--kazakh-variants and --select cannot be used together.');
  return result;
}

function parsePositiveInteger(value, option) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${option} must be a positive integer.`);
  return parsed;
}

function requiredValue(value, option) {
  if (!value.trim()) throw new Error(`${option} cannot be empty.`);
  return value.trim();
}

function isMp3(buffer) {
  return buffer.length > 3 && (
    buffer.subarray(0, 3).toString('ascii') === 'ID3'
    || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  );
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}: ${stderr}`)));
  });
}

function renderDesignIndex(manifest) {
  const cards = manifest.previews.map((preview) => `<article>
    <strong>Кандидат ${preview.number}</strong>
    <audio controls preload="metadata" src="./${escapeHtml(preview.file)}"></audio>
    <code>npm run tts:elevenlabs -- --select=${preview.number}</code>
  </article>`).join('');
  return pageTemplate(
    'ElevenLabs Voice Design',
    'Выберите один тембр',
    'Три варианта одного профиля. Прослушайте их и запустите команду под понравившимся вариантом.',
    cards,
  );
}

function renderTrioIndex(manifest) {
  const cards = ['kk', 'ru', 'en'].map((language) => {
    const item = manifest.languages[language];
    return `<article>
      <strong>${escapeHtml(item.label)}</strong>
      <p>${escapeHtml(item.text)}</p>
      <audio controls preload="metadata" src="./${escapeHtml(item.file)}?v=${manifest.version}-${escapeHtml(item.voiceId)}"></audio>
      <small>${escapeHtml(item.voiceName)} · ${escapeHtml(manifest.model)} · ${escapeHtml(item.languageCode)}</small>
    </article>`;
  }).join('');
  return pageTemplate(
    'ElevenLabs KZ · RU · EN',
    'Один голос на трёх языках',
    `${manifest.voice.name}: единый voice_id и единый тембр для казахского, русского и английского.`,
    cards,
  );
}

function renderKazakhVariantsIndex(manifest) {
  const cards = manifest.variants.map((variant) => `<article>
    <strong>0${variant.number} · ${escapeHtml(variant.name)}</strong>
    <p>${escapeHtml(variant.description)}</p>
    <audio controls preload="metadata" src="./${escapeHtml(variant.file)}?v=${manifest.version}-${escapeHtml(variant.voiceId)}"></audio>
    <small>${escapeHtml(variant.voiceId)}</small>
  </article>`).join('');
  return pageTemplate(
    'ElevenLabs · қазақ дауыстары',
    'Қазақша айтылымды таңдаңыз',
    `Sarah орнына бес жаңа әйел дауысы. Барлығы бір мәтінді оқиды: ${manifest.text}`,
    cards,
  );
}

function pageTemplate(title, heading, intro, cards) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color: #eef7f7; background: #061d2e; font-family: Inter, Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { max-width: 1180px; margin: 0 auto; padding: 56px 24px 72px; }
    header { max-width: 780px; margin-bottom: 30px; }
    header span { color: #63ddd4; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 12px 0; font-size: clamp(36px, 6vw, 64px); line-height: 1; letter-spacing: -.045em; }
    header p, article p { color: #b8cbd3; line-height: 1.6; }
    main { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    article { display: flex; min-width: 0; flex-direction: column; gap: 18px; padding: 24px; background: #0d3047; border: 1px solid #31566c; border-radius: 18px; box-shadow: 0 18px 45px rgba(0, 8, 16, .22); }
    article strong { color: #fff; font-size: 21px; }
    article p { flex: 1; margin: 0; }
    audio { width: 100%; }
    code, small { color: #82e5df; overflow-wrap: anywhere; }
    @media (max-width: 820px) { main { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><span>Электронная очередь · D-428</span><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(intro)}</p></header>
  <main>${cards}</main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
