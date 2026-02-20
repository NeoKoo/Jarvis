/**
 * AI Processing Pipeline
 * Multi-stage AI processing: scoring, categorization, translation, summarization
 */

import { QwenClient } from '@/lib/llm/qwen-client';
import { Message, DigestArticle, RSSItem, RSSCategory } from '@/types';
import {
  generateScoringPrompt,
  generateBatchScoringPrompt,
} from './prompts/scoring';
import {
  generateCategorizationPrompt,
  generateBatchCategorizationPrompt,
  isValidCategory,
  CATEGORY_META,
} from './prompts/categorization';
import { generateTranslationPrompt, generateBatchTranslationPrompt } from './prompts/translation';
import { generateSummaryPrompt, generateBatchSummaryPrompt } from './prompts/summary';
import { generateRecommendationPrompt, generateBatchRecommendationPrompt } from './prompts/recommendation';
import { generateTrendsPrompt, generateDailySummaryPrompt } from './prompts/trends';

const qwenClient = new QwenClient();

// ============================================================================
// Stage 1: Combined Processing (Scoring + Categorization + Translation)
// ============================================================================

/**
 * Process a single article with AI (combined scoring + categorization + translation)
 * This is more efficient than separate API calls
 */
export async function processArticleWithAI(item: RSSItem): Promise<DigestArticle> {
  try {
    // Combine multiple AI tasks in one API call for efficiency
    const combinedPrompt = `
**Task 1 - Score the article** (三维评分):
${generateScoringPrompt(item)}

**Task 2 - Categorize the article** (分类):
${generateCategorizationPrompt(item)}

**Task 3 - Translate and extract keywords** (翻译和关键词):
${generateTranslationPrompt(item)}

Return a single JSON object with all results:
\`\`\`json
{
  "scores": { "relevance": <number>, "quality": <number>, "timeliness": <number>, "overall": <number>, "reason": "<string>" },
  "category": "<category: ai-ml|security|engineering|tools|opinion|other>",
  "titleZh": "<Chinese title>",
  "keywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>"]
}
\`\`\`
`;

    const messages: Message[] = [
      {
        id: '1',
        role: 'system',
        content: `You are an expert technical content evaluator. You score articles on three dimensions (relevance, quality, timeliness), categorize them into one of six categories, and translate titles to Chinese while extracting keywords.

Be accurate and consistent. Return ONLY valid JSON.`,
        timestamp: new Date(),
      },
      { id: '2', role: 'user', content: combinedPrompt, timestamp: new Date() },
    ];

    const result = await qwenClient.chat(messages, { timeout: 15000, retries: 1 });
    const aiData = parseJSONResponse(result.content);

    // Validate and normalize data
    const category = isValidCategory(aiData.category) ? aiData.category : 'other';
    const scores = aiData.scores || { relevance: 5, quality: 5, timeliness: 5, overall: 5, reason: '' };
    const keywords = Array.isArray(aiData.keywords) ? aiData.keywords.slice(0, 4) : [];

    // Stage 2: Generate structured summary (separate call for quality)
    const summary = await generateArticleSummary(item);

    // Stage 3: Generate recommendation reason
    const reason = await generateRecommendationReason({
      title: item.title,
      description: item.description,
      scores,
    });

    return {
      id: crypto.randomUUID(),
      title: item.title,
      titleZh: aiData.titleZh || item.title,
      link: item.link,
      source: item.source,
      pubDate: item.pubDate,
      description: item.description,
      category,
      scores,
      keywords,
      summary: summary.summary || item.description,
      reason,
      processedAt: new Date(),
      readingTime: estimateReadingTime(item.description),
    };
  } catch (error) {
    console.error(`[AI Pipeline] Error processing article: ${item.title}`, error);
    // Return fallback article
    return createFallbackArticle(item);
  }
}

/**
 * Process multiple articles in batch (more efficient than one-by-one)
 */
