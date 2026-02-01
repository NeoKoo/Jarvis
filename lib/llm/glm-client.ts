import { Message, LLMResponse } from '@/types';

interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GLMAPIRequest {
  model: string;
  messages: GLMMessage[];
  stream?: boolean;
}

interface GLMAPIResponse {
  choices: Array<{
    index: number;
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

export class GLMClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.GLM_API_KEY || '';
    this.baseURL = process.env.GLM_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  }

  /**
   * Convert our Message format to GLM format
   */
  private convertMessages(messages: Message[]): GLMMessage[] {
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
      throw new Error('GLM_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4-plus',
          messages: this.convertMessages(messages),
        } as GLMAPIRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${error}`);
      }

      const data: GLMAPIResponse = await response.json();

      const content = data.choices[0]?.message?.content || '';
      return {
        content,
        model: 'glm-4-plus',
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error calling GLM API:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('GLM_API_KEY is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4-plus',
          messages: this.convertMessages(messages),
          stream: true,
        } as GLMAPIRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${error}`);
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
              const content = data.choices?.[0]?.delta?.content;
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
      console.error('Error calling GLM streaming API:', error);
      throw error;
    }
  }
}
