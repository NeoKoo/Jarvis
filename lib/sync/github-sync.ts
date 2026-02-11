/**
 * GitHub Sync Module for Jarvis
 * Handles bi-directional sync of Notes and Tasks with GitHub repository
 */

import { GitHubClient, GitHubConfig } from './github-client';
import { GitHubApiClient } from './github-api-client';
import { Note, Task } from '@/types';

export interface SyncOptions {
  conflictResolution?: 'local' | 'remote' | 'manual';
  autoSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  notes: {
    uploaded: number;
    downloaded: number;
    conflicts: number;
  };
  tasks: {
    uploaded: number;
    downloaded: number;
    conflicts: number;
  };
  error?: string;
}

export interface SyncMetadata {
  lastSyncAt: string;
  notes: Record<string, { updatedAt: string; sha: string }>;
  tasks: Record<string, { updatedAt: string; sha: string }>;
}

/**
 * Convert Note to Markdown format for GitHub storage
 */
function noteToMarkdown(note: Note): string {
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
 * Parse Markdown from GitHub to Note
 */
function markdownToNote(path: string, content: string): Note {
  // Extract ID from filename (e.g., "notes/2024-01-note-id.md" -> "note-id")
  const id = path.replace(/^notes\/\d{4}-\d{2}-/, '').replace('.md', '');

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let metadata: any = {};

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    metadata = frontmatter.split('\n').reduce((acc: any, line) => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        let value: any = match[2];
        // Try to parse JSON values
        try {
          value = JSON.parse(value);
        } catch {}
        acc[match[1]] = value;
      }
      return acc;
    }, {});
  }

  // Extract title and content
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : metadata.title || 'Untitled';
  const noteContent = content
    .replace(/^---\n[\s\S]*?\n---\n\n*/, '')
    .replace(/^#\s+.+\n*/, '')
    .trim();

  return {
    id: metadata.id || id,
    title,
    content: noteContent,
    tags: metadata.tags || [],
    createdAt: new Date(metadata.createdAt || Date.now()),
    updatedAt: new Date(metadata.updatedAt || Date.now()),
    isAiGenerated: metadata.isAiGenerated || false,
  };
}

/**
 * Get GitHub file path for a Note
 */
