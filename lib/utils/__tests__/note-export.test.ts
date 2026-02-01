import { exportNoteAsMarkdown, exportNotesAsMarkdown, copyToClipboard } from '../note-export';
import { Note } from '@/types';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('note-export utilities', () => {
  const mockNote: Note = {
    id: '1',
    title: 'Test Note',
    content: 'This is test content',
    tags: ['tag1', 'tag2'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('exportNoteAsMarkdown', () => {
    it('should export a note with title, content, and tags as markdown', () => {
      const result = exportNoteAsMarkdown(mockNote);

      expect(result).toContain('# Test Note');
      expect(result).toContain('This is test content');
      expect(result).toContain('**标签**：');
      expect(result).toContain('#tag1');
      expect(result).toContain('#tag2');
    });

    it('should handle note without tags', () => {
      const noteWithoutTags = { ...mockNote, tags: [] };
      const result = exportNoteAsMarkdown(noteWithoutTags);

      expect(result).toContain('# Test Note');
      expect(result).toContain('This is test content');
      expect(result).not.toContain('**标签**：');
    });

    it('should handle note with empty content', () => {
      const noteWithEmptyContent = { ...mockNote, content: '' };
      const result = exportNoteAsMarkdown(noteWithEmptyContent);

      expect(result).toContain('# Test Note');
      expect(result).toContain('\n\n'); // Empty content still has structure
    });

    it('should format multiple tags correctly', () => {
      const noteWithManyTags = {
        ...mockNote,
        tags: ['work', 'important', 'todo'],
      };
      const result = exportNoteAsMarkdown(noteWithManyTags);

      expect(result).toContain('#work');
      expect(result).toContain('#important');
      expect(result).toContain('#todo');
    });
  });

  describe('exportNotesAsMarkdown', () => {
    it('should export multiple notes with separators', () => {
      const note2: Note = {
        ...mockNote,
        id: '2',
        title: 'Second Note',
      };
      const result = exportNotesAsMarkdown([mockNote, note2]);

      expect(result).toContain('# Test Note');
      expect(result).toContain('# Second Note');
      expect(result).toContain('---'); // Separator
    });

    it('should not add separator after last note', () => {
      const notes = [mockNote];
      const result = exportNotesAsMarkdown(notes);

      const lines = result.split('\n');
      expect(lines[lines.length - 1]).not.toBe('---');
    });

    it('should return empty string for empty array', () => {
      const result = exportNotesAsMarkdown([]);
      expect(result).toBe('');
    });

    it('should export all notes in correct format', () => {
      const notes: Note[] = [
        mockNote,
        {
          ...mockNote,
          id: '2',
          title: 'Work Task',
          tags: ['urgent'],
        },
      ];
      const result = exportNotesAsMarkdown(notes);

      // Check all notes are included
      expect(result).toContain('# Test Note');
      expect(result).toContain('# Work Task');
      expect(result).toContain('#tag1');
      expect(result).toContain('#urgent');

      // Check separator count (1 separator for 2 notes)
      const separators = result.match(/---/g);
      expect(separators).toHaveLength(1);
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard and return true on success', async () => {
      const mockClipboard = navigator.clipboard.writeText as jest.Mock;
      mockClipboard.mockResolvedValueOnce(undefined);

      const result = await copyToClipboard('test text');

      expect(mockClipboard).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('should return false on clipboard error', async () => {
      const mockClipboard = navigator.clipboard.writeText as jest.Mock;
      mockClipboard.mockRejectedValueOnce(new Error('Clipboard error'));

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });

    it('should handle empty string', async () => {
      const mockClipboard = navigator.clipboard.writeText as jest.Mock;
      mockClipboard.mockResolvedValueOnce(undefined);

      const result = await copyToClipboard('');

      expect(mockClipboard).toHaveBeenCalledWith('');
      expect(result).toBe(true);
    });
  });
});
