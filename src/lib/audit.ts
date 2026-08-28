import { prisma } from "./db";

export async function writeAudit(opts: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: opts.tenantId,
      userId: opts.userId ?? null,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId ?? null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      ipAddress: opts.ipAddress ?? null,
    },
  });
}
