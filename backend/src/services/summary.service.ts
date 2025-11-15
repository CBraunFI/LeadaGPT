import { PrismaClient } from '@prisma/client';
import { getChatCompletion } from './openai.service';
import { getOrCompute, CACHE_TTL, deleteCache, invalidateCachePattern } from './cache.service';

const prisma = new PrismaClient();

interface ProfileSummaryData {
  profile: {
    firstName?: string;
    age?: number;
    gender?: string;
    role?: string;
    industry?: string;
    teamSize?: number;
    leadershipYears?: number;
    goals?: string[];
  };
  themenpakete: Array<{
    title: string;
    status: string;
    currentDay: number;
    totalDays: number;
  }>;
  chatActivity: {
    totalSessions: number;
    recentTopics: string[];
  };
  routines: Array<{
    title: string;
    frequency: string;
    completionRate: number;
  }>;
}

interface ActivitySummaryData {
  period: string;
  chatSessions: number;
  themenpaketProgress: Array<{
    title: string;
    daysCompleted: number;
  }>;
  routineCompletions: Array<{
    title: string;
    completedCount: number;
    target: number;
  }>;
  recentTopics: string[];
}

/**
 * Generate AI-powered profile summary (max 100 words)
 *
 * CACHED: 12 hours - profile changes slowly
 */
export async function generateProfileSummary(userId: string): Promise<string> {
  return getOrCompute(
    userId,
    'profile_summary',
    () => computeProfileSummary(userId),
    CACHE_TTL.PROFILE_SUMMARY
  );
}

/**
 * Internal: Compute profile summary (uncached)
 */
async function computeProfileSummary(userId: string): Promise<string> {
  try {
    // Gather all relevant profile data
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    const themenpakete = await prisma.userThemenPaketProgress.findMany({
      where: { userId },
      include: { themenPaket: true },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    });

    const chatSessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const routines = await prisma.routine.findMany({
      where: { userId, status: 'active' },
      include: {
        entries: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
            completed: true,
          },
        },
      },
    });

    // Build summary data
    const summaryData: ProfileSummaryData = {
      profile: {
        firstName: profile?.firstName || undefined,
        age: profile?.age || undefined,
        gender: profile?.gender || undefined,
        role: profile?.role || undefined,
        industry: profile?.industry || undefined,
        teamSize: profile?.teamSize || undefined,
        leadershipYears: profile?.leadershipYears || undefined,
        goals: profile?.goals ? JSON.parse(profile.goals) : undefined,
      },
      themenpakete: themenpakete.map(tp => ({
        title: tp.themenPaket.title,
        status: tp.status,
        currentDay: tp.currentDay,
        totalDays: tp.themenPaket.duration,
      })),
      chatActivity: {
        totalSessions: chatSessions.length,
        recentTopics: chatSessions
          .filter(s => s.title)
          .map(s => s.title!)
          .slice(0, 5),
      },
      routines: routines.map(r => ({
        title: r.title,
        frequency: r.frequency,
        completionRate: r.target
          ? (r.entries.length / r.target) * 100
          : r.entries.length,
      })),
    };

    // Generate AI summary
    const prompt = `Erstelle eine präzise, personalisierte Zusammenfassung der aktuellen Situation eines Nutzers basierend auf den folgenden Daten. Die Zusammenfassung soll maximal 100 Wörter lang sein und die gegenwärtige Entwicklung, Schwerpunkte und Situation des Nutzers beschreiben.

Nutzerdaten:
- Profil: ${JSON.stringify(summaryData.profile, null, 2)}
- Aktive Themenpakete: ${JSON.stringify(summaryData.themenpakete, null, 2)}
- Chat-Aktivität: ${JSON.stringify(summaryData.chatActivity, null, 2)}
- Routinen: ${JSON.stringify(summaryData.routines, null, 2)}

Erstelle eine zusammenhängende, natürliche Zusammenfassung in Fließtext-Form (max. 100 Wörter). Fokus auf die aktuelle Situation, Schwerpunkte und Entwicklung.`;

    const messages = [
      {
        role: 'system' as const,
        content: 'Du bist ein Experte für personalisierte Coaching-Zusammenfassungen. Deine Aufgabe ist es, präzise und einfühlsame Zusammenfassungen zu erstellen.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const summary = await getChatCompletion(messages);

    return summary;
  } catch (error) {
    console.error('Error generating profile summary:', error);
    return 'Profil-Zusammenfassung konnte nicht generiert werden.';
  }
}

