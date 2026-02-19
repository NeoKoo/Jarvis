import { NextResponse } from 'next/server';
import { QwenClient } from '@/lib/llm/qwen-client';
import { Message } from '@/types';

// 精选的技术博客 RSS 源（从原库的 90 个中选取最受欢迎的）
const TECH_RSS_FEEDS = [
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", category: "AI/ML" },
  { name: "Paul Graham", url: "http://www.aaronsw.com/2002/feeds/pgessays.rss", category: "观点" },
  { name: "Dan Abramov", url: "https://overreacted.io/rss.xml", category: "工程" },
  { name: "Mitchell Hashimoto", url: "https://mitchellh.com/feed.xml", category: "工程" },
  { name: "Gwern", url: "https://gwern.substack.com/feed", category: "AI/ML" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", category: "安全" },
  { name: "Troy Hunt", url: "https://www.troyhunt.com/rss/", category: "安全" },
  { name: "John Gruber", url: "https://daringfireball.net/feeds/main", category: "观点" },
  { name: "Antirez", url: "http://antirez.com/rss", category: "工程" },
  { name: "Fabien Sanglard", url: "https://fabiensanglard.net/rss.xml", category: "工程" },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  source: string;
  category: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Fetch RSS feeds
    const articles: FeedItem[] = [];
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48小时前

    for (const feed of TECH_RSS_FEEDS) {
      try {
        const response = await fetch(feed.url, {
          next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) continue;

        const text = await response.text();
        const items = parseRSS(text, feed.name, feed.category);

        for (const item of items) {
          if (item.pubDate > cutoffDate) {
            articles.push(item);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${feed.name}:`, error);
      }
    }

    // Sort by date
    articles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    // Take top 15
    const topArticles = articles.slice(0, 15);

    if (topArticles.length === 0) {
      return NextResponse.json({
        success: true,
        digest: {
          summary: '暂时没有新的文章。请稍后再试。',
          articles: [],
          trends: [],
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Check if QWEN_API_KEY is configured
    const hasQwenKey = process.env.QWEN_API_KEY && process.env.QWEN_API_KEY !== 'your_qwen_api_key_here';

    if (!hasQwenKey) {
      // Return articles without AI processing
      const formattedArticles = topArticles.slice(0, 5).map(article => ({
        title: article.title,
        link: article.link,
        source: article.source,
        category: article.category,
        pubDate: article.pubDate.toISOString(),
        description: article.description,
        reason: '最新文章',
      }));

      return NextResponse.json({
        success: true,
        digest: {
          summary: `今日精选 ${formattedArticles.length} 篇最新技术文章，涵盖 AI、工程、安全等领域。`,
          trends: ['技术持续创新', '工程实践分享', '安全最佳实践'],
          articles: formattedArticles,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // 2. Use AI to generate summary and select top articles
    const qwenClient = new QwenClient();

    const articlesText = topArticles
      .map((article, i) => `${i + 1}. ${article.title}\n   来源: ${article.source}\n   摘要: ${article.description.substring(0, 200)}...`)
      .join('\n\n');

    const prompt = `请帮我分析以下最新的技术文章，并生成一份每日技术摘要。

文章列表：
${articlesText}

请按以下 JSON 格式返回：
{
  "summary": "用2-3句话总结今天技术圈的重要趋势和看点",
  "trends": ["趋势1", "趋势2", "趋势3"],
  "topArticles": [
    {
      "index": 原文章索引（从0开始）,
      "reason": "推荐理由（1句话）"
    }
  ]
}

要求：
1. summary 要简洁有力，突出重点
2. trends 要宏观，反映技术发展方向
3. topArticles 选择 3-5 篇最值得读的文章，给出简短的推荐理由`;

    const messages: Message[] = [
      {
        id: 'system',
        role: 'system',
        content: '你是一个技术领域的专家，擅长从海量技术文章中筛选出最有价值的内容，并用简洁的语言总结技术趋势。',
        timestamp: new Date(),
      },
      {
        id: 'user',
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      },
    ];

    const result = await qwenClient.chat(messages);

    // Parse AI response
    let aiResponse;
    try {
      const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                       result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        aiResponse = JSON.parse(result.content);
      }
    } catch (e) {
      // Fallback if JSON parsing fails
      aiResponse = {
        summary: '今天有多篇值得阅读的技术文章，涵盖 AI、工程实践和安全等领域。',
        trends: ['技术持续创新', '工程实践分享', '安全最佳实践'],
        topArticles: topArticles.slice(0, 3).map((_, i) => ({ index: i, reason: '值得一读' })),
      };
    }

    // Format response
    const formattedArticles = (aiResponse.topArticles || [])
      .slice(0, 5)
      .map((item: any) => {
        const article = topArticles[item.index];
        return {
          title: article.title,
          link: article.link,
          source: article.source,
          category: article.category,
          pubDate: article.pubDate.toISOString(),
          description: article.description,
          reason: item.reason || '推荐阅读',
        };
      });

    return NextResponse.json({
      success: true,
      digest: {
        summary: aiResponse.summary || '今日技术摘要',
        trends: aiResponse.trends || [],
        articles: formattedArticles,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating daily digest:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate digest',
        digest: {
          summary: '生成摘要时出错，请稍后再试。',
          articles: [],
          trends: [],
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Simple RSS parser
function parseRSS(xml: string, sourceName: string, category: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Extract items using regex
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

  for (const itemMatch of itemMatches) {
    const titleMatch = itemMatch.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       itemMatch.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
    const linkMatch = itemMatch.match(/<link[^>]*>([^<]+)<\/link>/i);
    const pubDateMatch = itemMatch.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
    const descMatch = itemMatch.match(/<description[^>]*>([^<]+)<\/description>/i) ||
                      itemMatch.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);

    if (titleMatch && linkMatch) {
      const title = extractContent(titleMatch[1]);
      const link = extractContent(linkMatch[1]);
      const pubDateStr = pubDateMatch ? extractContent(pubDateMatch[1]) : '';
      const description = descMatch ? extractContent(descMatch[1]).substring(0, 500) : '';

      let pubDate = new Date();
      if (pubDateStr) {
        pubDate = new Date(pubDateStr);
      }

      items.push({
        title,
        link,
        pubDate,
        description: stripHtml(description),
        source: sourceName,
        category,
      });
    }
  }

  return items;
}

function extractContent(text: string): string {
  // Remove CDATA wrapper if present
  return text.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .trim();
}
