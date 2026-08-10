import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';
import { uploadsRoot } from './middleware/upload.js';
import { prisma } from './config/prisma.js';

export const app = express();

const localFrontendPorts = new Set(['5173', '5174']);
function allowFrontendOrigin(origin, requestHost, callback) {
  if (!origin || origin === env.CLIENT_URL) return callback(null, true);

  try {
    if (new URL(origin).host === requestHost) return callback(null, true);
  } catch {
    return callback(null, false);
  }

  if (env.NODE_ENV === 'development') {
    try {
      const url = new URL(origin);
      const privateNetworkHost =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        /^10\./.test(url.hostname) ||
        /^192\.168\./.test(url.hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
      if (url.protocol === 'http:' && privateNetworkHost && localFrontendPorts.has(url.port)) {
        return callback(null, true);
      }
    } catch {
      return callback(null, false);
    }
  }

  return callback(null, false);
}

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors((req, callback) => {
  allowFrontendOrigin(req.get('origin'), req.get('host'), (error, allowed) => callback(error, {
    origin: allowed,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
}));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/uploads', express.static(uploadsRoot, { fallthrough: false, maxAge: env.NODE_ENV === 'production' ? '7d' : 0 }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.setting.count();
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch {
    res.status(503).json({ success: false, data: { status: 'degraded', database: 'unavailable' } });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

if (env.NODE_ENV === 'production') {
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist, { maxAge: '1d', index: false, redirect: false }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) return res.sendFile(path.join(clientDist, 'index.html'));
    return next();
  });
}

app.use(notFound);
app.use(errorHandler);
