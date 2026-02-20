'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ArticleCard } from './ArticleCard';
import { DigestVisualizations } from './Visualizations';
import { DigestArticle, DigestStatistics, DigestVisualization } from '@/types';

interface DailyDigestResponse {
  success: boolean;
  digest: {
    summary: string;
    trends: string[];
    articles: DigestArticle[];
    statistics: DigestStatistics;
    visualizations: DigestVisualization;
    generatedAt: string;
  };
  error?: string;
}

export function DailyDigest() {
  const [digest, setDigest] = useState<DailyDigestResponse['digest'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const fetchDigest = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setProgress('正在获取RSS源...');

    try {
      const url = forceRefresh ? '/api/daily-digest?refresh=true' : '/api/daily-digest';
      const response = await fetch(url);

      // Handle streaming progress if available
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          result += chunk;

          // Try to parse progress updates
          const progressMatch = result.match(/\[Digest\] Step (\d)\/6: ([^.]+)\./);
          if (progressMatch) {
            const step = progressMatch[1];
            const stepName = progressMatch[2];
            const progressMap: Record<string, string> = {
              '1': '正在获取RSS源...',
              '2': '正在AI处理文章...',
              '3': '正在筛选排序...',
              '4': '正在生成统计数据...',
              '5': '正在分析趋势...',
              '6': '正在生成摘要...',
            };
            setProgress(progressMap[step] || stepName);
          }
        }

        const data = JSON.parse(result);
        if (data.success) {
          setDigest(data.digest);
          toast({
            title: "更新成功",
            description: `已获取 ${data.digest.articles.length} 篇精选文章`,
          });
        } else {
          setError(data.error || 'Failed to load digest');
        }
      } else {
        const data = await response.json();
        if (data.success) {
          setDigest(data.digest);
        } else {
          setError(data.error || 'Failed to load digest');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  const handleRefresh = () => {
    fetchDigest(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        {progress && (
          <p className="text-sm text-muted-foreground">{progress}</p>
        )}
        <p className="text-sm text-muted-foreground">正在生成每日技术摘要...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8">
          <p className="text-center text-destructive mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => fetchDigest()}>
              重试
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              强制刷新
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digest) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">每日技术摘要</h2>
            {digest.generatedAt && (
              <p className="text-sm text-muted-foreground">
                更新于 {format(new Date(digest.generatedAt), 'PPpp HH:mm', { locale: zhCN })}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">今日看点</h3>
              <p className="text-base leading-relaxed">{digest.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations Panel */}
      {digest.statistics.totalArticles > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            数据概览
          </h3>
          <DigestVisualizations
            statistics={digest.statistics}
            visualizations={digest.visualizations}
          />
        </div>
      )}

      {/* Trends */}
      {digest.trends && digest.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              今日趋势
            </CardTitle>
            <CardDescription>
              技术圈的主要话题和方向
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {digest.trends.map((trend, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-sm px-3 py-1 font-normal"
                >
                  {trend}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Summary */}
      {digest.statistics.totalArticles > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">统计信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {digest.statistics.totalArticles}
                </div>
                <div className="text-xs text-muted-foreground">精选文章</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {digest.statistics.sourcesAnalyzed}
                </div>
                <div className="text-xs text-muted-foreground">分析源</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {digest.statistics.averageScores.relevance.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">平均相关性</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {digest.statistics.averageScores.quality.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">平均质量</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div>
        <h3 className="font-semibold text-lg mb-3">精选文章</h3>
        {digest.articles && digest.articles.length > 0 ? (
          <div className="space-y-3">
            {digest.articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={digest.articles.indexOf(article)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <p className="text-center text-muted-foreground">暂无文章</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            基于 {digest.statistics.sourcesAnalyzed} 个技术博客 • AI 驱动的智能筛选
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';
