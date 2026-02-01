import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db/schema';
import { llmRouter } from '@/lib/llm/router';
import { generateSummaryPrompt, selectOptimalLength } from '@/lib/ai/note-prompts';
import type { Note } from '@/types';

export type SummaryLength = 'short' | 'medium' | 'long';

interface SummaryRequest {
  noteId: string;
  length?: SummaryLength;
}

interface SummaryResponse {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();

    // Validate request
    if (!body.noteId) {
      return NextResponse.json(
        { error: '笔记 ID 是必需的' },
        { status: 400 }
      );
    }

    // Get note from database
    const note = (await dbHelpers.getNote(body.noteId)) as Note | null;

    if (!note) {
      return NextResponse.json(
        { error: '笔记不存在' },
        { status: 404 }
      );
    }

    // Determine summary length
    const length = body.length || selectOptimalLength(note);

    // Generate prompt
    const prompt = generateSummaryPrompt(note, length);

    // Call AI using the router with Qwen model
    const messages = [
      {
        id: crypto.randomUUID(),
        role: 'system' as const,
        content: '你是一个专业的笔记摘要助手，擅长提炼要点和生成简洁准确的摘要。',
        timestamp: new Date(),
      },
      {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: prompt,
        timestamp: new Date(),
      },
    ];

    const { response: aiResponse } = await llmRouter.chatWithModel(messages, 'qwen');

    // Extract text content from response
    const summary = typeof aiResponse === 'string' ? aiResponse : aiResponse.content || '';

    if (!summary) {
      return NextResponse.json(
        { error: '生成摘要失败' },
        { status: 500 }
      );
    }

    const responseData: SummaryResponse = {
      summary,
      originalLength: note.content.length,
      summaryLength: summary.length,
      compressionRatio: note.content.length / summary.length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating summary:', error);

    return NextResponse.json(
      {
        error: '生成摘要时发生错误',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
