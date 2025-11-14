import prisma from '../config/database';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'user_view'
  | 'user_list'
  | 'user_edit'
  | 'user_delete'
  | 'password_reset'
  | 'dashboard_view'
  | 'company_view'
  | 'company_edit';

export interface AuditLogParams {
  adminId: string;
  action: AuditAction;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetId: params.targetId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
};

/**
 * Get audit logs with pagination
 */
export const getAuditLogs = async (options: {
  adminId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) => {
  const { adminId, action, limit = 50, offset = 0 } = options;

  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { logs, total };
};
