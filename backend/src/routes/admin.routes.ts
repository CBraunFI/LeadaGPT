import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { authenticateAdmin, AdminAuthRequest, requireSuperAdmin } from '../middleware/adminAuth';
import { generateAdminToken } from '../utils/adminJwt';
import { createAuditLog } from '../services/audit.service';
import {
  getDashboardStats,
  getUserStats,
  getCompanyStats,
} from '../services/statistics.service';

const router = Router();

/**
 * POST /api/admin/login
 * Admin login endpoint
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email },
      });

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Update last login
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate token
      const token = generateAdminToken({
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      });

      // Log the login
      await createAuditLog({
        adminId: admin.id,
        action: 'login',
        ipAddress: req.ip,
      });

      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Fehler bei der Anmeldung' });
    }
  }
);

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', authenticateAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const stats = await getDashboardStats();

    // Log dashboard access
    await createAuditLog({
      adminId: req.admin!.adminId,
      action: 'dashboard_view',
      ipAddress: req.ip,
    });

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Dashboard-Daten' });
  }
});

/**
 * GET /api/admin/users
 * Get list of users with pagination
 */
router.get('/users', authenticateAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const companyId = req.query.companyId as string | undefined;

    const result = await getUserStats({ companyId, limit, offset });

    // Log user list access
    await createAuditLog({
      adminId: req.admin!.adminId,
      action: 'user_list',
      details: { limit, offset, companyId },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Nutzerdaten' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
router.get('/users/:id', authenticateAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        company: true,
        sessions: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        },
        routines: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
        themenPaketProgress: {
          select: {
            id: true,
            status: true,
            currentDay: true,
            themenPaket: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    }

    // Log user view
    await createAuditLog({
      adminId: req.admin!.adminId,
      action: 'user_view',
      targetId: userId,
      ipAddress: req.ip,
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Nutzerdaten' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user information
 */
router.patch(
  '/users/:id',
  authenticateAdmin,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('companyId').optional().isString(),
  ],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.params.id;
      const { email, companyId } = req.body;

      const updateData: any = {};
      if (email) updateData.email = email;
      if (companyId !== undefined) updateData.companyId = companyId || null;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          profile: true,
          company: true,
        },
      });

      // Log user edit
      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'user_edit',
        targetId: userId,
        details: { changes: updateData },
        ipAddress: req.ip,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Nutzers' });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Delete user (only for superadmins)
 */
router.delete(
  '/users/:id',
  authenticateAdmin,
  requireSuperAdmin,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const userId = req.params.id;

      // Get user info before deletion for audit log
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Nutzer nicht gefunden' });
      }

      // Delete user (cascade will handle related data)
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log user deletion
      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'user_delete',
        targetId: userId,
        details: { email: user.email },
        ipAddress: req.ip,
      });

      res.json({ message: 'Nutzer erfolgreich gelöscht' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Nutzers' });
    }
  }
);

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (generates temporary password)
 */
router.post(
  '/users/:id/reset-password',
  authenticateAdmin,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const userId = req.params.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, authProvider: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Nutzer nicht gefunden' });
      }

      if (user.authProvider !== 'local') {
        return res.status(400).json({
          error: 'Passwort-Reset nur für lokale Nutzer möglich. Dieser Nutzer verwendet OAuth.',
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update user password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      // Log password reset
      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'password_reset',
        targetId: userId,
        ipAddress: req.ip,
      });

      res.json({
        message: 'Passwort wurde zurückgesetzt',
        tempPassword,
        email: user.email,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
    }
  }
);

/**
 * GET /api/admin/companies
 * Get list of companies
 */
router.get('/companies', authenticateAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const companies = await getCompanyStats();

    // Log company view
    await createAuditLog({
      adminId: req.admin!.adminId,
      action: 'company_view',
      ipAddress: req.ip,
    });

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Unternehmensdaten' });
  }
});

/**
 * GET /api/admin/me
 * Get current admin info
 */
router.get('/me', authenticateAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin!.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json(admin);
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Admin-Daten' });
  }
});

export default router;
