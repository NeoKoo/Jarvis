'use client';

import { DigestArticle } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Save, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCategoryLabel, getCategoryColor, getScoreColor, formatRelativeTime } from '@/lib/digest/statistics';

interface ArticleCardProps {
  article: DigestArticle;
  index: number;
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/daily-digest/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSaved(true);
        toast({
          title: "已保存",
          description: "文章已保存到笔记知识库",
        });
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryColor = getCategoryColor(article.category);
  const scoreColor = getScoreColor(article.scores.overall);

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 border-l-4"
      style={{ borderLeftColor: scoreColor }}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              index < 3
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                : 'bg-muted text-muted-foreground'
              }`}>
              {index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Category + Source + Time */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: categoryColor,
                  color: categoryColor,
                  backgroundColor: `${categoryColor}10`
                }}
              >
                {getCategoryLabel(article.category)}
              </Badge>
              <span className="text-xs text-muted-foreground">{article.source}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(new Date(article.pubDate))}
              </span>
              {article.readingTime && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {article.readingTime} 分钟阅读
                  </span>
                </>
              )}
            </div>

            {/* Title (Bilingual) */}
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group mb-2"
            >
              <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {article.titleZh || article.title}
                <ExternalLink className="w-4 h-4 inline-block ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h3>
              {article.titleZh && article.titleZh !== article.title && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {article.title}
                </p>
              )}
            </a>

            {/* Keywords */}
            {article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {article.keywords.slice(0, 4).map((keyword, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs px-2 py-0 font-normal"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {/* Summary */}
            {article.summary && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* Scores */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">相关</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: getScoreColor(article.scores.relevance) }}
                >
                  {article.scores.relevance}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">质量</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: getScoreColor(article.scores.quality) }}
                >
                  {article.scores.quality}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">时效</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: getScoreColor(article.scores.timeliness) }}
                >
                  {article.scores.timeliness}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">综合</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: scoreColor }}
                >
                  {article.scores.overall}
                </span>
              </div>
            </div>

            {/* Recommendation Reason */}
            {article.reason && (
              <div className="p-2 bg-primary/5 rounded-md mb-3">
                <p className="text-sm text-primary">
                  💡 {article.reason}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            size="sm"
            variant={isSaved ? 'default' : 'outline'}
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className="flex-shrink-0 gap-2 h-8"
          >
            {isSaving ? (
              <>保存中...</>
            ) : isSaved ? (
              <>
                <BookOpen className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
