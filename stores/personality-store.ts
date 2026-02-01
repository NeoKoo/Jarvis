import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIPersonality } from '@/types';

interface PersonalityStore {
  currentPersonality: AIPersonality;
  setPersonality: (personality: AIPersonality) => void;
}

export const usePersonalityStore = create<PersonalityStore>()(
  persist(
    (set) => ({
      currentPersonality: 'professional',
      setPersonality: (personality) => set({ currentPersonality: personality }),
    }),
    {
      name: 'jarvis-personality-storage',
    }
  )
);
