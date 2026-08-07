import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { AppError } from '../utils/api.js';

export const uploadsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const newsUploads = path.join(uploadsRoot, 'news');
fs.mkdirSync(newsUploads, { recursive: true });

const extensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, newsUploads),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${extensions.get(file.mimetype) || ''}`),
});

const uploader = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensions.has(file.mimetype)) return callback(new AppError(400, 'INVALID_IMAGE', 'Разрешены изображения JPG, PNG, WebP и GIF'));
    callback(null, true);
  },
});

export function uploadNewsImage(req, res, next) {
  uploader.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(400, 'IMAGE_TOO_LARGE', 'Размер изображения не должен превышать 5 МБ'));
    }
    return next(error);
  });
}
