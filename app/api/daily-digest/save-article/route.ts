import { NextResponse } from 'next/server';
import { QwenClient } from '@/lib/llm/qwen-client';
import { dbHelpers } from '@/lib/db/schema';
import { Message } from '@/types';

interface Article {
  title: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  description: string;
  reason: string;
}

interface SaveArticleRequest {
  article: Article;
}

export async function POST(request: Request) {
  try {
    const body: SaveArticleRequest = await request.json();
    const { article } = body;

    if (!article) {
      return NextResponse.json(
        { error: 'Article information is required' },
        { status: 400 }
      );
    }

    // Check if QWEN_API_KEY is configured
    const hasQwenKey = process.env.QWEN_API_KEY && process.env.QWEN_API_KEY !== 'your_qwen_api_key_here';

    if (!hasQwenKey) {
      // Save without AI processing
      const note = {
        title: article.title,
        content: `# ${article.title}

**来源：** ${article.source}
**分类：** ${article.category}
**链接：** ${article.link}

## 摘要
${article.description}

## 推荐理由
${article.reason}

---
*发布时间：${new Date(article.pubDate).toLocaleString('zh-CN')}*`,
        tags: ['技术文章', article.category, article.source],
        isAiGenerated: false,
      };

      await dbHelpers.saveNote({
        id: crypto.randomUUID(),
        ...note,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        note: {
          title: note.title,
          content: note.content,
          tags: note.tags,
        },
      });
    }

    // Use AI to enhance the article note
    const qwenClient = new QwenClient();

    const prompt = `请帮我将这篇技术文章整理成一篇结构清晰的笔记。

文章信息：
- 标题: ${article.title}
- 来源: ${article.source}
- 分类: ${article.category}
- 链接: ${article.link}
- 摘要: ${article.description}
- 推荐理由: ${article.reason}

请按以下格式生成笔记：

# ${article.title}

## 核心观点
（提取文章的核心观点和亮点）

## 详细内容
（扩展文章的主要内容，保持技术准确性）

## 技术要点
（如果涉及技术内容，列出关键技术点或概念）

## 应用价值
（说明这篇文章的实用价值和应用场景）

## 原文信息
- **来源：** ${article.source}
- **分类：** ${article.category}
- **链接：** ${article.link}

---
*由 AI 自动生成于 ${new Date().toLocaleString('zh-CN')}*`;

    const messages: Message[] = [
      {
        id: 'system',
        role: 'system',
        content: '你是一个专业的技术文档助手，擅长将技术文章整理成清晰易懂的笔记，保留关键技术细节。',
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

    // Save to notes database
    const note = {
      title: article.title,
      content: result.content,
      tags: ['技术文章', article.category, article.source],
      isAiGenerated: true,
    };

    await dbHelpers.saveNote({
      id: crypto.randomUUID(),
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      note: {
        title: note.title,
        content: result.content,
        tags: note.tags,
      },
    });
  } catch (error) {
    console.error('Error saving article to note:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
