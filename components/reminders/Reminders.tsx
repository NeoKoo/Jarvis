'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bell, Clock, MapPin, Trash2, Check } from 'lucide-react';
import { Reminder } from '@/types';
import { dbHelpers } from '@/lib/db/schema';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    time: '',
    type: 'time' as 'time' | 'location',
  });

  useEffect(() => {
    loadReminders();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const loadReminders = async () => {
    try {
      const allReminders = await dbHelpers.getPendingReminders();
      setReminders(allReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      type: formData.type,
      message: formData.message,
      time: formData.type === 'time' ? new Date(formData.time) : undefined,
      sent: false,
    };

    await dbHelpers.saveReminder(newReminder);
    setReminders((prev) => [...prev, newReminder]);

    // 设置浏览器通知
    if (formData.type === 'time' && newReminder.time) {
      scheduleNotification(newReminder);
    }

    setFormData({ message: '', time: '', type: 'time' });
    setShowForm(false);
  };

  const scheduleNotification = (reminder: Reminder) => {
    if (!reminder.time) return;

    const now = new Date().getTime();
    const reminderTime = new Date(reminder.time!).getTime();
    const delay = reminderTime - now;

    if (delay > 0) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Jarvis 提醒', {
            body: reminder.message,
            icon: '/icons/icon.svg',
          });
        }
      }, delay);
    }
  };

  const dismissReminder = async (id: string) => {
    await dbHelpers.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">提醒</h1>
          <p className="text-muted-foreground">设置智能提醒</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          新建提醒
        </Button>
      </div>

      {/* Notification Permission */}
      {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">启用通知以接收提醒</span>
              </div>
              <Button size="sm" onClick={requestNotificationPermission}>
                启用通知
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminder Form */}
      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>新建提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">提醒内容</label>
                <Input
                  placeholder="例如：下午3点开会"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">提醒类型</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="time"
                      checked={formData.type === 'time'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    />
                    <Clock className="h-4 w-4" />
                    时间提醒
                  </label>
                  <label className="flex items-center gap-2 opacity-50">
                    <input
                      type="radio"
                      value="location"
                      checked={formData.type === 'location'}
                      disabled
                    />
                    <MapPin className="h-4 w-4" />
                    位置提醒（即将推出）
                  </label>
                </div>
              </div>

              {formData.type === 'time' && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">提醒时间</label>
                  <Input
                    type="datetime-local"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">创建提醒</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">待发送提醒 ({reminders.length})</h2>
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无提醒</p>
              <p className="text-sm mt-2">点击"新建提醒"创建您的第一个提醒</p>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">{reminder.message}</p>
                    {reminder.time && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(reminder.time), 'yyyy年MM月dd日 HH:mm')}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => dismissReminder(reminder.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissReminder(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">关于提醒</p>
              <p className="text-xs text-muted-foreground mt-1">
                时间提醒通过浏览器通知发送。请确保已授予通知权限。
                位置提醒功能即将推出，将基于地理位置触发提醒。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
