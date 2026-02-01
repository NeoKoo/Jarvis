import { NextRequest, NextResponse } from 'next/server';
import { GLMClient } from '@/lib/llm/glm-client';
import { Message } from '@/types';

export const runtime = 'edge';

const TIME_CAPSULE_SYSTEM_PROMPT = `你是一位温暖、智慧的时光信使。当用户打开他们写给未来的时光胶囊时，你需要：

1. **回顾祝福**：温暖地回顾用户当初写下的内容
2. **时光见证**：强调时间的流逝和成长的意义
3. **激励鼓励**：给予积极正面的鼓励
4. **引发思考**：提出1-2个发人深省的问题

**回复风格**：
- 温暖而富有诗意
- 不冗长，控制在100-150字
- 充满希望和正能量

**示例**：
"亲爱的朋友，时光荏苒，当你打开这封信时，距离当初写下它已经过去了[X天]。那时的你，对未来怀着[简述用户的期待或心情]。时间是位神奇的魔术师，它带走了青春的稚嫩，却留下了成长的印记。愿你此刻回望，能够微笑着感谢当初那个努力生活、勇敢前行的自己。未来的路还很长，愿你继续带着勇气和热爱，书写更精彩的人生篇章。"`;

interface GenerateMessageRequest {
  content: string;
  createdAt: string;
  openDate: string;
}

async function generateTimeCapsuleMessage(content: string, createdAt: string, openDate: string): Promise<string> {
  const glmClient = new GLMClient();

  const created = new Date(createdAt);
  const open = new Date(openDate);
  const daysPassed = Math.floor((open.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  const userPrompt = `用户在${created.toLocaleDateString('zh-CN')}写下了这封时光胶囊，计划在${open.toLocaleDateString('zh-CN')}打开（间隔${daysPassed}天）。内容如下：

"${content}"

请为用户生成一段温暖的开场白。`;

  const messages: Message[] = [
    {
      id: 'system',
      role: 'system',
      content: TIME_CAPSULE_SYSTEM_PROMPT,
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
    return response.content.trim();
  } catch (error) {
    console.error('Error generating time capsule message:', error);
    // Fallback message
    return `亲爱的朋友，时光荏�，当你打开这封信时，距离当初写下它已经过去了${daysPassed}天。愿你此刻回望，能够微笑着感谢当初那个努力生活的自己。`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMessageRequest = await request.json();

    if (!body.content || !body.createdAt || !body.openDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const aiMessage = await generateTimeCapsuleMessage(
      body.content,
      body.createdAt,
      body.openDate
    );

    return NextResponse.json({ aiMessage });
  } catch (error) {
    console.error('Time capsule API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI message' },
      { status: 500 }
    );
  }
}
