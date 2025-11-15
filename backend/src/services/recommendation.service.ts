import prisma from '../config/database';
import { getChatCompletion } from './openai.service';

/**
 * Recommendation Service
 *
 * Generates personalized Themenpaket recommendations based on:
 * - User profile (role, goals, team size, experience)
 * - Chat history (topics discussed, challenges mentioned)
 * - Current Themenpakete progress
 * - Usage patterns
 */

interface RecommendationContext {
  profile: {
    firstName?: string;
    role?: string;
    industry?: string;
    teamSize?: number;
    leadershipYears?: number;
    goals?: string[];
  };
  chatTopics: string[];
  activethemenpakete: string[];
  completedThemenpakete: string[];
}

/**
 * Analyzes user's recent chat messages to extract discussed topics
 */
async function extractChatTopics(userId: string): Promise<string[]> {
  const recentMessages = await prisma.message.findMany({
    where: {
      session: {
        userId,
      },
      role: 'user',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Last 50 user messages
    select: {
      content: true,
    },
  });

  if (recentMessages.length === 0) {
    return [];
  }

  // Use AI to extract key topics from messages
  const messagesText = recentMessages.map(m => m.content).join('\n');

  const prompt = `Analysiere die folgenden Nutzer-Nachrichten und extrahiere die 5-7 wichtigsten diskutierten Themen und Herausforderungen. Gib nur die Themen als komma-separierte Liste zurück, ohne Nummerierung oder Erklärungen.

Nachrichten:
${messagesText}

Themen:`;

  try {
    const response = await getChatCompletion([
      { role: 'system', content: 'Du bist ein Experte für die Analyse von Führungsthemen.' },
      { role: 'user', content: prompt },
    ]);

    return response.split(',').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error('Error extracting chat topics:', error);
    return [];
  }
}

/**
 * Gathers recommendation context for a user
 */
async function gatherRecommendationContext(userId: string): Promise<RecommendationContext> {
  // Get user profile
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  // Get chat topics
  const chatTopics = await extractChatTopics(userId);

  // Get Themenpakete progress
  const progress = await prisma.userThemenPaketProgress.findMany({
    where: { userId },
    include: {
      themenPaket: {
        select: {
          title: true,
        },
      },
    },
  });

  const activeThemenpakete = progress
    .filter(p => p.status === 'active')
    .map(p => p.themenPaket.title);

  const completedThemenpakete = progress
    .filter(p => p.status === 'completed')
    .map(p => p.themenPaket.title);

  return {
    profile: {
      firstName: userProfile?.firstName || undefined,
      role: userProfile?.role || undefined,
      industry: userProfile?.industry || undefined,
      teamSize: userProfile?.teamSize || undefined,
      leadershipYears: userProfile?.leadershipYears || undefined,
      goals: userProfile?.goals ? JSON.parse(userProfile.goals) : [],
    },
    chatTopics,
    activethemenpakete: activeThemenpakete,
    completedThemenpakete: completedThemenpakete,
  };
}

/**
 * Generates 5 personalized Themenpaket recommendations using AI
 */
export async function generateRecommendations(userId: string): Promise<string[]> {
  // Gather context
  const context = await gatherRecommendationContext(userId);

  // Get all available Themenpakete
  const allThemenpakete = await prisma.themenPaket.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
    },
  });

  // Build AI prompt
  const prompt = `Du bist ein Experte für Führungskräfteentwicklung. Analysiere das folgende Nutzerprofil und empfehle die 5 passendsten Themenpakete aus der unten stehenden Liste.

## NUTZERPROFIL:
${context.profile.role ? `Rolle: ${context.profile.role}` : ''}
${context.profile.industry ? `Branche: ${context.profile.industry}` : ''}
${context.profile.teamSize ? `Teamgröße: ${context.profile.teamSize}` : ''}
${context.profile.leadershipYears ? `Führungserfahrung: ${context.profile.leadershipYears} Jahre` : ''}
${context.profile.goals && context.profile.goals.length > 0 ? `Ziele: ${context.profile.goals.join(', ')}` : ''}

${context.chatTopics.length > 0 ? `## DISKUTIERTE THEMEN:
${context.chatTopics.join(', ')}` : ''}

${context.activethemenpakete.length > 0 ? `## AKTIVE THEMENPAKETE:
${context.activethemenpakete.join(', ')}` : ''}

${context.completedThemenpakete.length > 0 ? `## ABGESCHLOSSENE THEMENPAKETE:
${context.completedThemenpakete.join(', ')}` : ''}

## VERFÜGBARE THEMENPAKETE:
${allThemenpakete.map(tp => `- ${tp.title} (${tp.category || 'Allgemein'}): ${tp.description}`).join('\n')}

## AUFGABE:
Wähle die 5 Themenpakete aus, die am besten zu diesem Nutzer passen. Berücksichtige:
1. Die aktuelle Rolle und Erfahrung
2. Diskutierte Herausforderungen in Chats
3. Noch nicht gestartete Themenpakete (vermeide aktive/abgeschlossene)
4. Logische Progression (vom Grundlegenden zum Fortgeschrittenen)
5. Vielfalt der Kategorien

Gib NUR die exakten Titel der 5 empfohlenen Themenpakete zurück, jeweils in einer neuen Zeile. Keine Nummerierung, keine Erklärungen.`;

  try {
    const response = await getChatCompletion([
      { role: 'system', content: 'Du bist ein Experte für Führungskräfteentwicklung und Lernpfad-Empfehlungen.' },
      { role: 'user', content: prompt },
    ]);

    // Parse response - expect 5 titles, one per line
    const recommendedTitles = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 5); // Ensure max 5

    // Map titles to IDs
    const recommendedIds: string[] = [];
    for (const title of recommendedTitles) {
      const themenpaket = allThemenpakete.find(tp =>
        tp.title.toLowerCase() === title.toLowerCase() ||
        title.toLowerCase().includes(tp.title.toLowerCase())
      );
      if (themenpaket) {
        recommendedIds.push(themenpaket.id);
      }
    }

    // If we didn't get 5 recommendations, fill with popular ones
    if (recommendedIds.length < 5) {
      const remaining = allThemenpakete
        .filter(tp => !recommendedIds.includes(tp.id))
        .slice(0, 5 - recommendedIds.length)
        .map(tp => tp.id);
      recommendedIds.push(...remaining);
    }

    return recommendedIds.slice(0, 5);
  } catch (error) {
    console.error('Error generating recommendations:', error);

    // Fallback: return first 5 Themenpakete
    return allThemenpakete.slice(0, 5).map(tp => tp.id);
  }
}
