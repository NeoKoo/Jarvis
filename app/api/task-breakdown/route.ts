import { NextRequest, NextResponse } from 'next/server';
import { GLMClient } from '@/lib/llm/glm-client';
import { Message, BreakdownRequest, BreakdownResponse } from '@/types';

export const runtime = 'edge';

const BREAKDOWN_SYSTEM_PROMPT = `你是一个专业的项目管理助手，擅长将复杂任务分解为可执行的子任务。

## 核心原则
1. **任务颗粒度**：每个子任务应该是独立可执行的，通常在1-8小时内完成
2. **逻辑顺序**：子任务之间应有明确的先后顺序和依赖关系
3. **时间估算**：基于合理的工作强度估算时间
4. **优先级标注**：根据重要性和紧急性标注优先级
5. **依赖关系**：明确标注哪些任务需要先完成

## 输出格式要求
必须返回纯JSON格式，不要有任何其他文字、markdown标记或解释：
{
  "title": "主任务标题",
  "description": "任务概述（1-2句话）",
  "subtasks": [
    {
      "title": "子任务标题",
      "estimatedHours": 4,
      "priority": "high",
      "order": 1,
      "dependencies": [],
      "deadline": "T-3天",
      "notes": "关键路径任务，需要提前准备"
    }
  ],
  "totalEstimatedHours": 20,
  "suggestedTimeline": "建议在20小时内完成，可以分4天进行，每天5小时",
  "tips": ["提前联系场地", "准备备用方案", "预留缓冲时间"]
}

## 优先级规则
- high：关键路径任务，直接影响项目成败
- medium：重要但可以适当调整的任务
- low：锦上添花的任务

## 时间估算参考
- 简单任务：1-2小时
- 中等任务：3-5小时
- 复杂任务：6-8小时
- 超过8小时的子任务应该进一步分解

## 依赖关系标注
- dependencies：子任务标题数组，表示必须先完成的任务
- 示例：["确定场地", "准备PPT"] 表示这两个任务必须先完成

## 截止日期格式
- T-N天：距离最终截止日期N天
- 具体日期：YYYY-MM-DD格式
- 相对时间："本周五前"、"下周一"等`;

async function generateBreakdown(taskDescription: string, context?: BreakdownRequest['context']): Promise<BreakdownResponse> {
  const glmClient = new GLMClient();

  let userPrompt = `请帮我分解这个任务：${taskDescription}`;

  if (context) {
    const contextParts: string[] = [];
    if (context.availableHours) contextParts.push(`可用时间：每天${context.availableHours}小时`);
    if (context.deadline) contextParts.push(`截止日期：${context.deadline}`);
    if (context.teamSize) contextParts.push(`团队规模：${context.teamSize}人`);
    if (context.preferences) contextParts.push(`特殊要求：${context.preferences}`);

    if (contextParts.length > 0) {
      userPrompt += `\n\n背景信息：\n${contextParts.join('\n')}`;
    }
  }

  const messages: Message[] = [
    {
      id: 'system',
      role: 'system',
      content: BREAKDOWN_SYSTEM_PROMPT,
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

    // 尝试从响应中提取JSON
    let jsonContent = response.content.trim();

    // 移除可能的markdown代码块标记
    jsonContent = jsonContent.replace(/^```json\s*/i, '');
    jsonContent = jsonContent.replace(/^```\s*/i, '');
    jsonContent = jsonContent.replace(/\s*```$/i, '');

    // 解析JSON
    const breakdown = JSON.parse(jsonContent);

    return {
      originalTask: taskDescription,
      breakdown: {
        title: breakdown.title || taskDescription,
        description: breakdown.description || '',
        subtasks: breakdown.subtasks || [],
      },
      totalEstimatedHours: breakdown.totalEstimatedHours || 0,
      suggestedTimeline: breakdown.suggestedTimeline || '',
      tips: breakdown.tips || [],
    };
  } catch (error) {
    console.error('Error generating task breakdown:', error);
    throw new Error('Failed to generate task breakdown');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BreakdownRequest = await request.json();

    if (!body.taskDescription || body.taskDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    const breakdown = await generateBreakdown(
      body.taskDescription,
      body.context
    );

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Task breakdown API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate task breakdown' },
      { status: 500 }
    );
  }
}
