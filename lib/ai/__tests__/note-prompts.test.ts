import { generateSummaryPrompt, estimateTokens, selectOptimalLength } from '../note-prompts';
import { Note } from '@/types';

describe('note-prompts', () => {
  const mockNote: Note = {
    id: '1',
    title: '测试笔记标题',
    content: '这是一段很长的测试内容，包含多个要点。第一点：学习 Next.js 框架。第二点：掌握 TypeScript 类型系统。第三点：理解 React 原理。第四点：实践项目开发。这是为了提高前端开发技能而制定的学习计划。',
    tags: ['学习', '前端'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('generateSummaryPrompt', () => {
    it('should generate a prompt for short summary', () => {
      const prompt = generateSummaryPrompt(mockNote, 'short');

      expect(prompt).toContain('摘要');
      expect(prompt).toContain(mockNote.title);
      expect(prompt).toContain(mockNote.content);
      expect(prompt).toContain('简短');
    });

    it('should generate a prompt for medium summary', () => {
      const prompt = generateSummaryPrompt(mockNote, 'medium');

      expect(prompt).toContain('摘要');
      expect(prompt).toContain(mockNote.title);
      expect(prompt).toContain(mockNote.content);
      expect(prompt).toContain('中等');
    });

    it('should generate a prompt for long summary', () => {
      const prompt = generateSummaryPrompt(mockNote, 'long');

      expect(prompt).toContain('摘要');
      expect(prompt).toContain(mockNote.title);
      expect(prompt).toContain(mockNote.content);
      expect(prompt).toContain('详细');
    });

    it('should handle note with empty content', () => {
      const emptyNote: Note = {
        ...mockNote,
        content: '',
      };

      const prompt = generateSummaryPrompt(emptyNote, 'short');

      expect(prompt).toContain('摘要');
      expect(prompt).toContain(mockNote.title);
    });

    it('should handle note with very long content', () => {
      const longContent = 'A'.repeat(10000);
      const longNote: Note = {
        ...mockNote,
        content: longContent,
      };

      const prompt = generateSummaryPrompt(longNote, 'short');

      // Should truncate or handle long content appropriately
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for Chinese text', () => {
      const text = '这是一段中文文本';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(text.length * 2);
    });

    it('should estimate tokens for English text', () => {
      const text = 'This is English text';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('should estimate tokens for mixed content', () => {
      const text = '这是中英文混合 mixed content 文本';
      const tokens = estimateTokens(text);

      expect(tokens).toBeGreaterThan(0);
    });

    it('should return 0 for empty string', () => {
      const tokens = estimateTokens('');

      expect(tokens).toBe(0);
    });
  });

  describe('selectOptimalLength', () => {
    it('should select short for brief notes', () => {
      const briefNote: Note = {
        ...mockNote,
        content: '简短的笔记',
      };

      const length = selectOptimalLength(briefNote);

      expect(length).toBe('short');
    });

    it('should select medium for average notes', () => {
      const mediumNote: Note = {
        ...mockNote,
        content: '这是一篇中等长度的笔记。' .repeat(20), // ~120 chars
      };

      const length = selectOptimalLength(mediumNote);

      expect(length).toBe('medium');
    });

    it('should select long for lengthy notes', () => {
      const lengthyNote: Note = {
        ...mockNote,
        content: '很长的笔记内容。'.repeat(150), // ~1050 chars
      };

      const length = selectOptimalLength(lengthyNote);

      expect(length).toBe('long');
    });
  });
});
