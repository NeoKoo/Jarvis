'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { ThemeToggle } from '@/components/theme-toggle';
import { GitHubSyncSettings } from '@/components/sync/GitHubSyncSettings';
import { Download, Upload, Trash2, Key, Palette, Database, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [qwenApiKey, setQwenApiKey] = useState('');
  const [glmApiKey, setGlmApiKey] = useState('');

  useEffect(() => {
    // 从localStorage加载API密钥（仅用于显示，实际密钥应在.env.local中）
    const qwenKey = localStorage.getItem('qwen_api_key') || '';
    const glmKey = localStorage.getItem('glm_api_key') || '';
    setQwenApiKey(qwenKey);
    setGlmApiKey(glmKey);
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('qwen_api_key', qwenApiKey);
    localStorage.setItem('glm_api_key', glmApiKey);
    alert('API密钥已保存（注意：生产环境应使用.env.local文件）');
  };

  const handleExportData = async () => {
    try {
      const db = await import('@/lib/db/schema').then(m => new m.JarvisDatabase());

      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        chatSessions: await db.chatSessions.toArray(),
        calendarEvents: await db.calendarEvents.toArray(),
        tasks: await db.tasks.toArray(),
        notes: await db.notes.toArray(),
        voiceMemos: await db.voiceMemos.toArray(),
        reminders: await db.reminders.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败: ' + error);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version) {
          throw new Error('无效的备份文件');
        }

        const db = (await import('@/lib/db/schema')).JarvisDatabase;
        const database = new db();

        // 清空现有数据
        await database.delete();
        await database.open();

        // 导入数据
        if (data.chatSessions) {
          await database.chatSessions.bulkAdd(data.chatSessions);
        }
        if (data.calendarEvents) {
          await database.calendarEvents.bulkAdd(data.calendarEvents);
        }
        if (data.tasks) {
          await database.tasks.bulkAdd(data.tasks);
        }
        if (data.notes) {
          await database.notes.bulkAdd(data.notes);
        }
        if (data.voiceMemos) {
          await database.voiceMemos.bulkAdd(data.voiceMemos);
        }
        if (data.reminders) {
          await database.reminders.bulkAdd(data.reminders);
        }

        alert('数据导入成功！页面将重新加载。');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('导入失败: ' + error);
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      const db = (await import('@/lib/db/schema')).JarvisDatabase;
      const database = new db();
      await database.delete();
      await database.open();
      alert('所有数据已清除');
      window.location.reload();
    } catch (error) {
      console.error('Clear data error:', error);
      alert('清除数据失败: ' + error);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">设置</h1>
            <p className="text-muted-foreground">管理您的应用设置和偏好</p>
          </div>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>API密钥</CardTitle>
              </div>
              <CardDescription>
                配置AI服务的API密钥。生产环境请在.env.local文件中配置。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">千问3 API密钥</label>
                <Input
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={qwenApiKey}
                  onChange={(e) => setQwenApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">GLM API密钥</label>
                <Input
                  type="password"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={glmApiKey}
                  onChange={(e) => setGlmApiKey(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveKeys}>保存密钥</Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>外观</CardTitle>
              </div>
              <CardDescription>自定义应用外观</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">主题模式</p>
                  <p className="text-sm text-muted-foreground">切换深色或浅色主题</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>通知</CardTitle>
              </div>
              <CardDescription>管理通知设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>浏览器通知权限</span>
                  <span className={`text-sm ${
                    typeof Notification !== 'undefined' && Notification.permission === 'granted'
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}>
                    {typeof Notification !== 'undefined'
                      ? Notification.permission === 'granted'
                        ? '已授权'
                        : Notification.permission === 'denied'
                        ? '已拒绝'
                        : '未授权'
                      : '不支持'}
                  </span>
                </div>
                {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
                  <Button size="sm" onClick={() => Notification.requestPermission()}>
                    请求通知权限
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GitHub Sync */}
          <GitHubSyncSettings />

          {/* Data Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>数据管理</CardTitle>
              </div>
              <CardDescription>导出、导入或清除您的数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
                <Button variant="outline" onClick={handleImportData}>
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </Button>
                <Button variant="destructive" onClick={handleClearData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除所有数据
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                导出的数据包含所有聊天记录、任务、笔记和日程。请妥善保管备份文件。
              </p>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>关于</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">构建</span>
                <span>Production Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">框架</span>
                <span>Next.js 15 + React 19</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
