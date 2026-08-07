import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categoryPatchSchema, categorySchema, newsPatchSchema, newsPublicationSchema, newsSchema, servicePatchSchema, serviceSchema, settingsSchema, userPatchSchema, userSchema } from '../schemas/index.js';
import { uploadNewsImage } from '../middleware/upload.js';
import * as content from '../controllers/adminContentController.js';
import * as admin from '../controllers/adminController.js';

export const adminRoutes = Router();
adminRoutes.use(authenticate);

adminRoutes.get('/dashboard', admin.dashboard);

adminRoutes.get('/services', content.listAdminServices);
adminRoutes.post('/services', validate(serviceSchema), content.createService);
adminRoutes.get('/services/:id', content.getAdminService);
adminRoutes.patch('/services/:id', validate(servicePatchSchema), content.updateService);
adminRoutes.delete('/services/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteService);

adminRoutes.get('/categories', content.listAdminCategories);
adminRoutes.post('/categories', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(categorySchema), content.createCategory);
adminRoutes.get('/categories/:id', content.getAdminCategory);
adminRoutes.patch('/categories/:id', validate(categoryPatchSchema), content.updateCategory);
adminRoutes.delete('/categories/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteCategory);

adminRoutes.get('/news', content.listAdminNews);
adminRoutes.post('/news/images', uploadNewsImage, content.saveNewsImage);
adminRoutes.post('/news', validate(newsSchema), content.createNews);
adminRoutes.get('/news/:id', content.getAdminNews);
adminRoutes.patch('/news/:id', validate(newsPatchSchema), content.updateNews);
adminRoutes.patch('/news/:id/publication', validate(newsPublicationSchema), content.updateNewsPublication);
adminRoutes.delete('/news/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteNews);

adminRoutes.get('/users', requireRoles('SUPER_ADMIN'), admin.listUsers);
adminRoutes.post('/users', requireRoles('SUPER_ADMIN'), validate(userSchema), admin.createUser);
adminRoutes.get('/users/:id', requireRoles('SUPER_ADMIN'), admin.getUser);
adminRoutes.patch('/users/:id', requireRoles('SUPER_ADMIN'), validate(userPatchSchema), admin.updateUser);
adminRoutes.delete('/users/:id', requireRoles('SUPER_ADMIN'), admin.deleteUser);

adminRoutes.get('/settings', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.getSettings);
adminRoutes.patch('/settings', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(settingsSchema), admin.updateSettings);
adminRoutes.get('/analytics', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.analytics);
adminRoutes.get('/audit-logs', requireRoles('SUPER_ADMIN'), admin.auditLogs);
