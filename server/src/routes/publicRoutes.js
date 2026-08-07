import { Router } from 'express';
import { analyticsSchema } from '../schemas/index.js';
import { validate } from '../middleware/validate.js';
import * as publicController from '../controllers/publicController.js';

export const publicRoutes = Router();

publicRoutes.get('/categories', publicController.listCategories);
publicRoutes.get('/categories/:slug', publicController.getCategory);
publicRoutes.get('/services', publicController.listServices);
publicRoutes.get('/services/popular', publicController.popularServices);
publicRoutes.get('/services/search', publicController.searchServices);
publicRoutes.get('/services/:slug', publicController.getService);
publicRoutes.get('/news', publicController.listNews);
publicRoutes.get('/news/:slug', publicController.getNews);
publicRoutes.get('/broadcast', publicController.getBroadcast);
publicRoutes.get('/exchange-rates/usd-kzt', publicController.usdKztRate);
publicRoutes.get('/settings/public', publicController.publicSettings);
publicRoutes.post('/analytics/events', validate(analyticsSchema), publicController.createAnalyticsEvent);
