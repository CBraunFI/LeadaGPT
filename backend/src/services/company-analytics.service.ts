import prisma from '../config/database';
import { getChatCompletion } from './openai.service';
import { getOrCompute, CACHE_TTL } from './cache.service';

/**
 * Company Analytics Service
 *
 * Provides aggregated analytics for company admins:
 * - User activity across the company
 * - Themenpakete usage and completion rates
 * - Chat activity and trending topics
 * - Routine adoption and completion rates
 *
 * PERFORMANCE: Results are cached with variable TTL based on time period
 */

interface CompanyAnalytics {
  period: string;
  userMetrics: {
    totalUsers: number;
    activeUsers: number; // Users with activity in period
    newUsers: number; // Users created in period
  };
  themenpaketMetrics: {
    totalProgress: number;
    activeProgress: number;
    completedProgress: number;
    popularThemenpakete: Array<{
      title: string;
      userCount: number;
      avgCompletion: number;
    }>;
  };
  chatMetrics: {
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    topTopics: string[];
  };
  routineMetrics: {
    totalRoutines: number;
    activeRoutines: number;
    popularRoutines: Array<{
      title: string;
      userCount: number;
      avgCompletionRate: number;
    }>;
  };
}

/**
 * Get analytics for a company
 *
 * @param companyId - Company ID
 * @param period - Time period ('week' | 'month' | '3months' | '6months' | 'all')
 * @returns Company analytics data
 */
