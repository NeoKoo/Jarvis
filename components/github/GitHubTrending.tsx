'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ExternalLink, Loader2, RefreshCw, GitFork, Save, BookOpen, Users, Eye } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 计算仓库年龄
  const createdDate = new Date(repository.createdAt);
  const updatedDate = new Date(repository.updatedAt);
  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceUpdated = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

  const ageText = daysSinceCreated < 30
    ? `${daysSinceCreated}天前`
    : daysSinceCreated < 365
    ? `${Math.floor(daysSinceCreated / 30)}个月前`
    : `${Math.floor(daysSinceCreated / 365)}年前`;

  const lastUpdatedText = daysSinceUpdated === 0
    ? '今天'
    : daysSinceUpdated < 7
    ? `${daysSinceUpdated}天前`
    : format(updatedDate, 'MM月dd日');

  return (
    <Card className="hover:shadow-lg transition-all hover:scale-[1.02]">
      <CardHeader className="pb-4">
        {/* 顶部：所有者信息和仓库名 */}
        <div className="flex items-start gap-3 mb-3">
          {/* 所有者头像 */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
              {repository.owner.login.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* 仓库名和链接 */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold leading-tight mb-1">
              <Link
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="truncate">{repository.fullName}</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{repository.owner.login}</span>
              <span>·</span>
              <span>创建于 {ageText}</span>
            </div>
          </div>
        </div>

        {/* 完整描述 */}
        {repository.description && (
          <CardDescription className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
            {repository.description}
          </CardDescription>
        )}

        {/* 展开/收起按钮 */}
        {repository.description && repository.description.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline mt-2"
          >
            {isExpanded ? '收起' : '展开完整描述'}
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 主要指标 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-500">
                {repository.stars.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">Stars</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <GitFork className="w-4 h-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-blue-700 dark:text-blue-500">
                {repository.forks?.toLocaleString() || '0'}
              </span>
              <span className="text-xs text-muted-foreground">Forks</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <Eye className="w-4 h-4 text-purple-500" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-500 truncate">
                {lastUpdatedText}
              </span>
              <span className="text-xs text-muted-foreground">更新</span>
            </div>
          </div>
        </div>

        {/* 技术栈标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          {repository.language && (
            <Badge variant="secondary" className="font-normal">
              {repository.language}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            开源项目
          </Badge>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-2">
          <Link href={repository.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button size="sm" variant="outline" className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
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
            {isSaved ? '已保存' : '保存'}
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
