'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarEvent } from '@/types';
import { format } from 'date-fns';
import { X, Clock, MapPin } from 'lucide-react';

interface EventFormProps {
  selectedDate?: Date;
  editingEvent?: CalendarEvent | null;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function EventForm({ selectedDate, editingEvent, onSave, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        startTime: format(new Date(editingEvent.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(editingEvent.endTime), "yyyy-MM-dd'T'HH:mm"),
        location: editingEvent.location || '',
      });
    } else if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setFormData({
        title: '',
        description: '',
        startTime: `${dateStr}T09:00`,
        endTime: `${dateStr}T10:00`,
        location: '',
      });
    }
  }, [editingEvent, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title: formData.title,
      description: formData.description || undefined,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      location: formData.location || undefined,
      reminders: [],
    };

    onSave(eventData);
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{editingEvent ? '编辑日程' : '新建日程'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">标题 *</label>
            <Input
              placeholder="例如：团队会议"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">描述</label>
            <textarea
              placeholder="添加描述..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  开始时间 *
                </div>
              </label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  结束时间 *
                </div>
              </label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                地点
              </div>
            </label>
            <Input
              placeholder="例如：会议室A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingEvent ? '更新' : '创建'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
