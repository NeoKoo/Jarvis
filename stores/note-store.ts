import { create } from 'zustand';
import { Note } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface NoteStore {
  notes: Note[];
  isLoading: boolean;
  searchQuery: string;
  selectedNote: Note | null;

  // Actions
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setSelectedNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;

  // Computed
  filteredNotes: () => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  isLoading: false,
  searchQuery: '',
  selectedNote: null,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await dbHelpers.getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Error loading notes:', error);
      set({ isLoading: false });
    }
  },

  addNote: async (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbHelpers.saveNote(newNote);

    set(state => ({
      notes: [newNote, ...state.notes],
    }));
  },

  updateNote: async (id, updates) => {
    const updatedNote = {
      ...updates,
      updatedAt: new Date(),
    } as Partial<Note>;

    await dbHelpers.saveNote({ id, ...updatedNote } as Note);

    set(state => ({
      notes: state.notes.map(note =>
        note.id === id ? { ...note, ...updatedNote } : note
      ),
      selectedNote: state.selectedNote?.id === id
        ? { ...state.selectedNote, ...updatedNote }
        : state.selectedNote,
    }));
  },

  deleteNote: async (id) => {
    await dbHelpers.deleteNote(id);

    set(state => ({
      notes: state.notes.filter(note => note.id !== id),
      selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
    }));
  },

  setSelectedNote: (note) => {
    set({ selectedNote: note });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  filteredNotes: () => {
    const { notes, searchQuery } = get();

    if (!searchQuery.trim()) {
      return notes;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },
}));
