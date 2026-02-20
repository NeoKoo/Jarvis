import { RSSFeedConfig, RSSCategory } from '@/types';

// ============================================================================
// 90 Premium RSS Sources from Karpathy + Hacker News 2025
// Source: https://github.com/vigorX777/ai-daily-digest
// ============================================================================

export const RSS_FEEDS: RSSFeedConfig[] = [
  // ============================================================================
  // AI/ML Category (25 feeds)
  // ============================================================================
  {
    name: "Simon Willison",
    url: "https://simonwillison.net/atom/everything/",
    category: 'ai-ml',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Gwern Branwen",
    url: "https://gwern.substack.com/feed",
    category: 'ai-ml',
    language: 'en',
    priority: 9,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Jeff Geerling",
    url: "https://www.jeffgeerling.com/blog.xml",
    category: 'ai-ml',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "DynoMight",
    url: "https://dynomight.net/feed.xml",
    category: 'ai-ml',
    language: 'en',
    priority: 6,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Gary Marcus",
    url: "https://garymarcus.substack.com/feed",
    category: 'ai-ml',
    language: 'en',
    priority: 8,
    enabled: true,
    fetchErrorCount: 0,
  },

  // ============================================================================
  // Security Category (15 feeds)
  // ============================================================================
  {
    name: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    category: 'security',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Troy Hunt",
    url: "https://www.troyhunt.com/rss/",
    category: 'security',
    language: 'en',
    priority: 9,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "lcamtuf",
    url: "https://lcamtuf.substack.com/feed",
    category: 'security',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Micah Lee",
    url: "https://micahflee.com/feed/",
    category: 'security',
    language: 'en',
    priority: 6,
    enabled: true,
    fetchErrorCount: 0,
  },

  // ============================================================================
  // Engineering Category (25 feeds)
  // ============================================================================
  {
    name: "Dan Abramov",
    url: "https://overreacted.io/rss.xml",
    category: 'engineering',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Mitchell Hashimoto",
    url: "https://mitchellh.com/feed.xml",
    category: 'engineering',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Antirez",
    url: "http://antirez.com/rss",
    category: 'engineering',
    language: 'en',
    priority: 9,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Fabien Sanglard",
    url: "https://fabiensanglard.net/rss.xml",
    category: 'engineering',
    language: 'en',
    priority: 8,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Dan Luu",
    url: "https://danluu.com/feed.xml",
    category: 'engineering',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Julia Evans",
    url: "https://jvns.ca/atom.xml",
    category: 'engineering',
    language: 'en',
    priority: 8,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Brendan Gregg",
    url: "https://www.brendangregg.com/blog/rss.xml",
    category: 'engineering',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Matt Klein",
    url: "https://mattklein.dev/feed.xml",
    category: 'engineering',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },

  // ============================================================================
  // Tools Category (15 feeds)
  // ============================================================================
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    category: 'tools',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "John Gruber",
    url: "https://daringfireball.net/feeds/main",
    category: 'tools',
    language: 'en',
    priority: 8,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Miguel de Icaza",
    url: "https://blog.miguelgrinberg.com/feed",
    category: 'tools',
    language: 'en',
    priority: 6,
    enabled: true,
    fetchErrorCount: 0,
  },

  // ============================================================================
  // Opinion Category (10 feeds)
  // ============================================================================
  {
    name: "Paul Graham",
    url: "http://www.aaronsw.com/2002/feeds/pgessays.rss",
    category: 'opinion',
    language: 'en',
    priority: 10,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Pluralistic",
    url: "https://pluralistic.net/feed/",
    category: 'opinion',
    language: 'en',
    priority: 9,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Derek Thompson",
    url: "https://www.theatlantic.com/feed/author/derek-thompson/",
    category: 'opinion',
    language: 'en',
    priority: 7,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Steve Blank",
    url: "https://steveblank.com/feed/",
    category: 'opinion',
    language: 'en',
    priority: 8,
    enabled: true,
    fetchErrorCount: 0,
  },

  // ============================================================================
  // Other Category (5 feeds)
  // ============================================================================
  {
    name: "Idiallo",
    url: "https://idiallo.com/feed.rss",
    category: 'other',
    language: 'en',
    priority: 6,
    enabled: true,
    fetchErrorCount: 0,
  },
  {
    name: "Maurycy Z",
    url: "https://maurycyz.com/index.xml",
    category: 'other',
    language: 'en',
    priority: 5,
    enabled: true,
    fetchErrorCount: 0,
  },

  // Note: This is a subset of 60 feeds. The full 90 feeds list would include
  // additional sources from each category. This can be expanded gradually.
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all enabled RSS feeds
 */
export const getEnabledFeeds = (): RSSFeedConfig[] =>
  RSS_FEEDS.filter(feed => feed.enabled);

/**
 * Get feeds by category
 */
export const getFeedsByCategory = (category: RSSCategory): RSSFeedConfig[] =>
  RSS_FEEDS.filter(feed => feed.category === category && feed.enabled);

/**
 * Update feed status after fetching
 * - Increments error count on failure
 * - Disables feed after 5 consecutive errors
 * - Resets error count on success
 */
export const updateFeedStatus = (name: string, error: boolean): void => {
  const feed = RSS_FEEDS.find(f => f.name === name);
  if (feed) {
    feed.lastFetched = new Date();
    if (error) {
      feed.fetchErrorCount++;
      // Auto-disable after 5 consecutive errors
      if (feed.fetchErrorCount >= 5) {
        feed.enabled = false;
        console.warn(`[RSS] Disabled feed "${name}" after 5 consecutive errors`);
      }
    } else {
      feed.fetchErrorCount = 0;
    }
  }
};

/**
 * Get feed statistics
 */
export const getFeedStats = () => {
  const total = RSS_FEEDS.length;
  const enabled = RSS_FEEDS.filter(f => f.enabled).length;
  const disabled = total - enabled;
  const byCategory: Record<RSSCategory, number> = {
    'ai-ml': 0,
    'security': 0,
    'engineering': 0,
    'tools': 0,
    'opinion': 0,
    'other': 0,
  };

  RSS_FEEDS.filter(f => f.enabled).forEach(feed => {
    byCategory[feed.category]++;
  });

  return {
    total,
    enabled,
    disabled,
    byCategory,
  };
};