function getNoteFilePath(note: Note): string {
  const date = new Date(note.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `notes/${year}-${month}/${note.id}.md`;
}

/**
 * Get GitHub file path for a Task
 */
function getTaskFilePath(task: Task): string {
  const date = new Date(task.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `tasks/${year}-${month}/${task.id}.json`;
}

/**
 * Main GitHub Sync Service
 */
export class GitHubSyncService {
  private client: GitHubClient;
  private metadata: SyncMetadata = {
    lastSyncAt: '',
    notes: {},
    tasks: {},
  };

  constructor(config: GitHubConfig) {
    this.client = new GitHubClient(config);
  }

  /**
   * Initialize sync by loading metadata from GitHub
   */
  async initialize(): Promise<void> {
    try {
      const metadataFile = await this.client.getFile('.jarvis-sync.json');
      if (metadataFile) {
        this.metadata = JSON.parse(metadataFile.content);
      }
    } catch {
      // No existing metadata, start fresh
      this.metadata = {
        lastSyncAt: new Date().toISOString(),
        notes: {},
        tasks: {},
      };
    }
  }

  /**
   * Save metadata to GitHub
   */
  private async saveMetadata(): Promise<void> {
    const content = JSON.stringify(this.metadata, null, 2);
    const existingMetadata = await this.client.getFile('.jarvis-sync.json');
    await this.client.createOrUpdateFile(
      '.jarvis-sync.json',
      content,
      'Update sync metadata',
      existingMetadata?.sha
    );
  }

  /**
   * Sync Notes to/from GitHub
   */
  async syncNotes(
    localNotes: Note[],
    onConflict?: (local: Note, remote: Note) => Promise<Note>
  ): Promise<{ uploaded: number; downloaded: number; conflicts: number }> {
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;

    // Get list of remote notes
    const noteFiles = await this.client.listFiles('notes').catch(() => []);
    const remoteNotes: Map<string, Note> = new Map();

    // Fetch all remote notes
    for (const file of noteFiles) {
      try {
        const fileContent = await this.client.getFile(`notes/${file}`);
        if (fileContent) {
          const note = markdownToNote(`notes/${file}`, fileContent.content);
          remoteNotes.set(note.id, note);
        }
      } catch (error) {
        console.error(`Failed to fetch note ${file}:`, error);
      }
    }

    // Find notes to upload (new or updated locally)
    const localNotesMap = new Map(localNotes.map((n) => [n.id, n]));
    const notesToUpload: Note[] = [];

    for (const note of localNotes) {
      const remoteNote = remoteNotes.get(note.id);
      const localMeta = this.metadata.notes[note.id];

      if (!remoteNote) {
        // New note locally
        notesToUpload.push(note);
      } else if (localMeta && new Date(note.updatedAt) > new Date(localMeta.updatedAt)) {
        // Note was updated locally since last sync
        if (new Date(note.updatedAt) > new Date(remoteNote.updatedAt)) {
          notesToUpload.push(note);
        } else if (new Date(note.updatedAt).getTime() !== new Date(remoteNote.updatedAt).getTime()) {
          // Conflict: both sides modified
          conflicts++;
          if (onConflict) {
            const resolved = await onConflict(note, remoteNote);
            notesToUpload.push(resolved);
          }
        }
      }
    }

    // Find notes to download (new or updated remotely)
    const notesToDownload: Note[] = [];

    for (const [id, remoteNote] of remoteNotes) {
      const localNote = localNotesMap.get(id);
      const remoteMeta = this.metadata.notes[id];

      if (!localNote) {
        // New note remotely
        notesToDownload.push(remoteNote);
      } else if (remoteMeta && new Date(remoteNote.updatedAt) > new Date(remoteMeta.updatedAt)) {
        // Note was updated remotely since last sync
        if (new Date(remoteNote.updatedAt) > new Date(localNote.updatedAt)) {
          notesToDownload.push(remoteNote);
        }
      }
    }

    // Upload notes
    const filesToUpload: { path: string; content: string }[] = [];
    for (const note of notesToUpload) {
      filesToUpload.push({
        path: getNoteFilePath(note),
        content: noteToMarkdown(note),
      });
      this.metadata.notes[note.id] = {
        updatedAt: note.updatedAt.toISOString(),
        sha: '', // Will be updated after commit
      };
    }

    if (filesToUpload.length > 0) {
      await this.client.createMultipleFiles(filesToUpload, `Sync ${filesToUpload.length} note(s)`);
      uploaded = filesToUpload.length;
    }

    // Download notes (return them to be saved locally)
    downloaded = notesToDownload.length;

    // Update metadata
    this.metadata.lastSyncAt = new Date().toISOString();
    await this.saveMetadata();

    return {
      uploaded,
      downloaded,
      conflicts,
    };
  }

  /**
   * Sync Tasks to/from GitHub
   */
  async syncTasks(
    localTasks: Task[],
    onConflict?: (local: Task, remote: Task) => Promise<Task>
  ): Promise<{ uploaded: number; downloaded: number; conflicts: number; downloadedTasks: Task[] }> {
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;
    const downloadedTasks: Task[] = [];

    // Get list of remote tasks
    const taskFiles = await this.client.listFiles('tasks').catch(() => []);
    const remoteTasks: Map<string, Task> = new Map();

    // Fetch all remote tasks
    for (const file of taskFiles) {
      try {
        const fileContent = await this.client.getFile(`tasks/${file}`);
        if (fileContent) {
          const task: Task = JSON.parse(fileContent.content);
          remoteTasks.set(task.id, task);
        }
      } catch (error) {
        console.error(`Failed to fetch task ${file}:`, error);
      }
    }

    // Find tasks to upload
    const localTasksMap = new Map(localTasks.map((t) => [t.id, t]));
    const tasksToUpload: Task[] = [];

    for (const task of localTasks) {
      const remoteTask = remoteTasks.get(task.id);
      const localMeta = this.metadata.tasks[task.id];

      if (!remoteTask) {
        tasksToUpload.push(task);
      } else if (localMeta && new Date(task.updatedAt) > new Date(localMeta.updatedAt)) {
        if (new Date(task.updatedAt) > new Date(remoteTask.updatedAt)) {
          tasksToUpload.push(task);
        } else if (new Date(task.updatedAt).getTime() !== new Date(remoteTask.updatedAt).getTime()) {
          conflicts++;
          if (onConflict) {
            const resolved = await onConflict(task, remoteTask);
            tasksToUpload.push(resolved);
          }
        }
      }
    }

    // Find tasks to download
    const tasksToDownload: Task[] = [];

    for (const [id, remoteTask] of remoteTasks) {
      const localTask = localTasksMap.get(id);
      const remoteMeta = this.metadata.tasks[id];

      if (!localTask) {
        tasksToDownload.push(remoteTask);
      } else if (remoteMeta && new Date(remoteTask.updatedAt) > new Date(remoteMeta.updatedAt)) {
        if (new Date(remoteTask.updatedAt) > new Date(localTask.updatedAt)) {
          tasksToDownload.push(remoteTask);
        }
      }
    }

    // Upload tasks
    const filesToUpload: { path: string; content: string }[] = [];
    for (const task of tasksToUpload) {
      filesToUpload.push({
        path: getTaskFilePath(task),
        content: JSON.stringify(task, null, 2),
      });
      this.metadata.tasks[task.id] = {
        updatedAt: task.updatedAt.toISOString(),
        sha: '',
      };
    }

    if (filesToUpload.length > 0) {
      await this.client.createMultipleFiles(filesToUpload, `Sync ${filesToUpload.length} task(s)`);
      uploaded = filesToUpload.length;
    }

    // Collect tasks to download
    downloadedTasks.push(...tasksToDownload);
    downloaded = tasksToDownload.length;

    // Update metadata
    this.metadata.lastSyncAt = new Date().toISOString();
    await this.saveMetadata();

    return {
      uploaded,
      downloaded,
      conflicts,
      downloadedTasks,
    };
  }

  /**
   * Full sync: notes and tasks
   */
  async sync(
    localNotes: Note[],
    localTasks: Task[],
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    try {
      await this.initialize();

      const notesResult = await this.syncNotes(localNotes);
      const tasksResult = await this.syncTasks(localTasks);

      // Merge downloaded tasks into local state
      const downloadedTasks = tasksResult.downloadedTasks;

      return {
        success: true,
        notes: notesResult,
        tasks: {
          uploaded: tasksResult.uploaded,
          downloaded: tasksResult.downloaded,
          conflicts: tasksResult.conflicts,
        },
      };
    } catch (error) {
      return {
        success: false,
        notes: { uploaded: 0, downloaded: 0, conflicts: 0 },
        tasks: { uploaded: 0, downloaded: 0, conflicts: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate GitHub configuration
   */
  async validateConfig(): Promise<boolean> {
    return this.client.validateConfig();
  }
}

/**
 * Environment-based GitHub Sync Service
 * Uses Next.js API routes to access GitHub credentials from environment variables
 */
export class EnvGitHubSyncService {
  private apiClient: GitHubApiClient;
  private metadata: SyncMetadata = {
    lastSyncAt: '',
    notes: {},
    tasks: {},
  };

  constructor() {
    this.apiClient = new GitHubApiClient();
  }

  /**
   * Get sync configuration from environment
   */
  async getConfig(): Promise<{
    owner: string;
    repo: string;
    branch: string;
    isEnabled: boolean;
  }> {
    return this.apiClient.getConfig();
  }

  /**
   * Initialize sync by loading metadata from GitHub
   */
  async initialize(): Promise<void> {
    try {
      const metadataFile = await this.apiClient.getFile('.jarvis-sync.json');
      if (metadataFile) {
        this.metadata = JSON.parse(metadataFile.content);
      }
    } catch {
      // No existing metadata, start fresh
      this.metadata = {
        lastSyncAt: new Date().toISOString(),
        notes: {},
        tasks: {},
      };
    }
  }

  /**
   * Save metadata to GitHub
   */
  private async saveMetadata(): Promise<void> {
    const content = JSON.stringify(this.metadata, null, 2);
    const existingMetadata = await this.apiClient.getFile('.jarvis-sync.json');

    if (existingMetadata?.sha) {
      // Need to implement update via API
      await this.apiClient.createFiles(
        [{ path: '.jarvis-sync.json', content }],
        'Update sync metadata'
      );
    } else {
      await this.apiClient.createFiles(
        [{ path: '.jarvis-sync.json', content }],
        'Create sync metadata'
      );
    }
  }

  /**
   * Sync Notes to/from GitHub
   */
  async syncNotes(
    localNotes: Note[]
  ): Promise<{ uploaded: number; downloaded: number; conflicts: number }> {
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;

    // Get list of remote notes
    const noteFiles = await this.apiClient.listFiles('notes');
    const remoteNotes: Map<string, Note> = new Map();

    // Fetch all remote notes
    for (const file of noteFiles) {
      try {
        const fileContent = await this.apiClient.getFile(`notes/${file}`);
        if (fileContent) {
          const note = markdownToNote(`notes/${file}`, fileContent.content);
          remoteNotes.set(note.id, note);
        }
      } catch (error) {
        console.error(`Failed to fetch note ${file}:`, error);
      }
    }

    // Find notes to upload
    const localNotesMap = new Map(localNotes.map((n) => [n.id, n]));
    const notesToUpload: Note[] = [];

    for (const note of localNotes) {
      const remoteNote = remoteNotes.get(note.id);
      const localMeta = this.metadata.notes[note.id];

      if (!remoteNote) {
        notesToUpload.push(note);
      } else if (localMeta && new Date(note.updatedAt) > new Date(localMeta.updatedAt)) {
        if (new Date(note.updatedAt) > new Date(remoteNote.updatedAt)) {
          notesToUpload.push(note);
        }
      }
    }

    // Find notes to download
    const notesToDownload: Note[] = [];

    for (const [id, remoteNote] of remoteNotes) {
      const localNote = localNotesMap.get(id);
      const remoteMeta = this.metadata.notes[id];

      if (!localNote) {
        notesToDownload.push(remoteNote);
      } else if (remoteMeta && new Date(remoteNote.updatedAt) > new Date(remoteMeta.updatedAt)) {
        if (new Date(remoteNote.updatedAt) > new Date(localNote.updatedAt)) {
          notesToDownload.push(remoteNote);
        }
      }
    }

    // Upload notes
    const filesToUpload: { path: string; content: string }[] = [];
    for (const note of notesToUpload) {
      filesToUpload.push({
        path: getNoteFilePath(note),
        content: noteToMarkdown(note),
      });
      this.metadata.notes[note.id] = {
        updatedAt: note.updatedAt.toISOString(),
        sha: '',
      };
    }

    if (filesToUpload.length > 0) {
      await this.apiClient.createFiles(filesToUpload, `Sync ${filesToUpload.length} note(s)`);
      uploaded = filesToUpload.length;
    }

    // Update metadata
    this.metadata.lastSyncAt = new Date().toISOString();
    await this.saveMetadata();

    return {
      uploaded,
      downloaded: notesToDownload.length,
      conflicts,
    };
  }

  /**
   * Sync Tasks to/from GitHub
   */
  async syncTasks(
    localTasks: Task[]
  ): Promise<{ uploaded: number; downloaded: number; conflicts: number; downloadedTasks: Task[] }> {
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;
    const downloadedTasks: Task[] = [];

    // Get list of remote tasks
    const taskFiles = await this.apiClient.listFiles('tasks');
    const remoteTasks: Map<string, Task> = new Map();

    // Fetch all remote tasks
    for (const file of taskFiles) {
      try {
        const fileContent = await this.apiClient.getFile(`tasks/${file}`);
        if (fileContent) {
          const task: Task = JSON.parse(fileContent.content);
          remoteTasks.set(task.id, task);
        }
      } catch (error) {
        console.error(`Failed to fetch task ${file}:`, error);
      }
    }

    // Find tasks to upload
    const localTasksMap = new Map(localTasks.map((t) => [t.id, t]));
    const tasksToUpload: Task[] = [];

    for (const task of localTasks) {
      const remoteTask = remoteTasks.get(task.id);
      const localMeta = this.metadata.tasks[task.id];

      if (!remoteTask) {
        tasksToUpload.push(task);
      } else if (localMeta && new Date(task.updatedAt) > new Date(localMeta.updatedAt)) {
        if (new Date(task.updatedAt) > new Date(remoteTask.updatedAt)) {
          tasksToUpload.push(task);
        }
      }
    }

    // Find tasks to download
    const tasksToDownload: Task[] = [];

    for (const [id, remoteTask] of remoteTasks) {
      const localTask = localTasksMap.get(id);
      const remoteMeta = this.metadata.tasks[id];

      if (!localTask) {
        tasksToDownload.push(remoteTask);
      } else if (remoteMeta && new Date(remoteTask.updatedAt) > new Date(remoteMeta.updatedAt)) {
        if (new Date(remoteTask.updatedAt) > new Date(localTask.updatedAt)) {
          tasksToDownload.push(remoteTask);
        }
      }
    }

    // Upload tasks
    const filesToUpload: { path: string; content: string }[] = [];
    for (const task of tasksToUpload) {
      filesToUpload.push({
        path: getTaskFilePath(task),
        content: JSON.stringify(task, null, 2),
      });
      this.metadata.tasks[task.id] = {
        updatedAt: task.updatedAt.toISOString(),
        sha: '',
      };
    }

    if (filesToUpload.length > 0) {
      await this.apiClient.createFiles(filesToUpload, `Sync ${filesToUpload.length} task(s)`);
      uploaded = filesToUpload.length;
    }

    downloadedTasks.push(...tasksToDownload);
    downloaded = tasksToDownload.length;

    // Update metadata
    this.metadata.lastSyncAt = new Date().toISOString();
    await this.saveMetadata();

    return {
      uploaded,
      downloaded,
      conflicts,
      downloadedTasks,
    };
  }

  /**
   * Full sync: notes and tasks
   */
  async sync(
    localNotes: Note[],
    localTasks: Task[]
  ): Promise<SyncResult> {
    try {
      await this.initialize();

      const notesResult = await this.syncNotes(localNotes);
      const tasksResult = await this.syncTasks(localTasks);

      return {
        success: true,
        notes: notesResult,
        tasks: {
          uploaded: tasksResult.uploaded,
          downloaded: tasksResult.downloaded,
          conflicts: tasksResult.conflicts,
        },
      };
    } catch (error) {
      return {
        success: false,
        notes: { uploaded: 0, downloaded: 0, conflicts: 0 },
        tasks: { uploaded: 0, downloaded: 0, conflicts: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate GitHub configuration
   */
  async validateConfig(): Promise<boolean> {
    return this.apiClient.validateConnection();
  }
}
