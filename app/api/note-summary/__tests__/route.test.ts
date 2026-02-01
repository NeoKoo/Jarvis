import { POST } from '../route';
import { dbHelpers } from '@/lib/db/schema';

// Mock dependencies
jest.mock('@/lib/db/schema');
jest('@/lib/llm/router');

describe('/api/note-summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return a summary for valid note', async () => {
      const mockNote = {
        id: '1',
        title: '测试笔记',
        content: '这是一段测试内容',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (dbHelpers.getNote as jest.Mock).mockResolvedValue(mockNote);

      const request = new Request('http://localhost:3000/api/note-summary', {
        method: 'POST',
        body: JSON.stringify({
          noteId: '1',
          length: 'medium',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('summary');
      expect(data.summary).toBeTruthy();
    });

    it('should handle missing note ID', async () => {
      const request = new Request('http://localhost:3000/api/note-summary', {
        method: 'POST',
        body: JSON.stringify({
          length: 'medium',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('should handle non-existent note', async () => {
      (dbHelpers.getNote as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/note-summary', {
        method: 'POST',
        body: JSON.stringify({
          noteId: 'nonexistent',
          length: 'short',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
    });

    it('should handle AI API errors gracefully', async () => {
      const mockNote = {
        id: '1',
        title: '测试笔记',
        content: '测试内容',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (dbHelpers.getNote as jest.Mock).mockResolvedValue(mockNote);

      // Mock AI failure
      jest.mock('@/lib/llm/router', () => {
        throw new Error('AI API error');
      });

      const request = new Request('http://localhost:3000/api/note-summary', {
        method: 'POST',
        body: JSON.stringify({
          noteId: '1',
          length: 'short',
        }),
      });

      const response = await POST(request);

      // Should return error but not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
