import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all routines for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const routines = await prisma.routine.findMany({
      where: { userId: req.user!.userId },
      include: {
        entries: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 entries
        },
      },
    });

    res.json(routines);
  } catch (error) {
    console.error('Get routines error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Routinen' });
  }
});

// Create routine
router.post(
  '/',
  authenticate,
  [
    body('title').isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('frequency').isIn(['daily', 'weekly', 'monthly', 'custom']),
    body('target').optional().isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, frequency, target } = req.body;

      const routine = await prisma.routine.create({
        data: {
          userId: req.user!.userId,
          title,
          description,
          frequency,
          target,
        },
        include: {
          entries: true,
        },
      });

      res.status(201).json(routine);
    } catch (error) {
      console.error('Create routine error:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Routine' });
    }
  }
);

// Update routine
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().isString(),
    body('frequency').optional().isIn(['daily', 'weekly', 'custom']),
    body('target').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['active', 'paused', 'completed']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, frequency, target, status } = req.body;

      const routine = await prisma.routine.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
        },
        data: {
          title,
          description,
          frequency,
          target,
          status,
        },
      });

      if (routine.count === 0) {
        return res.status(404).json({ error: 'Routine nicht gefunden' });
      }

      const updated = await prisma.routine.findUnique({
        where: { id: req.params.id },
      });

      res.json(updated);
    } catch (error) {
      console.error('Update routine error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Routine' });
    }
  }
);

// Delete routine
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.routine.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    res.json({ message: 'Routine gelöscht' });
  } catch (error) {
    console.error('Delete routine error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Routine' });
  }
});

// Add routine entry
router.post(
  '/:id/entries',
  authenticate,
  [
    body('date').isISO8601(),
    body('completed').isBoolean(),
    body('note').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date, completed, note } = req.body;

      // Verify routine belongs to user
      const routine = await prisma.routine.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
        },
      });

      if (!routine) {
        return res.status(404).json({ error: 'Routine nicht gefunden' });
      }

      const entry = await prisma.routineEntry.create({
        data: {
          routineId: req.params.id,
          date: new Date(date),
          completed,
          note,
        },
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error('Add routine entry error:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen des Eintrags' });
    }
  }
);

// Get routine stats
router.get('/:id/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const routine = await prisma.routine.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        entries: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Routine nicht gefunden' });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const lastWeekEntries = routine.entries.filter(
      (e) => e.date >= weekAgo && e.completed
    );
    const lastMonthEntries = routine.entries.filter(
      (e) => e.date >= monthAgo && e.completed
    );

    res.json({
      routine: {
        id: routine.id,
        title: routine.title,
        frequency: routine.frequency,
        target: routine.target,
      },
      stats: {
        lastWeek: lastWeekEntries.length,
        lastMonth: lastMonthEntries.length,
        total: routine.entries.filter((e) => e.completed).length,
      },
    });
  } catch (error) {
    console.error('Get routine stats error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});

export default router;
