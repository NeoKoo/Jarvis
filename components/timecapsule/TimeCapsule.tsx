'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTimeCapsuleStore } from '@/stores/time-capsule-store';
import { Mail, Clock, Send, Lock, Unlock, Trash2, Sparkles, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export function TimeCapsulePanel() {
  const {
    capsules,
    isLoading,
    loadCapsules,
    addCapsule,
    openCapsule,
    deleteCapsule,
    readyToOpen,
  } = useTimeCapsuleStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [openingCapsuleId, setOpeningCapsuleId] = useState<string | null>(null);

  useEffect(() => {
    loadCapsules();
  }, [loadCapsules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !openDate) {
      return;
    }

    const selectedDate = new Date(openDate);
    const now = new Date();

    if (differenceInDays(selectedDate, now) < 1) {
      alert('时光胶囊的开启时间至少要在明天之后');
      return;
    }

    await addCapsule({
      title: title.trim(),
      content: content.trim(),
      openDate: selectedDate,
      isOpened: false,
    });

    setTitle('');
    setContent('');
    setOpenDate('');
    setShowForm(false);
  };

  const handleOpenCapsule = async (capsuleId: string, createdAt: string, capsuleOpenDate: string) => {
    setOpeningCapsuleId(capsuleId);
    setIsGenerating(true);

    try {
      // Generate AI message
      const response = await fetch('/api/time-capsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: capsules.find(c => c.id === capsuleId)?.content,
          createdAt,
          openDate: capsuleOpenDate,
        }),
      });

      if (response.ok) {
        const { aiMessage } = await response.json();
        await openCapsule(capsuleId, aiMessage);
      }
    } catch (error) {
      console.error('Failed to generate AI message:', error);
      // Open without AI message
      await openCapsule(capsuleId);
    } finally {
      setIsGenerating(false);
      setOpeningCapsuleId(null);
    }
  };

  const readyCapsules = readyToOpen();
  const pendingCapsules = capsules.filter(c => !c.isOpened && new Date(c.openDate) > new Date());
  const openedCapsules = capsules.filter(c => c.isOpened);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            时光胶囊
          </h1>
          <p className="text-muted-foreground mt-1">给未来的自己写一封信</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          <Mail className="h-5 w-5 mr-2" />
          {showForm ? '取消' : '创建胶囊'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>创建时光胶囊</CardTitle>
            <CardDescription>
              写给未来的自己，在指定的时间打开
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  标题
                </label>
                <Input
                  placeholder="例如：给一年后的自己"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  开启时间
                </label>
                <Input
                  type="date"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  内容
                </label>
                <textarea
                  placeholder="亲爱的未来的我，写下你想对未来的自己说的话..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[200px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">封存胶囊</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ready to Open Notice */}
      {readyCapsules.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <Unlock className="h-5 w-5" />
              <span className="font-semibold">
                你有 {readyCapsules.length} 个时光胶囊可以打开了！
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capsules List */}
      <div className="space-y-4">
        {/* Pending Capsules */}
        {pendingCapsules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              等待开启 ({pendingCapsules.length})
            </h3>
            <div className="space-y-3">
              {pendingCapsules.map((capsule) => (
                <Card key={capsule.id} className="opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{capsule.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            将在 {format(new Date(capsule.openDate), 'yyyy年MM月dd日')} 开启
                          </span>
                          <span>·</span>
                          <span>
                            还有 {differenceInDays(new Date(capsule.openDate), new Date())} 天
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCapsule(capsule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ready to Open */}
        {readyCapsules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
              <Unlock className="h-5 w-5" />
              可以开启 ({readyCapsules.length})
            </h3>
            <div className="space-y-3">
              {readyCapsules.map((capsule) => (
                <Card key={capsule.id} className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{capsule.title}</h4>
                        <div className="text-sm text-muted-foreground mb-3">
                          创建于 {format(new Date(capsule.createdAt), 'yyyy年MM月dd日')}
                        </div>
                        <Button
                          onClick={() => handleOpenCapsule(capsule.id, capsule.createdAt.toISOString(), capsule.openDate.toISOString())}
                          disabled={openingCapsuleId === capsule.id && isGenerating}
                          className="w-full"
                        >
                          {openingCapsuleId === capsule.id && isGenerating ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                              AI正在准备惊喜...
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-2" />
                              打开胶囊
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Opened Capsules */}
        {openedCapsules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              已开启 ({openedCapsules.length})
            </h3>
            <div className="space-y-4">
              {openedCapsules.map((capsule) => (
                <Card key={capsule.id} className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{capsule.title}</CardTitle>
                    <CardDescription>
                      开启于 {format(new Date(capsule.openDate), 'yyyy年MM月dd日')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {capsule.aiMessage && (
                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-start gap-2 text-primary mb-2">
                          <Sparkles className="h-4 w-4 mt-0.5" />
                          <span className="text-sm font-semibold">时光信使的话</span>
                        </div>
                        <p className="text-sm leading-relaxed">{capsule.aiMessage}</p>
                      </div>
                    )}

                    <div className="bg-background p-4 rounded-lg border">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{capsule.content}</p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCapsule(capsule.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {capsules.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">还没有时光胶囊</p>
              <p className="text-sm">创建一个时光胶囊，给未来的自己写一封信吧</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
