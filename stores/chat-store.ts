import { create } from 'zustand';
import { ChatSession, Message, LLMModel } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface ChatStore {
  // Current session
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamContent: string;

  // Actions
  createNewSession: () => void;
  loadSessions: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateSessionTitle: (title: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  clearCurrentStream: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  isStreaming: false,
  currentStreamContent: '',

  createNewSession: () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ currentSession: newSession, isStreaming: false, currentStreamContent: '' });

    // Save to database
    dbHelpers.saveChatSession(newSession);
  },

  loadSessions: async () => {
    const sessions = await dbHelpers.getAllChatSessions();
    set({ sessions });
  },

  selectSession: async (id: string) => {
    const session = await dbHelpers.getChatSession(id);
    if (session) {
      set({ currentSession: session, isStreaming: false, currentStreamContent: '' });
    }
  },

  deleteSession: async (id: string) => {
    await dbHelpers.deleteChatSession(id);

    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    }));
  },

  addMessage: (message) => {
    const { currentSession } = get();

    if (!currentSession) {
      console.warn('No current session to add message to');
      return;
    }

    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, newMessage],
      updatedAt: new Date(),
    };

    // Update title if it's the first user message
    if (updatedSession.messages.length === 1 && message.role === 'user') {
      updatedSession.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    set({ currentSession: updatedSession });
    dbHelpers.saveChatSession(updatedSession);

    // Also update sessions list
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === updatedSession.id ? updatedSession : s
      ),
    }));
  },

  updateSessionTitle: async (title: string) => {
    const { currentSession } = get();

    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      title,
      updatedAt: new Date(),
    };

    set({ currentSession: updatedSession });
    await dbHelpers.saveChatSession(updatedSession);

    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === updatedSession.id ? updatedSession : s
      ),
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setStreaming: (streaming, content = '') => {
    set({ isStreaming: streaming, currentStreamContent: content });
  },

  clearCurrentStream: () => {
    set({ currentStreamContent: '' });
  },
}));
