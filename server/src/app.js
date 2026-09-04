import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { publicRoutes } from './routes/publicRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';
import { uploadsRoot } from './middleware/upload.js';
import { prisma } from './config/prisma.js';

export const app = express();

if (env.TRUST_PROXY_HOPS > 0) app.set('trust proxy', env.TRUST_PROXY_HOPS);

app.use((req, res, next) => {
  const suppliedId = req.get('x-request-id');
  req.id = suppliedId && /^[a-zA-Z0-9._:-]{8,128}$/.test(suppliedId) ? suppliedId : randomUUID();
  res.set('X-Request-Id', req.id);
  next();
});

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
const secureDeployment = new URL(env.CLIENT_URL).protocol === 'https:';
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: { 'upgrade-insecure-requests': secureDeployment ? [] : null },
  },
  crossOriginOpenerPolicy: secureDeployment ? undefined : false,
  originAgentCluster: secureDeployment ? undefined : false,
  strictTransportSecurity: secureDeployment ? undefined : false,
}));
app.use(cors((req, callback) => {
  allowFrontendOrigin(req.get('origin'), req.get('host'), (error, allowed) => callback(error, {
    origin: allowed,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
}));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsRoot, { fallthrough: false, maxAge: env.NODE_ENV === 'production' ? '7d' : 0 }));

function apiRateLimit(limit, scope) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Слишком много запросов, повторите позже', scope, requestId: req.id },
    }),
  });
}

app.get('/api/health/live', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'available' } });
});

async function readiness(_req, res) {
  try {
    await prisma.setting.count();
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch {
    res.status(503).json({ success: false, data: { status: 'degraded', database: 'unavailable' } });
  }
}

app.get('/api/health', readiness);
app.get('/api/health/ready', readiness);
app.use('/api/auth', apiRateLimit(env.AUTH_RATE_LIMIT, 'auth'), authRoutes);
app.use('/api/admin', apiRateLimit(env.ADMIN_RATE_LIMIT, 'admin'), adminRoutes);
app.use('/api', apiRateLimit(env.PUBLIC_RATE_LIMIT, 'public'), publicRoutes);

if (env.NODE_ENV === 'production' || env.SERVE_CLIENT_DIST) {
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist, { maxAge: '1d', index: false, redirect: false }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) return res.sendFile(path.join(clientDist, 'index.html'));
    return next();
  });
}

app.use(notFound);
app.use(errorHandler);
