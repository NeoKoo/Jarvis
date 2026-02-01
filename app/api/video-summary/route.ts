import { NextRequest, NextResponse } from 'next/server';
import { GLMClient } from '@/lib/llm/glm-client';
import { Message, VideoSummary, VideoSummaryRequest, VideoSummaryResponse } from '@/types';

export const runtime = 'edge';

const VIDEO_SUMMARY_SYSTEM_PROMPT = `你是一个专业的视频内容分析师，擅长从短视频平台的视频页面内容中提取关键信息并生成精炼的总结。

## 核心任务
1. **理解视频内容**：从视频标题、描述、评论中提取核心信息
2. **提炼关键观点**：识别视频的主要观点、亮点和价值点
3. **智能标签生成**：根据内容自动生成3-5个相关标签
4. **结构化输出**：以清晰的格式呈现总结内容

## 分析维度
- **主题识别**：视频属于什么类型（教育、娱乐、生活、科技等）
- **核心信息**：视频要传达的主要信息或技能
- **亮点提取**：独特的观点、有趣的细节、实用的技巧
- **用户反馈**：从评论中提取观众的主要反应和观点

## 输出格式
必须返回纯JSON格式（无markdown标记）：
{
  "title": "简短标题（不超过30字）",
  "summary": "详细总结（200-300字）",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "tags": ["标签1", "标签2", "标签3"],
  "category": "分类",
  "sentiment": "positive/neutral/educational/entertainment"
}`;

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): 'douyin' | 'tiktok' | 'other' {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('douyin.com')) return 'douyin';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  return 'other';
}

/**
 * Validate video URL
 */
function validateVideoUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  const lowerUrl = url.toLowerCase();
  if (!lowerUrl.includes('douyin.com') &&
      !lowerUrl.includes('tiktok.com') &&
      !lowerUrl.includes('bilibili.com') &&
      !lowerUrl.includes('youtube.com')) {
    return { valid: false, error: 'Unsupported video platform. Please use Douyin, TikTok, Bilibili, or YouTube URLs' };
  }

  return { valid: true };
}

/**
 * Extract content from video page
 * Note: This is a basic implementation. For production, use webReader MCP tool
 */
async function extractVideoContent(url: string): Promise<{
  title: string;
  description?: string;
  comments?: string;
  metadata?: Record<string, any>;
}> {
  try {
    // Basic fetch implementation
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Basic meta extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Video';

    const descMatch = html.match(/<meta name="description" content="([^"]*)"/i);
    const description = descMatch ? descMatch[1] : '';

    return {
      title,
      description,
      comments: '',
      metadata: {
        extractedAt: new Date().toISOString(),
        sourceUrl: url,
      },
    };
  } catch (error) {
    console.error('Error extracting video content:', error);

    // Fallback: return basic info from URL
    return {
      title: 'Video from URL',
      description: `Content extracted from: ${url}`,
      comments: '',
      metadata: {
        sourceUrl: url,
        error: 'Content extraction failed',
      },
    };
  }
}

/**
 * Generate AI summary from video content
 */
async function generateVideoSummary(
  videoUrl: string,
  platform: 'douyin' | 'tiktok' | 'other',
  content: {
    title: string;
    description?: string;
    comments?: string;
    metadata?: Record<string, any>;
  }
): Promise<Omit<VideoSummary, 'id' | 'createdAt' | 'updatedAt'>> {
  const glmClient = new GLMClient();

  const userPrompt = `请分析以下视频内容并生成总结：

**视频平台**: ${platform}
**视频标题**: ${content.title}
**视频描述**: ${content.description || '无描述'}
**评论内容**: ${content.comments || '无评论'}
**来源链接**: ${videoUrl}

请生成结构化的视频总结。`;

  const messages: Message[] = [
    {
      id: 'system',
      role: 'system',
      content: VIDEO_SUMMARY_SYSTEM_PROMPT,
      timestamp: new Date(),
    },
    {
      id: 'user',
      role: 'user',
      content: userPrompt,
      timestamp: new Date(),
    },
  ];

  try {
    const response = await glmClient.chat(messages);

    // Extract JSON from response
    let jsonContent = response.content.trim();

    // Remove markdown code blocks
    jsonContent = jsonContent.replace(/^```json\s*/i, '');
    jsonContent = jsonContent.replace(/^```\s*/i, '');
    jsonContent = jsonContent.replace(/\s*```$/i, '');

    // Parse JSON
    const aiResult = JSON.parse(jsonContent);

    return {
      videoUrl,
      platform,
      title: aiResult.title || content.title,
      content: aiResult.summary || 'No summary generated',
      originalContent: {
        description: content.description,
        comments: content.comments,
        metadata: content.metadata,
      },
      keyPoints: aiResult.keyPoints || [],
      tags: aiResult.tags || [],
      isAiGenerated: true,
    };
  } catch (error) {
    console.error('Error generating video summary:', error);
    throw new Error('Failed to generate video summary');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoSummaryRequest = await request.json();

    // Validate URL
    const validation = validateVideoUrl(body.videoUrl);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Detect platform
    const platform = body.platform || detectPlatform(body.videoUrl);

    // Extract video content
    const content = await extractVideoContent(body.videoUrl);

    // Generate AI summary
    const summaryData = await generateVideoSummary(body.videoUrl, platform, content);

    const response: VideoSummaryResponse = {
      summary: summaryData as VideoSummary,
      source: content,
    };

    // Add generated fields
    response.summary.id = crypto.randomUUID();
    response.summary.createdAt = new Date();
    response.summary.updatedAt = new Date();

    return NextResponse.json(response);
  } catch (error) {
    console.error('Video summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video summary' },
      { status: 500 }
    );
  }
}
