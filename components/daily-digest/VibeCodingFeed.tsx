'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Sparkles,
  Zap,
  Loader2,
  RefreshCw,
  ExternalLink,
  Lightbulb,
  TrendingUp,
  Code2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface VibeCodingArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate: Date;
  description: string;
  category: string;
  scores: {
    relevance: number;
    quality: number;
    timeliness: number;
    overall: number;
  };
  keywords: string[];
  summary: string;
  reason: string;
  processedAt: Date;
}

interface FeaturedTool {
  name: string;
  description: string;
  articleCount: number;
}

interface VibeCodingDigest {
  summary: string;
  articles: VibeCodingArticle[];
  featuredTools: FeaturedTool[];
  quickTips: string[];
  generatedAt: string;
}

interface VibeCodingResponse {
  success: boolean;
  digest: VibeCodingDigest;
  error?: string;
}

export function VibeCodingFeed() {
  const [digest, setDigest] = useState<VibeCodingDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  const fetchVibeCodingDigest = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh
        ? '/api/daily-digest/vibecoding?refresh=true'
        : '/api/daily-digest/vibecoding';
      const response = await fetch(url);
      const data: VibeCodingResponse = await response.json();

      if (data.success) {
        setDigest(data.digest);
        if (data.digest.articles.length > 0) {
          toast.success(`发现 ${data.digest.articles.length} 篇VibeCoding精选内容`);
        }
      } else {
        setError(data.error || 'Failed to load vibecoding digest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 不再自动加载，等待用户点击
  }, []);

  const handleFetch = () => {
    setHasFetched(true);
    fetchVibeCodingDigest(false);
  };

  const handleRefresh = () => {
    fetchVibeCodingDigest(true);
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">正在获取VibeCoding内容...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digest || digest.articles.length === 0) {
    // 如果还没有获取过数据，显示获取按钮
    if (!hasFetched && !loading && !error) {
      return (
        <Card className="backdrop-blur-sm bg-card/50">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <Cpu className="w-10 h-10 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">VibeCoding 专属推荐</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  获取 AI 辅助编程的最新动态和工具
                </p>
              </div>
              <Button onClick={handleFetch} size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                获取 VibeCoding 内容
              </Button>
              <p className="text-xs text-muted-foreground">
                AI 智能筛选 Cursor、Windsurf、Copilot 等工具相关内容
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 如果已经获取过但没有内容
    if (hasFetched && digest && digest.articles.length === 0) {
      return (
        <Card className="backdrop-blur-sm bg-card/50">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <Code2 className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无VibeCoding相关内容</p>
              <p className="text-sm text-muted-foreground">
                请稍后再试或尝试刷新获取最新内容
              </p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
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
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">VibeCoding 专属推荐</h2>
            <p className="text-sm text-muted-foreground">
              AI辅助编程的最新动态和工具
            </p>
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
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">今日VibeCoding看点</h3>
              <p className="text-base leading-relaxed">{digest.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Tools */}
      {digest.featuredTools && digest.featuredTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              热门AI编程工具
            </CardTitle>
            <CardDescription>当前最受关注的VibeCoding工具</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {digest.featuredTools.map((tool, index) => (
                <Card key={index} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{tool.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tool.articleCount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      {digest.quickTips && digest.quickTips.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              实用技巧
            </CardTitle>
            <CardDescription>来自VibeCoding社区的快速技巧</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {digest.quickTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
                >
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm flex-1">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div>
        <h3 className="font-semibold text-lg mb-3">精选文章</h3>
        <div className="space-y-3">
          {digest.articles.map((article, index) => (
            <Card
              key={article.id}
              className="hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {article.title}
                        <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </h4>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {article.summary || article.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {article.source}
                      </Badge>
                      {article.keywords.slice(0, 3).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(article.pubDate), 'MM月dd日')}
                      </span>
                      {article.scores && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            article.scores.overall >= 8
                              ? 'border-green-500 text-green-700'
                              : article.scores.overall >= 6
                              ? 'border-blue-500 text-blue-700'
                              : 'border-gray-500 text-gray-700'
                          }`}
                        >
                          相关性 {article.scores.overall}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>更新于 {format(new Date(digest.generatedAt), 'yyyy年MM月dd日 HH:mm')}</p>
            <p>AI驱动的VibeCoding内容筛选</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
