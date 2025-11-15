import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateProfileSummary } from '../services/summary.service';
import { getChatCompletion } from '../services/openai.service';
import { getOnboardingSystemPrompt } from '../config/onboarding-prompt';

const router = Router();

// Get user profile
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
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
    body('preferredLanguage').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { age, gender, role, industry, teamSize, leadershipYears, goals, preferredLanguage } =
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
          preferredLanguage,
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
router.post('/onboarding', authenticate, async (req: AuthRequest, res: Response) => {
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

// Get AI-generated profile summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await generateProfileSummary(req.user!.userId);
    res.json({ summary });
  } catch (error) {
    console.error('Get profile summary error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Profil-Zusammenfassung' });
  }
});

// Get or create Profile Reflection Chat
router.get('/reflection-chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if chat already exists
    let chat = await prisma.chatSession.findFirst({
      where: {
        userId: req.user!.userId,
        chatType: 'profil',
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Create if doesn't exist
    if (!chat) {
      chat = await prisma.chatSession.create({
        data: {
          userId: req.user!.userId,
          title: 'Meine Entwicklung',
          chatType: 'profil',
          isPinned: true,
        },
        include: {
          messages: true,
        },
      });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get profile reflection chat error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Reflexions-Chats' });
  }
});

// Get or create Onboarding Chat
router.get('/onboarding-chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get user profile for language
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    const userLanguage = userProfile?.preferredLanguage || 'Deutsch';

    // Check if chat already exists
    let chat = await prisma.chatSession.findFirst({
      where: {
        userId: req.user!.userId,
        chatType: 'onboarding',
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Create if doesn't exist
    if (!chat) {
      chat = await prisma.chatSession.create({
        data: {
          userId: req.user!.userId,
          title: 'Willkommen bei Leada',
          chatType: 'onboarding',
          isPinned: true,
        },
        include: {
          messages: true,
        },
      });

      // Add welcome message from AI
      const systemPrompt = getOnboardingSystemPrompt(userLanguage);

      const welcomeMessage = await getChatCompletion([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Begrüße mich als neuen Nutzer und starte das Onboarding.',
        },
      ]);

      // Create system message
      await prisma.message.create({
        data: {
          sessionId: chat.id,
          role: 'system',
          content: systemPrompt,
        },
      });

      // Create initial AI message
      const aiMessage = await prisma.message.create({
        data: {
          sessionId: chat.id,
          role: 'assistant',
          content: welcomeMessage,
        },
      });

      // Reload chat with messages
      chat = await prisma.chatSession.findUnique({
        where: { id: chat.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })!;
    }

    res.json(chat);
  } catch (error) {
    console.error('Get onboarding chat error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Onboarding-Chats' });
  }
});

export default router;
