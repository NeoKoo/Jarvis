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

// ============================================================================
// Daily Digest Types
// ============================================================================

// RSS Feed Configuration
export interface RSSFeedConfig {
  name: string;
  url: string;
  category: RSSCategory;
  language: 'en' | 'zh' | 'mixed';
  priority: number; // 1-10, for feed selection
  enabled: boolean;
  lastFetched?: Date;
  fetchErrorCount: number;
}

// Six-Category System
export type RSSCategory =
  | 'ai-ml'
  | 'security'
  | 'engineering'
  | 'tools'
  | 'opinion'
  | 'other';

// Three-Dimensional Scoring System
export interface ArticleScores {
  relevance: number;  // 1-10: How relevant to tech trends
  quality: number;    // 1-10: Content quality and depth
  timeliness: number; // 1-10: How fresh/time-sensitive
  overall: number;    // Weighted average (relevance*0.4 + quality*0.4 + timeliness*0.2)
}

// Enhanced Article Structure
export interface DigestArticle {
  // Basic metadata
  id: string;
  title: string;
  titleZh?: string;  // Chinese translation
  link: string;
  source: string;
  pubDate: Date;
  description: string;

  // AI-Enhanced fields
  category: RSSCategory;
  scores: ArticleScores;
  keywords: string[];  // 2-4 English keywords
  summary: string;     // 4-6 sentence structured summary
  reason: string;      // 1-sentence recommendation reason

  // Metadata
  processedAt: Date;
  readingTime?: number; // estimated reading time in minutes
}

// Original RSS Item (before AI processing)
export interface RSSItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  source: string;
  category: string;
}

// Digest Response
export interface DailyDigestResponse {
  success: boolean;
  digest: {
    summary: string;           // 3-5 sentence trend analysis
    trends: string[];          // Trend keywords
    articles: DigestArticle[]; // Top 10-15 articles
    statistics: DigestStatistics;
    visualizations: DigestVisualization;
    generatedAt: string;
  };
  error?: string;
}

// Statistics for Visualization
export interface DigestStatistics {
  totalArticles: number;
  categoryDistribution: Record<RSSCategory, number>;
  averageScores: {
    relevance: number;
    quality: number;
    timeliness: number;
  };
  topKeywords: Array<{ keyword: string; count: number }>;
  sourcesAnalyzed: number;
}

// Visualization Data
export interface DigestVisualization {
  categoryChart: string;      // Mermaid pie chart
  scoreChart: string;         // Mermaid bar chart
  tagCloud: Array<{           // Tag cloud data
    tag: string;
    weight: number;
  }>;
  trendChart?: string;        // Optional trend visualization
}

// Cache Entry
export interface ArticleCache {
  article: DigestArticle;
  cachedAt: Date;
  hits: number;
}

// Digest Preferences
export interface DigestPreferences {
  // Content filtering
  minScore: number;           // Minimum overall score (1-10, default: 6)
  categories: string[];        // Enabled categories
  excludeKeywords: string[];  // Keywords to filter out

  // Digest settings
  maxArticles: number;         // Maximum articles per digest (default: 15)
  timeRange: number;          // Hours to look back (default: 48)

  // AI settings
  enableTranslation: boolean; // Translate titles to Chinese
  enableScoring: boolean;     // Enable AI scoring
  enableCategorization: boolean;

  // Performance
  batchSize: number;          // Concurrent API calls (default: 5)
  cacheExpiry: number;        // Cache expiry in hours (default: 24)
}

// Digest Error Types
export type DigestErrorCode = 'API_ERROR' | 'PARSE_ERROR' | 'FETCH_ERROR' | 'UNKNOWN';

export class DigestError extends Error {
  constructor(
    message: string,
    public code: DigestErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DigestError';
  }
}
