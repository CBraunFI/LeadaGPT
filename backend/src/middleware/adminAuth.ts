import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../utils/adminJwt';
import prisma from '../config/database';

export interface AdminAuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to authenticate admin requests
 */
export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAdminToken(token);

    // Verify admin still exists and is active
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Admin-Konto nicht gefunden oder deaktiviert' });
    }

    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ungültiger oder abgelaufener Admin-Token' });
  }
};

/**
 * Middleware to check if admin has superadmin role
 */
export const requireSuperAdmin = (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Nur Superadmins haben Zugriff auf diese Ressource' });
  }
  next();
};
