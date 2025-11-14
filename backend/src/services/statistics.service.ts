import prisma from '../config/database';

/**
 * Get total number of registered users
 */
export const getTotalUsers = async (): Promise<number> => {
  return await prisma.user.count();
};

/**
 * Get number of active users (users who have sent messages in the last 30 days)
 */
export const getActiveUsers = async (): Promise<number> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get unique user IDs from chat sessions with recent messages
  const activeSessions = await prisma.chatSession.findMany({
    where: {
      updatedAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  return activeSessions.length;
};

/**
 * Generate word frequency data for word cloud
 * Returns top topics/terms from user messages
 */
export const getTopics = async (limit: number = 50): Promise<Array<{ text: string; value: number }>> => {
  // Get all user messages from the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const messages = await prisma.message.findMany({
    where: {
      role: 'user',
      createdAt: {
        gte: ninetyDaysAgo,
      },
    },
    select: {
      content: true,
    },
  });

  // Extract and count words
  const wordFrequency: Record<string, number> = {};

  // Common German stop words to exclude
  const stopWords = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
    'und', 'oder', 'aber', 'wenn', 'weil', 'dass', 'dann', 'also', 'ich', 'du', 'er', 'sie', 'es',
    'wir', 'ihr', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'ist', 'sind', 'war', 'waren',
    'bin', 'bist', 'hat', 'haben', 'hatte', 'hatten', 'wird', 'werden', 'wurde', 'wurden',
    'von', 'zu', 'bei', 'mit', 'für', 'auf', 'in', 'an', 'um', 'über', 'unter', 'durch',
    'wie', 'was', 'wo', 'wann', 'warum', 'welche', 'welcher', 'welches', 'diese', 'dieser', 'dieses',
    'nicht', 'nur', 'noch', 'mehr', 'sehr', 'können', 'möchten', 'sollten', 'würde', 'würden',
    'habe', 'hast', 'kann', 'kannst', 'muss', 'müssen', 'soll', 'sollen', 'will', 'wollen',
  ]);

  messages.forEach((message) => {
    // Split by word boundaries, lowercase, and filter
    const words = message.content
      .toLowerCase()
      .replace(/[^\wäöüß\s]/gi, ' ') // Remove punctuation but keep German umlauts
      .split(/\s+/)
      .filter((word) => {
        return (
          word.length > 3 && // At least 4 characters
          !stopWords.has(word) &&
          !/^\d+$/.test(word) // Not just numbers
        );
      });

    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  // Convert to array and sort by frequency
  const sortedWords = Object.entries(wordFrequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return sortedWords;
};

/**
 * Get company statistics
 */
export const getCompanyStats = async () => {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          users: true,
          documents: true,
        },
      },
    },
  });

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    domain: company.domain,
    userCount: company._count.users,
    documentCount: company._count.documents,
    createdAt: company.createdAt,
  }));
};

/**
 * Get user statistics with filters
 */
export const getUserStats = async (options: {
  companyId?: string;
  limit?: number;
  offset?: number;
}) => {
  const { companyId, limit = 50, offset = 0 } = options;

  const where: any = {};
  if (companyId) where.companyId = companyId;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        company: true,
        sessions: {
          select: {
            id: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);

  const enrichedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    lastUsed: user.sessions[0]?.updatedAt || null,
    profile: user.profile,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
        }
      : null,
  }));

  return { users: enrichedUsers, total };
};

/**
 * Get dashboard overview stats
 */
export const getDashboardStats = async () => {
  const [totalUsers, activeUsers, topTopics, companies] = await Promise.all([
    getTotalUsers(),
    getActiveUsers(),
    getTopics(30),
    getCompanyStats(),
  ]);

  return {
    totalUsers,
    activeUsers,
    topTopics,
    companies,
  };
};
