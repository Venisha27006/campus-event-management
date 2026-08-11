import { prisma } from '../config/prisma';
import { Request } from 'express';
import { AuthRequest } from '../types';

interface AuditParams {
  userId?: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  description?: string;
  oldValue?: unknown;
  newValue?: unknown;
  eventId?: string;
  req?: AuthRequest | Request;
}

export const createAuditLog = async (params: AuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        entityType: params.entityType,
        description: params.description,
        oldValue: params.oldValue ? (params.oldValue as object) : undefined,
        newValue: params.newValue ? (params.newValue as object) : undefined,
        eventId: params.eventId,
        ipAddress: params.req?.ip,
        userAgent: params.req?.headers['user-agent'],
      },
    });
  } catch {
    // Audit log failures should not break the main flow
  }
};
