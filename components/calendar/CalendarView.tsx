'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarStore } from '@/stores/calendar-store';
import { EventForm } from './EventForm';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  differenceInDays,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { CalendarEvent } from '@/types';

export function CalendarView() {
  const {
    events,
    isLoading,
    selectedDate,
    loadEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    setSelectedDate,
  } = useCalendarStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // 生成日历天数
  const daysDiff = differenceInDays(calendarEnd, calendarStart);
  const calendarDays = Array.from({ length: daysDiff + 1 }, (_, i) =>
    addDays(calendarStart, i)
  );

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return date >= eventStart && date <= eventEnd;
    });
    setSelectedDayEvents(dayEvents);
    setEditingEvent(null);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await addEvent(eventData);
    }
    setShowEventForm(false);
    setEditingEvent(null);

    // 更新选中日期的事件列表
    const date = selectedDate;
    if (date) {
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        return date >= eventStart && date <= eventEnd;
      });
      setSelectedDayEvents(dayEvents);
    }
  };

  const handleCancelForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return date >= eventStart && date <= eventEnd;
    }).slice(0, 3);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日历</h1>
          <p className="text-muted-foreground">管理您的日程安排</p>
        </div>
        <Button onClick={() => setShowEventForm(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          新建日程
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {format(currentMonth, 'yyyy年MM月')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                今天
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = isSameDay(date, selectedDate);
              const isDayToday = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={`min-h-[100px] p-2 rounded-lg border transition-all hover:shadow-md ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                    isDayToday ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isDayToday ? 'text-primary' : ''
                  }`}>
                    {format(date, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} 更多
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Events */}
      {(selectedDayEvents.length > 0 || isSameDay(selectedDate, new Date())) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'MM月dd日')} 的日程
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">暂无日程</p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(event.startTime), 'HH:mm')} - {' '}
                          {format(new Date(event.endTime), 'HH:mm')}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditEvent(event)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEvent(event.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Form */}
      {showEventForm && (
        <EventForm
          selectedDate={selectedDate}
          editingEvent={editingEvent}
          onSave={handleSaveEvent}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}
