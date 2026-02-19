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

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export class QwenClient {
  private apiKey: string;
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || '';
    this.baseURL = process.env.QWEN_API_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
    this.defaultTimeout = 30000; // 30 seconds
    this.defaultRetries = 2;
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your_qwen_api_key_here';
  }

  /**
   * Convert our Message format to Qwen format
   */
  private convertMessages(messages: Message[]): QwenMessage[] {
    const converted = messages
      .filter(msg => msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

    if (converted.length === 0) {
      throw new Error('No valid messages to send to API');
    }

    return converted;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Sleep for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = this.defaultRetries,
      initialDelay = 1000,
      maxDelay = 10000,
    } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('No valid messages') ||
          lastError.message.includes('not configured')
        ) {
          throw lastError;
        }

        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );

        console.warn(`Qwen API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, lastError.message);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Generate a chat completion with timeout and retry
   */
  async chat(
    messages: Message[],
    options: { timeout?: number; retries?: number } = {}
  ): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('QWEN_API_KEY is not configured');
    }

    const timeout = options.timeout || this.defaultTimeout;

    const response = await this.retryWithBackoff(async () => {
      const apiResponse = await this.fetchWithTimeout(
        `${this.baseURL}/services/aigc/text-generation/generation`,
        {
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
        },
        timeout
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Qwen API error: ${apiResponse.status} - ${errorText}`);
      }

      return apiResponse;
    }, {
      maxRetries: options.retries ?? this.defaultRetries,
    });

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
  }

  /**
   * Generate a streaming chat completion with timeout and retry
   */
  async *chatStream(
    messages: Message[],
    options: { timeout?: number; retries?: number } = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('QWEN_API_KEY is not configured');
    }

    const timeout = options.timeout || this.defaultTimeout;

    const response = await this.retryWithBackoff(async () => {
      const apiResponse = await this.fetchWithTimeout(
        `${this.baseURL}/services/aigc/text-generation/generation`,
        {
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
        },
        timeout
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Qwen API error: ${apiResponse.status} - ${errorText}`);
      }

      return apiResponse;
    }, {
      maxRetries: options.retries ?? this.defaultRetries,
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
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
              // Silently skip parsing errors in streaming
              console.debug('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
