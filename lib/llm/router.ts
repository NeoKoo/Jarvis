import { Message, LLMModel } from '@/types';
import { QwenClient } from './qwen-client';
import { GLMClient } from './glm-client';

interface RouteRule {
  patterns: RegExp[];
  model: LLMModel;
  reason: string;
}

/**
 * Intelligent router for selecting the appropriate LLM model
 * based on the complexity and type of task
 */
export class LLMRouter {
  private qwenClient: QwenClient;
  private glmClient: GLMClient;

  // Routing rules for different types of tasks
  private rules: RouteRule[] = [
    {
      patterns: [
        /写代码|写程序|编程|code|implement|function|class|algorithm|bug|debug/i,
        /分析|analyze|推理|reasoning|复杂|complex/i,
        /长文|长篇|详细报告|detailed report|comprehensive/i,
        /创意|creative|写作|writing|文章|essay|story/i,
        /专业|professional|建议|advice|expert/i,
      ],
      model: 'glm',
      reason: 'Complex task requiring advanced reasoning',
    },
    {
      patterns: [
        /天气|weather|气温|温度/i,
        /时间|time|几点|现在/i,
        /计算|calculate|数学|math|\d+\s*[\+\-\*\/]\s*\d+/i,
        /定时器|timer|提醒|remind/i,
        /聊天|chat|你好|hello|hi|在吗/i,
        /简单|simple|快速|quick|简短|brief/i,
      ],
      model: 'qwen',
      reason: 'Simple task suitable for fast response',
    },
  ];

  constructor() {
    this.qwenClient = new QwenClient();
    this.glmClient = new GLMClient();
  }

  /**
   * Determine which model to use based on the user's message
   */
  private selectModel(messages: Message[]): LLMModel {
    // Get the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (!lastUserMessage) {
      // Default to qwen for system messages or no user messages
      return 'qwen';
    }

    const content = lastUserMessage.content;

    // Check each rule in order
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(content)) {
          console.log(`Router: Selected ${rule.model} - ${rule.reason}`);
          return rule.model;
        }
      }
    }

    // Default to qwen for unmatched messages
    console.log('Router: No pattern matched, using default (qwen)');
    return 'qwen';
  }

  /**
   * Get the appropriate client based on model selection
   */
  private getClient(model: LLMModel) {
    switch (model) {
      case 'qwen':
        return this.qwenClient;
      case 'glm':
        return this.glmClient;
      default:
        return this.qwenClient;
    }
  }

  /**
   * Route the chat request to the appropriate model
   */
  async chat(messages: Message[]): Promise<{ model: LLMModel; response: Awaited<ReturnType<QwenClient['chat']>> }> {
    const model = this.selectModel(messages);
    const client = this.getClient(model);
    const response = await client.chat(messages);
    return { model, response };
  }

  /**
   * Route the streaming chat request to the appropriate model
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    const model = this.selectModel(messages);
    const client = this.getClient(model);

    console.log(`Router: Streaming with ${model}`);

    yield* client.chatStream(messages);
  }

  /**
   * Manually override model selection
   */
  async chatWithModel(messages: Message[], model: LLMModel) {
    const client = this.getClient(model);
    return {
      model,
      response: await client.chat(messages),
    };
  }

  /**
   * Manually override model selection for streaming
   */
  async *chatStreamWithModel(messages: Message[], model: LLMModel): AsyncGenerator<string, void, unknown> {
    const client = this.getClient(model);
    yield* client.chatStream(messages);
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
