import { Note } from '@/types';

export type SummaryLength = 'short' | 'medium' | 'long';

/**
 * Generate summary prompt for AI
 * @param note - The note to summarize
 * @param length - Desired summary length
 * @returns Formatted prompt for AI
 */
export function generateSummaryPrompt(note: Note, length: SummaryLength): string {
  // Truncate very long content to avoid token limits
  const maxContentLength = 3000;
  const truncatedContent =
    note.content.length > maxContentLength
      ? note.content.substring(0, maxContentLength) + '...'
      : note.content;

  const lengthInstructions = {
    short: '1-2 句话',
    medium: '3-5 句话，涵盖主要观点',
    long: '详细的摘要，包含所有重要细节',
  };

  const prompt = `请为以下笔记生成${length === 'short' ? '简短' : length === 'medium' ? '中等长度' : '详细'}摘要：

标题：${note.title}

内容：
${truncatedContent}

${note.tags.length > 0 ? `标签：${note.tags.join(', ')}` : ''}

要求：
- 生成一个${lengthInstructions[length]}的摘要
- 保留关键信息和要点
- 使用清晰简洁的语言
- 不要添加原文中没有的信息

摘要：`;

  return prompt;
}

/**
 * Estimate token count for text
 * Rough estimation: ~1.5 tokens per character for Chinese, ~0.25 for English
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Count Chinese characters
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  // Count non-Chinese characters (words)
  const nonChineseChars = text.length - chineseChars;

  // Rough estimation: Chinese chars are more token-intensive
  const chineseTokens = chineseChars * 1.5;
  const nonChineseTokens = nonChineseChars * 0.25;

  return Math.ceil(chineseTokens + nonChineseTokens);
}

/**
 * Select optimal summary length based on note content
 * @param note - The note to analyze
 * @returns Recommended summary length
 */
export function selectOptimalLength(note: Note): SummaryLength {
  const contentLength = note.content.length;

  // Brief notes (< 200 chars)
  if (contentLength < 200) {
    return 'short';
  }

  // Lengthy notes (> 1000 chars)
  if (contentLength > 1000) {
    return 'long';
  }

  // Average notes
  return 'medium';
}