export async function processArticlesBatch(items: RSSItem[]): Promise<DigestArticle[]> {
  if (items.length === 0) return [];

  console.log(`[AI Pipeline] Processing ${items.length} articles in batch...`);

  try {
    // Stage 1: Batch processing for scoring + categorization + translation
    const batchSize = 5;
    const processedArticles: DigestArticle[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Generate batch prompt
      const batchPrompt = generateBatchProcessingPrompt(batch);

      const messages: Message[] = [
        {
          id: '1',
          role: 'system',
          content: 'You are an expert technical content evaluator. Process these articles efficiently and accurately. Return ONLY valid JSON.',
          timestamp: new Date(),
        },
        { id: '2', role: 'user', content: batchPrompt, timestamp: new Date() },
      ];

      const result = await qwenClient.chat(messages, { timeout: 20000, retries: 1 });
      const aiResults = parseJSONResponse(result.content);

      // Process results and generate summaries for each
      for (const item of batch) {
        const index = items.indexOf(item);
        const aiData = aiResults.results?.find((r: any) => r.index === index);

        if (aiData) {
          const category = isValidCategory(aiData.category) ? aiData.category : 'other';
          const scores = aiData.scores || { relevance: 5, quality: 5, timeliness: 5, overall: 5 };
          const keywords = Array.isArray(aiData.keywords) ? aiData.keywords.slice(0, 4) : [];

          // Generate summary separately
          const summary = await generateArticleSummary(item);
          const reason = await generateRecommendationReason({ title: item.title, description: item.description, scores });

          processedArticles.push({
            id: crypto.randomUUID(),
            title: item.title,
            titleZh: aiData.titleZh || item.title,
            link: item.link,
            source: item.source,
            pubDate: item.pubDate,
            description: item.description,
            category,
            scores,
            keywords,
            summary: summary.summary || item.description,
            reason,
            processedAt: new Date(),
            readingTime: estimateReadingTime(item.description),
          });
        } else {
          // Fallback for missing results
          processedArticles.push(createFallbackArticle(item));
        }
      }

      console.log(`[AI Pipeline] Processed ${Math.min(i + batchSize, items.length)}/${items.length} articles`);
    }

    return processedArticles;
  } catch (error) {
    console.error('[AI Pipeline] Batch processing error:', error);
    // Fallback to individual processing
    console.log('[AI Pipeline] Falling back to individual processing...');
    const results: DigestArticle[] = [];
    for (const item of items) {
      try {
        const article = await processArticleWithAI(item);
        results.push(article);
      } catch {
        results.push(createFallbackArticle(item));
      }
    }
    return results;
  }
}

// ============================================================================
// Stage 2: Summary Generation
// ============================================================================

async function generateArticleSummary(item: RSSItem): Promise<any> {
  try {
    const messages: Message[] = [
      {
        id: '1',
        role: 'system',
        content: 'You are an expert technical writer. Create clear, structured summaries that help readers quickly understand the core value of technical content. Return ONLY valid JSON.',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'user',
        content: generateSummaryPrompt(item),
        timestamp: new Date(),
      },
    ];

    const result = await qwenClient.chat(messages, { timeout: 15000, retries: 1 });
    return parseJSONResponse(result.content);
  } catch (error) {
    console.error('[AI Pipeline] Summary generation error:', error);
    return { summary: item.description.substring(0, 200) };
  }
}

// ============================================================================
// Stage 3: Recommendation Generation
// ============================================================================

async function generateRecommendationReason(article: {
  title: string;
  description: string;
  scores: any;
}): Promise<string> {
  try {
    const messages: Message[] = [
      {
        id: '1',
        role: 'system',
        content: 'You are a technical content curator. Help developers quickly decide what to read. Return ONLY plain text, no quotes, no markdown.',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'user',
        content: generateRecommendationPrompt(article),
        timestamp: new Date(),
      },
    ];

    const result = await qwenClient.chat(messages, { timeout: 10000, retries: 1 });
    return result.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('[AI Pipeline] Recommendation generation error:', error);
    return '推荐阅读';
  }
}

