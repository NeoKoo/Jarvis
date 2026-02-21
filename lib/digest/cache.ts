/**
 * Digest Article Cache
 * IndexedDB-based caching layer for processed articles
 */

import { DigestArticle, ArticleCache, DailyDigestResponse } from '@/types';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const FULL_DIGEST_CACHE_KEY = 'full-digest';
const FULL_DIGEST_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours for full digest

// ============================================================================
// In-Memory Cache (for faster access during session)
// ============================================================================

const memoryCache = new Map<string, ArticleCache>();
let fullDigestCache: {
  digest: DailyDigestResponse['digest'];
  cachedAt: Date;
} | null = null;

/**
 * Get article from cache (memory first, then IndexedDB)
 */
export async function getCachedArticle(articleId: string): Promise<DigestArticle | null> {
  try {
    // Try memory cache first
    const memCache = memoryCache.get(articleId);
    if (memCache) {
      const age = Date.now() - memCache.cachedAt.getTime();
      if (age < CACHE_TTL) {
        // Increment hit counter
        memCache.hits++;
        return memCache.article;
      } else {
        // Remove expired cache
        memoryCache.delete(articleId);
      }
    }

    // Try IndexedDB (will be implemented with schema update)
    // For now, return null
    return null;
  } catch (error) {
    console.error('[Cache] Error reading from cache:', error);
    return null;
  }
}

/**
 * Cache an article (memory + IndexedDB)
 */
export async function cacheArticle(article: DigestArticle): Promise<void> {
  try {
    const cacheEntry: ArticleCache = {
      article,
      cachedAt: new Date(),
      hits: 0,
    };

    // Store in memory
    memoryCache.set(article.id, cacheEntry);

    // Store in IndexedDB (will be implemented with schema update)
    // await db.digestCache.put(cacheEntry);
  } catch (error) {
    console.error('[Cache] Error writing to cache:', error);
  }
}

/**
 * Cache multiple articles (batch operation)
 */
export async function cacheArticles(articles: DigestArticle[]): Promise<void> {
  const cachePromises = articles.map(article => cacheArticle(article));
  await Promise.allSettled(cachePromises);
}

/**
 * Invalidate old cache entries
 */
export async function invalidateOldCache(maxAge: number = CACHE_TTL): Promise<void> {
  const cutoff = Date.now() - maxAge;

  // Clean memory cache
  for (const [id, cache] of memoryCache.entries()) {
    if (cache.cachedAt.getTime() < cutoff) {
      memoryCache.delete(id);
    }
  }

  // Clean IndexedDB cache (will be implemented with schema update)
  // await db.digestCache.where('cachedAt').below(cutoff).delete();
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();

  // Clear IndexedDB (will be implemented with schema update)
  // await db.digestCache.clear();
}

/**
 * Get cache statistics
 */
export interface CacheStats {
  memorySize: number;
  totalHits: number;
  avgHitsPerEntry: number;
}

export function getCacheStats(): CacheStats {
  const memorySize = memoryCache.size;
  const totalHits = Array.from(memoryCache.values()).reduce((sum, c) => sum + c.hits, 0);
  const avgHitsPerEntry = memorySize > 0 ? totalHits / memorySize : 0;

  return {
    memorySize,
    totalHits,
    avgHitsPerEntry: Math.round(avgHitsPerEntry * 10) / 10,
  };
}

/**
 * Prune cache to limit memory usage
 */
export function pruneCache(maxEntries: number = 100): void {
  if (memoryCache.size <= maxEntries) return;

  // Sort by last access (cachedAt + hits as proxy)
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => {
      const scoreA = a[1].cachedAt.getTime() + a[1].hits * 60000; // hits weigh as 1 minute
      const scoreB = b[1].cachedAt.getTime() + b[1].hits * 60000;
      return scoreB - scoreA; // Most recently accessed first
    });

  // Remove oldest entries
  const toRemove = entries.slice(maxEntries);
  toRemove.forEach(([id]) => memoryCache.delete(id));

  console.log(`[Cache] Pruned ${toRemove.length} cache entries`);
}

/**
 * Generate cache key for RSS feed items
 */
export function generateCacheKey(item: {
  link: string;
  title: string;
}): string {
  // Use link + title as unique identifier
  const str = `${item.link}|${item.title}`;
  // Simple hash (for demo - use crypto.subtle.digest in production)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `digest-${Math.abs(hash)}`;
}

/**
 * Warm up cache with frequently accessed articles
 */
export async function warmCache(articleIds: string[]): Promise<void> {
  console.log(`[Cache] Warming up cache with ${articleIds.length} articles...`);
  // This would preload articles from IndexedDB into memory
  // Implementation depends on IndexedDB schema
}

/**
 * Export cache data (for debugging/backup)
 */
export function exportCacheData(): Array<{ id: string; article: DigestArticle; cachedAt: Date; hits: number }> {
  return Array.from(memoryCache.entries()).map(([id, cache]) => ({
    id,
    article: cache.article,
    cachedAt: cache.cachedAt,
    hits: cache.hits,
  }));
}

/**
 * Get cache hit rate (for monitoring)
 */
export function getCacheHitRate(): number {
  const totalHits = Array.from(memoryCache.values()).reduce((sum, c) => sum + c.hits, 0);
  const totalMisses = memoryCache.size; // Approximate (entries = misses on first access)
  const total = totalHits + totalMisses;

  if (total === 0) return 0;
  return Math.round((totalHits / total) * 1000) / 10; // Return percentage with 1 decimal
}

// ============================================================================
// Full Digest Cache (cache complete digest response)
// ============================================================================

/**
 * Get cached full digest
 */
export function getCachedDigest(): DailyDigestResponse['digest'] | null {
  if (!fullDigestCache) return null;

  const age = Date.now() - fullDigestCache.cachedAt.getTime();
  if (age < FULL_DIGEST_CACHE_TTL) {
    return fullDigestCache.digest;
  }

  fullDigestCache = null;
  return null;
}

/**
 * Cache full digest response
 */
export function setCachedDigest(digest: DailyDigestResponse['digest']): void {
  fullDigestCache = {
    digest,
    cachedAt: new Date(),
  };
}

/**
 * Invalidate full digest cache
 */
export function invalidateDigestCache(): void {
  fullDigestCache = null;
}

/**
 * Get digest cache age in minutes
 */
export function getDigestCacheAge(): number | null {
  if (!fullDigestCache) return null;
  return Math.floor((Date.now() - fullDigestCache.cachedAt.getTime()) / 60000);
}
