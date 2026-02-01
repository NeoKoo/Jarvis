import { create } from 'zustand';
import { Task } from '@/types';
import { dbHelpers } from '@/lib/db/schema';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  filter: 'all' | 'todo' | 'in-progress' | 'completed';
  sortBy: 'dueDate' | 'priority' | 'createdAt';

  // Actions
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  setFilter: (filter: 'all' | 'todo' | 'in-progress' | 'completed') => void;
  setSortBy: (sortBy: 'dueDate' | 'priority' | 'createdAt') => void;

  // Computed
  filteredTasks: () => Task[];
}

const priorityOrder = { high: 0, medium: 1, low: 2 };

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: 'all',
  sortBy: 'dueDate',

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await dbHelpers.getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbHelpers.saveTask(newTask);

    set(state => ({
      tasks: [...state.tasks, newTask],
    }));
  },

  updateTask: async (id, updates) => {
    const updatedTask = {
      ...updates,
      updatedAt: new Date(),
    } as Partial<Task>;

    await dbHelpers.saveTask({ id, ...updatedTask } as Task);

    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, ...updatedTask } : task
      ),
    }));
  },

  deleteTask: async (id) => {
    await dbHelpers.deleteTask(id);

    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
    }));
  },

  toggleTaskStatus: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const statusMap = {
      'todo': 'in-progress' as const,
      'in-progress': 'completed' as const,
      'completed': 'todo' as const,
    };

    const newStatus = statusMap[task.status];
    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
      completedAt: newStatus === 'completed' ? new Date() : undefined,
    };

    await dbHelpers.saveTask(updatedTask);

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id ? updatedTask : t
      ),
    }));
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  filteredTasks: () => {
    const { tasks, filter, sortBy } = get();

    // Filter
    let filtered = tasks;
    if (filter !== 'all') {
      filtered = tasks.filter(task => task.status === filter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted;
  },
}));
