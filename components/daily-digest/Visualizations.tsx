'use client';

import { DigestStatistics, DigestVisualization, RSSCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  getCategoryLabel,
  getCategoryColor,
  getCategoryPercentage,
} from '@/lib/digest/statistics';

interface VisualizationProps {
  statistics: DigestStatistics;
  visualizations: DigestVisualization;
}

export function DigestVisualizations({
  statistics,
  visualizations,
}: VisualizationProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            分类分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MermaidChart chart={visualizations.categoryChart} />
          <CategoryStats stats={statistics.categoryDistribution} />
        </CardContent>
      </Card>

      {/* Score Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            评分分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MermaidChart chart={visualizations.scoreChart} />
          <ScoreStats scores={statistics.averageScores} />
        </CardContent>
      </Card>

      {/* Tag Cloud */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            热门关键词
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagCloud tags={visualizations.tagCloud} />
        </CardContent>
      </Card>
    </div>
  );
}

function MermaidChart({ chart }: { chart: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
      <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">
        {chart}
      </pre>
    </div>
  );
}

function CategoryStats({
  stats,
}: {
  stats: Record<RSSCategory, number>;
}) {
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const categories = Object.entries(stats).filter(
    ([_, count]) => count > 0
  ) as Array<[RSSCategory, number]>;

  if (categories.length === 0) {
    return <div className="text-sm text-muted-foreground">暂无数据</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {categories.map(([cat, count]) => {
        const percentage = getCategoryPercentage(cat, stats);
        const color = getCategoryColor(cat);
        const label = getCategoryLabel(cat);

        return (
          <div key={cat} className="text-center p-2 rounded-lg border">
            <div
              className="text-2xl font-bold"
              style={{ color }}
            >
              {count}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{percentage}%</div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreStats(scores: {
  relevance: number;
  quality: number;
  timeliness: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <div className="text-center p-2 rounded-lg border">
        <div
          className="text-2xl font-bold"
          style={{ color: getScoreColor(scores.relevance) }}
        >
          {scores.relevance}
        </div>
        <div className="text-xs text-muted-foreground">相关性</div>
      </div>
      <div className="text-center p-2 rounded-lg border">
        <div
          className="text-2xl font-bold"
          style={{ color: getScoreColor(scores.quality) }}
        >
          {scores.quality}
        </div>
        <div className="text-xs text-muted-foreground">质量</div>
      </div>
      <div className="text-center p-2 rounded-lg border">
        <div
          className="text-2xl font-bold"
          style={{ color: getScoreColor(scores.timeliness) }}
        >
          {scores.timeliness}
        </div>
        <div className="text-xs text-muted-foreground">时效性</div>
      </div>
    </div>
  );
}

function TagCloud({
  tags,
}: {
  tags: Array<{ tag: string; weight: number }>;
}) {
  if (tags.length === 0) {
    return <div className="text-sm text-muted-foreground">暂无关键词</div>;
  }

  const maxWeight = tags[0]?.weight || 1;

  // Color palette for tags
  const colors = [
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {tags.map((tag, i) => {
        const size = Math.max(0.75, Math.min(1.5, tag.weight / maxWeight));
        const color = colors[i % colors.length];

        return (
          <span
            key={tag.tag}
            className="px-3 py-1 rounded-full font-medium transition-transform hover:scale-110 cursor-pointer"
            style={{
              fontSize: `${size}rem`,
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`,
            }}
          >
            {tag.tag}
            <span className="ml-1 text-xs opacity-60">({tag.weight})</span>
          </span>
        );
      })}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e'; // green
  if (score >= 6) return '#eab308'; // yellow
  return '#ef4444'; // red
}
