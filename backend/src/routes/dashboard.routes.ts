import { Router, Response } from 'express';
import { query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateActivitySummary } from '../services/summary.service';

const router = Router();

// Get activity summary for a specific period
router.get(
  '/activity-summary',
  authenticate,
  [query('period').optional().isIn(['week', 'month', '3months', '6months', 'all'])],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const period = (req.query.period as 'week' | 'month' | '3months' | '6months' | 'all') || 'week';
      const summary = await generateActivitySummary(req.user!.userId, period);

      res.json({ summary, period });
    } catch (error) {
      console.error('Get activity summary error:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Aktivitätszusammenfassung' });
    }
  }
);

// Get or create KI-Briefing Chat
router.get('/ki-briefing-chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if chat already exists
    let chat = await prisma.chatSession.findFirst({
      where: {
        userId: req.user!.userId,
        chatType: 'ki-briefing',
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
          title: 'KI-Briefing',
          chatType: 'ki-briefing',
          isPinned: true,
        },
        include: {
          messages: true,
        },
      });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get KI-Briefing chat error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des KI-Briefing-Chats' });
  }
});

// Get dashboard statistics for a specific period
router.get(
  '/stats',
  authenticate,
  [query('period').optional().isIn(['week', 'month', '3months', '6months', 'all'])],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const period = (req.query.period as string) || 'week';

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6months':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get statistics
      const chatSessions = await prisma.chatSession.count({
        where: {
          userId: req.user!.userId,
          updatedAt: { gte: startDate },
        },
      });

      const messages = await prisma.message.count({
        where: {
          session: {
            userId: req.user!.userId,
          },
          createdAt: { gte: startDate },
          role: 'user',
        },
      });

      const activeThemenpakete = await prisma.userThemenPaketProgress.findMany({
        where: {
          userId: req.user!.userId,
          lastAccessedAt: { gte: startDate },
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
              date: { gte: startDate.toISOString() },
              completed: true,
            },
          },
        },
      });

      res.json({
        period,
        chatSessions,
        messages,
        themenpakete: activeThemenpakete.length,
        themenpaketeDetails: activeThemenpakete.map(tp => ({
          title: tp.themenPaket.title,
          currentDay: tp.currentDay,
          totalDays: tp.themenPaket.duration,
          progress: (tp.currentDay / tp.themenPaket.duration) * 100,
        })),
        routines: activeRoutines.length,
        routineCompletions: activeRoutines.reduce((sum, r) => sum + r.entries.length, 0),
        routineDetails: activeRoutines.map(r => ({
          title: r.title,
          completedInPeriod: r.entries.length,
          target: r.target || 0,
        })),
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Dashboard-Statistiken' });
    }
  }
);

export default router;
