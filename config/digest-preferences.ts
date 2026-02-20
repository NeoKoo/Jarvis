import { DigestPreferences } from '@/types';

// ============================================================================
// Default Digest Preferences
// ============================================================================

/**
 * Default user preferences for daily digest generation
 */
export const DEFAULT_PREFERENCES: DigestPreferences = {
  // Content filtering
  minScore: 6,              // Minimum overall score (1-10)
  categories: ['ai-ml', 'security', 'engineering', 'tools', 'opinion', 'other'],
  excludeKeywords: [],      // Keywords to filter out

  // Digest settings
  maxArticles: 15,          // Maximum articles per digest
  timeRange: 48,            // Hours to look back (24h, 48h, 72h, 168h)

  // AI settings
  enableTranslation: true,  // Translate titles to Chinese
  enableScoring: true,      // Enable AI scoring
  enableCategorization: true, // Enable AI categorization

  // Performance
  batchSize: 5,             // Concurrent AI API calls
  cacheExpiry: 24,          // Cache expiry in hours
};

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Quick setup presets for different use cases
 */
export const PRESETS: Record<string, Partial<DigestPreferences>> = {
  // Conservative: High quality only
  conservative: {
    minScore: 8,
    maxArticles: 10,
    timeRange: 72,
  },

  // Balanced: Default settings
  balanced: {
    ...DEFAULT_PREFERENCES,
  },

  // Aggressive: More articles, lower score threshold
  aggressive: {
    minScore: 5,
    maxArticles: 20,
    timeRange: 24,
  },

  // AI-focused: Only AI/ML content
  ai: {
    categories: ['ai-ml', 'tools'],
    minScore: 7,
    maxArticles: 15,
  },

  // Security-focused: Only security content
  security: {
    categories: ['security', 'engineering'],
    minScore: 7,
    maxArticles: 15,
  },
};

/**
 * Get preset configuration by name
 */
export const getPreset = (presetName: string): Partial<DigestPreferences> => {
  return PRESETS[presetName] || PRESETS.balanced;
};

/**
 * Merge user preferences with defaults
 */
export const mergePreferences = (
  userPrefs?: Partial<DigestPreferences>
): DigestPreferences => {
  return {
    ...DEFAULT_PREFERENCES,
    ...userPrefs,
  };
};

/**
 * Validate preferences
 */
export const validatePreferences = (prefs: Partial<DigestPreferences>): string[] => {
  const errors: string[] = [];

  if (prefs.minScore !== undefined && (prefs.minScore < 1 || prefs.minScore > 10)) {
    errors.push('minScore must be between 1 and 10');
  }

  if (prefs.maxArticles !== undefined && (prefs.maxArticles < 5 || prefs.maxArticles > 50)) {
    errors.push('maxArticles must be between 5 and 50');
  }

  if (prefs.timeRange !== undefined && (prefs.timeRange < 1 || prefs.timeRange > 168)) {
    errors.push('timeRange must be between 1 and 168 hours (1 week)');
  }

  if (prefs.batchSize !== undefined && (prefs.batchSize < 1 || prefs.batchSize > 10)) {
    errors.push('batchSize must be between 1 and 10');
  }

  if (prefs.categories) {
    const validCategories = ['ai-ml', 'security', 'engineering', 'tools', 'opinion', 'other'];
    const invalidCategories = prefs.categories.filter(c => !validCategories.includes(c));
    if (invalidCategories.length > 0) {
      errors.push(`Invalid categories: ${invalidCategories.join(', ')}`);
    }
  }

  return errors;
};
