import { NextResponse } from 'next/server';
import { QwenClient } from '@/lib/llm/qwen-client';
import { getEnabledFeeds, getFeedsByCategory } from '@/config/rss-feeds';
import { fetchRSSFeeds } from '@/lib/rss/fetcher';
import { processArticlesBatch } from '@/lib/digest/ai-pipeline';
import { cacheArticles } from '@/lib/digest/cache';
import { RSSItem } from '@/types';

/**
 * VibeCoding-focused daily digest
 *
 * This endpoint filters and prioritizes content related to:
 * - AI-assisted coding tools (Cursor, Windsurf, Copilot, etc.)
 * - LLM code generation and completion
 * - AI pair programming
 * - Developer workflows with AI
 * - Code understanding and generation
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[VibeCoding] Starting personalized digest generation...');

  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get AI/ML feeds which are most relevant to vibecoding
    const aiMlFeeds = getFeedsByCategory('ai-ml');
    const toolsFeeds = getFeedsByCategory('tools');

    // Combine feeds, prioritizing AI/ML
    const prioritizedFeeds = [...aiMlFeeds, ...toolsFeeds];

    console.log(`[VibeCoding] Fetching from ${prioritizedFeeds.length} prioritized feeds`);

    // Fetch articles from last 72 hours (3 days) for more content
    const rawArticles = await fetchRSSFeeds(prioritizedFeeds, 72);

    if (rawArticles.length === 0) {
      console.log('[VibeCoding] No articles found');
      return NextResponse.json({
        success: true,
        digest: {
          summary: '暂时没有找到VibeCoding相关内容。请稍后再试。',
          articles: [],
          featuredTools: [],
          quickTips: [],
          generatedAt: new Date().toISOString(),
        },
      });
    }

    console.log(`[VibeCoding] Fetched ${rawArticles.length} articles`);

    // Check if QWEN_API_KEY is configured
    const hasQwenKey = process.env.QWEN_API_KEY && process.env.QWEN_API_KEY !== 'your_qwen_api_key_here';

    if (!hasQwenKey) {
      console.log('[VibeCoding] QWEN_API_KEY not configured, returning basic results');
      return createBasicVibecodingDigest(rawArticles);
    }

    // Process with AI to find vibecoding-relevant content
    console.log('[VibeCoding] Processing articles with AI...');

    // Take first 80 articles for processing
    const articlesForAI = rawArticles
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, 80);

    const processedArticles = await processArticlesWithVibecodingFilter(articlesForAI);

    // Filter by vibecoding relevance
    const vibecodingArticles = processedArticles.filter(
      article => article.vibecodingScore && article.vibecodingScore >= 6
    );

    // Sort by vibecoding score
    vibecodingArticles.sort((a, b) =>
      (b.vibecodingScore || 0) - (a.vibecodingScore || 0)
    );

    const topArticles = vibecodingArticles.slice(0, 15);

    console.log(`[VibeCoding] Found ${topArticles.length} vibecoding-relevant articles`);

    // Cache articles (convert to DigestArticle format)
    const digestArticles = topArticles.map(item => {
      const article = item.article;
      // Create a minimal DigestArticle from RSSItem
      return {
        id: crypto.randomUUID(),
        title: article.title,
        link: article.link,
        source: article.source,
        pubDate: article.pubDate,
        description: article.description,
        category: 'ai-ml' as const,
        scores: {
          relevance: item.vibecodingScore || 7,
          quality: 7,
          timeliness: 8,
          overall: item.vibecodingScore || 7,
        },
        keywords: ['AI', 'Coding', 'VibeCoding'],
        summary: article.description,
        reason: `VibeCoding相关性评分: ${item.vibecodingScore}/10`,
        processedAt: new Date(),
      };
    });
    await cacheArticles(digestArticles);

    // Generate featured tools section
    const featuredTools = extractFeaturedTools(topArticles);

    // Generate quick tips
    const quickTips = generateQuickTips(topArticles);

    const digest = {
      summary: generateVibecodingSummary(topArticles),
      articles: topArticles.map(item => item.article),
      featuredTools,
      quickTips,
      generatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log(`[VibeCoding] ✅ Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      digest,
    });
  } catch (error) {
    console.error('[VibeCoding] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate vibecoding digest',
        digest: {
          summary: '生成VibeCoding摘要时出错，请稍后再试。',
          articles: [],
          featuredTools: [],
          quickTips: [],
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Process articles and score them for vibecoding relevance
 */
async function processArticlesWithVibecodingFilter(articles: RSSItem[]): Promise<
  Array<{
    article: RSSItem;
    vibecodingScore?: number;
  }>
