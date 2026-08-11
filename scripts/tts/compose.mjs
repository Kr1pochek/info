import { spawn } from 'node:child_process';
import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { announcementSegments, normalizeTicketNumber } from './number-segments.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const packageRoot = path.join(projectRoot, 'client', 'public', 'audio', 'seo');
const manifest = JSON.parse(await readFile(path.join(packageRoot, 'voice-manifest.json'), 'utf8'));
const language = valueAfter('--language');
const prefix = valueAfter('--prefix');
const rawNumber = valueAfter('--number');
const force = process.argv.includes('--force');

if (!language || !prefix || rawNumber === undefined) {
  throw new Error('Usage: npm run tts:compose -- --language ru --prefix A --number 15 [--force]');
}

const number = normalizeTicketNumber(rawNumber);
const templateRoot = path.join(packageRoot, manifest.templateCode.toLowerCase().replaceAll('_', '-'));
const relativeSegments = announcementSegments(manifest, language, prefix, number);
const inputFiles = relativeSegments.map((relativePath) => path.join(templateRoot, language, relativePath));
for (const inputFile of inputFiles) await access(inputFile);

const customOutput = valueAfter('--output');
const outputPath = customOutput
  ? path.resolve(process.cwd(), customOutput)
  : path.join(packageRoot, 'previews', `${language}-${prefix.toUpperCase()}-${number}.wav`);
await mkdir(path.dirname(outputPath), { recursive: true });

const crossfadeSeconds = manifest.audio.crossfadeMs / 1000;
const filterParts = [];
let previous = '[0:a]';
for (let index = 1; index < inputFiles.length; index += 1) {
  const output = index === inputFiles.length - 1 ? '[joined]' : `[a${index}]`;
  filterParts.push(`${previous}[${index}:a]acrossfade=d=${crossfadeSeconds}:c1=tri:c2=tri${output}`);
  previous = output;
}
filterParts.push(`[joined]loudnorm=I=${manifest.audio.loudnessLufs}:TP=${manifest.audio.truePeakDb}:LRA=7[out]`);

const ffmpegArgs = ['-hide_banner', '-loglevel', 'error', force ? '-y' : '-n'];
for (const inputFile of inputFiles) ffmpegArgs.push('-i', inputFile);
ffmpegArgs.push(
  '-filter_complex', filterParts.join(';'),
  '-map', '[out]',
  '-ar', String(manifest.audio.sampleRateHz),
  '-ac', String(manifest.audio.channels),
  outputPath,
);
await run('ffmpeg', ffmpegArgs);
console.log(`Announcement written: ${path.relative(projectRoot, outputPath)}`);

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'pipe'] });
    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}: ${errorOutput}`)));
  });
}
