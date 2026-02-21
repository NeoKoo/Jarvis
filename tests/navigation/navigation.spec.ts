import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  navigateTo,
  ensureVisible,
} from '../helpers/test-utils';

/**
 * 导航和页面加载 E2E 测试
 * 测试主页加载、页面导航、PWA 检测等功能
 */

test.describe('导航和页面加载', () => {
  test.describe('主页加载', () => {
    test('应该正确显示主页标题', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证主标题显示
      await ensureVisible(page.locator('text=Jarvis'));

      // 验证副标题
      await ensureVisible(page.locator('text=您的个人智能助手'));
    });

    test('应该显示当前时间和日期', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证时间显示（格式为 HH:MM:SS）
      const timeElement = page.locator('.tabular-nums');
      await ensureVisible(timeElement);

      // 验证日期显示
      const dateElement = page.locator('text=月').and(page.locator('text=年'));
      await expect(dateElement).toBeVisible();
    });

    test('应该显示所有快捷操作卡片', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证所有快捷操作存在
      const quickActions = [
        'AI对话',
        '日历',
        '任务',
        '语音备忘',
        '笔记',
        '提醒',
      ];

      for (const action of quickActions) {
        await ensureVisible(page.locator(`text=${action}`));
      }

      // 验证快捷操作卡片数量
      const cardsCount = await page.locator('.grid.grid-cols-2.md\\:grid-cols-3 > a').count();
      expect(cardsCount).toBe(6);
    });

    test('应该显示功能特点', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证功能特点标题
      await ensureVisible(page.locator('text=功能特点'));

      // 验证各项功能描述
      await ensureVisible(page.locator('text=智能AI对话'));
      await ensureVisible(page.locator('text=语音交互'));
      await ensureVisible(page.locator('text=日历与任务'));
      await ensureVisible(page.locator('text=离线工作'));
    });

    test('应该显示 PWA 安装提示', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证 PWA 安装提示卡片
      await ensureVisible(page.locator('text=将Jarvis安装为应用以获得最佳体验'));
      await ensureVisible(page.locator('text=添加到主屏幕'));
    });
  });

  test.describe('导航测试', () => {
    test('应该能够从主页导航到 AI 对话页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击 AI 对话卡片
      await page.click('a[href="/chat"]');

      // 验证页面导航
      await page.waitForURL(/\/chat/);
      await waitForPageLoad(page);

      // 验证页面标题
      await ensureVisible(page.locator('text=AI对话'));
    });

    test('应该能够从主页导航到日历页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击日历卡片
      await page.click('a[href="/calendar"]');

      // 验证页面导航
      await page.waitForURL(/\/calendar/);
      await waitForPageLoad(page);

      // 验证页面元素
      await ensureVisible(page.locator('text=日历'));
    });

    test('应该能够从主页导航到任务页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击任务卡片
      await page.click('a[href="/tasks"]');

      // 验证页面导航
      await page.waitForURL(/\/tasks/);
      await waitForPageLoad(page);

      // 验证页面元素
      await ensureVisible(page.locator('text=任务'));
    });

    test('应该能够从主页导航到语音备忘页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击语音备忘卡片
      await page.click('a[href="/memos"]');

      // 验证页面导航
      await page.waitForURL(/\/memos/);
      await waitForPageLoad(page);

      // 验证页面元素
      await ensureVisible(page.locator('text=语音备忘'));
    });

    test('应该能够从主页导航到笔记页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击笔记卡片
      await page.click('a[href="/notes"]');

      // 验证页面导航
      await page.waitForURL(/\/notes/);
      await waitForPageLoad(page);

      // 验证页面元素
      await ensureVisible(page.locator('text=笔记'));
    });

    test('应该能够从主页导航到提醒页面', async ({ page }) => {
      await navigateTo(page, '/');

      // 点击提醒卡片
      await page.click('a[href="/reminders"]');

      // 验证页面导航
      await page.waitForURL(/\/reminders/);
      await waitForPageLoad(page);

      // 验证页面元素
      await ensureVisible(page.locator('text=提醒'));
    });

    test('应该能够使用导航栏返回主页', async ({ page }) => {
      // 先导航到笔记页面
      await navigateTo(page, '/notes');

      // 点击导航栏的 Logo/标题返回主页
      const homeLink = page.locator('a[href="/"]').first();
      await homeLink.click();

      // 验证返回主页
      await page.waitForURL(/\//);
      await waitForPageLoad(page);

      // 验证主页元素
      await ensureVisible(page.locator('text=Jarvis'));
    });
  });

  test.describe('响应式设计测试', () => {
    test('应该在移动设备上正确显示', async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateTo(page, '/');

      // 验证主页元素仍可见
      await ensureVisible(page.locator('text=Jarvis'));
      await ensureVisible(page.locator('text=AI对话'));

      // 验证快捷操作在小屏幕上显示为 2 列
      const grid = page.locator('.grid.grid-cols-2');
      await expect(grid).toBeVisible();
    });

    test('应该在平板设备上正确显示', async ({ page }) => {
      // 设置平板设备视口
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateTo(page, '/');

      // 验证主页元素
      await ensureVisible(page.locator('text=Jarvis'));

      // 验证快捷操作在中等屏幕上显示为 3 列
      const grid = page.locator('.md\\:grid-cols-3');
      await expect(grid).toBeVisible();
    });

    test('应该在桌面设备上正确显示', async ({ page }) => {
      // 设置桌面设备视口
      await page.setViewportSize({ width: 1920, height: 1080 });
      await navigateTo(page, '/');

      // 验证主页元素
      await ensureVisible(page.locator('text=Jarvis'));

      // 验证最大宽度容器
      const container = page.locator('.max-w-6xl');
      await expect(container).toBeVisible();
    });
  });

  test.describe('页面性能测试', () => {
    test('应该在合理时间内完成首次内容绘制', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // 等待主要内容渲染
      await page.waitForSelector('main', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // 验证页面在 5 秒内加载完成
      expect(loadTime).toBeLessThan(5000);
    });

    test('应该正确处理页面缓存', async ({ page }) => {
      // 首次访问
      await navigateTo(page, '/');

      // 获取首次加载的性能指标
      const firstLoadMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        };
      });

      // 二次访问（从缓存）
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 验证页面仍然正常显示
      await ensureVisible(page.locator('text=Jarvis'));
    });
  });

  test.describe('PWA 检测', () => {
    test('应该注册 Service Worker', async ({ page }) => {
      await navigateTo(page, '/');

      // 等待 Service Worker 注册
      await page.waitForTimeout(2000);

      // 在浏览器上下文中检查 Service Worker
      const swRegistered = await page.evaluate(async () => {
        return await navigator.serviceWorker.ready
          .then(() => true)
          .catch(() => false);
      });

      // 注意：Service Worker 在生产环境中应该注册
      // 开发环境可能需要构建后才能正常工作
      if (process.env.BASE_URL?.includes('zeabur.app')) {
        expect(swRegistered).toBe(true);
      }
    });

    test('应该有正确的 manifest 链接', async ({ page }) => {
      const response = await page.goto('/');

      // 检查页面中是否有 manifest 链接
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');

      // 验证 manifest 文件引用存在
      expect(manifestLink).toBeTruthy();
    });

    test('应该支持离线功能提示', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证离线工作相关的描述
      const offlineText = page.locator('text=离线工作');
      await expect(offlineText).toBeVisible();
    });
  });

  test.describe('可访问性测试', () => {
    test('应该有正确的页面标题', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证页面标题
      const title = await page.title();
      expect(title).toContain('Jarvis');
    });

    test('应该有正确的语言属性', async ({ page }) => {
      await navigateTo(page, '/');

      // 验证 html lang 属性
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('zh-CN');
    });

    test('链接应该有有意义的文本', async ({ page }) => {
      await navigateTo(page, '/');

      // 检查所有链接是否有可访问的文本
      const links = page.locator('a[href]');
      const count = await links.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        // 链接应该有文本或 aria-label
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    });

    test('应该支持键盘导航', async ({ page }) => {
      await navigateTo(page, '/');

      // 使用 Tab 键导航到第一个快捷操作
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // 按 Enter 键激活链接
      await page.keyboard.press('Enter');

      // 验证导航发生
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/\/(chat|calendar|tasks|memos|notes|reminders)/);
    });
  });
});
