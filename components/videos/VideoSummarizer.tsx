'use client';

import { useEffect, useState } from 'react';
import { VideoSummary } from '@/types';
import { useVideoSummaryStore } from '@/stores/video-summary-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Trash2, Edit2, Check, X, Video, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VideoSummarizer() {
  const {
    summaries,
    isLoading,
    searchQuery,
    selectedSummary,
    platformFilter,
    loadSummaries,
    addSummary,
    updateSummary,
    deleteSummary,
    setSelectedSummary,
    setSearchQuery,
    setPlatformFilter,
    filteredSummaries,
  } = useVideoSummaryStore();

  const [urlInput, setUrlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const handleGenerate = async () => {
    if (!urlInput.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/video-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: urlInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();

      await addSummary(data.summary);
      setUrlInput('');
      setSelectedSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this summary?')) {
      await deleteSummary(id);
      if (selectedSummary?.id === id) {
        setSelectedSummary(null);
      }
    }
  };

  const handleEdit = () => {
    if (selectedSummary) {
      setEditTitle(selectedSummary.title);
      setEditContent(selectedSummary.content);
      setEditTags(selectedSummary.tags.join(', '));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedSummary) {
      await updateSummary(selectedSummary.id, {
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map(t => t.trim()).filter(t => t),
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const filtered = filteredSummaries();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">视频内容总结</h1>
        </div>
        <p className="text-muted-foreground">
          粘贴视频链接，AI自动提取内容并生成结构化总结
        </p>
      </div>

      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            生成视频总结
          </CardTitle>
          <CardDescription>
            支持抖音、TikTok等主流视频平台
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="粘贴视频链接 (例如: https://www.douyin.com/video/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !urlInput.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成总结
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在提取视频内容并生成AI总结...</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索总结内容、标题、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={platformFilter} onValueChange={(value: any) => setPlatformFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="平台筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            <SelectItem value="douyin">抖音</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              总结列表 ({filtered.length})
            </h2>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filtered.map((summary) => (
                <Card
                  key={summary.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedSummary?.id === summary.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedSummary(summary)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2">
                      {summary.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(summary.createdAt).toLocaleDateString('zh-CN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {summary.content}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {summary.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {summary.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{summary.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无视频总结</p>
                <p className="text-sm mt-2">粘贴视频链接开始生成</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedSummary ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-xl font-bold mb-2"
                      />
                    ) : (
                      <CardTitle className="text-xl">{selectedSummary.title}</CardTitle>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedSummary.platform}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedSummary.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={handleEdit}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(selectedSummary.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Content */}
                <div>
                  <h3 className="font-semibold mb-2">内容总结</h3>
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedSummary.content}
                    </p>
                  )}
                </div>

                {/* Key Points */}
                {selectedSummary.keyPoints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">关键要点</h3>
                    <ul className="space-y-2">
                      {selectedSummary.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="text-primary font-semibold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h3 className="font-semibold mb-2">标签</h3>
                  {isEditing ? (
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="标签，用逗号分隔"
                      className="mt-2"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSummary.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Original URL */}
                {selectedSummary.videoUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">原始链接</h3>
                    <a
                      href={selectedSummary.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {selectedSummary.videoUrl}
                    </a>
                  </div>
                )}

                {/* Original Content (if available) */}
                {selectedSummary.originalContent?.description && (
                  <div>
                    <h3 className="font-semibold mb-2">原始描述</h3>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {selectedSummary.originalContent.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">选择一个视频总结查看详情</p>
                <p className="text-sm mt-2">或者生成新的视频总结</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
