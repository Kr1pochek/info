import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginSchema } from '../schemas/index.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

export const authRoutes = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток. Повторите позже.' } } });

authRoutes.post('/login', loginLimiter, validate(loginSchema), authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authenticate, authController.logout);
authRoutes.get('/me', authenticate, authController.me);
