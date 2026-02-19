'use client';

import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, TrendingUp, Loader2, RefreshCw, Save, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Article {
  title: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  description: string;
  reason: string;
}

interface ArticleCardProps {
  article: Article;
  index: number;
}

interface Digest {
  summary: string;
  trends: string[];
  articles: Article[];
  generatedAt: string;
}

function ArticleCard({ article, index }: ArticleCardProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToNote = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/daily-digest/save-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSaved(true);
        toast.success('已保存文章到笔记知识库');
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Error saving article to note:', error);
      toast.error(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={getCategoryColor(article.category)}>
                {article.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {article.source}
              </span>
            </div>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
            >
              {article.title}
              <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-50" />
            </a>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {article.description}
            </p>
            <p className="text-sm text-primary mt-2">
              💡 {article.reason}
            </p>
          </div>
          <Button
            size="sm"
            variant={isSaved ? 'default' : 'outline'}
            onClick={handleSaveToNote}
            disabled={isSaving || isSaved}
            className="gap-2 flex-shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSaved ? (
              <BookOpen className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaved ? '已保存' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyDigest() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/daily-digest');
      const data = await response.json();

      if (data.success) {
        setDigest(data.digest);
      } else {
        setError(data.error || 'Failed to load digest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  const handleRefresh = () => {
    fetchDigest();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6">
          <p className="text-center text-destructive mb-4">{error}</p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleRefresh}>
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!digest) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'AI/ML': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      '安全': 'bg-red-500/10 text-red-500 border-red-500/20',
      '工程': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      '观点': 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  if (loading) {

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          <h2 className="text-xl font-bold">每日技术摘要</h2>
          {digest.generatedAt && (
            <span className="text-sm text-muted-foreground">
              更新于 {format(new Date(digest.generatedAt), 'HH:mm')}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <p className="text-lg leading-relaxed">{digest.summary}</p>
        </CardContent>
      </Card>

      {/* Trends */}
      {digest.trends && digest.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              今日趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {digest.trends.map((trend, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                  {trend}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Articles */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">精选文章</h3>
        {digest.articles && digest.articles.length > 0 ? (
          <div className="space-y-3">
            {digest.articles.map((article, i) => (
              <ArticleCard key={i} article={article} index={i} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">暂无文章</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
