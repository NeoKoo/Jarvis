/**
 * Test helpers for GitHub sync functionality
 * Run these in browser console to verify the sync module
 */

import { GitHubClient, GitHubConfig } from './github-client';
import { GitHubSyncService } from './github-sync';
import { Note, Task } from '@/types';

export class SyncTestHelpers {
  /**
   * Test GitHub connection
   */
  static async testConnection(config: GitHubConfig): Promise<{ success: boolean; message: string }> {
    try {
      const client = new GitHubClient(config);
      const isValid = await client.validateConfig();

      if (!isValid) {
        return { success: false, message: '❌ Connection failed' };
      }

      const repo = await client.getRepo();
      return {
        success: true,
        message: `✅ Connected to ${repo.full_name}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create test note
   */
  static createTestNote(id: string): Note {
    return {
      id,
      title: `Test Note ${id}`,
      content: `This is a test note created at ${new Date().toISOString()}`,
      tags: ['test', 'auto-generated'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAiGenerated: false,
    };
  }

  /**
   * Create test task
   */
  static createTestTask(id: string): Task {
    return {
      id,
      title: `Test Task ${id}`,
      description: 'Auto-generated test task',
      status: 'todo',
      priority: 'medium',
      category: 'testing',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Test note to markdown conversion
   */
  static testNoteToMarkdown(note: Note): string {
    const metadata = {
      id: note.id,
      tags: note.tags,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      isAiGenerated: note.isAiGenerated || false,
    };

    const frontmatter = `---
${Object.entries(metadata)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---

# ${note.title}

${note.content}
`;

    return frontmatter;
  }

  /**
   * Run full sync test
   */
  static async runFullTest(config: GitHubConfig): Promise<{
    connection: { success: boolean; message: string };
    upload: { success: boolean; message: string };
    download: { success: boolean; message: string };
  }> {
    const results = {
      connection: await this.testConnection(config),
      upload: { success: false, message: '' },
      download: { success: false, message: '' },
    };

    if (!results.connection.success) {
      return results;
    }

    try {
      const service = new GitHubSyncService(config);
      await service.initialize();

      // Test upload
      const testNotes = [this.createTestNote('test-1'), this.createTestNote('test-2')];
      const testTasks = [this.createTestTask('task-1')];

      const syncResult = await service.sync(testNotes, testTasks);

      if (syncResult.success) {
        results.upload = {
          success: true,
          message: `✅ Uploaded ${syncResult.notes.uploaded} notes, ${syncResult.tasks.uploaded} tasks`,
        };

        results.download = {
          success: true,
          message: `✅ Downloaded ${syncResult.notes.downloaded} notes, ${syncResult.tasks.downloaded} tasks`,
        };
      } else {
        results.upload = {
          success: false,
          message: `❌ Sync failed: ${syncResult.error}`,
        };
      }
    } catch (error) {
      results.upload = {
        success: false,
        message: `❌ Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    return results;
  }

  /**
   * Clear test data from GitHub
   */
  static async clearTestData(config: GitHubConfig): Promise<boolean> {
    try {
      const client = new GitHubClient(config);

      // List and delete test notes
      const noteFiles = await client.listFiles('notes').catch(() => []);
      for (const file of noteFiles) {
        if (file.includes('test-')) {
          const fileData = await client.getFile(`notes/${file}`);
          if (fileData?.sha) {
            await client.deleteFile(`notes/${file}`, fileData.sha, 'Remove test data');
          }
        }
      }

      // List and delete test tasks
      const taskFiles = await client.listFiles('tasks').catch(() => []);
      for (const file of taskFiles) {
        if (file.includes('test-')) {
          const fileData = await client.getFile(`tasks/${file}`);
          if (fileData?.sha) {
            await client.deleteFile(`tasks/${file}`, fileData.sha, 'Remove test data');
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to clear test data:', error);
      return false;
    }
  }
}

/**
 * Browser console test script
 * Copy and paste this into browser console
 */
export const browserTestScript = `
// ==========================================
// GitHub Sync Test Script
// Run in browser console at localhost:3000
// ==========================================

async function testGitHubSync() {
  console.log('🧪 Starting GitHub Sync Tests...\\n');

  // 1. Get sync store
  const { useSyncStore } = await import('/stores/sync-store.ts');
  const syncStore = useSyncStore.getState();

  console.log('📊 Current sync status:');
  console.log('  Enabled:', syncStore.isEnabled);
  console.log('  Config:', syncStore.config);
  console.log('  Last Sync:', syncStore.lastSyncAt);
  console.log('  Auto Sync:', syncStore.autoSync);
  console.log('');

  // 2. Check if configured
  if (!syncStore.isEnabled) {
    console.log('❌ GitHub sync is not configured');
    console.log('Please go to Settings and configure GitHub sync first');
    return;
  }

  // 3. Load local data
  console.log('📚 Loading local data...');
  const { useNoteStore } = await import('/stores/note-store.ts');
  const { useTaskStore } = await import('/stores/task-store.ts');

  await useNoteStore.getState().loadNotes();
  await useTaskStore.getState().loadTasks();

  const notes = useNoteStore.getState().notes;
  const tasks = useTaskStore.getState().tasks;

  console.log('  Notes:', notes.length);
  console.log('  Tasks:', tasks.length);
  console.log('');

  // 4. Test sync
  console.log('🔄 Testing sync...');
  const result = await syncStore.sync(notes, tasks);

  console.log('📊 Sync result:');
  console.log('  Success:', result.success);
  console.log('  Notes uploaded:', result.notes.uploaded);
  console.log('  Notes downloaded:', result.notes.downloaded);
  console.log('  Tasks uploaded:', result.tasks.uploaded);
  console.log('  Tasks downloaded:', result.tasks.downloaded);

  if (result.error) {
    console.log('  ❌ Error:', result.error);
  } else {
    console.log('  ✅ Sync successful!');
  }

  return result;
}

// Run the test
testGitHubSync();
`;
