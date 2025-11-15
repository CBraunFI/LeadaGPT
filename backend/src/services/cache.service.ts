import prisma from '../config/database';

/**
 * Generic Caching Service
 *
 * Provides database-backed caching with TTL (Time-To-Live) support.
 * Survives server restarts (unlike in-memory caching).
 *
 * Cache keys follow the pattern: "{feature}_{variant}"
 * Examples:
 * - "recommendations"
 * - "dashboard_summary_week"
 * - "dashboard_summary_month"
 * - "profile_summary"
 */

export interface CacheOptions {
  ttlMinutes?: number; // Time-to-live in minutes (default varies by use case)
}

/**
 * Get cached data for a user
 *
 * @param userId - User ID
 * @param cacheKey - Cache key (e.g., "recommendations")
 * @returns Parsed data if cache hit and not expired, null otherwise
 */
export async function getCache<T>(userId: string, cacheKey: string): Promise<T | null> {
  try {
    const cached = await prisma.cachedData.findUnique({
      where: {
        userId_cacheKey: {
          userId,
          cacheKey,
        },
      },
    });

    if (!cached) {
      return null; // Cache miss
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      // Delete expired entry
      await prisma.cachedData.delete({
        where: { id: cached.id },
      });
      return null; // Cache expired
    }

    // Parse and return
    return JSON.parse(cached.data) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Set cached data for a user
 *
 * @param userId - User ID
 * @param cacheKey - Cache key
 * @param data - Data to cache (will be JSON-serialized)
 * @param ttlMinutes - Time-to-live in minutes
 */
export async function setCache<T>(
  userId: string,
  cacheKey: string,
  data: T,
  ttlMinutes: number
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    await prisma.cachedData.upsert({
      where: {
        userId_cacheKey: {
          userId,
          cacheKey,
        },
      },
      create: {
        userId,
        cacheKey,
        data: JSON.stringify(data),
        expiresAt,
      },
      update: {
        data: JSON.stringify(data),
        expiresAt,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Cache set error:', error);
    // Fail gracefully - don't throw
  }
}

/**
 * Delete cached data for a user
 *
 * @param userId - User ID
 * @param cacheKey - Cache key (optional - if not provided, deletes ALL cache for user)
 */
export async function deleteCache(userId: string, cacheKey?: string): Promise<void> {
  try {
    if (cacheKey) {
      // Delete specific cache entry
      await prisma.cachedData.deleteMany({
        where: {
          userId,
          cacheKey,
        },
      });
    } else {
      // Delete all cache entries for user
      await prisma.cachedData.deleteMany({
        where: { userId },
      });
    }
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete all expired cache entries (cleanup job)
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const result = await prisma.cachedData.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired cache entries`);
    return result.count;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

/**
 * Get or compute cached data
 *
 * This is the main helper function that handles cache-aside pattern:
 * 1. Try to get from cache
 * 2. If miss, compute using provided function
 * 3. Store result in cache
 * 4. Return result
 *
 * @param userId - User ID
 * @param cacheKey - Cache key
 * @param computeFn - Async function to compute data if cache miss
 * @param ttlMinutes - Time-to-live in minutes
 * @returns Cached or computed data
 */
export async function getOrCompute<T>(
  userId: string,
  cacheKey: string,
  computeFn: () => Promise<T>,
  ttlMinutes: number
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(userId, cacheKey);

  if (cached !== null) {
    console.log(`Cache HIT: ${cacheKey} for user ${userId}`);
    return cached;
  }

  // Cache miss - compute
  console.log(`Cache MISS: ${cacheKey} for user ${userId} - computing...`);
  const computed = await computeFn();

  // Store in cache (fire and forget - don't await)
  setCache(userId, cacheKey, computed, ttlMinutes).catch((err) =>
    console.error('Failed to cache:', err)
  );

  return computed;
}

/**
 * Invalidate cache entries based on patterns
 *
 * Useful when a user action should clear multiple related caches
 * Example: When profile is updated, clear all dashboard summaries
 *
 * @param userId - User ID
 * @param pattern - Pattern to match (e.g., "dashboard_summary_")
 */
export async function invalidateCachePattern(userId: string, pattern: string): Promise<void> {
  try {
    await prisma.cachedData.deleteMany({
      where: {
        userId,
        cacheKey: {
          startsWith: pattern,
        },
      },
    });

    console.log(`Invalidated cache pattern: ${pattern} for user ${userId}`);
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}

// Cache TTL Constants (in minutes)
export const CACHE_TTL = {
  RECOMMENDATIONS: 24 * 60, // 24 hours
  DASHBOARD_WEEK: 60, // 1 hour
  DASHBOARD_MONTH: 6 * 60, // 6 hours
  DASHBOARD_LONG: 24 * 60, // 24 hours (3m, 6m, all)
  PROFILE_SUMMARY: 12 * 60, // 12 hours
  TRANSLATION: 7 * 24 * 60, // 7 days (translations rarely change)
} as const;
