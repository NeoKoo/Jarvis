import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  navigateTo,
  ensureVisible,
  waitForLoading,
  waitForToast,
} from '../helpers/test-utils';

/**
 * GitHub 热门仓库功能 E2E 测试
 * 测试获取热门仓库、保存为笔记、刷新等功能
 */

test.describe('GitHub 热门仓库', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('应该能够获取热门仓库列表', async ({ page }) => {
    // 滚动到 GitHub 区域
    const githubSection = page.locator('text=GitHub 热门仓库');
    await ensureVisible(githubSection);

    // 点击"获取热门仓库"按钮
    await page.click('button:has-text("获取热门仓库")');

    // 等待加载完成
    await waitForLoading(page);

    // 验证仓库卡片显示
    await ensureVisible(page.locator('.grid.gap-4:has(a[href*="github.com"])'));

    // 验证至少有一个仓库卡片
    const repoCards = page.locator('a[href*="github.com"]');
    const count = await repoCards.count();
    expect(count).toBeGreaterThan(0);

    // 验证仓库卡片包含必要信息
    const firstCard = repoCards.first();
    await expect(firstCard.locator('text=Stars')).toBeVisible();
  });

  test('应该能够保存仓库为笔记', async ({ page }) => {
    // 先获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 等待仓库卡片加载
    await ensureVisible(page.locator('a[href*="github.com"]'));

    // 找到第一个"保存"按钮并点击
    const saveButtons = page.locator('button:has-text("保存")').first();
    await expect(saveButtons).toBeVisible();
    await saveButtons.click();

    // 等待保存动画完成
    await page.waitForTimeout(2000);

    // 验证按钮状态变为"已保存"
    await expect(page.locator('button:has-text("已保存")').first()).toBeVisible();

    // 等待 Toast 提示
    const toast = await waitForToast(page);
    expect(toast).toContain('保存到笔记');

    // 导航到笔记页面验证
    await navigateTo(page, '/notes');
    await ensureVisible(page.locator('text=GitHub'));

    // 验证笔记已创建（应该包含仓库名称）
    await ensureVisible(page.locator('.space-y-3'));
  });

  test('应该能够刷新热门仓库', async ({ page }) => {
    // 首次获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 记录首次更新时间
    const firstUpdateTime = await page.locator('text=更新于').textContent();

    // 点击刷新按钮
    await page.click('button:has-text("刷新")');

    // 等待刷新完成
    await waitForLoading(page);

    // 等待新时间显示
    await page.waitForTimeout(2000);

    // 验证刷新图标动画
    const refreshIcon = page.locator('.lucide-refresh-cw');
    await expect(refreshIcon).toHaveClass(/animate-spin/);
  });

  test('应该能够查看仓库详情（跳转到 GitHub）', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 等待仓库卡片加载
    await ensureVisible(page.locator('a[href*="github.com"]'));

    // 找到第一个仓库链接
    const repoLink = page.locator('a[href*="github.com"]').first();

    // 验证链接属性
    await expect(repoLink).toHaveAttribute('target', '_blank');
    await expect(repoLink).toHaveAttribute('rel', 'noopener noreferrer');

    // 验证外部链接图标存在
    const externalIcon = repoLink.locator('.lucide-external-link');
    await expect(externalIcon).toBeVisible();
  });

  test('应该能够展开和收起仓库描述', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 等待仓库卡片加载
    await ensureVisible(page.locator('a[href*="github.com"]'));

    // 查找有展开按钮的卡片（描述长度 > 100）
    const expandButton = page.locator('button:has-text("展开完整描述")').first();

    const count = await expandButton.count();

    if (count > 0) {
      // 点击展开按钮
      await expandButton.click();
      await page.waitForTimeout(300);

      // 验证描述已展开（line-clamp-3 类被移除）
      const description = page.locator('.line-clamp-3').first();
      const isExpanded = !(await description.isVisible());
      expect(isExpanded).toBe(true);

      // 点击收起按钮
      const collapseButton = page.locator('button:has-text("收起")').first();
      await collapseButton.click();
      await page.waitForTimeout(300);

      // 验证描述已收起
      await ensureVisible(page.locator('.line-clamp-3').first());
    } else {
      // 如果没有需要展开的描述，测试通过
      test.skip();
    }
  });

  test('应该显示仓库的完整信息', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 等待第一个仓库卡片
    await ensureVisible(page.locator('a[href*="github.com"]'));

    // 验证 Stars 数量显示
    await ensureVisible(page.locator('text=Stars'));

    // 验证 Forks 数量显示
    await ensureVisible(page.locator('text=Forks'));

    // 验证更新时间显示
    await ensureVisible(page.locator('text=更新'));

    // 验证语言标签显示（如果有）
    const languageBadges = page.locator('.badge:has-text("开源项目")');
    await expect(languageBadges.first()).toBeVisible();
  });

  test('应该显示加载状态', async ({ page }) => {
    // 点击"获取热门仓库"
    await page.click('button:has-text("获取热门仓库")');

    // 验证加载动画显示
    const loader = page.locator('.lucide-loader2, [role="status"]:has-text("加载中")');
    await expect(loader.first()).toBeVisible();

    // 等待加载完成
    await waitForLoading(page);
  });

  test('应该正确处理重复保存', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 第一次保存
    const saveButton = page.locator('button:has-text("保存")').first();
    await saveButton.click();
    await page.waitForTimeout(2000);

    // 验证按钮变为"已保存"状态
    await expect(page.locator('button:has-text("已保存")').first()).toBeVisible();

    // 验证"已保存"按钮被禁用
    const savedButton = page.locator('button:has-text("已保存")').first();
    await expect(savedButton).toBeDisabled();
  });

  test('应该显示仓库所有者信息', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 等待第一个仓库卡片
    await ensureVisible(page.locator('a[href*="github.com"]'));

    // 验证所有者头像显示
    const avatar = page.locator('.w-10.h-10.rounded-full').first();
    await expect(avatar).toBeVisible();

    // 验证所有者用户名显示
    await ensureVisible(page.locator('text=创建于'));
  });

  test('应该能够点击"查看仓库"按钮', async ({ page }) => {
    // 获取热门仓库
    await page.click('button:has-text("获取热门仓库")');
    await waitForLoading(page);

    // 点击"查看仓库"按钮
    const viewButton = page.locator('button:has-text("查看仓库")').first();
    await expect(viewButton).toBeVisible();

    // 验证按钮在 Link 元素内
    const parentLink = viewButton.locator('xpath=ancestor::a');
    await expect(parentLink).toHaveAttribute('target', '_blank');
  });
});
