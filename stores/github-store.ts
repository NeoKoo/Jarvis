import { create } from 'zustand';

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

interface GitHubState {
  repositories: GitHubRepository[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  fetchTrending: (language?: string, limit?: number) => Promise<void>;
  setRepositories: (repositories: GitHubRepository[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGitHubStore = create<GitHubState>((set) => ({
  repositories: [],
  loading: false,
  error: null,
  lastUpdated: null,

  fetchTrending: async (language = '', limit = 10) => {
    set({ loading: true, error: null });

    try {
      const url = language
        ? `/api/github/trending?language=${language}&limit=${limit}`
        : `/api/github/trending?limit=${limit}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        set({
          repositories: data.repositories,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        set({
          repositories: [],
          loading: false,
          error: data.error || 'Failed to fetch repositories',
        });
      }
    } catch (error) {
      set({
        repositories: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  setRepositories: (repositories) => set({ repositories }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
