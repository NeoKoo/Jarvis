import { NextResponse } from 'next/server';
import { QwenClient } from '@/lib/llm/qwen-client';
import { getEnabledFeeds } from '@/config/rss-feeds';
import { DEFAULT_PREFERENCES } from '@/config/digest-preferences';
import { fetchRSSFeeds } from '@/lib/rss/fetcher';
import { processArticlesBatch, generateTrends, generateDailySummary } from '@/lib/digest/ai-pipeline';
import { generateStatistics, generateVisualization } from '@/lib/digest/statistics';
import { cacheArticles, invalidateOldCache } from '@/lib/digest/cache';
import { DailyDigestResponse, DigestArticle, RSSItem } from '@/types';

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[Digest] Starting daily digest generation...');

  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Clean old cache
    if (forceRefresh) {
      await invalidateOldCache();
      console.log('[Digest] Cache invalidated');
    }

    // 2. Fetch RSS feeds
    console.log('[Digest] Step 1/6: Fetching RSS feeds...');
    const feeds = getEnabledFeeds();
    console.log(`[Digest] Found ${feeds.length} enabled RSS sources`);

    const rawArticles = await fetchRSSFeeds(feeds, DEFAULT_PREFERENCES.timeRange);

    if (rawArticles.length === 0) {
      console.log('[Digest] No articles found, returning empty digest');
      return NextResponse.json({
        success: true,
        digest: {
          summary: '暂时没有新的文章。请稍后再试。',
          trends: [],
          articles: [],
          statistics: {
            totalArticles: 0,
            categoryDistribution: {
              'ai-ml': 0,
              'security': 0,
              'engineering': 0,
              'tools': 0,
              'opinion': 0,
              'other': 0,
            },
            averageScores: {
              relevance: 0,
              quality: 0,
              timeliness: 0,
            },
            topKeywords: [],
            sourcesAnalyzed: 0,
          },
          visualizations: {
            categoryChart: '',
            scoreChart: '',
            tagCloud: [],
          },
          generatedAt: new Date().toISOString(),
        },
      });
    }

    console.log(`[Digest] Fetched ${rawArticles.length} articles from ${feeds.length} feeds`);

    // 3. Check if QWEN_API_KEY is configured
    const hasQwenKey = process.env.QWEN_API_KEY && process.env.QWEN_API_KEY !== 'your_qwen_api_key_here';

    if (!hasQwenKey) {
      console.log('[Digest] QWEN_API_KEY not configured, returning raw articles');
      return createBasicDigest(rawArticles);
    }

    // 4. Process articles with AI (batch processing)
    console.log('[Digest] Step 2/6: Processing articles with AI...');
    const processedArticles = await processArticlesBatch(rawArticles);
    console.log(`[Digest] Processed ${processedArticles.length} articles with AI`);

    // 5. Filter by minimum score and sort
    console.log('[Digest] Step 3/6: Filtering and sorting articles...');
    const filteredArticles = processedArticles.filter(
      article => article.scores.overall >= DEFAULT_PREFERENCES.minScore
    );

    filteredArticles.sort((a, b) => b.scores.overall - a.scores.overall);

    const topArticles = filteredArticles.slice(0, DEFAULT_PREFERENCES.maxArticles);
    console.log(`[Digest] Selected top ${topArticles.length} articles (score >= ${DEFAULT_PREFERENCES.minScore})`);

    if (topArticles.length === 0) {
      return createBasicDigest(rawArticles);
    }

    // 6. Generate statistics and visualizations
    console.log('[Digest] Step 4/6: Generating statistics and visualizations...');
    const statistics = generateStatistics(topArticles);
    const visualizations = generateVisualization(statistics);

    // 7. Generate trend analysis
    console.log('[Digest] Step 5/6: Analyzing trends...');
    const trends = await generateTrends(topArticles);
    console.log(`[Digest] Identified ${trends.length} trends`);

    // 8. Generate daily summary
    console.log('[Digest] Step 6/6: Generating daily summary...');
    const summary = await generateDailySummary(topArticles, trends);

    // 9. Cache articles
    await cacheArticles(topArticles);
    console.log('[Digest] Cached articles for future requests');

    // 10. Build response
    const digest = {
      summary,
      trends,
      articles: topArticles,
      statistics,
      visualizations,
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log(`[Digest] ✅ Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      digest,
    });
  } catch (error) {
    console.error('[Digest] Error:', error);

    // Return error response with fallback content
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate digest',
        digest: {
          summary: '生成摘要时出错，请稍后再试。',
          trends: [],
          articles: [],
          statistics: {
            totalArticles: 0,
            categoryDistribution: {
              'ai-ml': 0,
              'security': 0,
              'engineering': 0,
              'tools': 0,
              'opinion': 0,
              'other': 0,
            },
            averageScores: {
              relevance: 0,
              quality: 0,
              timeliness: 0,
            },
            topKeywords: [],
            sourcesAnalyzed: 0,
          },
          visualizations: {
            categoryChart: '',
            scoreChart: '',
            tagCloud: [],
          },
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Create basic digest without AI processing
 * (Fallback when QWEN_API_KEY is not configured)
 */
function createBasicDigest(rawArticles: RSSItem[]): NextResponse {
  // Sort by date and take top articles
  const sortedArticles = rawArticles
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, DEFAULT_PREFERENCES.maxArticles);

  const articles = sortedArticles.map(item => ({
    id: crypto.randomUUID(),
    title: item.title,
    link: item.link,
    source: item.source,
    pubDate: item.pubDate,
    description: item.description,
    category: 'other' as const,
    scores: {
      relevance: 5,
      quality: 5,
      timeliness: 5,
      overall: 5,
    },
    keywords: [],
    summary: item.description,
    reason: '最新文章',
    processedAt: new Date(),
  }));

  return NextResponse.json({
    success: true,
    digest: {
      summary: `今日精选 ${articles.length} 篇最新技术文章，涵盖 AI、工程、安全等领域。`,
      trends: ['技术持续创新', '工程实践分享', '安全最佳实践'],
      articles,
      statistics: {
        totalArticles: articles.length,
        categoryDistribution: {
          'ai-ml': 0,
          'security': 0,
          'engineering': 0,
          'tools': 0,
          'opinion': 0,
          'other': articles.length,
        },
        averageScores: {
          relevance: 5,
          quality: 5,
          timeliness: 5,
        },
        topKeywords: [],
        sourcesAnalyzed: new Set(articles.map(a => a.source)).size,
      },
      visualizations: {
        categoryChart: '',
        scoreChart: '',
        tagCloud: [],
      },
      generatedAt: new Date().toISOString(),
    },
  });
}
