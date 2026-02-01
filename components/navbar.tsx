'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { MessageSquare, Calendar, CheckSquare, Mic, BookOpen, Bell, Home, Settings, Mail, Video } from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/chat', label: 'AI对话', icon: MessageSquare },
  { href: '/calendar', label: '日历', icon: Calendar },
  { href: '/tasks', label: '任务', icon: CheckSquare },
  { href: '/memos', label: '语音备忘', icon: Mic },
  { href: '/notes', label: '笔记', icon: BookOpen },
  { href: '/videos', label: '视频总结', icon: Video },
  { href: '/reminders', label: '提醒', icon: Bell },
  { href: '/timecapsule', label: '时光胶囊', icon: Mail },
  { href: '/settings', label: '设置', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 max-w-7xl mx-auto">
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl">Jarvis</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors hover:text-foreground/80',
                    isActive ? 'text-foreground' : 'text-foreground/60'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="md:hidden font-bold text-xl">
              Jarvis
            </Link>
          </div>

          <nav className="flex items-center">
            <ThemeToggle />
          </nav>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t">
        <div className="container flex overflow-x-auto px-4 py-2 gap-2 max-w-7xl mx-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
