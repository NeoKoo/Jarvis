import { Message, LLMResponse } from '@/types';

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenAPIRequest {
  model: string;
  messages: QwenMessage[];
  stream?: boolean;
}

interface QwenAPIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class QwenClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || '';
    this.baseURL = process.env.QWEN_API_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
  }

  /**
   * Convert our Message format to Qwen format
   */
  private convertMessages(messages: Message[]): QwenMessage[] {
    return messages
      .filter(msg => msg.role !== 'system' || msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  /**
   * Generate a chat completion
   */
  async chat(messages: Message[]): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          messages: this.convertMessages(messages),
          result_format: 'message',
        } as QwenAPIRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Qwen API error: ${response.status} - ${error}`);
      }

      const data: QwenAPIResponse = await response.json();

      const content = data.choices[0]?.message?.content || '';
      return {
        content,
        model: 'qwen-max',
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error calling Qwen API:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-max',
          messages: this.convertMessages(messages),
          result_format: 'message',
          stream: true,
        } as QwenAPIRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Qwen API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data:[DONE]') continue;

          if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.slice(5).trim();
              const data = JSON.parse(jsonStr);
              const content = data.output?.choices?.[0]?.message?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calling Qwen streaming API:', error);
      throw error;
    }
  }
}
