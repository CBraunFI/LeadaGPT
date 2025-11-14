import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getChatCompletion, generateChatTitle, generateThemenPaketUnit, UserContext } from '../services/openai.service';
import { getDocumentContext } from './documents.routes';
import {
  extractProfileInformation,
  mergeProfileInfo,
  isProfileComplete,
} from '../services/profileExtraction.service';
import { analyzeLanguageStyle, extractUserMessages } from '../services/languageStyle.service';

const router = Router();

// Helper function to extract routine suggestions from AI response
function extractRoutineSuggestion(content: string): any | null {
  const routineRegex = /\[ROUTINE_VORSCHLAG\]([\s\S]*?)\[\/ROUTINE_VORSCHLAG\]/;
  const match = content.match(routineRegex);

  if (!match) return null;

  const suggestionText = match[1];
  const titleMatch = suggestionText.match(/Titel:\s*(.+)/);
  const descMatch = suggestionText.match(/Beschreibung:\s*(.+)/);
  const freqMatch = suggestionText.match(/Frequenz:\s*(daily|weekly|monthly|custom)/);
  const targetMatch = suggestionText.match(/Ziel:\s*(\d+)/);

  if (!titleMatch || !descMatch || !freqMatch) return null;

  return {
    title: titleMatch[1].trim(),
    description: descMatch[1].trim(),
    frequency: freqMatch[1].trim(),
    target: targetMatch ? parseInt(targetMatch[1]) : null,
  };
}

// Helper function to remove routine suggestion tags from content
function cleanRoutineSuggestionTags(content: string): string {
  return content.replace(/\[ROUTINE_VORSCHLAG\][\s\S]*?\[\/ROUTINE_VORSCHLAG\]/g, '').trim();
}

