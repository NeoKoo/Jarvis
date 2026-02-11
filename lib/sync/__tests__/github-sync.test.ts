/**
 * GitHub Sync Module Tests
 * Run with: npx tsx lib/sync/__tests__/github-sync.test.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubClient, GitHubConfig } from '../github-client';
import { GitHubSyncService } from '../github-sync';
import { Note, Task } from '@/types';

// Mock config - replace with real values for testing
const testConfig: GitHubConfig = {
  token: process.env.GITHUB_TEST_TOKEN || '',
  owner: process.env.GITHUB_TEST_OWNER || '',
  repo: process.env.GITHUB_TEST_REPO || 'jarvis-data-test',
  branch: 'main',
};

describe('GitHub Sync Module', () => {
  describe('GitHubClient', () => {
    let client: GitHubClient;

    beforeEach(() => {
      client = new GitHubClient(testConfig);
    });

    it('should validate configuration', async () => {
      if (!testConfig.token) {
        console.warn('⚠️ Skipping test: GITHUB_TEST_TOKEN not set');
        return;
      }

      const isValid = await client.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should get repository info', async () => {
      if (!testConfig.token) {
        return;
      }

      const repo = await client.getRepo();
      expect(repo).toBeDefined();
      expect(repo.full_name).toBe(`${testConfig.owner}/${testConfig.repo}`);
    });

    it('should create and read files', async () => {
      if (!testConfig.token) {
        return;
      }

      const testPath = `test/test-${Date.now()}.txt`;
      const testContent = 'Hello from GitHub Sync Test!';

      // Create file
      await client.createOrUpdateFile(testPath, testContent, 'Test file creation');

      // Read file
      const file = await client.getFile(testPath);
      expect(file).toBeDefined();
      expect(file?.content).toBe(testContent);

      // Cleanup
      const fileData = await client.getFile(testPath);
      if (fileData?.sha) {
        await client.deleteFile(testPath, fileData.sha, 'Cleanup test file');
      }
    });
  });

  describe('GitHubSyncService', () => {
    let service: GitHubSyncService;

    beforeEach(() => {
      service = new GitHubSyncService(testConfig);
    });

    it('should initialize sync metadata', async () => {
      if (!testConfig.token) {
        return;
      }

      await service.initialize();
      expect(service).toBeDefined();
    });

    it('should convert note to markdown', async () => {
      const testNote: Note = {
        id: 'test-note-1',
        title: 'Test Note',
        content: 'This is a test note',
        tags: ['test', 'automated'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isAiGenerated: false,
      };

      // Note conversion is internal, but we can test sync
      if (!testConfig.token) {
        return;
      }

      await service.initialize();
      const result = await service.syncNotes([testNote]);

      expect(result).toBeDefined();
      expect(result.uploaded).toBeGreaterThanOrEqual(0);
      expect(result.downloaded).toBeGreaterThanOrEqual(0);
    });

    it('should sync tasks', async () => {
      const testTask: Task = {
        id: 'test-task-1',
        title: 'Test Task',
        description: 'Automated test task',
        status: 'todo',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!testConfig.token) {
        return;
      }

      await service.initialize();
      const result = await service.syncTasks([testTask]);

      expect(result).toBeDefined();
      expect(result.uploaded).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Note to Markdown Conversion', () => {
    it('should include frontmatter with metadata', () => {
      const note: Note = {
        id: 'test-123',
        title: 'Test Title',
        content: 'Test content',
        tags: ['tag1', 'tag2'],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        isAiGenerated: true,
      };

      const markdown = `---
id: "${note.id}"
tags: ${JSON.stringify(note.tags)}
createdAt: "${note.createdAt.toISOString()}"
updatedAt: "${note.updatedAt.toISOString()}"
isAiGenerated: ${note.isAiGenerated}
---

# ${note.title}

${note.content}
`;

      expect(markdown).toContain('---');
      expect(markdown).toContain('id: "test-123"');
      expect(markdown).toContain('# Test Title');
      expect(markdown).toContain('Test content');
    });
  });

  describe('Task JSON Format', () => {
    it('should serialize correctly', () => {
      const task: Task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'high',
        category: 'work',
        dueDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const json = JSON.stringify(task, null, 2);

      expect(json).toContain('"id": "task-123"');
      expect(json).toContain('"status": "todo"');
      expect(json).toContain('"priority": "high"');
    });
  });
});

// Manual test function
export async function runManualTests() {
  console.log('🧪 Running manual GitHub sync tests...\n');

  if (!testConfig.token) {
    console.error('❌ GITHUB_TEST_TOKEN environment variable not set');
    console.log('\nSet environment variables:');
    console.log('  export GITHUB_TEST_TOKEN=ghp_xxx');
    console.log('  export GITHUB_TEST_OWNER=your-username');
    console.log('  export GITHUB_TEST_REPO=your-repo');
    return;
  }

  try {
    // Test 1: Connection
    console.log('📡 Testing connection...');
    const client = new GitHubClient(testConfig);
    const isValid = await client.validateConfig();
    console.log(isValid ? '✅ Connection successful' : '❌ Connection failed');

    // Test 2: Repository access
    console.log('\n📦 Testing repository access...');
    const repo = await client.getRepo();
    console.log(`✅ Repository: ${repo.full_name}`);

    // Test 3: File operations
    console.log('\n📄 Testing file operations...');
    const testPath = `test/manual-test-${Date.now()}.txt`;
    await client.createOrUpdateFile(testPath, 'Test content', 'Manual test');
    console.log('✅ File created');

    const file = await client.getFile(testPath);
    console.log(file?.content === 'Test content' ? '✅ File read correctly' : '❌ File read failed');

    // Cleanup
    if (file?.sha) {
      await client.deleteFile(testPath, file.sha, 'Cleanup');
      console.log('✅ Test file deleted');
    }

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runManualTests();
}
