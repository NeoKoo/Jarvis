import { create } from 'zustand';
import { EnvGitHubSyncService, SyncResult } from '@/lib/sync/github-sync';
import { Note, Task } from '@/types';

interface SyncStore {
  // Configuration from environment
  config: {
    owner: string;
    repo: string;
    branch: string;
  } | null;
  isEnabled: boolean;
  autoSync: boolean;
  lastSyncAt: Date | null;

  // Sync State
  isSyncing: boolean;
  syncError: string | null;

  // Sync Results
  lastSyncResult: SyncResult | null;

  // Actions
  loadConfig: () => Promise<void>;
  setAutoSync: (enabled: boolean) => void;
  validateConfig: () => Promise<boolean>;
  sync: (notes: Note[], tasks: Task[]) => Promise<SyncResult>;
  syncNotes: (notes: Note[]) => Promise<any>;
  syncTasks: (tasks: Task[]) => Promise<any>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  config: null,
  isEnabled: false,
  autoSync: false,
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,
  lastSyncResult: null,

  loadConfig: async () => {
    set({ isSyncing: true, syncError: null });

    try {
      const service = new EnvGitHubSyncService();
      const config = await service.getConfig();

      if (!config.isEnabled) {
        set({
          config: null,
          isEnabled: false,
          isSyncing: false,
        });
        return;
      }

      // Load settings from localStorage
      const savedAutoSync = localStorage.getItem('jarvis-github-autosync');
      const savedLastSync = localStorage.getItem('jarvis-last-sync');

      set({
        config: {
          owner: config.owner,
          repo: config.repo,
          branch: config.branch,
        },
        isEnabled: true,
        autoSync: savedAutoSync === 'true',
        lastSyncAt: savedLastSync ? new Date(savedLastSync) : null,
        isSyncing: false,
      });
    } catch (error) {
      set({
        syncError: error instanceof Error ? error.message : 'Failed to load config',
        isSyncing: false,
      });
    }
  },

  setAutoSync: (enabled) => {
    localStorage.setItem('jarvis-github-autosync', String(enabled));
    set({ autoSync: enabled });
  },

  validateConfig: async () => {
    try {
      const service = new EnvGitHubSyncService();
      return await service.validateConfig();
    } catch {
      return false;
    }
  },

  sync: async (notes, tasks) => {
    const { isEnabled } = get();
    if (!isEnabled) {
      throw new Error('GitHub sync not configured in environment');
    }

    set({ isSyncing: true, syncError: null });

    try {
      const service = new EnvGitHubSyncService();
      const result = await service.sync(notes, tasks);

      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      localStorage.setItem('jarvis-last-sync', new Date().toISOString());

      set({
        lastSyncAt: new Date(),
        lastSyncResult: result,
        isSyncing: false,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sync failed';
      set({
        syncError: errorMsg,
        isSyncing: false,
      });
      throw error;
    }
  },

  syncNotes: async (notes) => {
    const { isEnabled } = get();
    if (!isEnabled) {
      throw new Error('GitHub sync not configured in environment');
    }

    set({ isSyncing: true, syncError: null });

    try {
      const service = new EnvGitHubSyncService();
      await service.initialize();
      const result = await service.syncNotes(notes);

      set({
        isSyncing: false,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Notes sync failed';
      set({
        syncError: errorMsg,
        isSyncing: false,
      });
      throw error;
    }
  },

  syncTasks: async (tasks) => {
    const { isEnabled } = get();
    if (!isEnabled) {
      throw new Error('GitHub sync not configured in environment');
    }

    set({ isSyncing: true, syncError: null });

    try {
      const service = new EnvGitHubSyncService();
      await service.initialize();
      const result = await service.syncTasks(tasks);

      set({
        isSyncing: false,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Tasks sync failed';
      set({
        syncError: errorMsg,
        isSyncing: false,
      });
      throw error;
    }
  },
}));

// Initialize from localStorage on client side
if (typeof window !== 'undefined') {
  const savedAutoSync = localStorage.getItem('jarvis-github-autosync');
  const savedLastSync = localStorage.getItem('jarvis-last-sync');

  if (savedAutoSync) {
    useSyncStore.setState({
      autoSync: savedAutoSync === 'true',
      lastSyncAt: savedLastSync ? new Date(savedLastSync) : null,
    });
  }
}
