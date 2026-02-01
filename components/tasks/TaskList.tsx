'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaskStore } from '@/stores/task-store';
import { Plus, CheckCircle2, Circle, AlertCircle, Clock, Trash2, Edit2, Filter, Sparkles } from 'lucide-react';
import { Task } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TaskBreakdownPanel } from './TaskBreakdown';

interface TaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
}

export function TaskList() {
  const {
    filteredTasks,
    isLoading,
    filter,
    sortBy,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFilter,
    setSortBy,
  } = useTaskStore();

  const [showForm, setShowForm] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTask) {
      await updateTask(editingTask.id, formData);
      setEditingTask(null);
    } else {
      await addTask({
        ...formData,
        status: 'todo',
      });
    }

    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
    });
    setShowForm(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
    }
  };

  const tasks = filteredTasks();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">任务管理</h1>
          <p className="text-muted-foreground">跟踪和管理您的待办事项</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBreakdown(!showBreakdown)} variant="outline" size="lg">
            <Sparkles className="h-5 w-5 mr-2" />
            智能分解
          </Button>
          <Button onClick={() => setShowForm(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            新建任务
          </Button>
        </div>
      </div>

      {/* Task Breakdown Panel */}
      {showBreakdown && (
        <TaskBreakdownPanel onClose={() => setShowBreakdown(false)} />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">筛选:</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'todo', 'in-progress', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? '全部' : f === 'todo' ? '待办' : f === 'in-progress' ? '进行中' : '已完成'}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="dueDate">截止日期</option>
                <option value="priority">优先级</option>
                <option value="createdAt">创建时间</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Form */}
      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingTask ? '编辑任务' : '新建任务'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="任务标题"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <textarea
                placeholder="任务描述（可选）"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">截止日期</label>
                  <Input
                    type="date"
                    value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      dueDate: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>

              <Input
                placeholder="分类（可选）"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTask ? '更新' : '创建'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无任务</p>
              <p className="text-sm mt-2">点击"新建任务"创建您的第一个任务</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className={`hover:shadow-md transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-1 hover:scale-110 transition-transform"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.dueDate), 'MM月dd日')}
                        </span>
                      )}
                      {task.category && (
                        <span className="px-2 py-0.5 rounded bg-secondary">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
