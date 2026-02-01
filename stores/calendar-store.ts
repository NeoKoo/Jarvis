import { create } from 'zustand';
import { CalendarEvent } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface CalendarStore {
  events: CalendarEvent[];
  isLoading: boolean;
  selectedDate: Date;
  view: 'day' | 'week' | 'month';

  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setView: (view: 'day' | 'week' | 'month') => void;

  // Computed
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsInRange: (start: Date, end: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  isLoading: false,
  selectedDate: new Date(),
  view: 'month',

  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await dbHelpers.getAllEvents();
      set({ events, isLoading: false });
    } catch (error) {
      console.error('Error loading events:', error);
      set({ isLoading: false });
    }
  },

  addEvent: async (eventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbHelpers.saveEvent(newEvent);

    set(state => ({
      events: [...state.events, newEvent],
    }));
  },

  updateEvent: async (id, updates) => {
    const updatedEvent = {
      ...updates,
      updatedAt: new Date(),
    } as Partial<CalendarEvent>;

    await dbHelpers.saveEvent({ id, ...updatedEvent } as CalendarEvent);

    set(state => ({
      events: state.events.map(event =>
        event.id === id ? { ...event, ...updatedEvent } : event
      ),
    }));
  },

  deleteEvent: async (id) => {
    await dbHelpers.deleteEvent(id);

    set(state => ({
      events: state.events.filter(event => event.id !== id),
    }));
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setView: (view) => {
    set({ view });
  },

  getEventsForDate: (date) => {
    const { events } = get();
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return date >= eventStart && date <= eventEnd;
    });
  },

  getEventsInRange: (start, end) => {
    const { events } = get();
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= end && eventEnd >= start;
    });
  },
}));
