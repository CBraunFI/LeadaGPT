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
    const progress = await prisma.userThemenPaketProgress.upsert({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      create: {
        userId: req.user!.userId,
        themenPaketId: req.params.id,
        status: 'active',
        currentDay: 1,
        currentUnit: 1,
      },
      update: {
        status: 'active',
      },
    });

    res.json(progress);
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

// Get next learning unit
router.get('/:id/next-unit', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get user's progress
    const progress = await prisma.userThemenPaketProgress.findUnique({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      include: {
        themenPaket: true,
      },
    });

    if (!progress) {
      return res.status(404).json({ error: 'Themenpaket nicht gestartet' });
    }

    // Get the next learning unit
    const nextUnit = await prisma.learningUnit.findFirst({
      where: {
        themenPaketId: req.params.id,
        day: progress.currentDay,
        unitNumber: progress.currentUnit,
      },
    });

    if (!nextUnit) {
      return res.status(404).json({ error: 'Keine weitere Lerneinheit gefunden' });
    }

    res.json({
      unit: nextUnit,
      progress: {
        currentDay: progress.currentDay,
        currentUnit: progress.currentUnit,
        totalDays: progress.themenPaket.duration,
        totalUnits: progress.themenPaket.duration * progress.themenPaket.unitsPerDay,
      },
    });
  } catch (error) {
    console.error('Get next unit error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der nächsten Lerneinheit' });
  }
});

// Advance to next unit
router.post('/:id/advance', authenticate, async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userThemenPaketProgress.findUnique({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      include: {
        themenPaket: true,
      },
    });

    if (!progress) {
      return res.status(404).json({ error: 'Themenpaket nicht gestartet' });
    }

    // Calculate next unit
    let nextDay = progress.currentDay;
    let nextUnit = progress.currentUnit + 1;

    if (nextUnit > progress.themenPaket.unitsPerDay) {
      nextDay += 1;
      nextUnit = 1;
    }

    // Check if completed
    const isCompleted = nextDay > progress.themenPaket.duration;

    const updatedProgress = await prisma.userThemenPaketProgress.update({
      where: {
        userId_themenPaketId: {
          userId: req.user!.userId,
          themenPaketId: req.params.id,
        },
      },
      data: {
        currentDay: isCompleted ? progress.currentDay : nextDay,
        currentUnit: isCompleted ? progress.currentUnit : nextUnit,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : null,
      },
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error('Advance unit error:', error);
    res.status(500).json({ error: 'Fehler beim Fortschreiten zur nächsten Einheit' });
  }
});

export default router;
