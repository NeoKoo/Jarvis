'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, TrendingUp, Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ArticleCard } from './ArticleCard';
import { DigestVisualizations } from './Visualizations';
import { DigestSkeleton } from './DigestSkeleton';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [hasFetched, setHasFetched] = useState(false);
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
          toast.success(`已获取 ${data.digest.articles.length} 篇精选文章`);
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
    // 不再自动加载，等待用户点击
  }, []);

  const handleFetch = () => {
    setHasFetched(true);
    fetchDigest(false);
  };

  const handleRefresh = () => {
    fetchDigest(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {progress && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{progress}</p>
          </div>
        )}
        <DigestSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => fetchDigest()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                强制刷新
              </Button>
            </div>
            <div className="text-xs text-muted-foreground max-w-md mx-auto p-3 bg-muted/30 rounded">
              <p className="font-medium mb-1">可能的原因：</p>
              <ul className="text-left space-y-1">
                <li>• RSS 源暂时无法访问</li>
                <li>• AI 服务未配置或超出配额</li>
                <li>• 网络连接问题</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digest) {
    // 如果还没有获取过数据，显示获取按钮
    if (!hasFetched && !loading && !error) {
      return (
        <Card className="backdrop-blur-sm bg-card/50">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <Newspaper className="w-16 h-16 mx-auto text-primary opacity-20" />
              <div>
                <h3 className="text-xl font-semibold mb-2">每日技术摘要</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  获取今日精选技术文章，AI 智能筛选
                </p>
              </div>
              <Button onClick={handleFetch} size="lg" className="gap-2">
                <Newspaper className="w-5 h-5" />
                获取每日摘要
              </Button>
              <p className="text-xs text-muted-foreground">
                点击按钮将调用 API 分析最新技术文章
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
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
                更新于 {format(new Date(digest.generatedAt), 'yyyy年MM月dd日 HH:mm')}
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
            {digest.articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">暂无符合条件的文章</p>
              <p className="text-sm text-muted-foreground mb-4">
                可能是 RSS 源未更新或筛选条件过严格
              </p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                强制刷新获取最新文章
              </Button>
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
