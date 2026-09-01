import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { analyticsPeriodSchema, broadcastItemSchema, broadcastSettingsSchema, categoryPatchSchema, categorySchema, newsPatchSchema, newsPublicationSchema, newsSchema, safetySettingsSchema, servicePackagePatchSchema, servicePackageSchema, servicePatchSchema, serviceSchema, settingsSchema, userPatchSchema, userSchema } from '../schemas/index.js';
import { uploadBroadcastMedia, uploadNewsImage } from '../middleware/upload.js';
import * as content from '../controllers/adminContentController.js';
import * as admin from '../controllers/adminController.js';

export const adminRoutes = Router();
adminRoutes.use(authenticate);

adminRoutes.get('/dashboard', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.dashboard);
adminRoutes.get('/system-status', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.systemStatus);

adminRoutes.get('/services', requireRoles('SUPER_ADMIN', 'ADMIN'), content.listAdminServices);
adminRoutes.post('/services', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(serviceSchema), content.createService);
adminRoutes.get('/services/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.getAdminService);
adminRoutes.patch('/services/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(servicePatchSchema), content.updateService);
adminRoutes.delete('/services/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteService);

adminRoutes.get('/categories', requireRoles('SUPER_ADMIN', 'ADMIN'), content.listAdminCategories);
adminRoutes.post('/categories', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(categorySchema), content.createCategory);
adminRoutes.get('/categories/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.getAdminCategory);
adminRoutes.patch('/categories/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(categoryPatchSchema), content.updateCategory);
adminRoutes.delete('/categories/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteCategory);

adminRoutes.get('/service-packages', requireRoles('SUPER_ADMIN', 'ADMIN'), content.listAdminServicePackages);
adminRoutes.post('/service-packages', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(servicePackageSchema), content.createServicePackage);
adminRoutes.get('/service-packages/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.getAdminServicePackage);
adminRoutes.patch('/service-packages/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(servicePackagePatchSchema), content.updateServicePackage);
adminRoutes.delete('/service-packages/:id', requireRoles('SUPER_ADMIN', 'ADMIN'), content.deleteServicePackage);

adminRoutes.get('/news', content.listAdminNews);
adminRoutes.post('/news/images', uploadNewsImage, content.saveNewsImage);
adminRoutes.post('/news', validate(newsSchema), content.createNews);
adminRoutes.get('/news/:id', content.getAdminNews);
adminRoutes.patch('/news/:id', validate(newsPatchSchema), content.updateNews);
adminRoutes.patch('/news/:id/publication', validate(newsPublicationSchema), content.updateNewsPublication);
adminRoutes.delete('/news/:id', content.deleteNews);

adminRoutes.get('/broadcast/items', content.listBroadcastItems);
adminRoutes.post('/broadcast/media', uploadBroadcastMedia, content.saveBroadcastMedia);
adminRoutes.post('/broadcast/videos', uploadBroadcastMedia, content.saveBroadcastMedia);
adminRoutes.post('/broadcast/items', validate(broadcastItemSchema), content.createBroadcastItem);
adminRoutes.patch('/broadcast/items/:id', validate(broadcastItemSchema), content.updateBroadcastItem);
adminRoutes.delete('/broadcast/items/:id', content.deleteBroadcastItem);
adminRoutes.get('/broadcast/settings', content.getBroadcastSettings);
adminRoutes.patch('/broadcast/settings', validate(broadcastSettingsSchema), content.updateBroadcastSettings);

adminRoutes.get('/users', requireRoles('SUPER_ADMIN'), admin.listUsers);
adminRoutes.post('/users', requireRoles('SUPER_ADMIN'), validate(userSchema), admin.createUser);
adminRoutes.get('/users/:id', requireRoles('SUPER_ADMIN'), admin.getUser);
adminRoutes.patch('/users/:id', requireRoles('SUPER_ADMIN'), validate(userPatchSchema), admin.updateUser);
adminRoutes.delete('/users/:id', requireRoles('SUPER_ADMIN'), admin.deleteUser);

adminRoutes.get('/settings', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.getSettings);
adminRoutes.patch('/settings', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(settingsSchema), admin.updateSettings);
adminRoutes.get('/safety', requireRoles('SUPER_ADMIN', 'ADMIN'), admin.getSafetySettings);
adminRoutes.patch('/safety', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(safetySettingsSchema), admin.updateSafetySettings);
adminRoutes.get('/analytics', requireRoles('SUPER_ADMIN', 'ADMIN'), validate(analyticsPeriodSchema, 'query'), admin.analytics);
adminRoutes.get('/audit-logs', requireRoles('SUPER_ADMIN'), admin.auditLogs);
