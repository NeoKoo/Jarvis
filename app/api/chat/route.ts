import { NextRequest, NextResponse } from 'next/server';
import { llmRouter } from '@/lib/llm/router';
import { getPersonalityPrompt } from '@/lib/ai/personalities';
import { Message, AIPersonality } from '@/types';

export const runtime = 'edge';

interface ChatRequest {
  messages: Message[];
  stream?: boolean;
  model?: 'qwen' | 'glm';
  personality?: AIPersonality;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, stream = false, model, personality } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Convert timestamp strings back to Date objects
    const parsedMessages: Message[] = messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    // Add personality system prompt if provided
    let messagesWithPersonality = parsedMessages;
    if (personality) {
      const personalityPrompt = getPersonalityPrompt(personality);
      messagesWithPersonality = [
        {
          id: 'personality-system',
          role: 'system' as const,
          content: personalityPrompt,
          timestamp: new Date(),
        },
        ...parsedMessages,
      ];
    }

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            const generator = model
              ? llmRouter.chatStreamWithModel(messagesWithPersonality, model)
              : llmRouter.chatStream(messagesWithPersonality);

            for await (const chunk of generator) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({ error: String(error) })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const result = model
        ? await llmRouter.chatWithModel(messagesWithPersonality, model)
        : await llmRouter.chat(messagesWithPersonality);

      return NextResponse.json({
        content: result.response.content,
        model: result.model,
        usage: result.response.usage,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
