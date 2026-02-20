import { QwenClient } from './lib/llm/qwen-client';
import { Message } from './types';

async function testQwenAPI() {
  console.log('Testing Qwen API...');

  // Temporarily set API key for testing
  process.env.QWEN_API_KEY = 'sk-60960c67ba4348f6862ee4dc6311e8c3';

  const client = new QwenClient();

  const messages: Message[] = [
    {
      id: '1',
      role: 'system',
      content: 'You are a helpful assistant.',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'user',
      content: 'Please say "Hello, Qwen API is working!" in English.',
      timestamp: new Date(),
    },
  ];

  try {
    const result = await client.chat(messages, { timeout: 30000, retries: 1 });
    console.log('✅ Qwen API Test Success!');
    console.log('Response:', result.content);
  } catch (error) {
    console.error('❌ Qwen API Test Failed:', error);
  }
}

testQwenAPI();
