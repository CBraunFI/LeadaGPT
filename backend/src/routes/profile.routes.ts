import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profil nicht gefunden' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Profils' });
  }
});

// Update user profile
router.put(
  '/',
  authenticate,
  [
    body('age').optional().isInt({ min: 18, max: 100 }),
    body('gender').optional().isString(),
    body('role').optional().isString(),
    body('industry').optional().isString(),
    body('teamSize').optional().isInt({ min: 0 }),
    body('leadershipYears').optional().isInt({ min: 0 }),
    body('goals').optional().isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { age, gender, role, industry, teamSize, leadershipYears, goals } =
        req.body;

      const profile = await prisma.userProfile.update({
        where: { userId: req.user!.userId },
        data: {
          age,
          gender,
          role,
          industry,
          teamSize,
          leadershipYears,
          goals,
        },
      });

      res.json(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
    }
  }
);

// Complete onboarding
router.post('/onboarding', authenticate, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.userProfile.update({
      where: { userId: req.user!.userId },
      data: {
        onboardingComplete: true,
      },
    });

    res.json(profile);
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Fehler beim Abschließen des Onboardings' });
  }
});

export default router;
