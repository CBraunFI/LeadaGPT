import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get branding for current user's company
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      // No company branding - return Leada defaults
      return res.json({
        hasCompanyBranding: false,
        logoUrl: null,
        accentColor: '#5D9FAD',
        companyName: null,
      });
    }

    // Return company branding
    res.json({
      hasCompanyBranding: true,
      logoUrl: user.company.logoUrl,
      accentColor: user.company.accentColor || '#5D9FAD',
      companyName: user.company.name,
    });
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Brandings' });
  }
});

export default router;
