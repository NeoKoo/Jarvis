'use client';

import { useSyncStore } from '@/stores/sync-store';
import { Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SyncIndicator() {
  const { isEnabled, isSyncing, lastSyncAt, sync } = useSyncStore();

  const formatLastSync = (date: Date | null) => {
    if (!date) return '从未同步';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    return date.toLocaleDateString();
  };

  const handleSync = async () => {
    try {
      const { useNoteStore } = await import('@/stores/note-store');
      const { useTaskStore } = await import('@/stores/task-store');

      await useNoteStore.getState().loadNotes();
      await useTaskStore.getState().loadTasks();

      const notes = useNoteStore.getState().notes;
      const tasks = useTaskStore.getState().tasks;

      await sync(notes, tasks);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSync}
      disabled={isSyncing}
      className="relative"
      title={`GitHub 同步: ${formatLastSync(lastSyncAt)}`}
    >
      {isSyncing ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      ) : (
        <Cloud className="h-5 w-5 text-green-500" />
      )}
    </Button>
  );
}

export function SyncIndicatorDisabled() {
  const { isEnabled } = useSyncStore();

  if (isEnabled) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      title="未配置 GitHub 同步，前往设置页面配置"
    >
      <a href="/settings">
        <CloudOff className="h-5 w-5 text-muted-foreground" />
      </a>
    </Button>
  );
}
