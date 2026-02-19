import { NextResponse } from 'next/server';
import { QwenClient } from '@/lib/llm/qwen-client';
import { dbHelpers } from '@/lib/db/schema';
import { Message } from '@/types';

interface GitHubRepository {
  fullName: string;
  description: string;
  url: string;
  language: string;
  stars: number;
}

interface SaveToNoteRequest {
  repository: GitHubRepository;
}

export async function POST(request: Request) {
  try {
    const body: SaveToNoteRequest = await request.json();
    const { repository } = body;

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository information is required' },
        { status: 400 }
      );
    }

    // 1. Fetch README from GitHub
    let readmeContent = '';
    try {
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${repository.fullName}/readme`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        // README content is base64 encoded
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.error('Error fetching README:', error);
    }

    // 2. Generate Chinese summary using Qwen
    const qwenClient = new QwenClient();

    const prompt = `请帮我分析这个 GitHub 仓库，并生成一份中文的知识库笔记。

仓库信息：
- 名称: ${repository.fullName}
- 描述: ${repository.description}
- 语言: ${repository.language}
- 星标数: ${repository.stars}
- 链接: ${repository.url}

README 内容：
${readmeContent ? readmeContent.substring(0, 10000) : '(无 README)'}

请按以下格式生成笔记：

# ${repository.fullName}

## 简介
（用中文简要介绍这个项目是做什么的）

## 主要功能
（列出项目的主要功能点和特性）

## 技术栈
（列出项目使用的主要技术和框架）

## 使用方法
（简要说明如何安装和使用这个项目）

## 应用场景
（说明这个项目适合在什么场景下使用）

## 仓库链接
${repository.url}

---
*此笔记由 AI 自动生成于 ${new Date().toLocaleString('zh-CN')}*`;

    const messages: Message[] = [
      {
        id: 'system',
        role: 'system',
        content: '你是一个专业的技术文档撰写助手，擅长将 GitHub 仓库的信息整理成清晰易懂的中文知识库笔记。',
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

    // 3. Save to notes database
    const note = {
      title: `${repository.fullName} - GitHub 仓库笔记`,
      content: result.content,
      tags: ['github', '开源', repository.language.toLowerCase(), repository.fullName.split('/')[1]],
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
    console.error('Error saving GitHub repository to note:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
