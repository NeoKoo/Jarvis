'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTaskStore } from '@/stores/task-store';
import { Sparkles, Loader2, Clock, AlertCircle, CheckCircle2, Plus, XCircle } from 'lucide-react';
import { BreakdownResponse, SubTask } from '@/types';

interface TaskBreakdownPanelProps {
  onClose?: () => void;
}

export function TaskBreakdownPanel({ onClose }: TaskBreakdownPanelProps) {
  const [input, setInput] = useState('');
  const [availableHours, setAvailableHours] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    success: number;
    failed: number;
    isImporting: boolean;
  } | null>(null);

  const { addTask } = useTaskStore();

  const handleBreakdown = async () => {
    if (!input.trim()) return;

    setIsBreakingDown(true);
    setError('');
    setBreakdown(null);

    try {
      const response = await fetch('/api/task-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: input,
          context: {
            availableHours: availableHours ? parseInt(availableHours) : undefined,
            deadline: deadline || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('分解任务失败');
      }

      const data = await response.json();
      setBreakdown(data);

      // 自动显示确认对话框
      setShowConfirmDialog(true);
    } catch (err) {
      console.error('Breakdown failed:', err);
      setError('任务分解失败，请稍后重试');
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleImportTask = async (subtask: SubTask, order: number) => {
    try {
      // 计算截止日期
      let dueDate: Date | undefined;
      if (subtask.deadline) {
        // 简单处理T-N格式，实际项目中需要更复杂的日期解析
        if (subtask.deadline.startsWith('T-')) {
          const days = parseInt(subtask.deadline.replace('T-', '').replace('天', ''));
          if (deadline) {
            dueDate = new Date(deadline);
            dueDate.setDate(dueDate.getDate() - days);
          }
        } else {
          dueDate = new Date(subtask.deadline);
        }
      }

      await addTask({
        title: subtask.title,
        description: subtask.notes,
        priority: subtask.priority,
        status: 'todo',
        dueDate,
      });
    } catch (err) {
      console.error('Failed to import task:', err);
    }
  };

  const handleImportAll = async () => {
    if (!breakdown) return;

    // 显示确认对话框
    setShowConfirmDialog(true);
  };

  const handleConfirmImport = async () => {
    if (!breakdown) return;

    const total = breakdown.breakdown.subtasks.length;
    let success = 0;
    let failed = 0;

    // 初始化导入状态
    setImportStatus({
      total,
      success: 0,
      failed: 0,
      isImporting: true,
    });

    // 逐个导入任务
    for (let i = 0; i < breakdown.breakdown.subtasks.length; i++) {
      const subtask = breakdown.breakdown.subtasks[i];

      try {
        await handleImportTask(subtask, subtask.order);
        success++;

        // 更新进度
        setImportStatus({
          total,
          success,
          failed,
          isImporting: i < breakdown.breakdown.subtasks.length - 1,
        });
      } catch (error) {
        console.error(`Failed to import task "${subtask.title}":`, error);
        failed++;

        // 继续导入下一个任务
        setImportStatus({
          total,
          success,
          failed,
          isImporting: i < breakdown.breakdown.subtasks.length - 1,
        });
      }
    }

    // 完成导入
    setImportStatus({
      total,
      success,
      failed,
      isImporting: false,
    });
  };

  const handleCloseDialog = () => {
    setShowConfirmDialog(false);
    setImportStatus(null);

    // 导入成功后关闭分解面板
    if (importStatus && importStatus.success > 0 && importStatus.failed === 0) {
      if (onClose) onClose();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>智能任务分解</CardTitle>
        </div>
        <CardDescription>
          输入一个复杂任务，AI会帮你将其分解为可执行的小步骤
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <textarea
            placeholder="例如：准备下周的产品发布会、学习React并构建一个项目、筹备公司年会..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[120px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isBreakingDown}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">每天可用时间（小时）</label>
              <Input
                type="number"
                placeholder="例如：4"
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                disabled={isBreakingDown}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">截止日期</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isBreakingDown}
              />
            </div>
          </div>

          <Button
            onClick={handleBreakdown}
            disabled={isBreakingDown || !input.trim()}
            className="w-full"
            size="lg"
          >
            {isBreakingDown ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI正在思考中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                开始智能分解
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Breakdown Results */}
        {breakdown && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Summary */}
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">{breakdown.breakdown.title}</h3>
              {breakdown.breakdown.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {breakdown.breakdown.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">总预估时间：</span>
                  <span className="text-primary font-semibold">{breakdown.totalEstimatedHours}小时</span>
                </div>
              </div>
              {breakdown.suggestedTimeline && (
                <div className="mt-2 text-sm text-muted-foreground">
                  💡 {breakdown.suggestedTimeline}
                </div>
              )}
            </div>

            {/* Tips */}
            {breakdown.tips && breakdown.tips.length > 0 && (
              <div className="bg-blue-500/5 p-3 rounded-md border border-blue-500/20">
                <h4 className="text-sm font-semibold mb-2 text-blue-600 dark:text-blue-400">💡 建议</h4>
                <ul className="space-y-1">
                  {breakdown.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-muted-foreground">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                子任务列表
              </h4>
              <div className="space-y-2">
                {breakdown.breakdown.subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            #{subtask.order}
                          </span>
                          <h5 className="font-medium text-sm">{subtask.title}</h5>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                          <span className={`px-2 py-0.5 rounded border ${getPriorityColor(subtask.priority)}`}>
                            {getPriorityLabel(subtask.priority)}优先级
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {subtask.estimatedHours}小时
                          </span>
                          {subtask.deadline && (
                            <span className="text-muted-foreground">
                              📅 {subtask.deadline}
                            </span>
                          )}
                        </div>

                        {subtask.notes && (
                          <p className="text-xs text-muted-foreground">{subtask.notes}</p>
                        )}

                        {subtask.dependencies && subtask.dependencies.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">依赖：</span>
                            <span className="text-primary">{subtask.dependencies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImportTask(subtask, subtask.order)}
                        className="flex-shrink-0"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        导入
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import All Button */}
            <Button onClick={handleImportAll} size="lg" className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              一键导入所有任务
            </Button>
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入任务</DialogTitle>
            <DialogDescription>
              即将导入 {breakdown?.breakdown.subtasks.length || 0} 个子任务
            </DialogDescription>
          </DialogHeader>

          {/* Task Preview */}
          <div className="space-y-2 my-4">
            {breakdown?.breakdown.subtasks.slice(0, 3).map((subtask, i) => (
              <div key={i} className="text-sm flex justify-between items-center p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{subtask.order}
                  </span>
                  <span className="font-medium">{subtask.title}</span>
                </div>
                <span className="text-muted-foreground text-xs">{subtask.estimatedHours}h</span>
              </div>
            ))}
            {breakdown && breakdown.breakdown.subtasks.length > 3 && (
              <div className="text-sm text-muted-foreground text-center p-2">
                ... 还有 {breakdown.breakdown.subtasks.length - 3} 个任务
              </div>
            )}
          </div>

          {/* Import Progress */}
          {importStatus?.isImporting && (
            <div className="my-4">
              <Progress value={((importStatus.success + importStatus.failed) / importStatus.total) * 100} />
              <p className="text-sm text-center mt-2">
                正在导入 {importStatus.success + importStatus.failed + 1}/{importStatus.total}
              </p>
            </div>
          )}

          {/* Import Result */}
          {importStatus && !importStatus.isImporting && (
            <div className="my-4 p-4 bg-muted rounded">
              <p className="text-sm font-medium mb-2">导入完成</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  成功 {importStatus.success} 个
                </span>
                {importStatus.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    失败 {importStatus.failed} 个
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {!importStatus?.isImporting && (
              <>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleConfirmImport}>
                  立即导入
                </Button>
              </>
            )}
            {importStatus && !importStatus.isImporting && (
              <Button onClick={handleCloseDialog}>
                完成
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
