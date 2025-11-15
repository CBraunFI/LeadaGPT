import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getChatCompletion, UserContext } from '../services/openai.service';

const router = Router();

// Get all sessions for user
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Sessions' });
  }
});

// Create new session
router.post('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const session = await prisma.chatSession.create({
      data: {
        userId: req.user!.userId,
        title: req.body.title || null,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Session' });
  }
});

// Get session with messages
router.get('/sessions/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session nicht gefunden' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Session' });
  }
});

// Send message to session
router.post(
  '/sessions/:id/messages',
  authenticate,
  [body('content').isString().trim().isLength({ min: 1, max: 2000 })],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sessionId = req.params.id;
      const { content } = req.body;

      // Verify session belongs to user
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId: req.user!.userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session nicht gefunden' });
      }

      // Save user message
      const userMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content,
        },
      });

      // Get user profile and context
      const profile = await prisma.userProfile.findUnique({
        where: { userId: req.user!.userId },
      });

      const activeThemenpakete = await prisma.userThemenPaketProgress.findMany({
        where: {
          userId: req.user!.userId,
          status: 'active',
        },
        include: {
          themenPaket: true,
        },
      });

      const activeRoutines = await prisma.routine.findMany({
        where: {
          userId: req.user!.userId,
          status: 'active',
        },
        include: {
          entries: {
            where: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
              completed: true,
            },
          },
        },
      });

      // Build user context
      const userContext: UserContext = {
        profile: profile
          ? {
              firstName: profile.firstName || undefined,
              age: profile.age || undefined,
              role: profile.role || undefined,
              teamSize: profile.teamSize || undefined,
              goals: profile.goals,
            }
          : undefined,
        activeThemenpakete: activeThemenpakete.map((tp) => ({
          title: tp.themenPaket.title,
          currentDay: tp.currentDay,
          totalDays: tp.themenPaket.duration,
        })),
        activeRoutines: activeRoutines.map((r) => ({
          title: r.title,
          completedThisWeek: r.entries.length,
          target: r.target || 0,
        })),
      };

      // Prepare messages for OpenAI
      const chatHistory = session.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      chatHistory.push({ role: 'user', content });

      // Get AI response
      const aiResponse = await getChatCompletion(chatHistory, userContext);

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: aiResponse,
        },
      });

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Fehler beim Senden der Nachricht' });
    }
  }
);

// Delete session
router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.chatSession.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    res.json({ message: 'Session gelöscht' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Session' });
  }
});

export default router;
