import { RSSFeedConfig, RSSItem } from '@/types';
import { parseRSS } from './parser';
import { updateFeedStatus } from '@/config/rss-feeds';

/**
 * Fetch RSS feeds with concurrency control
 */
export async function fetchRSSFeeds(
  feeds: RSSFeedConfig[],
  timeRangeHours: number
): Promise<RSSItem[]> {
  const cutoffDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  const allItems: RSSItem[] = [];
  const concurrency = 10; // Fetch 10 feeds concurrently
  const timeoutMs = 10000; // 10 second timeout per feed

  let successCount = 0;
  let failCount = 0;

  console.log(`[RSS] Starting to fetch ${feeds.length} feeds (cutoff: ${timeRangeHours}h ago)`);

  // Process feeds in batches
  for (let i = 0; i < feeds.length; i += concurrency) {
    const batch = feeds.slice(i, i + concurrency);

    // Fetch all feeds in this batch concurrently
    const results = await Promise.allSettled(
      batch.map(feed => fetchFeed(feed, cutoffDate, timeoutMs))
    );

    // Process results
    results.forEach((result, index) => {
      const feed = batch[index];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allItems.push(...result.value);
        successCount++;
        updateFeedStatus(feed.name, false); // Success
      } else {
        failCount++;
        updateFeedStatus(feed.name, true); // Error
      }
    });

    const progress = Math.min(i + concurrency, feeds.length);
    console.log(`[RSS] Progress: ${progress}/${feeds.length} feeds processed (${successCount} ok, ${failCount} failed)`);
  }

  console.log(`[RSS] Completed: Fetched ${allItems.length} articles from ${successCount}/${feeds.length} feeds`);

  return allItems;
}

/**
 * Fetch a single RSS feed
 */
async function fetchFeed(
  feed: RSSFeedConfig,
  cutoffDate: Date,
  timeoutMs: number
): Promise<RSSItem[]> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Jarvis-RSS-Reader/1.0)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      // Next.js caching: revalidate every hour
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();

    // Parse RSS feed
    const items = parseRSS(text, feed.name, feed.category);

    // Filter by date
    const recentItems = items.filter(item => item.pubDate > cutoffDate);

    return recentItems;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Only log non-abort errors to reduce noise
    if (!errorMessage.includes('abort') && !errorMessage.includes('fetch failed')) {
      console.warn(`[RSS] ✗ ${feed.name}: ${errorMessage}`);
    } else if (errorMessage.includes('abort')) {
      console.warn(`[RSS] ✗ ${feed.name}: timeout`);
    }

    return [];
  }
}

/**
 * Fetch a single RSS feed (public API for manual refresh)
 */
export async function fetchSingleFeed(
  feed: RSSFeedConfig,
  timeRangeHours: number = 48
): Promise<RSSItem[]> {
  const cutoffDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  return fetchFeed(feed, cutoffDate, 10000);
}

/**
 * Test if a feed is accessible
 */
export async function testFeed(feedUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Jarvis-RSS-Reader/1.0)',
      },
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get feed statistics
 */
export interface FeedStats {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<string, number>;
}

export function getFeedStats(feeds: RSSFeedConfig[]): FeedStats {
  const total = feeds.length;
  const enabled = feeds.filter(f => f.enabled).length;
  const disabled = total - enabled;
  const byCategory: Record<string, number> = {};

  feeds.filter(f => f.enabled).forEach(feed => {
    byCategory[feed.category] = (byCategory[feed.category] || 0) + 1;
  });

  return {
    total,
    enabled,
    disabled,
    byCategory,
  };
}
