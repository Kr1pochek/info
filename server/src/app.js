import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

const localFrontendPorts = new Set(['5173', '5174']);
function allowFrontendOrigin(origin, callback) {
  if (!origin || origin === env.CLIENT_URL) return callback(null, true);

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
app.use(cors({ origin: allowFrontendOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use(notFound);
app.use(errorHandler);
