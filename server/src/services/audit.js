import { prisma } from '../config/prisma.js';

export async function writeAudit(req, action, entityType, entityId, oldData, newData) {
  return prisma.auditLog.create({
    data: {
      adminUserId: req.user.id,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      oldData: oldData || undefined,
      newData: newData || undefined,
      ipAddress: req.ip?.slice(0, 80),
      userAgent: req.get('user-agent')?.slice(0, 500),
    },
  });
}
