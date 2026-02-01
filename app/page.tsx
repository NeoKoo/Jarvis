'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calendar, CheckSquare, Mic, BookOpen, Bell } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export default function Home() {
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState('');

  useEffect(() => {
    // 每秒更新时间
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      setDate(now.toLocaleDateString('zh-CN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: 'AI对话',
      description: '与Jarvis智能助手交流',
      icon: MessageSquare,
      href: '/chat',
      color: 'text-blue-500',
    },
    {
      title: '日历',
      description: '管理您的日程安排',
      icon: Calendar,
      href: '/calendar',
      color: 'text-green-500',
    },
    {
      title: '任务',
      description: '跟踪待办事项',
      icon: CheckSquare,
      href: '/tasks',
      color: 'text-purple-500',
    },
    {
      title: '语音备忘',
      description: '录制并转写录音',
      icon: Mic,
      href: '/memos',
      color: 'text-red-500',
    },
    {
      title: '笔记',
      description: '快速记录和知识库',
      icon: BookOpen,
      href: '/notes',
      color: 'text-yellow-500',
    },
    {
      title: '提醒',
      description: '设置智能提醒',
      icon: Bell,
      href: '/reminders',
      color: 'text-orange-500',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center space-y-2 py-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Jarvis
          </h1>
          <p className="text-muted-foreground text-lg">您的个人智能助手</p>
        </div>

        {/* 时间卡片 */}
        <Card className="backdrop-blur-sm bg-card/50">
          <CardContent className="p-8 text-center">
            <div className="text-6xl md:text-8xl font-bold tabular-nums">
              {time.toLocaleTimeString('zh-CN')}
            </div>
            <div className="text-xl text-muted-foreground mt-2">{date}</div>
          </CardContent>
        </Card>

        {/* 快捷操作网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full hover:scale-105">
                  <CardHeader>
                    <Icon className={`h-8 w-8 ${action.color} mb-2`} />
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 功能特点 */}
        <Card className="backdrop-blur-sm bg-card/50">
          <CardHeader>
            <CardTitle>功能特点</CardTitle>
            <CardDescription>由智能LLM路由系统驱动</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <strong className="text-sm">智能AI对话</strong>
                <p className="text-sm text-muted-foreground">
                  根据任务复杂度自动路由：简单任务使用千问（快速），复杂任务使用GLM（强大）
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <strong className="text-sm">语音交互</strong>
                <p className="text-sm text-muted-foreground">
                  语音识别和语音合成，支持免提操作
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <strong className="text-sm">日历与任务</strong>
                <p className="text-sm text-muted-foreground">
                  完整的日程管理和任务追踪功能
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
              <div>
                <strong className="text-sm">离线工作</strong>
                <p className="text-sm text-muted-foreground">
                  PWA应用，支持离线使用和本地数据存储
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA安装提示 */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              将Jarvis安装为应用以获得最佳体验
            </p>
            <p className="text-xs text-muted-foreground">
              使用浏览器的"添加到主屏幕"或"安装应用"选项
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
    </>
  );
}