> {
  const qwenClient = new QwenClient();

  const results = await Promise.all(
    articles.map(async (article: RSSItem) => {
      try {
        // Score the article for vibecoding relevance
        const prompt = `Rate this article's relevance to "VibeCoding" (AI-assisted programming) on a scale of 1-10.

Article Title: ${article.title}
Article Description: ${article.description}

Consider:
- AI coding tools (Cursor, Windsurf, Copilot, Tabnine, etc.)
- LLM code generation and completion
- AI pair programming workflows
- Code understanding with AI
- Developer productivity with AI

Return ONLY a number from 1-10. Nothing else.`;

        const message = {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: prompt,
          timestamp: new Date(),
        };

        const response = await qwenClient.chat([message]);

        const scoreText = response.content.trim();
        const score = parseInt(scoreText);

        if (isNaN(score) || score < 1 || score > 10) {
          return { article, vibecodingScore: undefined };
        }

        return { article, vibecodingScore: score };
      } catch (error) {
        console.error(`[VibeCoding] Error scoring article: ${article.title}`, error);
        return { article, vibecodingScore: undefined };
      }
    })
  );

  return results;
}

/**
 * Generate a summary of vibecoding content
 */
function generateVibecodingSummary(articles: Array<{ article: any; vibecodingScore?: number }>): string {
  if (articles.length === 0) {
    return '今日暂无VibeCoding相关内容。';
  }

  const topTools = extractFeaturedTools(articles).slice(0, 3).map(t => t.name).join('、');

  return `今日发现 ${articles.length} 篇关于AI辅助编程的精选内容，涵盖${topTools}等热门工具的最新动态和实用技巧。`;
}

/**
 * Extract featured tools mentioned in articles
 */
function extractFeaturedTools(articles: Array<{ article: any; vibecodingScore?: number }>): Array<{
  name: string;
  description: string;
  articleCount: number;
}> {
  const toolKeywords = {
    'Cursor': { name: 'Cursor', description: 'AI-first代码编辑器', count: 0 },
    'Windsurf': { name: 'Windsurf', description: 'Codeium推出的AI编辑器', count: 0 },
    'Copilot': { name: 'GitHub Copilot', description: 'GitHub的AI编程助手', count: 0 },
    'Claude': { name: 'Claude Code', description: 'Anthropic的AI编程工具', count: 0 },
    'GPT-4': { name: 'GPT-4', description: 'OpenAI的代码生成模型', count: 0 },
    'Tabnine': { name: 'Tabnine', description: 'AI代码补全工具', count: 0 },
    'Codeium': { name: 'Codeium', description: '免费AI编码助手', count: 0 },
    'Continue': { name: 'Continue', description: '开源AI编码助手', count: 0 },
  };

  articles.forEach(({ article }) => {
    const text = (article.title + ' ' + article.description).toLowerCase();

    Object.entries(toolKeywords).forEach(([key, tool]) => {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        tool.count++;
      }
    });
  });

  return Object.entries(toolKeywords)
    .filter(([_, tool]) => tool.count > 0)
    .map(([key, tool]) => ({
      name: tool.name,
      description: tool.description,
      articleCount: tool.count,
    }))
    .sort((a, b) => b.articleCount - a.articleCount);
}

/**
 * Generate quick tips from articles
 */
function generateQuickTips(articles: Array<{ article: any; vibecodingScore?: number }>): string[] {
  const tips: string[] = [];

  articles.slice(0, 5).forEach(({ article }) => {
    if (article.summary && article.summary.length > 0) {
      // Extract first sentence as a quick tip
      const firstSentence = article.summary.split(/[。.!！]/)[0];
      if (firstSentence.length > 10 && firstSentence.length < 100) {
        tips.push(firstSentence);
      }
    }
  });

  return tips.slice(0, 3);
}

/**
 * Create basic digest without AI processing
 */
function createBasicVibecodingDigest(rawArticles: RSSItem[]): NextResponse {
  const vibecodingKeywords = [
    'cursor', 'windsurf', 'copilot', 'ai coding', 'llm code',
    'code completion', 'ai programming', 'gpt-4 code',
    'claude code', 'tabnine', 'codeium', 'continue'
  ];

  const filteredArticles = rawArticles
    .filter(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      return vibecodingKeywords.some(keyword => text.includes(keyword));
    })
    .slice(0, 15)
    .map(item => ({
      id: crypto.randomUUID(),
      title: item.title,
      link: item.link,
      source: item.source,
      pubDate: item.pubDate,
      description: item.description,
      category: 'ai-ml' as const,
      scores: {
        relevance: 7,
        quality: 6,
        timeliness: 8,
        overall: 7,
      },
      keywords: ['AI', 'Coding'],
      summary: item.description,
      reason: 'VibeCoding相关内容',
      processedAt: new Date(),
    }));

  return NextResponse.json({
    success: true,
    digest: {
      summary: `发现 ${filteredArticles.length} 篇AI辅助编程相关的最新文章。`,
      articles: filteredArticles,
      featuredTools: [
        { name: 'AI编码工具', description: '最新AI编程助手', articleCount: filteredArticles.length },
      ],
      quickTips: [
        '使用AI编码工具可以提高开发效率',
        '尝试不同的AI工具找到最适合你的',
      ],
      generatedAt: new Date().toISOString(),
    },
  });
}
