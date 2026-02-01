import Dexie, { Table } from 'dexie';
import {
  ChatSession,
  CalendarEvent,
  Task,
  Note,
  VoiceMemo,
  Reminder,
  TimeCapsule,
  VideoSummary
} from '@/types';

export class JarvisDatabase extends Dexie {
  chatSessions!: Table<ChatSession>;
  calendarEvents!: Table<CalendarEvent>;
  tasks!: Table<Task>;
  notes!: Table<Note>;
  voiceMemos!: Table<VoiceMemo>;
  reminders!: Table<Reminder>;
  timeCapsules!: Table<TimeCapsule>;
  videoSummaries!: Table<VideoSummary>;

  constructor() {
    super('JarvisDB');

    // Define tables and their indexes
    this.version(3).stores({
      chatSessions: 'id, title, createdAt, updatedAt',
      calendarEvents: 'id, startTime, endTime, createdAt',
      tasks: 'id, status, priority, dueDate, createdAt, category',
      notes: 'id, createdAt, tags, isAiGenerated',
      voiceMemos: 'id, createdAt, tags',
      reminders: 'id, type, sent, eventId, taskId',
      timeCapsules: 'id, openDate, createdAt, isOpened',
      videoSummaries: 'id, platform, createdAt, tags, isAiGenerated'
    });
  }
}

// Create a singleton instance
export const db = new JarvisDatabase();

// Database helper functions
export const dbHelpers = {
  // Chat Operations
  async saveChatSession(session: ChatSession): Promise<void> {
    await db.chatSessions.put(session);
  },

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return await db.chatSessions.get(id);
  },

  async getAllChatSessions(): Promise<ChatSession[]> {
    return await db.chatSessions.orderBy('updatedAt').reverse().toArray();
  },

  async deleteChatSession(id: string): Promise<void> {
    await db.chatSessions.delete(id);
  },

  // Calendar Operations
  async saveEvent(event: CalendarEvent): Promise<void> {
    await db.calendarEvents.put(event);
  },

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    return await db.calendarEvents.get(id);
  },

  async getEventsInRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    return await db.calendarEvents
      .where('startTime')
      .between(start, end, true)
      .toArray();
  },

  async getAllEvents(): Promise<CalendarEvent[]> {
    return await db.calendarEvents.orderBy('startTime').toArray();
  },

  async deleteEvent(id: string): Promise<void> {
    await db.calendarEvents.delete(id);
  },

  // Task Operations
  async saveTask(task: Task): Promise<void> {
    await db.tasks.put(task);
  },

  async getTask(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id);
  },

  async getAllTasks(): Promise<Task[]> {
    return await db.tasks.orderBy('createdAt').reverse().toArray();
  },

  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return await db.tasks.where('status').equals(status).toArray();
  },

  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  // Note Operations
  async saveNote(note: Note): Promise<void> {
    await db.notes.put(note);
  },

  async getNote(id: string): Promise<Note | undefined> {
    return await db.notes.get(id);
  },

  async getAllNotes(): Promise<Note[]> {
    return await db.notes.orderBy('updatedAt').reverse().toArray();
  },

  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await db.notes.toArray();
    const lowerQuery = query.toLowerCase();
    return allNotes.filter(
      note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  // Voice Memo Operations
  async saveVoiceMemo(memo: VoiceMemo): Promise<void> {
    await db.voiceMemos.put(memo);
  },

  async getVoiceMemo(id: string): Promise<VoiceMemo | undefined> {
    return await db.voiceMemos.get(id);
  },

  async getAllVoiceMemos(): Promise<VoiceMemo[]> {
    return await db.voiceMemos.orderBy('createdAt').reverse().toArray();
  },

  async deleteVoiceMemo(id: string): Promise<void> {
    await db.voiceMemos.delete(id);
  },

  // Reminder Operations
  async saveReminder(reminder: Reminder): Promise<void> {
    await db.reminders.put(reminder);
  },

  async getPendingReminders(): Promise<Reminder[]> {
    return await db.reminders.filter(reminder => !reminder.sent).toArray();
  },

  async markReminderSent(id: string): Promise<void> {
    await db.reminders.update(id, { sent: true });
  },

  async deleteReminder(id: string): Promise<void> {
    await db.reminders.delete(id);
  },

  // Time Capsule Operations
  async saveTimeCapsule(capsule: TimeCapsule): Promise<void> {
    await db.timeCapsules.put(capsule);
  },

  async getTimeCapsule(id: string): Promise<TimeCapsule | undefined> {
    return await db.timeCapsules.get(id);
  },

  async getAllTimeCapsules(): Promise<TimeCapsule[]> {
    return await db.timeCapsules.orderBy('openDate').toArray();
  },

  async getReadyToOpen(): Promise<TimeCapsule[]> {
    const now = new Date();
    return await db.timeCapsules
      .where('openDate')
      .belowOrEqual(now)
      .and(capsule => !capsule.isOpened)
      .toArray();
  },

  async markAsOpened(id: string, aiMessage?: string): Promise<void> {
    await db.timeCapsules.update(id, {
      isOpened: true,
      ...(aiMessage && { aiMessage })
    });
  },

  async deleteTimeCapsule(id: string): Promise<void> {
    await db.timeCapsules.delete(id);
  },

  // Video Summary Operations
  async saveVideoSummary(summary: VideoSummary): Promise<void> {
    await db.videoSummaries.put(summary);
  },

  async getVideoSummary(id: string): Promise<VideoSummary | undefined> {
    return await db.videoSummaries.get(id);
  },

  async getAllVideoSummaries(): Promise<VideoSummary[]> {
    return await db.videoSummaries.orderBy('createdAt').reverse().toArray();
  },

  async searchVideoSummaries(query: string): Promise<VideoSummary[]> {
    const allSummaries = await db.videoSummaries.toArray();
    const lowerQuery = query.toLowerCase();
    return allSummaries.filter(
      summary =>
        summary.title.toLowerCase().includes(lowerQuery) ||
        summary.content.toLowerCase().includes(lowerQuery) ||
        summary.keyPoints.some(point => point.toLowerCase().includes(lowerQuery)) ||
        summary.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  async deleteVideoSummary(id: string): Promise<void> {
    await db.videoSummaries.delete(id);
  }
};
