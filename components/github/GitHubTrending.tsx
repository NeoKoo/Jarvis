'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ExternalLink, Loader2, RefreshCw, GitFork, Save, BookOpen } from 'lucide-react';
import { useGitHubStore, GitHubRepository } from '@/stores/github-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SavingState {
  [key: string]: boolean;
}

function RepositoryCard({ repository }: { repository: GitHubRepository }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToNote = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/github/save-to-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repository }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSaved(true);
        toast.success('已将仓库信息保存到笔记知识库');
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Error saving to note:', error);
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              <Link
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                {repository.fullName}
                <ExternalLink className="w-4 h-4 opacity-50" />
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {repository.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          {repository.language && (
            <Badge variant="secondary" className="font-normal">
              {repository.language}
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{repository.stars.toLocaleString()}</span>
          </div>
          <div className="text-xs opacity-75">
            {format(new Date(repository.createdAt), 'yyyy-MM-dd')}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link href={repository.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              查看仓库
            </Button>
          </Link>
          <Button
            size="sm"
            variant={isSaved ? 'default' : 'secondary'}
            onClick={handleSaveToNote}
            disabled={isSaving || isSaved}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSaved ? (
              <BookOpen className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaved ? '已保存' : '保存笔记'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function GitHubTrending() {
  const { repositories, loading, error, fetchTrending, lastUpdated } = useGitHubStore();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // 不再自动加载，等待用户点击
  }, []);

  const handleFetch = () => {
    setHasFetched(true);
    fetchTrending();
  };

  const handleRefresh = () => {
    fetchTrending();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5" />
          <h2 className="text-xl font-bold">GitHub 热门仓库</h2>
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              更新于 {format(lastUpdated, 'HH:mm:ss')}
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

      {!hasFetched && repositories.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="p-4 bg-muted rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <GitFork className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">GitHub 热门仓库</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  发现当前最热门的开源项目
                </p>
              </div>
              <Button onClick={handleFetch} size="lg" className="gap-2">
                <GitFork className="w-5 h-5" />
                获取热门仓库
              </Button>
              <p className="text-xs text-muted-foreground">
                点击按钮将调用 GitHub API 获取趋势数据
              </p>
            </div>
          </CardContent>
        </Card>
      ) : loading && repositories.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <p className="text-center text-destructive">{error}</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={handleRefresh}>
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">暂无仓库数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
