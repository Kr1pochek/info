import { z } from 'zod';

const text = (max = 1000) => z.string().trim().min(1).max(max);
const optionalText = (max = 1000) => z.string().trim().max(max).optional();
const list = z.array(z.string().trim().min(1).max(500)).max(30);
const slug = z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Используйте латиницу, цифры и дефисы');

export const loginSchema = z.object({ login: text(80), password: z.string().min(8).max(128) });

export const categorySchema = z.object({
  slug, titleRu: text(160), titleKz: text(160), descriptionRu: text(600), descriptionKz: text(600),
  icon: text(60), isPublished: z.boolean(), sortOrder: z.coerce.number().int().min(0).max(10000),
});
export const categoryPatchSchema = categorySchema.partial().refine((value) => Object.keys(value).length > 0);

export const serviceSchema = z.object({
  slug, titleRu: text(220), titleKz: text(220), shortDescriptionRu: text(800), shortDescriptionKz: text(800),
  fullDescriptionRu: text(10000), fullDescriptionKz: text(10000), targetAudienceRu: text(3000), targetAudienceKz: text(3000),
  requiredDocumentsRu: list, requiredDocumentsKz: list, requiredDataRu: list, requiredDataKz: list,
  conditionsRu: text(5000), conditionsKz: text(5000), stepsRu: list, stepsKz: list,
  processingTimeRu: text(300), processingTimeKz: text(300), costRu: text(300), costKz: text(300),
  resultRu: text(3000), resultKz: text(3000), rejectionReasonsRu: list, rejectionReasonsKz: list,
  contactsRu: text(500), contactsKz: text(500), officeAddressRu: text(500), officeAddressKz: text(500),
  workingHoursRu: text(500), workingHoursKz: text(500), keywordsRu: text(1000), keywordsKz: text(1000),
  icon: text(60), categoryId: z.coerce.number().int().positive(), isPopular: z.boolean(), isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});
export const servicePatchSchema = serviceSchema.partial().refine((value) => Object.keys(value).length > 0);

export const userSchema = z.object({
  login: text(80), password: z.string().min(10).max(128), fullName: text(160),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), isActive: z.boolean().default(true),
});
export const userPatchSchema = z.object({
  login: optionalText(80), password: z.string().min(10).max(128).optional(), fullName: optionalText(160),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']).optional(), isActive: z.boolean().optional(),
}).refine((value) => Object.values(value).some((item) => item !== undefined));

export const settingsSchema = z.object({
  organizationNameRu: text(240), organizationNameKz: text(240), contactPhone: text(80),
  addressRu: text(500), addressKz: text(500), workingHoursRu: text(300), workingHoursKz: text(300),
  inactivitySeconds: z.coerce.number().int().min(30).max(3600), warningSeconds: z.coerce.number().int().min(5).max(120),
  defaultLanguage: z.enum(['ru', 'kz']), showCurrentTime: z.boolean(), maintenanceMode: z.boolean(),
  maintenanceMessageRu: text(500), maintenanceMessageKz: text(500), popularServicesCount: z.coerce.number().int().min(1).max(20),
}).refine((value) => value.warningSeconds < value.inactivitySeconds, { path: ['warningSeconds'], message: 'Предупреждение должно быть раньше завершения' });

export const analyticsSchema = z.object({
  eventType: z.enum(['SERVICE_OPEN', 'CATEGORY_OPEN', 'SEARCH', 'SESSION_TIMEOUT', 'SESSION_RESET', 'LANGUAGE_CHANGE', 'FONT_SIZE_CHANGE', 'HOME_RETURN']),
  serviceId: z.number().int().positive().optional().nullable(), categoryId: z.number().int().positive().optional().nullable(),
  searchQuery: z.string().trim().max(80).optional().nullable(), sessionId: z.string().min(8).max(80),
  metadata: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});