// Helper function to generate and deliver pending Themenpaket units
async function deliverPendingThemenPaketUnits(sessionId: string, userId: string) {
  try {
    // Check if this chat has an active Themenpaket
    const themenPaketProgress = await prisma.userThemenPaketProgress.findFirst({
      where: {
        chatSessionId: sessionId,
        status: 'active',
      },
      include: {
        themenPaket: true,
      },
    });

    if (!themenPaketProgress) {
      return; // No active Themenpaket for this chat
    }

    // Calculate which day we're on
    const startDate = new Date(themenPaketProgress.startedAt);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(daysPassed + 1, themenPaketProgress.themenPaket.duration);

    // Check if we've completed the Themenpaket
    if (currentDay > themenPaketProgress.themenPaket.duration) {
      // Mark as completed if not already
      if (themenPaketProgress.status === 'active') {
        await prisma.userThemenPaketProgress.update({
          where: { id: themenPaketProgress.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      }
      return;
    }

    // Get user profile for context
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Get document context
    const documentsContext = await getDocumentContext(userId);

    const userContext: UserContext | undefined = profile
      ? {
          profile: {
            age: profile.age || undefined,
            role: profile.role || undefined,
            teamSize: profile.teamSize || undefined,
            goals: profile.goals ? JSON.parse(profile.goals) : undefined,
            onboardingComplete: profile.onboardingComplete,
          },
          documentsContext: documentsContext || undefined,
        }
      : documentsContext
      ? { documentsContext }
      : undefined;

    // Check which units have already been delivered for the current day
    const existingUnits = await prisma.message.findMany({
      where: {
        sessionId,
        role: 'assistant',
        metadata: {
          contains: `"day":${currentDay}`,
        },
      },
    });

    const existingUnitNumbers = existingUnits
      .map(msg => {
        try {
          const metadata = JSON.parse(msg.metadata || '{}');
          return metadata.type === 'themenpaket_unit' && metadata.day === currentDay
            ? metadata.unit
            : null;
        } catch {
          return null;
        }
      })
      .filter(u => u !== null);

    // Generate missing units for today
    const unitsPerDay = themenPaketProgress.themenPaket.unitsPerDay;
    for (let unit = 1; unit <= unitsPerDay; unit++) {
      if (!existingUnitNumbers.includes(unit)) {
        // Generate this unit
        const content = await generateThemenPaketUnit({
          themenPaketTitle: themenPaketProgress.themenPaket.title,
          day: currentDay,
          unit,
          totalDays: themenPaketProgress.themenPaket.duration,
          unitsPerDay,
          userContext,
        });

        // Save as message
        await prisma.message.create({
          data: {
            sessionId,
            role: 'assistant',
            content,
            metadata: JSON.stringify({
              type: 'themenpaket_unit',
              day: currentDay,
              unit,
              themenPaketId: themenPaketProgress.themenPaketId,
            }),
          },
        });
      }
    }

    // Update progress
    await prisma.userThemenPaketProgress.update({
      where: { id: themenPaketProgress.id },
      data: {
        currentDay,
        lastAccessedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error delivering Themenpaket units:', error);
    // Don't throw - we don't want to block chat loading
  }
}

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
      include: {
        messages: true,
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
    // First, deliver any pending Themenpaket units
    await deliverPendingThemenPaketUnits(req.params.id, req.user!.userId);

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
  async (req: AuthRequest, res: Response) => {
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

      // Get document context
      const documentsContext = await getDocumentContext(req.user!.userId);

      // Analyze language style from previous messages
      const userMessagesContent = extractUserMessages(
        session.messages.map(msg => ({ role: msg.role, content: msg.content }))
      );
      const languageStyle = analyzeLanguageStyle(userMessagesContent);

      // Build user context
      const userContext: UserContext = {
        profile: profile
          ? {
              age: profile.age || undefined,
              role: profile.role || undefined,
              teamSize: profile.teamSize || undefined,
              goals: profile.goals ? JSON.parse(profile.goals) : undefined,
              onboardingComplete: profile.onboardingComplete,
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
        documentsContext: documentsContext || undefined,
        languageStyle: languageStyle?.description || undefined,
      };

      // Prepare messages for OpenAI
      const chatHistory = session.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      chatHistory.push({ role: 'user', content });

      // Get AI response
      const aiResponse = await getChatCompletion(chatHistory, userContext);

      // Extract routine suggestion if present
      const routineSuggestion = extractRoutineSuggestion(aiResponse);

      // Clean content from routine tags for display
      const cleanedContent = cleanRoutineSuggestionTags(aiResponse);

      // Prepare metadata
      const metadata: any = {};
      if (routineSuggestion) {
        metadata.routine_suggestion = routineSuggestion;
      }

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: cleanedContent,
          metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        },
      });

      // Extract profile information from conversation and update profile
      try {
        const extracted = await extractProfileInformation(
          content,
          aiResponse,
          profile
        );

        if (extracted.hasNewInfo) {
          console.log('📝 Neue Profilinformationen gefunden:', extracted);

          // Merge with existing profile
          const updatedProfileData = mergeProfileInfo(profile, extracted);

          // Check if profile is now complete
          const profileComplete = isProfileComplete(updatedProfileData);

          // Update profile in database
          await prisma.userProfile.update({
            where: { userId: req.user!.userId },
            data: {
              age: updatedProfileData.age,
              gender: updatedProfileData.gender,
              role: updatedProfileData.role,
              industry: updatedProfileData.industry,
              teamSize: updatedProfileData.teamSize,
              leadershipYears: updatedProfileData.leadershipYears,
              goals: updatedProfileData.goals ? JSON.stringify(updatedProfileData.goals) : profile?.goals,
              onboardingComplete: profileComplete || profile?.onboardingComplete || false,
            },
          });

          console.log('✅ Profil automatisch aktualisiert');
        }
      } catch (error) {
        console.error('Error extracting/updating profile:', error);
        // Don't fail the request if profile extraction fails
      }

      // Generate title after first exchange (2 messages: user + assistant)
      if (session.messages.length === 0 && !session.title) {
        try {
          const titleMessages = [
            { role: 'user' as const, content },
            { role: 'assistant' as const, content: aiResponse }
          ];
          const generatedTitle = await generateChatTitle(titleMessages);

          await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
              title: generatedTitle,
              updatedAt: new Date()
            },
          });
        } catch (error) {
          console.error('Error generating chat title:', error);
          // Continue even if title generation fails
        }
      } else {
        // Just update timestamp
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
      }

      // Return full session with all messages
      const updatedSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      res.json(updatedSession);
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
