import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user's company branding
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        company: true,
      },
    });

    if (!user || !user.company) {
      // Kein Company-Branding -> Default (Leada) zurückgeben
      return res.json({
        hasCompanyBranding: false,
        logoUrl: null,
        accentColor: '#5D9FAD', // Leada Default
      });
    }

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
