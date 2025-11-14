import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ADMIN: Seed themenpakete (temporary endpoint)
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const themenpakete = [
      {
        title: 'Konstruktives Feedback geben',
        description: 'Lernen Sie, wie Sie Feedback so formulieren, dass es motiviert und weiterbringt. Entwickeln Sie Ihre Feedbackkultur.',
        category: 'Kommunikation',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Konflikte im Team lösen',
        description: 'Konflikte professionell lösen und als Mediator zwischen Teammitgliedern agieren. Praxisnahe Techniken für den Arbeitsalltag.',
        category: 'Konfliktmanagement',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Effektiv delegieren',
        description: 'Lernen Sie, Aufgaben strategisch zu delegieren, Mitarbeiter zu entwickeln und sich auf Ihre wichtigsten Führungsaufgaben zu konzentrieren.',
        category: 'Delegation',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Mitarbeiter motivieren',
        description: 'Verstehen Sie, was Ihre Mitarbeiter antreibt und lernen Sie praxiserprobte Methoden, um intrinsische Motivation zu fördern.',
        category: 'Motivation',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Schwierige Gespräche führen',
        description: 'Meistern Sie herausfordernde Mitarbeitergespräche - von Kritik über Kündigungen bis zu Leistungsproblemen.',
        category: 'Kommunikation',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Agile Führung',
        description: 'Führen Sie in agilen Umgebungen erfolgreich. Scrum, Kanban und moderne Führungsansätze für dynamische Teams.',
        category: 'Agilität',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Resilienz aufbauen',
        description: 'Stärken Sie Ihre psychische Widerstandskraft und lernen Sie, mit Stress und Herausforderungen umzugehen.',
        category: 'Persönlichkeitsentwicklung',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Effektives Zeitmanagement',
        description: 'Optimieren Sie Ihre Zeit, setzen Sie Prioritäten richtig und erreichen Sie mehr mit weniger Stress.',
        category: 'Produktivität',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Design Thinking für Führungskräfte',
        description: 'Innovative Problemlösungen entwickeln mit der Design-Thinking-Methode. Praxisnah und umsetzbar.',
        category: 'Innovation',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Remote Teams führen',
        description: 'Erfolgreiche Führung verteilter Teams. Kommunikation, Vertrauen und Produktivität im Home-Office.',
        category: 'Remote Leadership',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Change Management',
        description: 'Veränderungsprozesse erfolgreich gestalten und Ihr Team durch Transformationen führen.',
        category: 'Veränderung',
        duration: 14,
        unitsPerDay: 2,
      },
      {
        title: 'Strategisches Denken entwickeln',
        description: 'Erweitern Sie Ihren strategischen Horizont und treffen Sie bessere langfristige Entscheidungen.',
        category: 'Strategie',
        duration: 14,
        unitsPerDay: 2,
      },
    ];

    const created = [];
    for (const tp of themenpakete) {
      const existing = await prisma.themenPaket.findFirst({
        where: { title: tp.title },
      });

      if (!existing) {
        const result = await prisma.themenPaket.create({ data: tp });
        created.push(result.title);
      }
    }

    res.json({
      message: 'Themenpakete seeded',
      created: created.length,
      titles: created,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Fehler beim Seeden' });
  }
});

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
