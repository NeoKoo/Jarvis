'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncStore } from '@/stores/sync-store';
import { useToast } from '@/hooks/use-toast';
import {
  Github,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Cloud,
  CloudOff,
  Settings,
} from 'lucide-react';

export function GitHubSyncSettings() {
  const {
    config,
    isEnabled,
    autoSync,
    isSyncing,
    syncError,
    lastSyncAt,
    lastSyncResult,
    loadConfig,
    setAutoSync,
    sync,
  } = useSyncStore();

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig().then(() => setIsLoading(false));
  }, [loadConfig]);

  const handleSyncNow = async () => {
    try {
      const { useNoteStore } = await import('@/stores/note-store');
      const { useTaskStore } = await import('@/stores/task-store');

      await useNoteStore.getState().loadNotes();
      await useTaskStore.getState().loadTasks();

      const notes = useNoteStore.getState().notes;
      const tasks = useTaskStore.getState().tasks;

      const result = await sync(notes, tasks);

      if (result.success) {
        toast.success(`同步成功！笔记: ↑${result.notes.uploaded} ↓${result.notes.downloaded} | 任务: ↑${result.tasks.uploaded} ↓${result.tasks.downloaded}`);
      } else {
        toast.error(`同步失败: ${result.error}`);
      }
    } catch (error) {
      toast.error(`同步出错: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return '从未同步';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <CardTitle>加载同步配置...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-muted-foreground" />
            <CardTitle>GitHub 同步</CardTitle>
          </div>
          <CardDescription>
            将笔记和任务同步到 GitHub 仓库，实现跨设备数据同步和备份
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Settings className="h-5 w-5" />
              <span className="font-medium">需要在环境变量中配置</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              请在服务器的 <code className="bg-background px-1 py-0.5 rounded">.env.local</code> 文件中添加以下配置：
            </p>
            <div className="space-y-2 text-sm">
              <div className="bg-background p-2 rounded font-mono">
                <div className="text-muted-foreground"># GitHub Personal Access Token</div>
                <div>GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx</div>
              </div>
              <div className="bg-background p-2 rounded font-mono">
                <div className="text-muted-foreground"># GitHub 仓库配置</div>
                <div>GITHUB_REPO_OWNER=your_username</div>
                <div>GITHUB_REPO_NAME=jarvis-data</div>
                <div>GITHUB_BRANCH=main</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 配置后需要重启服务器才能生效
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>数据存储结构：</strong>
            </p>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
{`jarvis-data/
├── notes/
│   └── 2024-02/
│       └── note-id.md
├── tasks/
│   └── 2024-02/
│       └── task-id.json
└── .jarvis-sync.json`}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-green-500" />
            <CardTitle>GitHub 同步</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" />
            已连接
          </div>
        </div>
        <CardDescription>
          {config?.owner}/{config?.repo}
          {config && config.branch !== 'main' && ` (${config.branch})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">同步状态</p>
            <p className="text-xs text-muted-foreground">
              上次同步: {formatLastSync(lastSyncAt)}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                立即同步
              </>
            )}
          </Button>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
            <p className="font-medium">最近同步结果:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">笔记:</span>{' '}
                ↑{lastSyncResult.notes.uploaded} ↓{lastSyncResult.notes.downloaded}
              </div>
              <div>
                <span className="text-muted-foreground">任务:</span>{' '}
                ↑{lastSyncResult.tasks.uploaded} ↓{lastSyncResult.tasks.downloaded}
              </div>
            </div>
          </div>
        )}

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">自动同步</p>
            <p className="text-xs text-muted-foreground">
              数据变更时自动同步到 GitHub
            </p>
          </div>
          <Button
            variant={autoSync ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoSync(!autoSync)}
          >
            {autoSync ? '已启用' : '已禁用'}
          </Button>
        </div>

        {/* Error Display */}
        {syncError && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Configuration Info */}
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <p>配置来源: 环境变量</p>
          <p>修改配置需要重启服务器</p>
        </div>
      </CardContent>
    </Card>
  );
}