// ============================================================================
// Stage 4: Trends and Daily Summary
// ============================================================================

/**
 * Generate trend analysis from top articles
 */
export async function generateTrends(articles: DigestArticle[]): Promise<string[]> {
  if (articles.length === 0) return [];

  const topArticles = articles.slice(0, 20); // Analyze top 20 for trends

  try {
    const messages: Message[] = [
      {
        id: '1',
        role: 'system',
        content: 'You are a technology trend analyst. Identify broader technology trends from article collections. Look for patterns across articles, not individual topics. Return ONLY valid JSON.',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'user',
        content: generateTrendsPrompt(topArticles),
        timestamp: new Date(),
      },
    ];

    const result = await qwenClient.chat(messages, { timeout: 20000, retries: 2 });
    const data = parseJSONResponse(result.content);

    return data.trends || [];
  } catch (error) {
    console.error('[AI Pipeline] Trends generation error:', error);
    return ['技术持续创新', '工程实践分享', '安全最佳实践'];
  }
}

/**
 * Generate daily summary from trends and articles
 */
export async function generateDailySummary(
  articles: DigestArticle[],
  trends: string[]
): Promise<string> {
  if (articles.length === 0) {
    return '暂时没有新的文章。请稍后再试。';
  }

  try {
    const messages: Message[] = [
      {
        id: '1',
        role: 'system',
        content: 'You are a technology analyst writing daily summaries for developers. Be concise and actionable. Return ONLY plain text, no markdown.',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'user',
        content: generateDailySummaryPrompt(articles, trends),
        timestamp: new Date(),
      },
    ];

    const result = await qwenClient.chat(messages, { timeout: 15000, retries: 1 });
    return result.content.trim();
  } catch (error) {
    console.error('[AI Pipeline] Daily summary generation error:', error);
    return `今日精选 ${articles.length} 篇技术文章，涵盖 AI、工程、安全等领域。`;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate batch processing prompt (combines scoring + categorization + translation)
 */
function generateBatchProcessingPrompt(items: Array<{
  index: number;
  title: string;
  description: string;
  source: string;
}>): string {
  return `Process these ${items.length} articles efficiently:

${items.map(item => `[${item.index}] ${item.title}\n${item.description.substring(0, 200)}...`).join('\n\n---\n\n')}

For each article, provide:
1. **Scores**: relevance (1-10), quality (1-10), timeliness (1-10), overall (weighted avg)
2. **Category**: ai-ml, security, engineering, tools, opinion, or other
3. **TitleZh**: Chinese translation
4. **Keywords**: 2-4 English keywords

Return ONLY JSON:
\`\`\`json
{
  "results": [
    {
      "index": 0,
      "scores": { "relevance": 8, "quality": 7, "timeliness": 9, "overall": 7.8, "reason": "..." },
      "category": "ai-ml",
      "titleZh": "中文标题",
      "keywords": ["llm", "transformer"]
    },
    ...
  ]
}
\`\`\`

Be accurate and efficient. Process all ${items.length} articles.`;
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJSONResponse(content: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                     content.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try direct JSON parse
    return JSON.parse(content);
  } catch (e) {
    console.error('[AI Pipeline] JSON parse error:', content.substring(0, 200));
    return {};
  }
}

/**
 * Create fallback article when AI processing fails
 */
function createFallbackArticle(item: RSSItem): DigestArticle {
  return {
    id: crypto.randomUUID(),
    title: item.title,
    link: item.link,
    source: item.source,
    pubDate: item.pubDate,
    description: item.description,
    category: 'other',
    scores: { relevance: 5, quality: 5, timeliness: 5, overall: 5 },
    keywords: [],
    summary: item.description,
    reason: '推荐阅读',
    processedAt: new Date(),
  };
}

/**
 * Estimate reading time in minutes
 */
function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
