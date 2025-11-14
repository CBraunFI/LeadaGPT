import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all themenpakete with user progress
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const themenpakete = await prisma.themenPaket.findMany({
      include: {
        progress: {
          where: { userId: req.user!.userId },
        },
      },
    });

    const result = themenpakete.map((tp) => ({
      id: tp.id,
      title: tp.title,
      description: tp.description,
      duration: tp.duration,
      unitsPerDay: tp.unitsPerDay,
      category: tp.category,
      status: tp.progress[0]?.status || 'not_started',
      progress: tp.progress[0] || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get themenpakete error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Themenpakete' });
  }
});

// Get single themenpaket with units
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const themenpaket = await prisma.themenPaket.findUnique({
      where: { id: req.params.id },
      include: {
        units: {
          orderBy: { order: 'asc' },
        },
        progress: {
          where: { userId: req.user!.userId },
        },
      },
    });

    if (!themenpaket) {
      return res.status(404).json({ error: 'Themenpaket nicht gefunden' });
    }

    res.json({
      ...themenpaket,
      status: themenpaket.progress[0]?.status || 'not_started',
      userProgress: themenpaket.progress[0] || null,
    });
  } catch (error) {
    console.error('Get themenpaket error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Themenpakets' });
  }
});

// Start themenpaket
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get the themenpaket
    const themenPaket = await prisma.themenPaket.findUnique({
      where: { id: req.params.id },
    });

    if (!themenPaket) {
      return res.status(404).json({ error: 'Themenpaket nicht gefunden' });
    }

    // Check if progress already exists
    const existingProgress = await prisma.userThemenPaketProgress.findUnique({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      include: {
        chatSession: true,
      },
    });

    let chatSession;
    let progress;

    if (existingProgress && existingProgress.chatSession) {
      // Reactivate existing progress and use existing chat
      progress = await prisma.userThemenPaketProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: 'active',
          startedAt: new Date(), // Reset start date
          currentDay: 1,
          currentUnit: 1,
        },
        include: {
          chatSession: true,
        },
      });
      chatSession = existingProgress.chatSession;
    } else {
      // Create new chat session for this themenpaket
      chatSession = await prisma.chatSession.create({
        data: {
          userId: req.user!.userId,
          title: `Themenpaket: ${themenPaket.title}`,
        },
      });

      // Create or update progress
      progress = await prisma.userThemenPaketProgress.upsert({
        where: {
          userId_themenPaketId: {
            userId: req.user!.userId,
            themenPaketId: req.params.id,
          },
        },
        create: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
          chatSessionId: chatSession.id,
          status: 'active',
          currentDay: 1,
          currentUnit: 1,
        },
        update: {
          chatSessionId: chatSession.id,
          status: 'active',
          startedAt: new Date(),
          currentDay: 1,
          currentUnit: 1,
        },
        include: {
          chatSession: true,
        },
      });
    }

    res.json({
      progress,
      chatSessionId: chatSession.id,
    });
  } catch (error) {
    console.error('Start themenpaket error:', error);
    res.status(500).json({ error: 'Fehler beim Starten des Themenpakets' });
  }
});

// Pause themenpaket
router.post('/:id/pause', authenticate, async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userThemenPaketProgress.update({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      data: {
        status: 'paused',
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Pause themenpaket error:', error);
    res.status(500).json({ error: 'Fehler beim Pausieren des Themenpakets' });
  }
});

// Continue themenpaket
router.post('/:id/continue', authenticate, async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userThemenPaketProgress.update({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      data: {
        status: 'active',
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Continue themenpaket error:', error);
    res.status(500).json({ error: 'Fehler beim Fortsetzen des Themenpakets' });
  }
});

// Get user's progress for all themenpakete
router.get('/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userThemenPaketProgress.findMany({
      where: { userId: req.user!.userId },
      include: {
        themenPaket: true,
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Fortschritts' });
  }
});

export default router;
