import { create } from 'zustand';
import { VideoSummary } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface VideoSummaryStore {
  summaries: VideoSummary[];
  isLoading: boolean;
  searchQuery: string;
  selectedSummary: VideoSummary | null;
  platformFilter: 'all' | 'douyin' | 'tiktok' | 'other';

  // Actions
  loadSummaries: () => Promise<void>;
  addSummary: (summary: Omit<VideoSummary, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSummary: (id: string, updates: Partial<VideoSummary>) => Promise<void>;
  deleteSummary: (id: string) => Promise<void>;
  setSelectedSummary: (summary: VideoSummary | null) => void;
  setSearchQuery: (query: string) => void;
  setPlatformFilter: (filter: 'all' | 'douyin' | 'tiktok' | 'other') => void;

  // Computed
  filteredSummaries: () => VideoSummary[];
}

export const useVideoSummaryStore = create<VideoSummaryStore>((set, get) => ({
  summaries: [],
  isLoading: false,
  searchQuery: '',
  selectedSummary: null,
  platformFilter: 'all',

  loadSummaries: async () => {
    set({ isLoading: true });
    try {
      const summaries = await dbHelpers.getAllVideoSummaries();
      set({ summaries, isLoading: false });
    } catch (error) {
      console.error('Error loading video summaries:', error);
      set({ isLoading: false });
    }
  },

  addSummary: async (summaryData) => {
    const newSummary: VideoSummary = {
      ...summaryData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbHelpers.saveVideoSummary(newSummary);
    set(state => ({ summaries: [newSummary, ...state.summaries] }));
  },

  updateSummary: async (id, updates) => {
    const updatedSummary = { ...updates, updatedAt: new Date() } as Partial<VideoSummary>;
    await dbHelpers.saveVideoSummary({ id, ...updatedSummary } as VideoSummary);

    set(state => ({
      summaries: state.summaries.map(summary =>
        summary.id === id ? { ...summary, ...updatedSummary } : summary
      ),
      selectedSummary: state.selectedSummary?.id === id
        ? { ...state.selectedSummary, ...updatedSummary }
        : state.selectedSummary,
    }));
  },

  deleteSummary: async (id) => {
    await dbHelpers.deleteVideoSummary(id);
    set(state => ({
      summaries: state.summaries.filter(summary => summary.id !== id),
      selectedSummary: state.selectedSummary?.id === id ? null : state.selectedSummary,
    }));
  },

  setSelectedSummary: (summary) => set({ selectedSummary: summary }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPlatformFilter: (filter) => set({ platformFilter: filter }),

  filteredSummaries: () => {
    const { summaries, searchQuery, platformFilter } = get();
    let filtered = summaries;

    if (platformFilter !== 'all') {
      filtered = filtered.filter(summary => summary.platform === platformFilter);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(summary =>
        summary.title.toLowerCase().includes(lowerQuery) ||
        summary.content.toLowerCase().includes(lowerQuery) ||
        summary.keyPoints.some(point => point.toLowerCase().includes(lowerQuery)) ||
        summary.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  },
}));
