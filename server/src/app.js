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

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use(notFound);
app.use(errorHandler);
