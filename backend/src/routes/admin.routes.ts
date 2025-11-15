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
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractText } from '../services/textExtraction.service';

const router = Router();

// Configure multer for company document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/company-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF, DOCX und TXT Dateien sind erlaubt'));
    }
  },
});

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
 * POST /api/admin/companies
 * Create a new company (Superadmin only)
 */
router.post(
  '/companies',
  authenticateAdmin,
  requireSuperAdmin,
  [
    body('name').isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('domain').optional().isString(),
    body('logoUrl').optional().isURL(),
    body('accentColor').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, domain, logoUrl, accentColor } = req.body;

      const company = await prisma.company.create({
        data: {
          name,
          description,
          domain,
          logoUrl,
          accentColor,
        },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'company_create',
        targetId: company.id,
        details: { name },
        ipAddress: req.ip,
      });

      res.status(201).json(company);
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen des Unternehmens' });
    }
  }
);

/**
 * GET /api/admin/companies/:id
 * Get single company details (Superadmin only)
 */
router.get('/companies/:id', authenticateAdmin, requireSuperAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            admins: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Unternehmen nicht gefunden' });
    }

    await createAuditLog({
      adminId: req.admin!.adminId,
      action: 'company_view',
      targetId: company.id,
      ipAddress: req.ip,
    });

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Unternehmens' });
  }
});

/**
 * PUT /api/admin/companies/:id
 * Update company (Superadmin only)
 */
router.put(
  '/companies/:id',
  authenticateAdmin,
  requireSuperAdmin,
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('domain').optional().isString(),
    body('logoUrl').optional().isURL(),
    body('accentColor').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, domain, logoUrl, accentColor } = req.body;

      const company = await prisma.company.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(domain !== undefined && { domain }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(accentColor !== undefined && { accentColor }),
        },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'company_edit',
        targetId: company.id,
        details: { name },
        ipAddress: req.ip,
      });

      res.json(company);
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Unternehmens' });
    }
  }
);

/**
 * PUT /api/admin/companies/:id/corporate-prompt
 * Update company corporate prompt (Superadmin only)
 */
router.put(
  '/companies/:id/corporate-prompt',
  authenticateAdmin,
  requireSuperAdmin,
  [body('corporatePrompt').optional().isString()],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { corporatePrompt } = req.body;

      await prisma.company.update({
        where: { id: req.params.id },
        data: { corporatePrompt: corporatePrompt || null },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'company_prompt_update',
        targetId: req.params.id,
        ipAddress: req.ip,
      });

      res.json({ message: 'Corporate Prompt aktualisiert' });
    } catch (error) {
      console.error('Update corporate prompt error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Corporate Prompts' });
    }
  }
);

/**
 * GET /api/admin/companies/:id/users
 * Get all users for a company (Superadmin only)
 */
router.get('/companies/:id/users', authenticateAdmin, requireSuperAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.params.id },
      include: {
        profile: {
          select: {
            firstName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Nutzer' });
  }
});

/**
 * GET /api/admin/companies/:id/admins
 * Get all admins for a company (Superadmin only)
 */
router.get('/companies/:id/admins', authenticateAdmin, requireSuperAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      where: { companyId: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(admins);
  } catch (error) {
    console.error('Get company admins error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Admins' });
  }
});

/**
 * POST /api/admin/users/:userId/promote-to-admin
 * Promote a user to company admin (Superadmin only)
 */
router.post(
  '/users/:userId/promote-to-admin',
  authenticateAdmin,
  requireSuperAdmin,
  [
    body('name').isString().trim().isLength({ min: 1 }),
    body('password').isString().isLength({ min: 6 }),
  ],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, password } = req.body;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'Nutzer nicht gefunden' });
      }

      if (!user.companyId) {
        return res.status(400).json({ error: 'Nutzer muss zuerst einem Unternehmen zugeordnet werden' });
      }

      // Check if admin already exists for this user's email
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: user.email },
      });

      if (existingAdmin) {
        return res.status(400).json({ error: 'Admin mit dieser E-Mail existiert bereits' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email: user.email,
          passwordHash,
          name,
          role: 'admin',
          companyId: user.companyId,
        },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'user_promote_to_admin',
        targetId: user.id,
        details: { adminId: admin.id, companyId: user.companyId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        message: 'Nutzer erfolgreich zu Company Admin ernannt',
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          companyId: admin.companyId,
        },
      });
    } catch (error) {
      console.error('Promote user to admin error:', error);
      res.status(500).json({ error: 'Fehler beim Ernennen zum Admin' });
    }
  }
);

