/**
 * Statistics and Visualization Generation
 * Calculate statistics and generate Mermaid chart data
 */

import { DigestArticle, DigestStatistics, DigestVisualization, RSSCategory } from '@/types';

/**
 * Generate statistics from processed articles
 */
export function generateStatistics(articles: DigestArticle[]): DigestStatistics {
  const totalArticles = articles.length;

  if (totalArticles === 0) {
    return {
      totalArticles: 0,
      categoryDistribution: {
        'ai-ml': 0,
        'security': 0,
        'engineering': 0,
        'tools': 0,
        'opinion': 0,
        'other': 0,
      },
      averageScores: {
        relevance: 0,
        quality: 0,
        timeliness: 0,
      },
      topKeywords: [],
      sourcesAnalyzed: 0,
    };
  }

  // Category distribution
  const categoryDistribution: Record<RSSCategory, number> = {
    'ai-ml': 0,
    'security': 0,
    'engineering': 0,
    'tools': 0,
    'opinion': 0,
    'other': 0,
  };

  articles.forEach(article => {
    categoryDistribution[article.category]++;
  });

  // Average scores
  const totalRelevance = articles.reduce((sum, a) => sum + a.scores.relevance, 0);
  const totalQuality = articles.reduce((sum, a) => sum + a.scores.quality, 0);
  const totalTimeliness = articles.reduce((sum, a) => sum + a.scores.timeliness, 0);

  const averageScores = {
    relevance: Math.round((totalRelevance / totalArticles) * 10) / 10,
    quality: Math.round((totalQuality / totalArticles) * 10) / 10,
    timeliness: Math.round((totalTimeliness / totalArticles) * 10) / 10,
  };

  // Top keywords
  const keywordCounts: Record<string, number> = {};
  articles.forEach(article => {
    article.keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase();
      keywordCounts[normalized] = (keywordCounts[normalized] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Unique sources
  const sourcesAnalyzed = new Set(articles.map(a => a.source)).size;

  return {
    totalArticles,
    categoryDistribution,
    averageScores,
    topKeywords,
    sourcesAnalyzed,
  };
}

/**
 * Generate visualization data from statistics
 */
export function generateVisualization(
  stats: DigestStatistics
): DigestVisualization {
  // Category pie chart
  const categoryChart = generatePieChart(stats.categoryDistribution);

  // Score bar chart
  const scoreChart = generateBarChart(stats.averageScores);

  // Tag cloud data
  const tagCloud = stats.topKeywords.map(k => ({
    tag: k.keyword,
    weight: k.count,
  }));

  return {
    categoryChart,
    scoreChart,
    tagCloud,
  };
}

/**
 * Generate Mermaid pie chart for category distribution
 */
function generatePieChart(distribution: Record<RSSCategory, number>): string {
  const labels: Record<RSSCategory, string> = {
    'ai-ml': 'AI/ML',
    'security': '安全',
    'engineering': '工程',
    'tools': '工具',
    'opinion': '观点',
    'other': '其他',
  };

  const emojis: Record<RSSCategory, string> = {
    'ai-ml': '🤖',
    'security': '🔒',
    'engineering': '⚙️',
    'tools': '🛠',
    'opinion': '💡',
    'other': '📝',
  };

  // Filter out empty categories
  const data = Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([cat, count]) => `${emojis[cat as RSSCategory]} ${labels[cat as RSSCategory]} ${count}`)
    .join('\n  ');

  return `pie title 今日文章分类分布\n  showData\n  ${data}`;
}

/**
 * Generate Mermaid bar chart for score distribution
 */
function generateBarChart(scores: {
  relevance: number;
  quality: number;
  timeliness: number;
}): string {
  return `bar title 平均评分（满分10分）
  "相关性 🎯" ${scores.relevance}
  "质量 ⭐" ${scores.quality}
  "时效性 ⏰" ${scores.timeliness}
`;
}

/**
 * Generate ASCII bar chart for terminal display
 */
export function generateAsciiBarChart(keywords: Array<{ keyword: string; count: number }>): string {
  const topKeywords = keywords.slice(0, 10);
  const maxVal = topKeywords[0]?.count || 1;
  const maxBarWidth = 20;

  let chart = '```\n';
  topKeywords.forEach(({ keyword, count }) => {
    const barLen = Math.max(1, Math.round((count / maxVal) * maxBarWidth));
    const bar = '█'.repeat(barLen) + '░'.repeat(maxBarWidth - barLen);
    chart += `${keyword.padEnd(15)} │ ${bar} ${count}\n`;
  });
  chart += '```\n';

  return chart;
}

/**
 * Generate tag cloud string (for text display)
 */
export function generateTagCloudString(keywords: Array<{ keyword: string; count: number }>): string {
  const maxCount = keywords[0]?.count || 1;

  return keywords
    .map((k, i) => {
      const size = Math.max(0.75, Math.min(1.5, k.count / maxCount));
      const bold = i < 3;
      const prefix = bold ? '**' : '';
      return `${prefix}${k.keyword}(${k.count})${prefix}`;
    })
    .join(' · ');
}

/**
 * Calculate percentage for a category
 */
export function getCategoryPercentage(
  category: RSSCategory,
  distribution: Record<RSSCategory, number>
): number {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  return Math.round((distribution[category] / total) * 100);
}

/**
 * Get category label with emoji
 */
export function getCategoryLabel(category: RSSCategory): string {
  const labels: Record<RSSCategory, string> = {
    'ai-ml': '🤖 AI/ML',
    'security': '🔒 安全',
    'engineering': '⚙️ 工程',
    'tools': '🛠 工具',
    'opinion': '💡 观点',
    'other': '📝 其他',
  };
  return labels[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: RSSCategory): string {
  const colors: Record<RSSCategory, string> = {
    'ai-ml': '#8b5cf6', // purple
    'security': '#ef4444', // red
    'engineering': '#3b82f6', // blue
    'tools': '#10b981', // green
    'opinion': '#f59e0b', // amber
    'other': '#6b7280', // gray
  };
  return colors[category];
}

/**
 * Get score color (for UI display)
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e'; // green
  if (score >= 6) return '#eab308'; // yellow
  return '#ef4444'; // red
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN');
}
