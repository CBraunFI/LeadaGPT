import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all weekly reports for user
router.get('/weekly', authenticate, async (req: AuthRequest, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      where: { userId: req.user!.userId },
      orderBy: { weekStart: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get weekly reports error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Reports' });
  }
});

// Get latest weekly report
router.get('/weekly/latest', authenticate, async (req: AuthRequest, res) => {
  try {
    const report = await prisma.weeklyReport.findFirst({
      where: { userId: req.user!.userId },
      orderBy: { weekStart: 'desc' },
    });

    if (!report) {
      return res.status(404).json({ error: 'Kein Report gefunden' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get latest report error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Reports' });
  }
});

// Generate weekly report
router.post('/weekly/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get chat messages from last week
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: req.user!.userId,
        updatedAt: {
          gte: weekAgo,
        },
      },
      include: {
        messages: {
          where: {
            role: 'user',
          },
        },
      },
    });

    // Extract topics from messages (simplified - in production use NLP)
    const topics: string[] = [];
    sessions.forEach((session) => {
      session.messages.forEach((msg) => {
        // Basic keyword extraction (in production, use proper NLP)
        const keywords = ['Feedback', 'Konflikt', 'Zeitmanagement', 'Team', 'Führung'];
        keywords.forEach((keyword) => {
          if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
            if (!topics.includes(keyword)) {
              topics.push(keyword);
            }
          }
        });
      });
    });

    // Get themenpakete progress
    const themenpaketeProgress = await prisma.userThemenPaketProgress.findMany({
      where: {
        userId: req.user!.userId,
        status: 'active',
      },
      include: {
        themenPaket: true,
      },
    });

    // Get routines progress
    const routines = await prisma.routine.findMany({
      where: {
        userId: req.user!.userId,
        status: 'active',
      },
      include: {
        entries: {
          where: {
            date: {
              gte: weekAgo,
            },
            completed: true,
          },
        },
      },
    });

    // Build progress data
    const progress = {
      themenpakete: themenpaketeProgress.map((tp) => ({
        title: tp.themenPaket.title,
        currentDay: tp.currentDay,
        totalDays: tp.themenPaket.duration,
        progress: Math.round((tp.currentDay / tp.themenPaket.duration) * 100),
      })),
      routines: routines.map((r) => ({
        title: r.title,
        completedDays: r.entries.length,
        targetDays: r.target || 7,
        progress:
          r.target && r.target > 0
            ? Math.round((r.entries.length / r.target) * 100)
            : 0,
      })),
    };

    // Generate recommendations (simplified - in production use ML/AI)
    const recommendations: string[] = [];
    if (topics.includes('Feedback')) {
      recommendations.push('Konstruktives Feedback geben');
    }
    if (topics.includes('Konflikt')) {
      recommendations.push('Konfliktklärung & Mediation');
    }
    if (topics.includes('Zeitmanagement')) {
      recommendations.push('Effektives Zeitmanagement');
    }

    // Create report
    const report = await prisma.weeklyReport.create({
      data: {
        userId: req.user!.userId,
        weekStart: weekAgo,
        weekEnd: now,
        topics: JSON.stringify(topics),
        progress: JSON.stringify(progress),
        recommendations: JSON.stringify(recommendations),
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Fehler beim Generieren des Reports' });
  }
});

export default router;