export async function getCompanyAnalytics(
  companyId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<CompanyAnalytics> {
  // Determine TTL based on period (same as individual dashboard)
  const ttl =
    period === 'week'
      ? CACHE_TTL.DASHBOARD_WEEK
      : period === 'month'
      ? CACHE_TTL.DASHBOARD_MONTH
      : CACHE_TTL.DASHBOARD_LONG;

  const cacheKey = `company_analytics_${period}`;

  return getOrCompute(
    companyId,
    cacheKey,
    () => computeCompanyAnalytics(companyId, period),
    ttl
  );
}

/**
 * Internal: Compute company analytics (uncached)
 */
async function computeCompanyAnalytics(
  companyId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<CompanyAnalytics> {
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

  // Get all users for this company
  const allUsers = await prisma.user.findMany({
    where: { companyId },
    select: { id: true, createdAt: true },
  });

  const totalUsers = allUsers.length;
  const newUsers = allUsers.filter((u) => u.createdAt >= startDate).length;

  // Get users with activity in period (chat or themenpaket activity)
  const activeChatUsers = await prisma.chatSession.findMany({
    where: {
      user: { companyId },
      updatedAt: { gte: startDate },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const activeThemenpaketUsers = await prisma.userThemenPaketProgress.findMany({
    where: {
      user: { companyId },
      lastAccessedAt: { gte: startDate },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const activeUserIds = new Set([
    ...activeChatUsers.map((s) => s.userId),
    ...activeThemenpaketUsers.map((tp) => tp.userId),
  ]);

  // Themenpakete metrics
  const allProgress = await prisma.userThemenPaketProgress.findMany({
    where: {
      user: { companyId },
    },
    include: {
      themenPaket: true,
    },
  });

  const activeProgress = allProgress.filter((p) => p.status === 'active').length;
  const completedProgress = allProgress.filter((p) => p.status === 'completed').length;

  // Popular Themenpakete
  const themenpaketStats = allProgress.reduce((acc, progress) => {
    const title = progress.themenPaket.title;
    if (!acc[title]) {
      acc[title] = {
        users: new Set<string>(),
        totalCompletion: 0,
        count: 0,
      };
    }
    acc[title].users.add(progress.userId);
    const completion = (progress.currentDay / progress.themenPaket.duration) * 100;
    acc[title].totalCompletion += completion;
    acc[title].count++;
    return acc;
  }, {} as Record<string, { users: Set<string>; totalCompletion: number; count: number }>);

  const popularThemenpakete = Object.entries(themenpaketStats)
    .map(([title, stats]) => ({
      title,
      userCount: stats.users.size,
      avgCompletion: Math.round(stats.totalCompletion / stats.count),
    }))
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 10); // Top 10

  // Chat metrics
  const chatSessions = await prisma.chatSession.findMany({
    where: {
      user: { companyId },
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

  const totalSessions = chatSessions.length;
  const totalMessages = chatSessions.reduce((sum, s) => sum + s.messages.length, 0);
  const avgMessagesPerSession =
    totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

  // Extract topics from chat titles
  const topTopics = chatSessions
    .filter((s) => s.title && s.chatType === 'general')
    .map((s) => s.title!)
    .slice(0, 20); // Top 20 for AI analysis

  // Routine metrics
  const allRoutines = await prisma.routine.findMany({
    where: {
      user: { companyId },
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

  const activeRoutines = allRoutines.filter((r) => r.status === 'active').length;

  // Popular routines
  const routineStats = allRoutines.reduce((acc, routine) => {
    const title = routine.title;
    if (!acc[title]) {
      acc[title] = {
        users: new Set<string>(),
        totalCompletions: 0,
        totalTargets: 0,
      };
    }
    acc[title].users.add(routine.userId);
    acc[title].totalCompletions += routine.entries.length;
    acc[title].totalTargets += routine.target || 0;
    return acc;
  }, {} as Record<string, { users: Set<string>; totalCompletions: number; totalTargets: number }>);

  const popularRoutines = Object.entries(routineStats)
    .map(([title, stats]) => ({
      title,
      userCount: stats.users.size,
      avgCompletionRate:
        stats.totalTargets > 0
          ? Math.round((stats.totalCompletions / stats.totalTargets) * 100)
          : 0,
    }))
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 10); // Top 10

  return {
    period,
    userMetrics: {
      totalUsers,
      activeUsers: activeUserIds.size,
      newUsers,
    },
    themenpaketMetrics: {
      totalProgress: allProgress.length,
      activeProgress,
      completedProgress,
      popularThemenpakete,
    },
    chatMetrics: {
      totalSessions,
      totalMessages,
      avgMessagesPerSession,
      topTopics,
    },
    routineMetrics: {
      totalRoutines: allRoutines.length,
      activeRoutines,
      popularRoutines,
    },
  };
}

/**
 * Generate AI summary of company analytics
 *
 * Similar to individual activity summaries but for the entire company.
 *
 * @param companyId - Company ID
 * @param period - Time period
 * @returns AI-generated summary (3-5 sentences, max 80 words)
 */
export async function generateCompanyAnalyticsSummary(
  companyId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string> {
  // Use same TTL as analytics
  const ttl =
    period === 'week'
      ? CACHE_TTL.DASHBOARD_WEEK
      : period === 'month'
      ? CACHE_TTL.DASHBOARD_MONTH
      : CACHE_TTL.DASHBOARD_LONG;

  const cacheKey = `company_summary_${period}`;

  return getOrCompute(
    companyId,
    cacheKey,
    () => computeCompanyAnalyticsSummary(companyId, period),
    ttl
  );
}

/**
 * Internal: Compute company analytics summary (uncached)
 */
async function computeCompanyAnalyticsSummary(
  companyId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string> {
  const analytics = await getCompanyAnalytics(companyId, period);

  const periodLabel = {
    week: 'letzten 7 Tage',
    month: 'letzten Monat',
    '3months': 'letzten 3 Monate',
    '6months': 'letzten 6 Monate',
    all: 'Gesamtzeitraum',
  }[period];

  const prompt = `Erstelle eine prägnante Zusammenfassung der Unternehmens-Aktivitäten für den Zeitraum: ${periodLabel}.

Daten:
- Nutzer: ${analytics.userMetrics.totalUsers} gesamt, ${analytics.userMetrics.activeUsers} aktiv, ${analytics.userMetrics.newUsers} neu
- Themenpakete: ${analytics.themenpaketMetrics.activeProgress} aktiv, ${analytics.themenpaketMetrics.completedProgress} abgeschlossen
- Beliebteste Themenpakete: ${analytics.themenpaketMetrics.popularThemenpakete
    .slice(0, 3)
    .map((t) => `${t.title} (${t.userCount} Nutzer)`)
    .join(', ')}
- Chat-Aktivität: ${analytics.chatMetrics.totalSessions} Sessions, ${analytics.chatMetrics.totalMessages} Nachrichten
- Routinen: ${analytics.routineMetrics.activeRoutines} aktiv

WICHTIG: Erstelle 3-5 kurze Sätze, maximal 80 Wörter insgesamt. Fokus auf: Engagement-Level, beliebte Themen, Trends.`;

  try {
    const summary = await getChatCompletion([
      {
        role: 'system',
        content:
          'Du bist ein Experte für die Analyse von Unternehmens-Lerndaten. Deine Antworten sind präzise und datenfokussiert.',
      },
      { role: 'user', content: prompt },
    ]);

    return summary;
  } catch (error) {
    console.error('Error generating company analytics summary:', error);
    return 'Zusammenfassung konnte nicht generiert werden.';
  }
}

/**
 * Get company users with their basic stats
 *
 * For admin user management view
 *
 * @param companyId - Company ID
 * @returns List of users with stats
 */
export async function getCompanyUsers(companyId: string): Promise<
  Array<{
    id: string;
    email: string;
    firstName?: string;
    createdAt: Date;
    lastActive?: Date;
    themenpaketCount: number;
    completedThemenpaketCount: number;
    chatSessionCount: number;
  }>
> {
  const users = await prisma.user.findMany({
    where: { companyId },
    include: {
      profile: {
        select: {
          firstName: true,
        },
      },
      themenPaketProgress: {
        select: {
          status: true,
        },
      },
      sessions: {
        select: {
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName || undefined,
    createdAt: user.createdAt,
    lastActive: user.sessions[0]?.updatedAt || undefined,
    themenpaketCount: user.themenPaketProgress.length,
    completedThemenpaketCount: user.themenPaketProgress.filter(
      (tp) => tp.status === 'completed'
    ).length,
    chatSessionCount: user.sessions.length,
  }));
}