/**
 * PUT /api/admin/users/:userId/company
 * Assign user to a company (Superadmin only)
 */
router.put(
  '/users/:userId/company',
  authenticateAdmin,
  requireSuperAdmin,
  [body('companyId').optional().isString()],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { companyId } = req.body;

      // Verify company exists if provided
      if (companyId) {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          return res.status(404).json({ error: 'Unternehmen nicht gefunden' });
        }
      }

      const user = await prisma.user.update({
        where: { id: req.params.userId },
        data: { companyId: companyId || null },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'user_company_assign',
        targetId: user.id,
        details: { companyId },
        ipAddress: req.ip,
      });

      res.json({ message: 'Unternehmen zugeordnet', user });
    } catch (error) {
      console.error('Assign user to company error:', error);
      res.status(500).json({ error: 'Fehler beim Zuordnen des Unternehmens' });
    }
  }
);

/**
 * GET /api/admin/companies/:id/documents
 * Get company documents (Superadmin only)
 */
router.get('/companies/:id/documents', authenticateAdmin, requireSuperAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        companyId: req.params.id,
        category: 'company',
      },
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        metadata: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    res.json(documents);
  } catch (error) {
    console.error('Get company documents error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Dokumente' });
  }
});

/**
 * POST /api/admin/companies/:id/documents
 * Upload company document (Superadmin only)
 */
router.post(
  '/companies/:id/documents',
  authenticateAdmin,
  requireSuperAdmin,
  upload.single('file'),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Keine Datei hochgeladen' });
      }

      const companyId = req.params.id;
      const filePath = req.file.path;
      const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(404).json({ error: 'Unternehmen nicht gefunden' });
      }

      // Extract text from file
      const fileBuffer = fs.readFileSync(filePath);
      const extractionResult = await extractText(fileBuffer, fileType);
      const extractedText = extractionResult.text || '';

      // Create a system user for the company if needed
      let companyUser = await prisma.user.findFirst({
        where: {
          companyId,
          email: `system@${companyId}.internal`,
        },
      });

      if (!companyUser) {
        companyUser = await prisma.user.create({
          data: {
            email: `system@${companyId}.internal`,
            passwordHash: null,
            authProvider: 'system',
            companyId,
          },
        });
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          userId: companyUser.id,
          companyId,
          filename: req.file.originalname,
          fileType,
          fileSize: req.file.size,
          category: 'company',
          extractedText,
          metadata: JSON.stringify({
            uploadedBy: req.admin!.email,
            uploadedAt: new Date().toISOString(),
          }),
        },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'company_document_upload',
        targetId: companyId,
        details: { documentId: document.id, filename: req.file.originalname },
        ipAddress: req.ip,
      });

      res.status(201).json({
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
      });
    } catch (error) {
      console.error('Upload company document error:', error);
      res.status(500).json({ error: 'Fehler beim Hochladen des Dokuments' });
    }
  }
);

/**
 * DELETE /api/admin/companies/:id/documents/:docId
 * Delete company document (Superadmin only)
 */
router.delete(
  '/companies/:id/documents/:docId',
  authenticateAdmin,
  requireSuperAdmin,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id: companyId, docId } = req.params;

      // Verify document belongs to this company
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          companyId,
          category: 'company',
        },
      });

      if (!document) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      // Delete from database
      await prisma.document.delete({
        where: { id: docId },
      });

      await createAuditLog({
        adminId: req.admin!.adminId,
        action: 'company_document_delete',
        targetId: companyId,
        details: { documentId: docId, filename: document.filename },
        ipAddress: req.ip,
      });

      res.json({ message: 'Dokument erfolgreich gelöscht' });
    } catch (error) {
      console.error('Delete company document error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Dokuments' });
    }
  }
);

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
