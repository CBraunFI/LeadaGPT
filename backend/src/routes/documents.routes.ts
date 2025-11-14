import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  extractText,
  isSupportedFileType,
  getFileExtension,
} from '../services/textExtraction.service';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isSupportedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nicht unterstütztes Dateiformat. Erlaubt: PDF, DOCX, TXT'));
    }
  },
});

// Upload document
router.post(
  '/upload',
  authenticate,
  upload.single('document'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Keine Datei hochgeladen' });
      }

      const { category } = req.body;

      if (!category || !['personal', 'company'].includes(category)) {
        return res.status(400).json({ error: 'Ungültige Kategorie. Erlaubt: personal, company' });
      }

      const userId = req.user!.userId;
      const file = req.file;
      const fileType = getFileExtension(file.mimetype);

      // Extract text from the uploaded file
      console.log(`📄 Extrahiere Text aus ${file.originalname} (${fileType})...`);
      const extractionResult = await extractText(file.buffer, fileType);

      if (extractionResult.error) {
        return res.status(500).json({
          error: 'Fehler bei der Textextraktion',
          details: extractionResult.error,
        });
      }

      // Get user's company if the document is for company category
      let companyId = null;
      if (category === 'company') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { companyId: true },
        });
        companyId = user?.companyId || null;
      }

      // Save document metadata and extracted text to database
      const document = await prisma.document.create({
        data: {
          userId,
          companyId,
          filename: file.originalname,
          fileType,
          fileSize: file.size,
          category,
          extractedText: extractionResult.text,
          metadata: JSON.stringify({
            originalMimetype: file.mimetype,
            wordCount: extractionResult.wordCount,
            pageCount: extractionResult.pageCount,
            uploadedFrom: req.ip,
          }),
        },
      });

      console.log(`✅ Dokument gespeichert: ${document.filename} (ID: ${document.id})`);

      res.status(201).json({
        message: 'Dokument erfolgreich hochgeladen',
        document: {
          id: document.id,
          filename: document.filename,
          fileType: document.fileType,
          fileSize: document.fileSize,
          category: document.category,
          uploadedAt: document.uploadedAt,
          wordCount: extractionResult.wordCount,
          pageCount: extractionResult.pageCount,
        },
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Fehler beim Hochladen des Dokuments' });
    }
  }
);

// Get all documents for the authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { category } = req.query;

    const where: any = { userId };
    if (category && ['personal', 'company'].includes(category as string)) {
      where.category = category;
    }

    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        category: true,
        metadata: true,
        uploadedAt: true,
        updatedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    // Parse metadata for each document
    const documentsWithParsedMetadata = documents.map((doc) => ({
      ...doc,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
    }));

    res.json(documentsWithParsedMetadata);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Dokumente' });
  }
});

// Get a specific document by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const documentId = req.params.id;

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }

    res.json({
      ...document,
      metadata: document.metadata ? JSON.parse(document.metadata) : null,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Dokuments' });
  }
});

// Delete a document
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const documentId = req.params.id;

    // Check if document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId },
    });

    console.log(`🗑️ Dokument gelöscht: ${document.filename} (ID: ${documentId})`);

    res.json({
      message: 'Dokument erfolgreich gelöscht',
      deletedDocument: {
        id: document.id,
        filename: document.filename,
      },
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Dokuments' });
  }
});

// Get document context for AI (internal use by chat service)
export const getDocumentContext = async (userId: string): Promise<string> => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        filename: true,
        category: true,
        extractedText: true,
      },
    });

    if (documents.length === 0) {
      return '';
    }

    let context = '\n\n## DOKUMENTE DES NUTZERS:\n\n';

    const personalDocs = documents.filter((d) => d.category === 'personal');
    const companyDocs = documents.filter((d) => d.category === 'company');

    if (personalDocs.length > 0) {
      context += '### Persönliche Dokumente:\n';
      personalDocs.forEach((doc) => {
        context += `\n**${doc.filename}:**\n${doc.extractedText}\n`;
      });
    }

    if (companyDocs.length > 0) {
      context += '\n### Unternehmens-Dokumente:\n';
      companyDocs.forEach((doc) => {
        context += `\n**${doc.filename}:**\n${doc.extractedText}\n`;
      });
    }

    return context;
  } catch (error) {
    console.error('Error getting document context:', error);
    return '';
  }
};

export default router;
