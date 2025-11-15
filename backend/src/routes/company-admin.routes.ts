import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import {
  authenticateAdmin,
  requireCompanyAdmin,
  AdminAuthRequest,
} from '../middleware/adminAuth';
import {
  getCompanyAnalytics,
  generateCompanyAnalyticsSummary,
  getCompanyUsers,
} from '../services/company-analytics.service';
import { updateCorporatePrompt } from '../services/prompt.service';
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
 * Get company information
 * GET /api/company-admin/info
 */
router.get('/info', authenticateAdmin, requireCompanyAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.admin!.companyId! },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        accentColor: true,
        corporatePrompt: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Unternehmen nicht gefunden' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Unternehmensinformationen' });
  }
});

/**
 * Update corporate prompt
 * PUT /api/company-admin/corporate-prompt
 */
router.put(
  '/corporate-prompt',
  authenticateAdmin,
  requireCompanyAdmin,
  [body('corporatePrompt').optional().isString()],
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { corporatePrompt } = req.body;

      await updateCorporatePrompt(
        req.admin!.companyId!,
        corporatePrompt || null
      );

      res.json({ message: 'Corporate Prompt erfolgreich aktualisiert' });
    } catch (error) {
      console.error('Update corporate prompt error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Corporate Prompts' });
    }
  }
);

/**
 * Get company analytics
 * GET /api/company-admin/analytics?period=week
 */
router.get('/analytics', authenticateAdmin, requireCompanyAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';

    if (!['week', 'month', '3months', '6months', 'all'].includes(period)) {
      return res.status(400).json({ error: 'Ungültiger Zeitraum' });
    }

    const analytics = await getCompanyAnalytics(
      req.admin!.companyId!,
      period as 'week' | 'month' | '3months' | '6months' | 'all'
    );

    res.json(analytics);
  } catch (error) {
    console.error('Get company analytics error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Analytics' });
  }
});

/**
 * Get company analytics summary
 * GET /api/company-admin/analytics/summary?period=week
 */
router.get(
  '/analytics/summary',
  authenticateAdmin,
  requireCompanyAdmin,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const period = (req.query.period as string) || 'week';

      if (!['week', 'month', '3months', '6months', 'all'].includes(period)) {
        return res.status(400).json({ error: 'Ungültiger Zeitraum' });
      }

      const summary = await generateCompanyAnalyticsSummary(
        req.admin!.companyId!,
        period as 'week' | 'month' | '3months' | '6months' | 'all'
      );

      res.json({ summary });
    } catch (error) {
      console.error('Get company analytics summary error:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Zusammenfassung' });
    }
  }
);

/**
 * Get company users
 * GET /api/company-admin/users
 */
router.get('/users', authenticateAdmin, requireCompanyAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const users = await getCompanyUsers(req.admin!.companyId!);
    res.json(users);
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Nutzer' });
  }
});

/**
 * Get company documents
 * GET /api/company-admin/documents
 */
router.get('/documents', authenticateAdmin, requireCompanyAdmin, async (req: AdminAuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        companyId: req.admin!.companyId!,
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
    res.status(500).json({ error: 'Fehler beim Abrufen der Dokumente' });
  }
});

/**
 * Upload company document
 * POST /api/company-admin/documents
 */
router.post(
  '/documents',
  authenticateAdmin,
  requireCompanyAdmin,
  upload.single('file'),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Keine Datei hochgeladen' });
      }

      const filePath = req.file.path;
      const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

      // Extract text from file
      const fileBuffer = fs.readFileSync(filePath);
      const extractionResult = await extractText(fileBuffer, fileType);
      const extractedText = extractionResult.text || '';

      // Get admin's user record to associate document
      const admin = await prisma.admin.findUnique({
        where: { id: req.admin!.adminId },
        select: { companyId: true },
      });

      // Create a system user for the company if needed
      let companyUser = await prisma.user.findFirst({
        where: {
          companyId: req.admin!.companyId!,
          email: `system@${req.admin!.companyId}.internal`,
        },
      });

      if (!companyUser) {
        companyUser = await prisma.user.create({
          data: {
            email: `system@${req.admin!.companyId}.internal`,
            passwordHash: null,
            authProvider: 'system',
            companyId: req.admin!.companyId!,
          },
        });
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          userId: companyUser.id,
          companyId: req.admin!.companyId!,
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
 * Delete company document
 * DELETE /api/company-admin/documents/:id
 */
router.delete(
  '/documents/:id',
  authenticateAdmin,
  requireCompanyAdmin,
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const documentId = req.params.id;

      // Verify document belongs to this company
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          companyId: req.admin!.companyId!,
          category: 'company',
        },
      });

      if (!document) {
        return res.status(404).json({ error: 'Dokument nicht gefunden' });
      }

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId },
      });

      res.json({ message: 'Dokument erfolgreich gelöscht' });
    } catch (error) {
      console.error('Delete company document error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Dokuments' });
    }
  }
);

export default router;
