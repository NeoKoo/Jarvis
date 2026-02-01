// Chat Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  reminders: Reminder[];
  recurrence?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: Date;
  count?: number;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isAiGenerated?: boolean;
}

// Voice Memo Types
export interface VoiceMemo {
  id: string;
  audioBlob?: Blob;
  audioUrl?: string;
  transcription: string;
  duration: number;
  createdAt: Date;
  tags: string[];
}

// Reminder Types
export interface Reminder {
  id: string;
  type: 'time' | 'location';
  time?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  message: string;
  eventId?: string;
  taskId?: string;
  sent: boolean;
}

// LLM Types
export type LLMModel = 'qwen' | 'glm';

export interface LLMRequest {
  messages: Message[];
  model: LLMModel;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Task Breakdown Types
export interface TaskBreakdown {
  id: string;
  originalTask: string;
  breakdown: {
    title: string;
    description: string;
    subtasks: SubTask[];
  };
  totalEstimatedHours: number;
  suggestedTimeline: string;
  tips?: string[];
  createdAt: Date;
}

export interface SubTask {
  title: string;
  estimatedHours: number;
  priority: 'high' | 'medium' | 'low';
  order: number;
  dependencies?: string[];
  deadline?: string;
  notes?: string;
}

export interface BreakdownRequest {
  taskDescription: string;
  context?: {
    availableHours?: number;
    deadline?: string;
    teamSize?: number;
    preferences?: string;
  };
}

export interface BreakdownResponse {
  originalTask: string;
  breakdown: {
    title: string;
    description: string;
    subtasks: SubTask[];
  };
  totalEstimatedHours: number;
  suggestedTimeline: string;
  tips?: string[];
}

// AI Personality Types
export type AIPersonality = 'professional' | 'mentor' | 'friendly' | 'coach';

export interface AIPersonalityConfig {
  id: AIPersonality;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  speechStyle: 'formal' | 'encouraging' | 'casual' | 'direct';
}

// Time Capsule Types
export interface TimeCapsule {
  id: string;
  title: string;
  content: string;
  openDate: Date;
  createdAt: Date;
  isOpened: boolean;
  aiMessage?: string;
}

// Video Summary Types
export interface VideoSummary {
  id: string;
  videoUrl: string;
  platform: 'douyin' | 'tiktok' | 'other';
  title: string;
  content: string; // AI-generated summary
  originalContent?: {
    description?: string;
    comments?: string;
    metadata?: Record<string, any>;
  };
  keyPoints: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isAiGenerated: true;
}

export interface VideoSummaryRequest {
  videoUrl: string;
  platform?: 'douyin' | 'tiktok' | 'other';
}

export interface VideoSummaryResponse {
  summary: VideoSummary;
  source: {
    title: string;
    description?: string;
    comments?: string;
    metadata?: Record<string, any>;
  };
}
