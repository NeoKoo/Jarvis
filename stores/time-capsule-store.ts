import { create } from 'zustand';
import { TimeCapsule } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface TimeCapsuleStore {
  capsules: TimeCapsule[];
  isLoading: boolean;
  loadCapsules: () => Promise<void>;
  addCapsule: (capsule: Omit<TimeCapsule, 'id' | 'createdAt'>) => Promise<void>;
  openCapsule: (id: string, aiMessage?: string) => Promise<void>;
  deleteCapsule: (id: string) => Promise<void>;
  readyToOpen: () => TimeCapsule[];
}

export const useTimeCapsuleStore = create<TimeCapsuleStore>((set, get) => ({
  capsules: [],
  isLoading: false,

  loadCapsules: async () => {
    set({ isLoading: true });
    try {
      const capsules = await dbHelpers.getAllTimeCapsules();
      set({ capsules, isLoading: false });
    } catch (error) {
      console.error('Error loading time capsules:', error);
      set({ isLoading: false });
    }
  },

  addCapsule: async (capsuleData) => {
    const newCapsule: TimeCapsule = {
      ...capsuleData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    await dbHelpers.saveTimeCapsule(newCapsule);

    set(state => ({
      capsules: [...state.capsules, newCapsule],
    }));
  },

  openCapsule: async (id, aiMessage) => {
    await dbHelpers.markAsOpened(id, aiMessage);

    set(state => ({
      capsules: state.capsules.map(capsule =>
        capsule.id === id
          ? { ...capsule, isOpened: true, aiMessage }
          : capsule
      ),
    }));
  },

  deleteCapsule: async (id) => {
    await dbHelpers.deleteTimeCapsule(id);

    set(state => ({
      capsules: state.capsules.filter(capsule => capsule.id !== id),
    }));
  },

  readyToOpen: () => {
    const { capsules } = get();
    const now = new Date();
    return capsules.filter(
      capsule => !capsule.isOpened && new Date(capsule.openDate) <= now
    );
  },
}));