/**
 * Generate AI-powered activity summary for dashboard (max 3 sentences, max 40 words)
 *
 * CACHED: Variable TTL based on period
 * - week: 1h (active data)
 * - month: 6h (semi-active)
 * - 3m/6m/all: 24h (historical data)
 */
export async function generateActivitySummary(
  userId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string> {
  // Determine TTL based on period
  const ttl =
    period === 'week'
      ? CACHE_TTL.DASHBOARD_WEEK
      : period === 'month'
      ? CACHE_TTL.DASHBOARD_MONTH
      : CACHE_TTL.DASHBOARD_LONG;

  const cacheKey = `dashboard_summary_${period}`;

  return getOrCompute(userId, cacheKey, () => computeActivitySummary(userId, period), ttl);
}

/**
 * Internal: Compute activity summary (uncached)
 */
async function computeActivitySummary(
  userId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string> {
  try {
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Gather activity data for period
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        userId,
        updatedAt: { gte: startDate },
      },
      include: {
        messages: {
          where: {
            createdAt: { gte: startDate },
          },
        },
      },
    });

    const themenpaketProgress = await prisma.userThemenPaketProgress.findMany({
      where: {
        userId,
        lastAccessedAt: { gte: startDate },
      },
      include: { themenPaket: true },
    });

    const routineEntries = await prisma.routineEntry.findMany({
      where: {
        routine: { userId },
        date: { gte: startDate.toISOString() },
        completed: true,
      },
      include: { routine: true },
    });

    // Extract topics from chat titles
    const recentTopics = chatSessions
      .filter(s => s.title && s.chatType === 'general')
      .map(s => s.title!)
      .slice(0, 10);

    const activityData: ActivitySummaryData = {
      period,
      chatSessions: chatSessions.length,
      themenpaketProgress: themenpaketProgress.map(tp => ({
        title: tp.themenPaket.title,
        daysCompleted: tp.currentDay,
      })),
      routineCompletions: Object.values(
        routineEntries.reduce((acc, entry) => {
          const key = entry.routine.title;
          if (!acc[key]) {
            acc[key] = {
              title: entry.routine.title,
              completedCount: 0,
              target: entry.routine.target || 0,
            };
          }
          acc[key].completedCount++;
          return acc;
        }, {} as Record<string, any>)
      ),
      recentTopics,
    };

    // Generate AI summary
    const periodLabel = {
      week: 'letzten 7 Tage',
      month: 'letzten Monat',
      '3months': 'letzten 3 Monate',
      '6months': 'letzten 6 Monate',
      all: 'Gesamtzeitraum',
    }[period];

    const prompt = `Erstelle eine sehr knappe Zusammenfassung der Nutzer-Aktivitäten für den Zeitraum: ${periodLabel}.

Aktivitätsdaten:
- Chat-Sessions: ${activityData.chatSessions}
- Themenpaket-Fortschritte: ${JSON.stringify(activityData.themenpaketProgress)}
- Routine-Durchführungen: ${JSON.stringify(activityData.routineCompletions)}
- Themen: ${activityData.recentTopics.join(', ')}

WICHTIG: Erstelle genau 1-3 kurze Sätze, maximal 40 Wörter insgesamt. Fokus auf: Schwerpunkte, Frequenz, Herausforderungen.`;

    const messages = [
      {
        role: 'system' as const,
        content: 'Du bist ein Experte für prägnante Aktivitätszusammenfassungen. Deine Antworten sind immer sehr kurz und präzise.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const summary = await getChatCompletion(messages);

    return summary;
  } catch (error) {
    console.error('Error generating activity summary:', error);
    return 'Aktivitätszusammenfassung konnte nicht generiert werden.';
  }
}

/**
 * Invalidate profile summary cache
 *
 * Call this when:
 * - User profile is updated
 * - User completes a major milestone
 */
export async function invalidateProfileSummary(userId: string): Promise<void> {
  await deleteCache(userId, 'profile_summary');
  console.log(`Invalidated profile summary cache for user ${userId}`);
}

/**
 * Invalidate all dashboard summaries
 *
 * Call this when:
 * - New chat session is created (significant activity)
 * - User starts/completes Themenpaket
 */
export async function invalidateDashboardSummaries(userId: string): Promise<void> {
  await invalidateCachePattern(userId, 'dashboard_summary_');
  console.log(`Invalidated all dashboard summaries for user ${userId}`);
}
